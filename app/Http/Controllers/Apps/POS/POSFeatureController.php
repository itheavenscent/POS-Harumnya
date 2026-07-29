<?php

namespace App\Http\Controllers\Apps\POS;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;
use App\Models\CashDrawer;
use App\Models\StockTransfer;
use App\Models\StockMovement;
use App\Models\WarehouseIngredientStock;
use App\Models\WarehousePackagingStock;
use App\Models\Warehouse;
use App\Models\Store;
use App\Models\Ingredient;
use App\Models\PackagingMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class POSFeatureController extends Controller
{
    /**
     * View-only stock for the current store.
     */
    public function stock(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;
        $type = $request->input('type', 'ingredient');

        if ($type === 'ingredient') {
            $stocks = StoreIngredientStock::with(['ingredient.category'])
                ->join('ingredients', 'store_ingredient_stocks.ingredient_id', '=', 'ingredients.id')
                ->where('store_ingredient_stocks.store_id', $storeId)
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('ingredients.name', 'ilike', "%{$search}%")
                          ->orWhere('ingredients.code', 'ilike', "%{$search}%");
                    });
                })
                ->orderBy('ingredients.name')
                ->select('store_ingredient_stocks.*')
                ->paginate(20)
                ->withQueryString();
        } else {
            $stocks = StorePackagingStock::with(['packagingMaterial.category', 'packagingMaterial.size'])
                ->join('packaging_materials', 'store_packaging_stocks.packaging_material_id', '=', 'packaging_materials.id')
                ->where('store_packaging_stocks.store_id', $storeId)
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('packaging_materials.name', 'ilike', "%{$search}%")
                          ->orWhere('packaging_materials.code', 'ilike', "%{$search}%");
                    });
                })
                ->orderBy('packaging_materials.name')
                ->select('store_packaging_stocks.*')
                ->paginate(20)
                ->withQueryString();
        }

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Stock', [
            'stocks' => $stocks,
            'filters' => $request->only(['search', 'type']),
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    /**
     * View-only transaction history for the current store.
     */
    public function transactions(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $sales = Sale::with(['customer', 'salesPerson', 'items.packagings.packagingMaterial', 'payments.paymentMethod'])
            ->withCount('items')
            ->where('store_id', $storeId)
            ->when(!$user->hasRole('super-admin') && !$user->hasPermissionTo('transactions-all'), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sale_number', 'ilike', "%{$search}%")
                      ->orWhere('customer_name', 'ilike', "%{$search}%");
                });
            })
            ->latest('sold_at')
            ->paginate(20)
            ->withQueryString();

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Transactions', [
            'sales' => $sales,
            'filters' => $request->only(['search']),
            'activeCashDrawer' => $activeCashDrawer,
            'canPrint' => $user->can('transactions-print'),
        ]);
    }

    /**
     * List stock transfers destined to this store.
     */
    public function fulfillmentIndex(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $transfers = StockTransfer::query()
            ->with(['creator:id,name', 'items'])
            ->where('to_location_type', 'store')
            ->where('to_location_id', $storeId)
            ->whereIn('status', ['in_transit', 'completed', 'cancelled'])
            ->when($request->search, fn ($q, $s) =>
                $q->where('transfer_number', 'like', "%{$s}%")
                  ->orWhere('notes', 'like', "%{$s}%")
            )
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest('transfer_date')
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $transfers->getCollection()->each(function ($t) {
            $t->from_name = $this->locationName($t->from_location_type, $t->from_location_id);
            $t->to_name   = $this->locationName($t->to_location_type,   $t->to_location_id);
        });

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Fulfillment/Index', [
            'transfers' => $transfers,
            'filters'   => $request->only(['search', 'status']),
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    /**
     * Show stock transfer details.
     */
    public function fulfillmentShow(string $id): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $transfer = StockTransfer::with([
            'items', 'creator:id,name', 'approver:id,name',
            'sender:id,name', 'receiver:id,name',
        ])->findOrFail($id);

        if ($transfer->to_location_type !== 'store' || $transfer->to_location_id !== $storeId) {
            abort(403, 'Akses ditolak. Transfer ini bukan ditujukan untuk toko Anda.');
        }

        $transfer->from_name = $this->locationName($transfer->from_location_type, $transfer->from_location_id);
        $transfer->to_name   = $this->locationName($transfer->to_location_type,   $transfer->to_location_id);

        $transfer->items->each(function ($item) use ($transfer) {
            [$name, $code, $unit] = $this->resolveItem($item->item_type, $item->item_id);
            $item->item_name    = $name;
            $item->item_code    = $code;
            $item->item_unit    = $unit;
            $stock              = $this->findStock($transfer->to_location_type, $transfer->to_location_id, $item->item_type, $item->item_id);
            $item->dest_stock   = $stock ? (int) $stock->quantity : 0;
        });

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Fulfillment/Show', [
            'transfer'  => $transfer,
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    /**
     * Receive stock transfer (fulfillment).
     */
    public function fulfillmentReceive(Request $request, string $id)
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $transfer = StockTransfer::with('items')->findOrFail($id);

        if ($transfer->to_location_type !== 'store' || $transfer->to_location_id !== $storeId) {
            abort(403, 'Akses ditolak. Transfer ini bukan ditujukan untuk toko Anda.');
        }

        if (! $transfer->canReceive()) {
            return back()->withErrors(['status' => 'Transfer tidak dapat diterima dari status ini.']);
        }

        $request->validate([
            'items'                     => 'required|array',
            'items.*.id'                => 'required|uuid',
            'items.*.quantity_received' => 'required|integer|min:0',
            'actual_arrival_date'       => 'nullable|date',
        ]);

        DB::transaction(function () use ($transfer, $request, $user) {
            $now    = now();
            $userId = $user->id;
            $rcvMap = collect($request->items)->keyBy('id');

            foreach ($transfer->items as $item) {
                $rcvQty = (int) ($rcvMap[$item->id]['quantity_received'] ?? $item->quantity_sent);
                $item->update(['quantity_received' => $rcvQty]);

                if ($rcvQty <= 0) continue;

                $destStock = $this->findOrCreateStock(
                    $transfer->to_location_type, $transfer->to_location_id,
                    $item->item_type, $item->item_id
                );

                $qtyBefore  = (int)   $destStock->quantity;
                $avgBefore  = (float) $destStock->average_cost;
                $unitCost   = (float) $item->unit_cost;
                $qtyAfter   = $qtyBefore + $rcvQty;

                $newAvgCost = $qtyAfter > 0
                    ? round((($qtyBefore * $avgBefore) + ($rcvQty * $unitCost)) / $qtyAfter, 4)
                    : $unitCost;

                $destStock->update([
                    'quantity'     => $qtyAfter,
                    'average_cost' => $newAvgCost,
                    'total_value'  => round($qtyAfter * $newAvgCost, 2),
                    'last_in_at'   => $now,
                    'last_in_by'   => $userId,
                    'last_in_qty'  => $rcvQty,
                ]);

                StockMovement::create([
                    'location_type'    => $transfer->to_location_type,
                    'location_id'      => $transfer->to_location_id,
                    'movement_type'    => 'transfer_in',
                    'item_type'        => $item->item_type,
                    'item_id'          => $item->item_id,
                    'qty_change'       => $rcvQty,
                    'qty_before'       => $qtyBefore,
                    'qty_after'        => $qtyAfter,
                    'unit_cost'        => $unitCost,
                    'total_cost'       => round($rcvQty * $unitCost, 2),
                    'avg_cost_before'  => $avgBefore,
                    'avg_cost_after'   => $newAvgCost,
                    'reference_type'   => StockTransfer::class,
                    'reference_id'     => $transfer->id,
                    'reference_number' => $transfer->transfer_number,
                    'movement_date'    => $transfer->transfer_date,
                    'notes'            => "Fulfillment Kasir {$transfer->transfer_number} ← {$this->locationName($transfer->from_location_type, $transfer->from_location_id)}",
                    'created_by'       => $userId,
                ]);
            }

            $transfer->update([
                'status'              => 'completed',
                'received_by'         => $userId,
                'received_at'         => $now,
                'actual_arrival_date' => $request->actual_arrival_date ?? today(),
            ]);
        });

        return to_route('pos.fulfillment.index')
            ->with('success', 'Transfer diterima. Stok berhasil masuk ke toko Anda!');
    }

    /**
     * Laporan Penjualan khusus toko kasir (scoped ke default_store_id).
     * Berbeda dari laporan admin (laporan.penjualan) yang lintas toko.
     */
    public function salesReport(Request $request): Response
    {
        $user    = Auth::user();
        $storeId = $user->default_store_id;

        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', now()->toDateString());
        $from = \Illuminate\Support\Carbon::parse($dateFrom)->startOfDay();
        $to   = \Illuminate\Support\Carbon::parse($dateTo)->endOfDay();

        // Batas rentang 90 hari agar konsisten dgn laporan admin
        if ($from->diffInDays($to) > 90) {
            $from = $to->copy()->subDays(90)->startOfDay();
        }

        $summary = DB::table('sales')
            ->where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw('
                COUNT(*)                            AS total_transactions,
                COALESCE(SUM(total), 0)             AS total_revenue,
                COALESCE(AVG(total), 0)             AS avg_order,
                COUNT(DISTINCT customer_id)         AS unique_customers
            ')
            ->first();

        // Total diskon dari sale_discounts (bukan sales.discount_amount — kolom itu 0
        // untuk transaksi reward/multiple discount). Sumber sama dgn dashboard admin.
        $totalDiscount = DB::table('sale_discounts')
            ->join('sales', 'sale_discounts.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sold_at', [$from, $to])
            ->sum('sale_discounts.applied_amount');

        $itemsSold = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sold_at', [$from, $to])
            ->sum('sale_items.qty');

        // Tren harian (support MySQL & PostgreSQL)
        $driver    = DB::getDriverName();
        $dayExpr   = $driver === 'pgsql' ? "TO_CHAR(sold_at, 'YYYY-MM-DD')" : "DATE(sold_at)";
        $labelExpr = $driver === 'pgsql' ? "TO_CHAR(sold_at, 'DD Mon')"     : "DATE_FORMAT(sold_at, '%d %b')";

        $trend = DB::table('sales')
            ->where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw("
                {$dayExpr}                  AS day,
                {$labelExpr}                AS label,
                COUNT(*)                    AS transactions,
                COALESCE(SUM(total), 0)     AS revenue
            ")
            ->groupByRaw("{$dayExpr}, {$labelExpr}")
            ->orderByRaw($dayExpr)
            ->get()
            ->map(fn ($r) => [
                'label'        => $r->label,
                'transactions' => (int)   $r->transactions,
                'revenue'      => (float) $r->revenue,
            ]);

        $topVariants = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sold_at', [$from, $to])
            ->whereNotNull('sale_items.variant_id_snapshot')
            ->selectRaw("
                COALESCE(sale_items.variant_name, 'Tanpa Nama')  AS name,
                SUM(sale_items.qty)                              AS qty,
                COALESCE(SUM(sale_items.subtotal), 0)            AS revenue
            ")
            ->groupBy('sale_items.variant_name')
            ->orderByDesc('qty')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name'    => $r->name,
                'qty'     => (int)   $r->qty,
                'revenue' => (float) $r->revenue,
            ]);

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/SalesReport', [
            'storeName' => Store::find($storeId)?->name ?? 'Toko Anda',
            'filters'   => ['date_from' => $from->toDateString(), 'date_to' => $to->toDateString()],
            'summary'   => [
                'totalTransactions' => (int)   $summary->total_transactions,
                'totalRevenue'      => (float) round($summary->total_revenue, 2),
                'totalDiscount'     => (float) round($totalDiscount ?? 0, 2),
                'avgOrder'          => (float) round($summary->avg_order, 2),
                'uniqueCustomers'   => (int)   $summary->unique_customers,
                'totalItemsSold'    => (int)   $itemsSold,
            ],
            'trend'       => $trend,
            'topVariants' => $topVariants,
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    /**
     * Ranking Sales khusus toko kasir (scoped ke default_store_id).
     */
    public function salesRanking(Request $request): Response
    {
        $user    = Auth::user();
        $storeId = $user->default_store_id;

        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', now()->toDateString());
        $from = \Illuminate\Support\Carbon::parse($dateFrom)->startOfDay();
        $to   = \Illuminate\Support\Carbon::parse($dateTo)->endOfDay();

        if ($from->diffInDays($to) > 90) {
            $from = $to->copy()->subDays(90)->startOfDay();
        }

        $ranking = DB::table('sales')
            ->join('sales_people', 'sales.sales_person_id', '=', 'sales_people.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereNull('sales.deleted_at')
            ->whereNull('sales_people.deleted_at')
            ->whereBetween('sales.sold_at', [$from, $to])
            ->selectRaw('
                sales_people.id,
                sales_people.name,
                sales_people.code,
                COUNT(sales.id)                 AS transactions_count,
                COALESCE(SUM(sales.total), 0)   AS total_revenue,
                COALESCE(AVG(sales.total), 0)   AS average_sales
            ')
            ->groupBy('sales_people.id', 'sales_people.name', 'sales_people.code')
            ->orderByDesc('total_revenue')
            ->get();

        // Item terjual per sales person (query terpisah agar SQL sederhana)
        $itemsMap = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereNotNull('sales.sales_person_id')
            ->whereBetween('sales.sold_at', [$from, $to])
            ->selectRaw('sales.sales_person_id, SUM(sale_items.qty) AS qty')
            ->groupBy('sales.sales_person_id')
            ->pluck('qty', 'sales.sales_person_id');

        $ranking = $ranking->map(fn ($r) => [
            'id'                 => $r->id,
            'name'               => $r->name,
            'code'               => $r->code,
            'transactions_count' => (int)   $r->transactions_count,
            'total_revenue'      => (float) $r->total_revenue,
            'average_sales'      => (float) $r->average_sales,
            'total_items_sold'   => (int)   ($itemsMap[$r->id] ?? 0),
        ]);

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/SalesRanking', [
            'storeName' => Store::find($storeId)?->name ?? 'Toko Anda',
            'filters'   => ['date_from' => $from->toDateString(), 'date_to' => $to->toDateString()],
            'ranking'   => $ranking,
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    private function findStock(string $locType, string $locId, string $itemType, string $itemId)
    {
        return match ([$locType, $itemType]) {
            ['warehouse', 'ingredient']         => WarehouseIngredientStock::where('warehouse_id', $locId)->where('ingredient_id', $itemId)->first(),
            ['warehouse', 'packaging_material'] => WarehousePackagingStock::where('warehouse_id', $locId)->where('packaging_material_id', $itemId)->first(),
            ['store', 'ingredient']             => StoreIngredientStock::where('store_id', $locId)->where('ingredient_id', $itemId)->first(),
            ['store', 'packaging_material']     => StorePackagingStock::where('store_id', $locId)->where('packaging_material_id', $itemId)->first(),
            default => null,
        };
    }

    private function findOrCreateStock(string $locType, string $locId, string $itemType, string $itemId)
    {
        $stock = $this->findStock($locType, $locId, $itemType, $itemId);
        if ($stock) return $stock;

        $base = ['quantity' => 0, 'average_cost' => 0.0, 'total_value' => 0.0];
        return match ([$locType, $itemType]) {
            ['warehouse', 'ingredient']         => WarehouseIngredientStock::create(array_merge($base, ['warehouse_id' => $locId, 'ingredient_id' => $itemId])),
            ['warehouse', 'packaging_material'] => WarehousePackagingStock::create(array_merge($base, ['warehouse_id' => $locId, 'packaging_material_id' => $itemId])),
            ['store', 'ingredient']             => StoreIngredientStock::create(array_merge($base, ['store_id' => $locId, 'ingredient_id' => $itemId])),
            ['store', 'packaging_material']     => StorePackagingStock::create(array_merge($base, ['store_id' => $locId, 'packaging_material_id' => $itemId])),
        };
    }

    private function locationName(string $type, string $id): string
    {
        return $type === 'warehouse'
            ? (Warehouse::find($id)?->name ?? '-')
            : (Store::find($id)?->name     ?? '-');
    }

    private function resolveItem(string $type, string $id): array
    {
        if ($type === 'ingredient') {
            $i = Ingredient::find($id);
            return [$i?->name ?? '-', $i?->code ?? '-', $i?->unit ?? 'unit'];
        }
        $p = PackagingMaterial::with('size')->find($id);
        return [$p?->name ?? '-', $p?->code ?? '-', $p?->size?->name ?? 'pcs'];
    }
}
