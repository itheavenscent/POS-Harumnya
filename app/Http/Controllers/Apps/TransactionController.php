<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartPackaging;
use App\Models\CustomOrderPricingRule;
use App\Models\Customer;
use App\Models\CustomerPointLedger;
use App\Models\DiscountType;
use App\Models\DiscountUsage;
use App\Models\Ingredient;
use App\Models\Intensity;
use App\Models\IntensitySizePrice;
use App\Models\PackagingMaterial;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleDiscount;
use App\Models\SaleItem;
use App\Models\SaleItemPackaging;
use App\Models\SalePayment;
use App\Models\SalesPerson;
use App\Models\Size;
use App\Models\Store;
use App\Models\StoreCategory;
use App\Models\Variant;
use App\Models\CashDrawer;
use App\Models\User;
use App\Services\StockDeductionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function __construct(
        private readonly StockDeductionService $stockDeduction,
    ) {
    }

    public function index(): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        if (!$storeId) {
            return Inertia::render('Dashboard/Transactions/Index', [
                'error' => 'Anda belum memiliki toko default. Hubungi admin.',
                'carts' => [],
                'carts_total' => 0,
                'heldCarts' => [],
                'intensities' => [],
                'customers' => [],
                'salesPeople' => [],
                'packagingMaterials' => [],
                'paymentMethods' => [],
                'discounts' => [],
                'customPricingRules' => [],
                'storeId' => null,
                'storeName' => null,
            ]);
        }

        $store = Store::with('storeCategory')->find($storeId);

        $carts = $this->getActiveCarts($user->id, $storeId);
        $cartsTotal = $this->calcCartsTotal($carts);
        $heldCarts = $this->getHeldCarts($user->id, $storeId);

        $intensities = Intensity::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'code', 'oil_ratio', 'alcohol_ratio', 'sort_order']);

        $customers = Customer::select('id', 'name', 'phone', 'code', 'tier', 'points')
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(100)
            ->get();

        $salesPeople = SalesPerson::select('id', 'name', 'code', 'phone')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $packagingMaterials = PackagingMaterial::select(
            'id',
            'name',
            'code',
            'selling_price',
            'is_free',
            'free_condition_note',
            'average_cost',
            'sort_order'
        )
            ->where('is_active', true)
            ->where('is_available_as_addon', true)
            ->orderBy('sort_order')
            ->get();

        $paymentMethods = PaymentMethod::select(
            'id',
            'name',
            'code',
            'type',
            'admin_fee_pct',
            'can_give_change'
        )
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $discounts = $this->getActiveDiscountsForStore($storeId);

        $customPricingRules = CustomOrderPricingRule::where('is_active', true)
            ->where(fn($q) => $q->whereNull('valid_from')
                ->orWhereDate('valid_from', '<=', today()))
            ->where(fn($q) => $q->whereNull('valid_until')
                ->orWhereDate('valid_until', '>=', today()))
            ->get(['id', 'variant_id', 'min_oil_ml', 'max_oil_ml', 'min_ratio_note']);

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/Transactions/Index', [
            'carts' => $carts,
            'carts_total' => $cartsTotal,
            'heldCarts' => $heldCarts,
            'intensities' => $intensities,
            'customers' => $customers,
            'salesPeople' => $salesPeople,
            'packagingMaterials' => $packagingMaterials,
            'paymentMethods' => $paymentMethods,
            'discounts' => $discounts,
            'customPricingRules' => $customPricingRules,
            'activeCashDrawer' => $activeCashDrawer,
            'storeId' => $storeId,
            'storeName' => $store?->name,
            'error' => null,
        ]);
    }

    // =========================================================================
    // GET CUSTOM ORDER PRICE (AJAX)
    // GET /dashboard/transactions/custom-price
    //
    // PERUBAHAN: harga dihitung dari ingredients.selling_price (oil),
    // bukan dari CustomOrderPricingRule.
    // Formula: custom_unit_price = oil_qty × oil_ingredient.selling_price
    // =========================================================================
    public function getCustomPrice(Request $request): JsonResponse
    {
        $request->validate([
            'variant_id' => 'required|uuid|exists:variants,id',
            'oil_qty' => 'required|integer|min:1',
            'alcohol_qty' => 'nullable|integer|min:0',
        ]);

        $oilQty = (int) $request->oil_qty;
        $alcoholQty = (int) ($request->alcohol_qty ?? 0);

        // Validasi rasio minimum 1:1
        if ($alcoholQty > $oilQty) {
            return response()->json([
                'success' => false,
                'message' => "Rasio tidak valid: alkohol ({$alcoholQty}ml) tidak boleh melebihi oil ({$oilQty}ml). Minimum rasio oil:alkohol = 1:1.",
            ], 422);
        }

        // Cari rule pricing untuk variant ini, default ke global jika tidak ada.
        $pricingRule = CustomOrderPricingRule::findForVariant($request->variant_id);

        // Validasi minimum dan maksimum oil berdasarkan rule tersebut (atau global fallback 5ml default)
        $minOil = $pricingRule?->min_oil_ml ?? 5;
        $maxOil = $pricingRule?->max_oil_ml; // bisa null (no limit)
        $ratioNote = $pricingRule?->min_ratio_note ?? 'Minimum rasio oil:alkohol = 1:1. Alkohol gratis ke customer.';

        if ($oilQty < $minOil) {
            return response()->json([
                'success' => false,
                'message' => "Minimal pemesanan oil adalah {$minOil} ml.",
            ], 422);
        }

        if ($maxOil && $oilQty > $maxOil) {
            return response()->json([
                'success' => false,
                'message' => "Maksimal pemesanan oil adalah {$maxOil} ml.",
            ], 422);
        }

        // ── Cari selling_price ingredient oil ─────────────────────────────────
        // Prioritas: ingredient oil yang terkait variant (via variant_recipes),
        // fallback ke ingredient oil manapun yang is_active dan punya selling_price.
        $oilIngredient = $this->resolveOilIngredient($request->variant_id);

        if (!$oilIngredient) {
            return response()->json([
                'success' => false,
                'message' => 'Ingredient oil tidak ditemukan atau belum memiliki harga jual. Hubungi admin untuk mengatur selling_price pada ingredient oil.',
            ], 422);
        }

        if (!$oilIngredient->selling_price || $oilIngredient->selling_price <= 0) {
            return response()->json([
                'success' => false,
                'message' => "Ingredient oil \"{$oilIngredient->name}\" belum memiliki harga jual (selling_price). Hubungi admin.",
            ], 422);
        }

        // Harga = oil_qty × selling_price per ml; alkohol GRATIS ke customer
        $calculatedPrice = (int) round($oilQty * $oilIngredient->selling_price);
        $totalVolume = $oilQty + $alcoholQty;

        // Snapshot WAC alkohol — untuk COGS, bukan untuk harga jual
        $alcoholWac = $this->getAlcoholWac(Auth::user()->default_store_id);

        return response()->json([
            'success' => true,
            'data' => [
                'calculated_price' => $calculatedPrice,
                'price_per_ml_oil' => (float) $oilIngredient->selling_price,
                'oil_ingredient_id' => $oilIngredient->id,
                'oil_ingredient_name' => $oilIngredient->name,
                'oil_qty' => $oilQty,
                'alcohol_qty' => $alcoholQty,
                'total_volume' => $totalVolume,
                'alcohol_cost_snapshot' => $alcoholWac,
                'alcohol_is_free' => true,
                'min_oil_ml' => $minOil,
                'max_oil_ml' => $maxOil,
                'ratio_note' => $ratioNote,
            ],
        ]);
    }

    // =========================================================================
    // ADD CUSTOM ORDER TO CART
    // POST /dashboard/transactions/add-custom-to-cart
    // =========================================================================
    public function addCustomToCart(Request $request): RedirectResponse
    {
        $request->validate([
            'variant_id' => 'required|uuid|exists:variants,id',
            'oil_qty' => 'required|integer|min:1',
            'alcohol_qty' => 'nullable|integer|min:0',
            'other_qty' => 'nullable|integer|min:0',
            'custom_unit_price' => 'required|numeric|min:0',
            'qty' => 'required|integer|min:1|max:99',
            'packaging_ids' => 'nullable|array',
            'packaging_ids.*' => 'uuid|exists:packaging_materials,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $storeId = $user->default_store_id;

        abort_unless((bool) $storeId, 422, 'Toko default tidak ditemukan. Hubungi admin.');

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        abort_unless((bool) $activeCashDrawer, 422, 'Silakan buka shift terlebih dahulu sebelum memproses pesanan.');

        $oilQty = (int) $request->oil_qty;
        $alcoholQty = (int) $request->alcohol_qty;
        $otherQty = (int) ($request->other_qty ?? 0);

        // Validasi rasio minimum 1:1
        abort_if(
            $alcoholQty > $oilQty,
            422,
            "Rasio tidak valid: alkohol tidak boleh melebihi oil. Minimum rasio oil:alkohol = 1:1."
        );

        // ── Validasi min / max limit dari pricing rule ─────────────────────────
        $pricingRule = CustomOrderPricingRule::findForVariant($request->variant_id);
        $minOil = $pricingRule?->min_oil_ml ?? 5;
        $maxOil = $pricingRule?->max_oil_ml;

        abort_if($oilQty < $minOil, 422, "Minimal pemesanan oil adalah {$minOil} ml.");
        abort_if($maxOil && $oilQty > $maxOil, 422, "Maksimal pemesanan oil adalah {$maxOil} ml.");

        // Ambil selling_price oil untuk snapshot harga per ml saat cart dibuat
        $oilIngredient = $this->resolveOilIngredient($request->variant_id);
        $oilSellingPrice = $oilIngredient?->selling_price ?? 0;

        $alcoholWac = $this->getAlcoholWac($storeId);
        $totalVolume = $oilQty + $alcoholQty + $otherQty;

        DB::transaction(function () use ($request, $user, $storeId, $oilQty, $alcoholQty, $otherQty, $totalVolume, $alcoholWac, $oilIngredient, $oilSellingPrice) {
            $cart = Cart::create([
                'cashier_id' => $user->id,
                'store_id' => $storeId,
                'variant_id' => $request->variant_id,
                'intensity_id' => null,   // custom order tidak punya intensity baku
                'size_id' => null,   // custom order tidak punya size baku
                'product_id' => null,   // custom = made-to-order
                'unit_price' => (int) $request->custom_unit_price,
                'qty' => $request->qty,
                // ── Custom fields ──────────────────────────────────────────
                'is_custom_order' => true,
                'custom_oil_qty' => $oilQty,
                'custom_alcohol_qty' => $alcoholQty,
                'custom_other_qty' => $otherQty ?: null,
                'custom_total_volume' => $totalVolume,
                'custom_unit_price' => $request->custom_unit_price,
                // Snapshot selling_price oil saat transaksi (historis, tidak terpengaruh edit master)
                'oil_selling_price_snapshot' => $oilSellingPrice,
                'oil_ingredient_id' => $oilIngredient?->id,
                'alcohol_cost_snapshot' => $alcoholWac,
                'notes' => $request->notes,
            ]);

            if ($request->filled('packaging_ids')) {
                PackagingMaterial::whereIn('id', $request->packaging_ids)
                    ->where('is_active', true)
                    ->get()
                    ->each(function ($pkg) use ($cart) {
                        CartPackaging::create([
                            'cart_id' => $cart->id,
                            'packaging_material_id' => $pkg->id,
                            'qty' => 1,
                            'unit_price' => $pkg->is_free ? 0 : (int) ($pkg->selling_price ?? 0),
                        ]);
                    });
            }
        });

        return back();
    }

    // =========================================================================
    // EXISTING ENDPOINTS (tidak berubah)
    // =========================================================================

    public function history(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $query = Sale::with([
            'items.packagings.packagingMaterial',
            'payments.paymentMethod',
            'customer:id,name,phone',
            'cashier:id,name',
            'salesPerson:id,name,code',
        ])
            ->withCount('items')
            ->where('store_id', $storeId)
            ->latest('sold_at');

        if ($request->filled('date_from')) {
            $query->whereDate('sold_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sold_at', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if (!$user->hasRole('super-admin') && !$user->hasPermissionTo('transactions-all')) {
            $query->where('cashier_id', $user->id);
        }
        if ($request->filled('sale_number')) {
            $q = $request->sale_number;
            $query->where('sale_number', 'like', "%{$q}%");
        }
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(
                fn($inner) =>
                $inner->where('sale_number', 'like', "%{$q}%")
                    ->orWhere('customer_name', 'like', "%{$q}%")
            );
        }

        $sales = $query->paginate(20)->withQueryString();

        $summaryQuery = Sale::where('store_id', $storeId)->where('status', 'completed');
        if ($request->filled('date_from')) {
            $summaryQuery->whereDate('sold_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $summaryQuery->whereDate('sold_at', '<=', $request->date_to);
        }
        if (!$user->hasRole('super-admin') && !$user->hasPermissionTo('transactions-all')) {
            $summaryQuery->where('cashier_id', $user->id);
        }

        $summary = $summaryQuery->selectRaw('
            COUNT(*) as total_transactions,
            COALESCE(SUM(total), 0) as total_revenue,
            COALESCE(SUM(cogs_total), 0) as total_cogs,
            COALESCE(SUM(gross_profit), 0) as total_gross_profit,
            COALESCE(AVG(gross_margin_pct), 0) as avg_margin
        ')->first();

        return Inertia::render('Dashboard/Transactions/History', [
            'sales' => $sales,
            'filters' => $request->only('date_from', 'date_to', 'q', 'sale_number', 'status'),
            'summary' => $summary,
        ]);
    }

    public function print(string $saleNumber, Request $request): Response
    {
        $sale = Sale::with([
            'items.packagings.packagingMaterial',
            'payments.paymentMethod',
            'store',
            'cashier:id,name',
            'salesPerson:id,name',
            'customer:id,name,phone,code',
        ])
            ->where('sale_number', str_replace('-', '/', $saleNumber))
            ->orWhere('sale_number', $saleNumber)
            ->firstOrFail();

        return Inertia::render('Dashboard/Transactions/Print', [
            'sale' => $sale,
            'fromTransaction' => session()->pull('from_transaction', false),
        ]);
    }

    public function getVariantsForIntensity(Request $request): JsonResponse
    {
        $request->validate(['intensity_id' => 'required|uuid|exists:intensities,id']);

        $user = Auth::user();
        $storeId = $user->default_store_id;
        $store = $storeId ? Store::with('storeCategory')->find($storeId) : null;

        $variantQuery = Variant::where('is_active', true)->orderBy('sort_order');

        if ($store && $store->store_category_id) {
            $category = $store->storeCategory;
            if ($category && !$category->allow_all_variants) {
                $allowedIds = $category->variants()
                    ->wherePivot('is_active', true)
                    ->pluck('variants.id');
                if ($allowedIds->isNotEmpty()) {
                    $variantQuery->whereIn('id', $allowedIds);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $variantQuery->get(['id', 'name', 'code', 'gender', 'image']),
        ]);
    }

    /**
     * GET /get-variants-pos
     * Ambil semua varian aktif (dengan gambar) untuk katalog POS.
     * Filter berdasarkan store category jika ada.
     */
    public function getVariantsForPOS(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $storeId = $user->default_store_id ?? null;
            $store = $storeId ? Store::with('storeCategory')->find($storeId) : null;

            $variantQuery = Variant::where('is_active', true);

            try {
                $variantQuery->orderBy('sort_order');
            } catch (\Exception $e) {
                $variantQuery->orderBy('name');
            }

            if ($store && $store->store_category_id) {
                $category = $store->storeCategory;
                if ($category && !$category->allow_all_variants) {
                    $allowedIds = $category->variants()
                        ->wherePivot('is_active', true)
                        ->pluck('variants.id');
                    if ($allowedIds->isNotEmpty()) {
                        $variantQuery->whereIn('id', $allowedIds);
                    }
                }
            }

            $variants = $variantQuery->get(['id', 'name', 'code', 'gender', 'image', 'description']);

            // Tambahkan image_url accessor
            $variants = $variants->map(function ($v) {
                $v->image_url = $v->image ? asset('storage/variants/' . $v->image) : null;
                return $v;
            });

            return response()->json(['success' => true, 'data' => $variants]);
        } catch (\Exception $e) {
            \Log::error('getVariantsForPOS error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat varian: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /get-intensities
     * Ambil intensitas yang tersedia untuk suatu varian
     * berdasarkan produk aktif yang ada di tabel products.
     */
    public function getIntensitiesForVariant(Request $request): JsonResponse
    {
        $request->validate(['variant_id' => 'required|uuid|exists:variants,id']);

        // Ambil intensity_id yang punya produk aktif untuk varian ini
        $intensityIds = Product::where('variant_id', $request->variant_id)
            ->where('is_active', true)
            ->distinct()
            ->pluck('intensity_id')
            ->filter();

        if ($intensityIds->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $intensities = Intensity::whereIn('id', $intensityIds)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'code', 'oil_ratio', 'alcohol_ratio', 'sort_order']);

        return response()->json(['success' => true, 'data' => $intensities]);
    }

    /**
     * Endpoint: ambil semua variant aktif (tanpa filter intensity),
     * digunakan untuk dropdown custom order.
     */
    public function getVariantsForCustom(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $storeId = $user->default_store_id ?? null;
            $store = $storeId ? Store::with('storeCategory')->find($storeId) : null;

            $variantQuery = Variant::where('is_active', true);

            try {
                $variantQuery->orderBy('sort_order');
            } catch (\Exception $e) {
                $variantQuery->orderBy('name');
            }

            if ($store && $store->store_category_id) {
                $category = $store->storeCategory;
                if ($category && !$category->allow_all_variants) {
                    $allowedIds = $category->variants()
                        ->wherePivot('is_active', true)
                        ->pluck('variants.id');
                    if ($allowedIds->isNotEmpty()) {
                        $variantQuery->whereIn('id', $allowedIds);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $variantQuery->get(['id', 'name', 'code', 'gender', 'image']),
            ]);
        } catch (\Exception $e) {
            \Log::error('getVariantsForCustom error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat varian: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getAvailableSizes(Request $request): JsonResponse
    {
        $request->validate([
            'intensity_id' => 'required|uuid|exists:intensities,id',
            'variant_id' => 'required|uuid|exists:variants,id',
        ]);

        $priceRows = IntensitySizePrice::where('intensity_id', $request->intensity_id)
            ->where('is_active', true)
            ->get(['size_id', 'price']);

        if ($priceRows->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $priceMap = $priceRows->pluck('price', 'size_id');

        $sizes = Size::whereIn('id', $priceMap->keys())
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'volume_ml', 'sort_order'])
            ->map(function ($size) use ($priceMap) {
                $size->price = $priceMap->get($size->id);
                return $size;
            });

        return response()->json(['success' => true, 'data' => $sizes]);
    }

    public function getPerfumePrice(Request $request): JsonResponse
    {
        $request->validate([
            'intensity_id' => 'required|uuid|exists:intensities,id',
            'variant_id' => 'required|uuid|exists:variants,id',
            'size_id' => 'required|uuid|exists:sizes,id',
            'packaging_ids' => 'nullable|array',
            'packaging_ids.*' => 'uuid|exists:packaging_materials,id',
        ]);

        $perfumePrice = IntensitySizePrice::where('intensity_id', $request->intensity_id)
            ->where('size_id', $request->size_id)
            ->where('is_active', true)
            ->value('price');

        $product = Product::where('variant_id', $request->variant_id)
            ->where('intensity_id', $request->intensity_id)
            ->where('size_id', $request->size_id)
            ->where('is_active', true)
            ->first();

        if ($perfumePrice === null && $product !== null) {
            $perfumePrice = $product->selling_price;
        }

        if ($perfumePrice === null) {
            return response()->json([
                'success' => false,
                'message' => 'Harga belum diatur untuk ukuran ini. Silakan hubungi admin.',
            ], 422);
        }

        $packagingTotal = 0;
        $packagingDetails = [];

        if ($request->filled('packaging_ids')) {
            PackagingMaterial::whereIn('id', $request->packaging_ids)
                ->where('is_active', true)
                ->get(['id', 'name', 'selling_price', 'is_free', 'free_condition_note', 'average_cost'])
                ->each(function ($pkg) use (&$packagingTotal, &$packagingDetails) {
                    $effectivePrice = $pkg->is_free ? 0 : (int) ($pkg->selling_price ?? 0);
                    $packagingTotal += $effectivePrice;
                    $packagingDetails[] = [
                        'id' => $pkg->id,
                        'name' => $pkg->name,
                        'price' => $pkg->selling_price,
                        'effective_price' => $effectivePrice,
                        'is_free' => $pkg->is_free,
                        'free_note' => $pkg->free_condition_note,
                        'average_cost' => $pkg->average_cost,
                    ];
                });
        }

        return response()->json([
            'success' => true,
            'data' => [
                'product_id' => $product?->id,
                'product_name' => $product?->name,
                'product_sku' => $product?->sku,
                'perfume_price' => (int) $perfumePrice,
                'packaging_total' => $packagingTotal,
                'packaging_detail' => $packagingDetails,
                'total_price' => (int) $perfumePrice + $packagingTotal,
                'stock_available' => true,
            ],
        ]);
    }

    public function addToCart(Request $request): RedirectResponse
    {
        $request->validate([
            'intensity_id' => 'required|uuid|exists:intensities,id',
            'variant_id' => 'required|uuid|exists:variants,id',
            'size_id' => 'required|uuid|exists:sizes,id',
            'qty' => 'required|integer|min:1|max:99',
            'packaging_ids' => 'nullable|array',
            'packaging_ids.*' => 'uuid|exists:packaging_materials,id',
        ]);

        $user = Auth::user();
        $storeId = $user->default_store_id;

        abort_unless((bool) $storeId, 422, 'Toko default tidak ditemukan. Hubungi admin.');

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        abort_unless((bool) $activeCashDrawer, 422, 'Silakan buka shift terlebih dahulu sebelum memproses pesanan.');

        $product = Product::where('variant_id', $request->variant_id)
            ->where('intensity_id', $request->intensity_id)
            ->where('size_id', $request->size_id)
            ->where('is_active', true)
            ->first();

        $price = (int) (IntensitySizePrice::where('intensity_id', $request->intensity_id)
            ->where('size_id', $request->size_id)
            ->where('is_active', true)
            ->value('price')
            ?? $product?->selling_price
            ?? 0);

        DB::transaction(function () use ($request, $user, $storeId, $product, $price) {
            $cart = Cart::create([
                'cashier_id' => $user->id,
                'store_id' => $storeId,
                'variant_id' => $request->variant_id,
                'intensity_id' => $request->intensity_id,
                'size_id' => $request->size_id,
                'product_id' => $product?->id,
                'unit_price' => $price,
                'qty' => $request->qty,
            ]);

            if ($request->filled('packaging_ids')) {
                PackagingMaterial::whereIn('id', $request->packaging_ids)
                    ->where('is_active', true)
                    ->get()
                    ->each(function ($pkg) use ($cart) {
                        $effectivePrice = $pkg->is_free ? 0 : (int) ($pkg->selling_price ?? 0);
                        CartPackaging::create([
                            'cart_id' => $cart->id,
                            'packaging_material_id' => $pkg->id,
                            'qty' => 1,
                            'unit_price' => $effectivePrice,
                        ]);
                    });
            }
        });

        return back();
    }

    public function updateCart(Request $request, string $id): RedirectResponse
    {
        $request->validate(['qty' => 'required|integer|min:1|max:99']);

        Cart::where('id', $id)
            ->where('cashier_id', Auth::id())
            ->whereNull('hold_id')
            ->update(['qty' => $request->qty]);

        return back();
    }

    public function destroyCart(string $id): RedirectResponse
    {
        Cart::where('id', $id)
            ->where('cashier_id', Auth::id())
            ->delete();

        return back();
    }

    public function holdCart(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        Cart::where('cashier_id', $user->id)
            ->where('store_id', $storeId)
            ->whereNull('hold_id')
            ->update([
                'hold_id' => (string) Str::uuid(),
                'hold_label' => $request->label ?? 'Hold ' . now()->format('H:i'),
                'held_at' => now(),
                'cart_expires_at' => now()->addHours(2),
            ]);

        return back();
    }

    public function resumeHeldCart(string $holdId): RedirectResponse
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        DB::transaction(function () use ($user, $storeId, $holdId) {
            if (
                Cart::where('cashier_id', $user->id)
                    ->where('store_id', $storeId)
                    ->whereNull('hold_id')
                    ->exists()
            ) {
                Cart::where('cashier_id', $user->id)
                    ->where('store_id', $storeId)
                    ->whereNull('hold_id')
                    ->update([
                        'hold_id' => (string) Str::uuid(),
                        'hold_label' => 'Hold ' . now()->format('H:i'),
                        'held_at' => now(),
                        'cart_expires_at' => now()->addHours(2),
                    ]);
            }

            Cart::where('cashier_id', $user->id)
                ->where('store_id', $storeId)
                ->where('hold_id', $holdId)
                ->update([
                    'hold_id' => null,
                    'hold_label' => null,
                    'held_at' => null,
                    'cart_expires_at' => null,
                ]);
        });

        return back();
    }

    public function deleteHeldCart(string $holdId): RedirectResponse
    {
        Cart::where('cashier_id', Auth::id())
            ->where('hold_id', $holdId)
            ->delete();

        return back();
    }

    // =========================================================================
    // CHECKOUT / STORE SALE
    // =========================================================================
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'payment_method_id' => 'required|uuid|exists:payment_methods,id',
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'sales_person_id' => 'nullable|uuid|exists:sales_people,id',
            'discount_type_id' => 'nullable|uuid|exists:discount_types,id',
            'discount_amount' => 'nullable|numeric|min:0',
            'cash_amount' => 'nullable|numeric|min:0',
            'standalone_packagings' => 'nullable|array',
            'standalone_packagings.*.packaging_material_id' => 'required|uuid|exists:packaging_materials,id',
            'standalone_packagings.*.qty' => 'required|integer|min:1|max:99',
        ]);

        $user = Auth::user();
        $storeId = $user->default_store_id;

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$activeCashDrawer) {
            return back()->withErrors(['message' => 'Anda belum membuka shift.']);
        }

        $carts = Cart::with([
            'packagings.packagingMaterial',
            'product',
            'variant:id,name,code',
            'intensity:id,name,code',
            'size:id,name,volume_ml',
        ])
            ->where('cashier_id', $user->id)
            ->where('store_id', $storeId)
            ->whereNull('hold_id')
            ->get();

        if ($carts->isEmpty()) {
            return back()->withErrors(['message' => 'Keranjang kosong']);
        }

        $paymentMethod = PaymentMethod::findOrFail($request->payment_method_id);
        $customer = $request->customer_id ? Customer::find($request->customer_id) : null;
        $salesPerson = $request->sales_person_id ? SalesPerson::find($request->sales_person_id) : null;
        $discountType = $request->discount_type_id ? DiscountType::find($request->discount_type_id) : null;
        $stockDeduction = $this->stockDeduction;

        $standalonePkgs = [];
        foreach ((array) $request->standalone_packagings as $sp) {
            $pkg = PackagingMaterial::find($sp['packaging_material_id'] ?? null);
            if ($pkg) {
                $standalonePkgs[] = ['pkg' => $pkg, 'qty' => (int) ($sp['qty'] ?? 1)];
            }
        }

        $sale = DB::transaction(function () use ($carts, $standalonePkgs, $request, $user, $storeId, $paymentMethod, $customer, $salesPerson, $discountType, $stockDeduction, $activeCashDrawer) {
            [$subtotalPerfume, $subtotalPackaging, $cogsPerfume, $cogsPackaging, $cogsAlcohol]
                = $this->calcSubtotals($carts, $standalonePkgs);

            $subtotal = $subtotalPerfume + $subtotalPackaging;
            $discountAmount = min((float) ($request->discount_amount ?? 0), $subtotal);
            $total = max(0, $subtotal - $discountAmount);

            $isCash = $paymentMethod->can_give_change || $paymentMethod->type === 'cash';
            $amountPaid = $isCash ? (float) ($request->cash_amount ?? $total) : $total;
            $adminFee = (int) round($amountPaid * ($paymentMethod->admin_fee_pct ?? 0) / 100);
            $change = $isCash ? max(0, $amountPaid - $total) : 0;

            $cogsTotal = $cogsPerfume + $cogsPackaging + $cogsAlcohol;
            $grossProfit = $total - $cogsTotal;
            $marginPct = $total > 0 ? round($grossProfit / $total * 100, 2) : 0;

            $sale = Sale::create([
                'sale_number' => $this->generateSaleNumber($storeId),
                'store_id' => $storeId,
                'cash_drawer_id' => $activeCashDrawer->id,
                'cashier_id' => $user->id,
                'cashier_name' => $user->name,
                'sales_person_id' => $salesPerson?->id,
                'sales_person_name' => $salesPerson?->name,
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name,
                'sold_at' => now(),
                'subtotal_perfume' => $subtotalPerfume,
                'subtotal_packaging' => $subtotalPackaging,
                'subtotal' => $subtotal,
                'discount_amount' => (int) $discountAmount,
                'tax_amount' => 0,
                'total' => (int) $total,
                'amount_paid' => (int) $amountPaid,
                'change_amount' => (int) $change,
                'cogs_perfume' => $cogsPerfume,
                'cogs_packaging' => $cogsPackaging,
                'cogs_alcohol' => $cogsAlcohol,
                'cogs_total' => $cogsTotal,
                'gross_profit' => (int) $grossProfit,
                'gross_margin_pct' => $marginPct,
                'points_earned' => 0,
                'points_redeemed' => 0,
                'status' => 'completed',
            ]);

            $saleItemIds = [];

            foreach ($carts as $cart) {
                /** @var \App\Models\Cart $cart */
                $isCustom = (bool) ($cart->is_custom_order ?? false);
                $itemSub = $cart->unit_price * $cart->qty;

                // HPP oil
                $cogsPerUnit = $isCustom
                    ? $this->calcCustomOilCogs($cart)
                    : ($cart->product?->production_cost ?? 0);
                $itemCogs = $cogsPerUnit * $cart->qty;

                // HPP alkohol (gratis ke customer, tetap masuk COGS)
                $alcoholCogsPerUnit = $isCustom
                    ? $this->calcCustomAlcoholCogs($cart)
                    : 0;
                $alcoholCogsTotal = $alcoholCogsPerUnit * $cart->qty;

                $totalCogsThisItem = $itemCogs + $alcoholCogsTotal;
                $itemProfit = $itemSub - $totalCogsThisItem;

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $cart->product_id,
                    'product_name' => $this->buildProductName($cart),
                    'product_sku' => $cart->product?->sku,
                    'variant_name' => $cart->variant?->name,
                    'intensity_code' => $cart->intensity?->code,
                    'size_ml' => $isCustom
                        ? $cart->custom_total_volume
                        : $cart->size?->volume_ml,
                    'variant_id_snapshot' => $cart->variant_id,
                    'intensity_id_snapshot' => $cart->intensity_id,
                    'size_id_snapshot' => $cart->size_id,
                    'qty' => $cart->qty,
                    'unit_price' => $cart->unit_price,
                    'item_discount' => 0,
                    'subtotal' => $itemSub,
                    'cogs_per_unit' => $cogsPerUnit,
                    'cogs_total' => $itemCogs,
                    'line_gross_profit' => $itemProfit,
                    'line_gross_margin_pct' => $itemSub > 0
                        ? round($itemProfit / $itemSub * 100, 2) : 0,
                    // ── Custom order fields ─────────────────────────────────
                    'is_custom_order' => $isCustom,
                    'custom_oil_qty' => $isCustom ? $cart->custom_oil_qty : null,
                    'custom_alcohol_qty' => $isCustom ? $cart->custom_alcohol_qty : null,
                    'custom_other_qty' => $isCustom ? $cart->custom_other_qty : null,
                    'custom_total_volume' => $isCustom ? $cart->custom_total_volume : null,
                    'alcohol_is_free' => true,
                    'alcohol_cogs_per_unit' => $alcoholCogsPerUnit,
                    'alcohol_cogs_total' => $alcoholCogsTotal,
                    // Snapshot harga jual oil per ml saat transaksi
                    'oil_selling_price_snapshot' => $isCustom ? $cart->oil_selling_price_snapshot : null,
                    // ───────────────────────────────────────────────────────
                    'notes' => $cart->notes,
                ]);

                foreach ($cart->packagings as $cartPkg) {
                    $this->createSaleItemPackaging($saleItem->id, $cartPkg);
                }

                $saleItemIds[] = $saleItem->id;
            }

            // Standalone packagings
            foreach ($standalonePkgs as $sp) {
                $pkg = $sp['pkg'];
                $qty = $sp['qty'];
                $unitEffective = $pkg->is_free ? 0 : (int) ($pkg->selling_price ?? 0);
                $pkgSub = $unitEffective * $qty;
                $pkgCogs = (int) (($pkg->average_cost ?? 0) * $qty);
                $nameSuffix = $pkg->is_free ? ' [GRATIS]' : '';

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => null,
                    'product_name' => '[Kemasan] ' . $pkg->name . $nameSuffix,
                    'product_sku' => $pkg->code,
                    'variant_name' => null,
                    'intensity_code' => null,
                    'size_ml' => null,
                    'variant_id_snapshot' => null,
                    'intensity_id_snapshot' => null,
                    'size_id_snapshot' => null,
                    'qty' => $qty,
                    'unit_price' => $unitEffective,
                    'item_discount' => 0,
                    'subtotal' => $pkgSub,
                    'cogs_per_unit' => $pkg->average_cost ?? 0,
                    'cogs_total' => $pkgCogs,
                    'line_gross_profit' => $pkgSub - $pkgCogs,
                    'line_gross_margin_pct' => $pkgSub > 0
                        ? round(($pkgSub - $pkgCogs) / $pkgSub * 100, 2) : 0,
                    'notes' => $pkg->is_free
                        ? 'Kemasan gratis: ' . ($pkg->free_condition_note ?? 'Gratis')
                        : 'Kemasan standalone',
                ]);
            }

            // Sale Discount
            if ($discountAmount > 0) {
                SaleDiscount::create([
                    'sale_id' => $sale->id,
                    'discount_type_id' => $discountType?->id,
                    'discount_name' => $discountType?->name ?? 'Diskon Manual',
                    'discount_category' => $discountType?->type ?? 'manual',
                    'discount_value' => $discountType?->value ?? 0,
                    'applied_amount' => (int) $discountAmount,
                    'sort_order' => 1,
                ]);

                if ($discountType) {
                    DiscountUsage::create([
                        'discount_type_id' => $discountType->id,
                        'order_id' => $sale->id,
                        'store_id' => $storeId,
                        'customer_id' => $customer?->id,
                        'discount_amount' => (int) $discountAmount,
                        'original_amount' => (int) $subtotal,
                        'final_amount' => (int) $total,
                        'used_at' => now(),
                    ]);
                }
            }

            // Sale Payment
            SalePayment::create([
                'sale_id' => $sale->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => (int) $amountPaid,
                'admin_fee' => $adminFee,
                'payment_method_name' => $paymentMethod->name,
                'payment_method_type' => $paymentMethod->type,
                'payment_status' => 'completed',
                'settled_at' => now(),
            ]);

            // Loyalty Points
            if ($customer && $total > 0) {
                $pointsEarned = (int) floor($total / 10000);

                if ($pointsEarned > 0) {
                    $sale->update(['points_earned' => $pointsEarned]);
                    $customer->increment('points', $pointsEarned);
                    $customer->increment('lifetime_points_earned', $pointsEarned);
                    $customer->increment('lifetime_spending', (int) $total);
                    $customer->increment('total_transactions');

                    CustomerPointLedger::create([
                        'customer_id' => $customer->id,
                        'type' => 'earned',
                        'points' => $pointsEarned,
                        'balance_after' => $customer->fresh()->points,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => "Pembelian {$sale->sale_number}",
                    ]);
                }
            }

            // Stock Deduction
            $saleItems = SaleItem::with('packagings')
                ->whereIn('id', $saleItemIds)
                ->get();

            $stockDeduction->deductAfterSale($sale, $storeId, $saleItems);

            if (!empty($standalonePkgs)) {
                $stockDeduction->deductStandalonePackagings($sale, $storeId, $standalonePkgs);
            }

            // Bersihkan cart
            Cart::where('cashier_id', $user->id)
                ->where('store_id', $storeId)
                ->whereNull('hold_id')
                ->delete();

            return $sale;
        });

        return redirect()->route('transactions.print', ['saleNumber' => str_replace('/', '-', $sale->sale_number)])
            ->with('success', 'Transaksi berhasil disimpan!')
            ->with('from_transaction', true);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Resolve ingredient oil yang dipakai untuk custom order pricing.
     *
     * Prioritas:
     *   1. Ingredient oil yang terkait variant (via variant_recipes) + punya selling_price
     *   2. Ingredient oil manapun yang is_active + punya selling_price (fallback global)
     *
     * Return: Ingredient model dengan field id, name, selling_price, average_cost
     *         atau null jika tidak ditemukan.
     */
    private function resolveOilIngredient(?string $variantId): ?object
    {
        // Prioritas 1: spesifik variant
        if ($variantId) {
            $ingredient = DB::table('ingredients as i')
                ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
                ->join('variant_recipes as vr', 'vr.ingredient_id', '=', 'i.id')
                ->where('vr.variant_id', $variantId)
                ->where('ic.ingredient_type', 'oil')
                ->where('i.is_active', true)
                ->whereNotNull('i.selling_price')
                ->where('i.selling_price', '>', 0)
                ->orderByDesc('i.selling_price')   // ambil yang paling mahal jika ada >1
                ->select('i.id', 'i.name', 'i.selling_price', 'i.average_cost')
                ->first();

            if ($ingredient) {
                return $ingredient;
            }
        }

        // Prioritas 2: fallback global — ingredient oil apapun yang punya selling_price
        return DB::table('ingredients as i')
            ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
            ->where('ic.ingredient_type', 'oil')
            ->where('i.is_active', true)
            ->whereNotNull('i.selling_price')
            ->where('i.selling_price', '>', 0)
            ->orderByDesc('i.selling_price')
            ->select('i.id', 'i.name', 'i.selling_price', 'i.average_cost')
            ->first();
    }

    /**
     * Hitung HPP oil untuk custom order menggunakan average_cost ingredient
     * (WAC dari stok — untuk laporan margin, bukan untuk harga jual).
     */
    private function calcCustomOilCogs(Cart $cart): float
    {
        if (!$cart->custom_oil_qty) {
            return 0;
        }

        // Gunakan WAC dari stok toko — sama seperti sebelumnya
        $oilWac = $this->getOilWac($cart->store_id, $cart->variant_id);

        return round($cart->custom_oil_qty * $oilWac, 4);
    }

    /**
     * Hitung HPP alkohol untuk custom order.
     * Alkohol gratis ke customer, tetapi HPP tetap dihitung untuk laporan margin.
     */
    private function calcCustomAlcoholCogs(Cart $cart): float
    {
        if (!$cart->custom_alcohol_qty) {
            return 0;
        }

        $wac = (float) ($cart->alcohol_cost_snapshot ?? 0);

        return round($cart->custom_alcohol_qty * $wac, 4);
    }

    /**
     * Ambil WAC alkohol dari store_ingredient_stocks.
     */
    private function getAlcoholWac(?string $storeId): float
    {
        if (!$storeId)
            return 0;

        return (float) DB::table('store_ingredient_stocks as sis')
            ->join('ingredients as i', 'i.id', '=', 'sis.ingredient_id')
            ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
            ->where('sis.store_id', $storeId)
            ->where('ic.ingredient_type', 'alcohol')
            ->where('i.is_active', true)
            ->orderByDesc('sis.quantity')
            ->value('sis.average_cost') ?? 0;
    }

    /**
     * Ambil WAC oil dari store_ingredient_stocks untuk kalkulasi COGS.
     * (Berbeda dari selling_price — ini untuk HPP/margin, bukan harga jual.)
     */
    private function getOilWac(?string $storeId, ?string $variantId): float
    {
        if (!$storeId)
            return 0;

        if ($variantId) {
            $wac = (float) DB::table('store_ingredient_stocks as sis')
                ->join('variant_recipes as vr', 'vr.ingredient_id', '=', 'sis.ingredient_id')
                ->join('ingredients as i', 'i.id', '=', 'sis.ingredient_id')
                ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
                ->where('sis.store_id', $storeId)
                ->where('vr.variant_id', $variantId)
                ->where('ic.ingredient_type', 'oil')
                ->where('i.is_active', true)
                ->value('sis.average_cost') ?? 0;

            if ($wac > 0)
                return $wac;
        }

        return (float) DB::table('store_ingredient_stocks as sis')
            ->join('ingredients as i', 'i.id', '=', 'sis.ingredient_id')
            ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
            ->where('sis.store_id', $storeId)
            ->where('ic.ingredient_type', 'oil')
            ->where('i.is_active', true)
            ->orderByDesc('sis.quantity')
            ->value('sis.average_cost') ?? 0;
    }

    private function getActiveCarts(int $cashierId, string $storeId): Collection
    {
        return Cart::with([
            'variant:id,name,code,image',
            'intensity:id,name,code',
            'size:id,name,volume_ml',
            'packagings.packagingMaterial:id,name,code,selling_price,is_free,free_condition_note',
        ])
            ->where('cashier_id', $cashierId)
            ->where('store_id', $storeId)
            ->whereNull('hold_id')
            ->latest()
            ->get();
    }

    private function calcCartsTotal(Collection $carts): int
    {
        return (int) $carts->sum(function ($cart) {
            $pkgTotal = $cart->packagings->sum(
                fn($p) => ($p->unit_price ?? 0) * ($p->qty ?? 1)
            );
            return ($cart->unit_price ?? 0) * $cart->qty + $pkgTotal;
        });
    }

    private function getHeldCarts(int $cashierId, string $storeId): Collection
    {
        return Cart::where('cashier_id', $cashierId)
            ->where('store_id', $storeId)
            ->whereNotNull('hold_id')
            ->select('hold_id', 'hold_label', 'held_at')
            ->selectRaw('SUM(unit_price * qty) as total')
            ->groupBy('hold_id', 'hold_label', 'held_at')
            ->get()
            ->map(fn($h) => [
                'hold_id' => $h->hold_id,
                'label' => $h->hold_label,
                'total' => (int) $h->total,
                'held_at' => $h->held_at,
            ]);
    }

    private function getActiveDiscountsForStore(string $storeId): Collection
    {
        return DiscountType::where('is_active', true)
            ->where(fn($q) => $q->whereNull('start_date')
                ->orWhereDate('start_date', '<=', today()))
            ->where(fn($q) => $q->whereNull('end_date')
                ->orWhereDate('end_date', '>=', today()))
            ->where(fn($q) => $q->whereDoesntHave('stores')
                ->orWhereHas('stores', fn($sq) => $sq->where('store_id', $storeId)))
            ->with(['requirements', 'applicabilities'])
            ->orderByDesc('priority')
            ->get([
                'id',
                'name',
                'code',
                'type',
                'value',
                'description',
                'min_purchase_amount',
                'min_purchase_quantity',
                'max_discount_amount',
                'buy_quantity',
                'get_quantity',
                'get_product_type',
                'is_game_reward',
                'is_combinable',
                'priority',
            ]);
    }

    /**
     * Hitung subtotals — mengembalikan 5 nilai.
     * Return: [subtotalPerfume, subtotalPackaging, cogsPerfume, cogsPackaging, cogsAlcohol]
     */
    private function calcSubtotals(Collection $carts, array $standalonePkgs): array
    {
        $sp = $sc = $cp = $cc = $ca = 0;

        foreach ($carts as $cart) {
            $isCustom = (bool) ($cart->is_custom_order ?? false);

            $sp += $cart->unit_price * $cart->qty;

            if ($isCustom) {
                $oilCogs = $this->calcCustomOilCogs($cart) * $cart->qty;
                $cp += $oilCogs;

                $alcCogs = $this->calcCustomAlcoholCogs($cart) * $cart->qty;
                $ca += $alcCogs;
            } else {
                $cp += ($cart->product?->production_cost ?? 0) * $cart->qty;
            }

            foreach ($cart->packagings as $pkg) {
                $sc += $pkg->unit_price * $pkg->qty;
                $cc += ($pkg->packagingMaterial?->average_cost ?? 0) * $pkg->qty;
            }
        }

        foreach ($standalonePkgs as $s) {
            $effectivePrice = $s['pkg']->is_free ? 0 : ($s['pkg']->selling_price ?? 0);
            $sc += $effectivePrice * $s['qty'];
            $cc += ($s['pkg']->average_cost ?? 0) * $s['qty'];
        }

        return [(int) $sp, (int) $sc, (int) $cp, (int) $cc, (int) $ca];
    }

    private function createSaleItemPackaging(string $saleItemId, $cartPkg): void
    {
        $pkg = $cartPkg->packagingMaterial;
        $isFree = $pkg?->is_free ?? false;
        $unitPrice = $cartPkg->unit_price;
        $sub = $unitPrice * $cartPkg->qty;
        $unitCost = $pkg?->average_cost ?? 0;
        $cogs = $unitCost * $cartPkg->qty;
        $name = ($pkg?->name ?? 'Packaging') . ($isFree ? ' [GRATIS]' : '');

        SaleItemPackaging::create([
            'sale_item_id' => $saleItemId,
            'packaging_material_id' => $cartPkg->packaging_material_id,
            'packaging_name' => $name,
            'packaging_code' => $pkg?->code,
            'qty' => $cartPkg->qty,
            'unit_price' => $unitPrice,
            'subtotal' => $sub,
            'unit_cost' => $unitCost,
            'cogs_total' => $cogs,
            'line_gross_profit' => $sub - $cogs,
            'line_gross_margin_pct' => $sub > 0
                ? round(($sub - $cogs) / $sub * 100, 2) : 0,
        ]);
    }

    private function buildProductName($cart): string
    {
        if ($cart->is_custom_order ?? false) {
            $parts = array_filter([
                $cart->variant?->name,
                'Custom',
                $cart->custom_oil_qty ? $cart->custom_oil_qty . 'ml oil' : null,
                $cart->custom_alcohol_qty ? $cart->custom_alcohol_qty . 'ml alkohol' : null,
            ]);
            return implode(' - ', $parts);
        }

        if ($cart->product?->name) {
            return $cart->product->name;
        }
        return implode(' - ', array_filter([
            $cart->variant?->name,
            $cart->intensity?->code,
            $cart->size?->volume_ml ? $cart->size->volume_ml . 'ml' : null,
        ]));
    }

    private function generateSaleNumber(string $storeId): string
    {
        $prefix = 'INV-' . now()->format('Ymd') . '-';
        $last = Sale::where('sale_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('sale_number')
            ->value('sale_number');
        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;
        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }
}
