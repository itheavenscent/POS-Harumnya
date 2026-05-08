<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Ingredient;
use App\Models\PackagingMaterial;
use App\Models\Warehouse;
use App\Models\Store;
use App\Models\WarehouseIngredientStock;
use App\Models\WarehousePackagingStock;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;

/**
 * PurchaseController — PRODUCTION READY
 *
 * Perbaikan dari versi sebelumnya:
 *
 * [1] complete() — StockMovement::create() memakai field yang TIDAK ADA di migration:
 *       ✗ stockable_type / stockable_id   → dihapus dari migration
 *       ✗ quantity                         → diganti qty_change
 *       ✗ stock_before / stock_after       → diganti qty_before / qty_after
 *       ✗ reference_type tidak disertakan  → wajib ada
 *     Sekarang:
 *       ✓ qty_change / qty_before / qty_after
 *       ✓ unit_cost (15,4) / total_cost (15,2)
 *       ✓ avg_cost_before (15,4) / avg_cost_after (15,4)
 *       ✓ reference_type (FQCN) / reference_id / reference_number
 *       ✓ movement_type = 'purchase_in' (sesuai enum migration)
 *
 * [2] show() — filter StockMovement tanpa reference_type
 *       → risiko collision antar modul (purchase vs transfer vs repack)
 *       ✓ Ditambah: where('reference_type', Purchase::class)
 *
 * [3] index() summary — COUNT(*) FILTER (WHERE ...) adalah PostgreSQL syntax
 *       ✗ Tidak bekerja di MySQL
 *       ✓ Diganti: SUM(CASE WHEN status = '...' THEN 1 ELSE 0 END)
 *
 * Alur status:
 *   draft → pending → approved → received → completed
 *                  ↘ cancelled (dari draft / pending / approved)
 */
class PurchaseController extends Controller
{
    // =========================================================================
    // INDEX
    // =========================================================================

    public function index(Request $request)
    {
        $purchases = Purchase::query()
            ->with(['supplier:id,name,code', 'creator:id,name', 'items'])
            ->when($request->search, function ($q, $s) {
                $term = strtolower($s);
                $q->where(function ($inner) use ($term) {
                    $inner->whereRaw('LOWER(purchase_number) LIKE ?', ["%{$term}%"])
                          ->orWhereHas('supplier', function ($q2) use ($term) {
                              $q2->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                          });
                });
            })
            ->when($request->status,           fn ($q, $s) => $q->where('status', $s))
            ->when($request->destination_type, fn ($q, $t) => $q->where('destination_type', $t))
            ->when($request->date_from,        fn ($q, $d) => $q->whereDate('purchase_date', '>=', $d))
            ->when($request->date_to,          fn ($q, $d) => $q->whereDate('purchase_date', '<=', $d))
            ->latest('purchase_date')
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $purchases->getCollection()->each(function ($p) {
            $p->destination_name = $this->locationName($p->destination_type, $p->destination_id);
            $p->item_count       = $p->items->count();
        });

        // ★ FIX [3]: FILTER() adalah PostgreSQL syntax — pakai CASE WHEN untuk MySQL
        $summary = Purchase::query()->selectRaw("
            COUNT(*)                                                   AS total,
            SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END)    AS draft,
            SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END)    AS pending,
            SUM(CASE WHEN status = 'approved'  THEN 1 ELSE 0 END)    AS approved,
            SUM(CASE WHEN status = 'received'  THEN 1 ELSE 0 END)    AS received,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)    AS completed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)    AS cancelled
        ")->first();

        return Inertia::render('Dashboard/Purchases/Index', [
            'purchases' => $purchases,
            'filters'   => $request->only(['search', 'status', 'destination_type', 'date_from', 'date_to']),
            'summary'   => $summary,
        ]);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public function create()
    {
        return Inertia::render('Dashboard/Purchases/Create', $this->formData());
    }

    // =========================================================================
    // STORE — simpan sebagai draft
    // =========================================================================

    public function store(Request $request)
    {
        $v = $this->validateStore($request);

        DB::transaction(function () use ($v) {
            $purchase = Purchase::create([
                'purchase_number'        => Purchase::generateNumber(),
                'supplier_id'            => $v['supplier_id'],
                'destination_type'       => $v['destination_type'],
                'destination_id'         => $v['destination_id'],
                'purchase_date'          => $v['purchase_date'],
                'expected_delivery_date' => $v['expected_delivery_date'] ?? null,
                'status'                 => 'draft',
                'tax'                    => $v['tax']           ?? '0',
                'discount'               => $v['discount']      ?? '0',
                'shipping_cost'          => $v['shipping_cost'] ?? '0',
                'notes'                  => $v['notes']         ?? null,
                'created_by'             => auth()->id(),
            ]);

            [$subtotal] = $this->upsertItems($purchase, $v['items']);

            $total = $this->bcAdd(
                $this->bcSub(
                    $this->bcAdd($subtotal, (string) ($v['tax'] ?? 0), 2),
                    (string) ($v['discount'] ?? 0),
                    2
                ),
                (string) ($v['shipping_cost'] ?? 0),
                2
            );

            $colType = Schema::getColumnType('purchases', 'subtotal');
            if (str_contains($colType, 'int')) {
                $purchase->update([
                    'subtotal' => (int) round((float) $subtotal),
                    'total'    => (int) round((float) $total),
                ]);
            } else {
                $purchase->update(['subtotal' => $subtotal, 'total' => $total]);
            }
        });

        return to_route('purchases.index')
            ->with('success', 'Purchase Order berhasil disimpan sebagai draft!');
    }

    // =========================================================================
    // SHOW
    // =========================================================================

    public function show(string $id)
    {
        $purchase = Purchase::with([
            'items',
            'supplier',
            'creator:id,name',
            'approver:id,name',
            'receiver:id,name',
        ])->findOrFail($id);

        $purchase->destination_name = $this->locationName(
            $purchase->destination_type,
            $purchase->destination_id
        );

        $purchase->items->each(function ($item) {
            [$name, $code, $unit] = $this->resolveItem($item->item_type, $item->item_id);
            $item->item_name = $name;
            $item->item_code = $code;
            $item->item_unit = $unit;
        });

        // ★ FIX [2]: tambah filter reference_type agar tidak collision dengan modul lain
        // (StockTransfer, RepackTransaction, dll bisa punya UUID yang sama)
        $movements = StockMovement::where('reference_type', Purchase::class)
            ->where('reference_id', $purchase->id)
            ->with('creator:id,name')
            ->orderBy('created_at')
            ->get()
            ->each(function ($m) {
                $m->item_name     = $this->resolveItemName($m->item_type, $m->item_id);
                $m->location_name = $this->locationName($m->location_type, $m->location_id);
            });

        return Inertia::render('Dashboard/Purchases/Show', [
            'purchase'  => $purchase,
            'movements' => $movements,
        ]);
    }

    // =========================================================================
    // EDIT
    // =========================================================================

    public function edit(string $id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);

        if (! $purchase->canEdit()) {
            return back()->withErrors(['edit' => 'Purchase yang sudah diproses tidak dapat diedit.']);
        }

        $purchase->destination_name = $this->locationName(
            $purchase->destination_type,
            $purchase->destination_id
        );

        return Inertia::render('Dashboard/Purchases/Edit', array_merge(
            ['purchase' => $purchase],
            $this->formData()
        ));
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public function update(Request $request, string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if (! $purchase->canEdit()) {
            return back()->withErrors(['edit' => 'Purchase yang sudah diproses tidak dapat diedit.']);
        }

        $v = $this->validateUpdate($request);

        // destination tidak boleh diubah setelah dibuat
        $v['destination_type'] = $purchase->destination_type;
        $v['destination_id']   = $purchase->destination_id;

        DB::transaction(function () use ($purchase, $v) {
            $purchase->update([
                'supplier_id'            => $v['supplier_id'],
                'purchase_date'          => $v['purchase_date'],
                'expected_delivery_date' => $v['expected_delivery_date'] ?? null,
                'tax'                    => $v['tax']           ?? '0',
                'discount'               => $v['discount']      ?? '0',
                'shipping_cost'          => $v['shipping_cost'] ?? '0',
                'notes'                  => $v['notes']         ?? null,
            ]);

            $purchase->items()->delete();
            [$subtotal] = $this->upsertItems($purchase, $v['items']);

            $total = $this->bcAdd(
                $this->bcSub(
                    $this->bcAdd($subtotal, (string) ($v['tax'] ?? 0), 2),
                    (string) ($v['discount'] ?? 0),
                    2
                ),
                (string) ($v['shipping_cost'] ?? 0),
                2
            );

            $colType = Schema::getColumnType('purchases', 'subtotal');
            if (str_contains($colType, 'int')) {
                $purchase->update([
                    'subtotal' => (int) round((float) $subtotal),
                    'total'    => (int) round((float) $total),
                ]);
            } else {
                $purchase->update(['subtotal' => $subtotal, 'total' => $total]);
            }
        });

        return to_route('purchases.show', $id)
            ->with('success', 'Purchase Order berhasil diperbarui!');
    }

    // =========================================================================
    // WORKFLOW: draft → pending
    // =========================================================================

    public function submit(string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if (! $purchase->canSubmit()) {
            return back()->withErrors(['status' => 'Hanya draft yang dapat diajukan.']);
        }

        $purchase->update(['status' => 'pending']);

        return back()->with('success', 'Purchase Order diajukan untuk approval.');
    }

    // =========================================================================
    // WORKFLOW: pending → approved
    // =========================================================================

    public function approve(string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if (! $purchase->canApprove()) {
            return back()->withErrors(['status' => 'Purchase Order tidak dapat disetujui.']);
        }

        $purchase->update([
            'status'      => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Purchase Order disetujui.');
    }

    // =========================================================================
    // WORKFLOW: approved → received
    // =========================================================================

    public function receive(Request $request, string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if (! $purchase->canReceive()) {
            return back()->withErrors(['status' => 'Purchase Order tidak dapat di-receive.']);
        }

        $request->validate([
            'actual_delivery_date' => 'nullable|date',
        ]);

        $purchase->update([
            'status'               => 'received',
            'received_by'          => auth()->id(),
            'received_at'          => now(),
            'actual_delivery_date' => $request->actual_delivery_date ?? today(),
        ]);

        return back()->with('success', 'Barang diterima. Silakan selesaikan PO untuk memperbarui stok.');
    }

    // =========================================================================
    // WORKFLOW: received → completed
    // Update stok + WAC + StockMovement
    // =========================================================================

    public function complete(string $id)
    {
        $purchase = Purchase::with(['items', 'supplier'])->findOrFail($id);

        if (! $purchase->canComplete()) {
            return back()->withErrors(['status' => 'Purchase Order tidak dapat diselesaikan.']);
        }

        DB::transaction(function () use ($purchase) {
            $userId = auth()->id();
            $now    = now();

            foreach ($purchase->items as $item) {
                // quantity: integer SIGNED (negatif = retur ke supplier)
                $qty       = (int)   $item->quantity;
                // unit_price kolom decimal(15,2) — cast ke float untuk WAC
                $unitPrice = (float) $item->unit_price;

                $stock = $this->findOrCreateStock(
                    $purchase->destination_type,
                    $purchase->destination_id,
                    $item->item_type,
                    $item->item_id,
                    $unitPrice
                );

                $qtyBefore = (int)   $stock->quantity;      // bigInteger SIGNED
                $avgBefore = (float) $stock->average_cost;  // decimal(15,4)
                $qtyAfter  = $qtyBefore + $qty;

                // Hitung WAC baru — decimal(15,4)
                // WAC = (stok_lama × avg_lama + qty_baru × harga_beli) / stok_baru
                if ($qtyAfter > 0) {
                    $newAvgCost = round(
                        (($qtyBefore * $avgBefore) + ($qty * $unitPrice)) / $qtyAfter,
                        4
                    );
                } elseif ($qtyAfter === 0) {
                    $newAvgCost = 0.0;
                } else {
                    // Stok minus (retur > stok) — pertahankan avg lama
                    $newAvgCost = $avgBefore;
                }

                $stock->update([
                    'quantity'     => $qtyAfter,                             // bigInteger SIGNED
                    'average_cost' => $newAvgCost,                           // decimal(15,4)
                    'total_value'  => max(0, round($qtyAfter * $newAvgCost, 2)), // decimal(15,2)
                    'last_in_at'   => $now,
                    'last_in_by'   => $userId,
                    'last_in_qty'  => $qty,
                ]);

                // Sync WAC ke tabel master agar HPP tersedia tanpa JOIN
                $this->syncMasterAverageCost($item->item_type, $item->item_id, $newAvgCost);

                // ★ FIX [1]: field sesuai migration — semua field wajib ada
                StockMovement::create([
                    // Lokasi
                    'location_type'    => $purchase->destination_type,      // 'warehouse'|'store'
                    'location_id'      => $purchase->destination_id,
                    // Jenis gerakan
                    'movement_type'    => 'purchase_in',                    // enum migration ✓
                    // Item
                    'item_type'        => $item->item_type,                 // 'ingredient'|'packaging_material'
                    'item_id'          => $item->item_id,
                    // Kuantitas SIGNED
                    'qty_change'       => $qty,                             // positif=masuk, negatif=retur
                    'qty_before'       => $qtyBefore,
                    'qty_after'        => $qtyAfter,
                    // Nilai — presisi sesuai migration
                    'unit_cost'        => $unitPrice,                       // decimal(15,4)
                    'total_cost'       => round(abs($qty) * $unitPrice, 2), // decimal(15,2)
                    'avg_cost_before'  => $avgBefore,                       // decimal(15,4)
                    'avg_cost_after'   => $newAvgCost,                      // decimal(15,4)
                    // Referensi dokumen
                    'reference_type'   => Purchase::class,                  // FQCN — wajib ada
                    'reference_id'     => $purchase->id,
                    'reference_number' => $purchase->purchase_number,
                    // Metadata
                    'movement_date'    => $purchase->purchase_date,
                    'created_by'       => $userId,
                    'notes'            => "PO {$purchase->purchase_number} dari {$purchase->supplier->name}",
                ]);
            }

            $purchase->update(['status' => 'completed']);
        });

        return to_route('purchases.show', $id)
            ->with('success', 'Purchase Order selesai! Stok & HPP berhasil diperbarui.');
    }

    // =========================================================================
    // WORKFLOW: cancel
    // =========================================================================

    public function cancel(Request $request, string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if (! $purchase->canCancel()) {
            return back()->withErrors(['status' => 'Purchase Order tidak dapat dibatalkan.']);
        }

        $request->validate(['reason' => 'nullable|string|max:1000']);

        $purchase->update([
            'status'              => 'cancelled',
            'cancellation_reason' => $request->reason ?? null,
        ]);

        return to_route('purchases.index')
            ->with('success', 'Purchase Order dibatalkan.');
    }

    // =========================================================================
    // DESTROY — hanya draft
    // =========================================================================

    public function destroy(string $id)
    {
        $purchase = Purchase::findOrFail($id);

        if ($purchase->status !== 'draft') {
            return back()->withErrors(['delete' => 'Hanya draft yang dapat dihapus.']);
        }

        $purchase->delete(); // softDeletes

        return to_route('purchases.index')
            ->with('success', 'Draft Purchase Order dihapus.');
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function formData(): array
    {
        return [
            'suppliers' => Supplier::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'payment_term', 'credit_limit']),
            'warehouses' => Warehouse::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'stores' => Store::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'ingredients' => Ingredient::where('is_active', true)
                ->with('category:id,name')
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name', 'code', 'unit', 'ingredient_category_id', 'average_cost']),
            'packagingMaterials' => PackagingMaterial::where('is_active', true)
                ->with(['category:id,name', 'size:id,name'])
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name', 'code', 'packaging_category_id', 'size_id', 'purchase_price', 'average_cost']),
        ];
    }

    /**
     * Rules dasar yang dipakai oleh store() dan update().
     *
     * unit_price: numeric (bukan integer) — kolom decimal(15,2) support Rp 12.500,50
     * quantity  : integer signed — negatif untuk retur ke supplier
     */
    private function baseRules(): array
    {
        return [
            'supplier_id'            => 'required|uuid|exists:suppliers,id',
            'purchase_date'          => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:purchase_date',
            'tax'                    => 'nullable|numeric|min:0',
            'discount'               => 'nullable|numeric|min:0',
            'shipping_cost'          => 'nullable|numeric|min:0',
            'notes'                  => 'nullable|string|max:2000',
            'items'                  => 'required|array|min:1',
            'items.*.item_type'      => 'required|in:ingredient,packaging_material',
            'items.*.item_id'        => 'required|uuid',
            'items.*.quantity'       => 'required|integer|not_in:0',
            'items.*.unit_price'     => 'required|numeric|min:0',
            'items.*.notes'          => 'nullable|string|max:500',
        ];
    }

    private function validateStore(Request $request): array
    {
        return $request->validate(array_merge($this->baseRules(), [
            'destination_type' => 'required|in:warehouse,store',
            'destination_id'   => 'required|uuid',
        ]));
    }

    private function validateUpdate(Request $request): array
    {
        return $request->validate($this->baseRules());
    }

    /**
     * Insert purchase_items, kembalikan [subtotal_bcmath_string].
     *
     * Kompatibel dengan kolom bigInteger (migration lama) maupun decimal(15,2).
     * Deteksi tipe kolom sekali per request — bukan per item.
     *
     * @return array{0: string}
     */
    private function upsertItems(Purchase $purchase, array $items): array
    {
        $subtotal = '0.00';
        $colType  = Schema::getColumnType('purchase_items', 'unit_price');
        $isInt    = str_contains($colType, 'int');

        foreach ($items as $item) {
            $qty       = (int)   $item['quantity'];
            $rawPrice  = (float) $item['unit_price'];
            $unitPrice = $isInt ? (int) round($rawPrice) : round($rawPrice, 2);
            $lineTotal = $isInt ? (int) round($qty * $unitPrice) : round($qty * $unitPrice, 2);
            
            // Gunakan sprintf untuk memastikan string numerik murni (menghindari notasi scientific)
            $lineTotalStr = sprintf("%.2f", (float) $lineTotal);
            $subtotal = $this->bcAdd($subtotal, $lineTotalStr, 2);

            $purchase->items()->create([
                'item_type'  => $item['item_type'],
                'item_id'    => $item['item_id'],
                'quantity'   => $qty,
                'unit_price' => $unitPrice,
                'subtotal'   => $lineTotal,
                'notes'      => $item['notes'] ?? null,
            ]);
        }

        return [$subtotal];
    }

    private function findOrCreateStock(
        string $locType,
        string $locId,
        string $itemType,
        string $itemId,
        float  $initialCost = 0.0
    ) {
        $stock = $this->findStock($locType, $locId, $itemType, $itemId);
        if ($stock) return $stock;

        $base = ['quantity' => 0, 'average_cost' => $initialCost, 'total_value' => 0.0];

        return match ([$locType, $itemType]) {
            ['warehouse', 'ingredient']         => WarehouseIngredientStock::create(
                array_merge($base, ['warehouse_id' => $locId, 'ingredient_id' => $itemId])
            ),
            ['warehouse', 'packaging_material'] => WarehousePackagingStock::create(
                array_merge($base, ['warehouse_id' => $locId, 'packaging_material_id' => $itemId])
            ),
            ['store', 'ingredient']             => StoreIngredientStock::create(
                array_merge($base, ['store_id' => $locId, 'ingredient_id' => $itemId])
            ),
            ['store', 'packaging_material']     => StorePackagingStock::create(
                array_merge($base, ['store_id' => $locId, 'packaging_material_id' => $itemId])
            ),
            default => throw new \InvalidArgumentException(
                "Unknown stock combination: [{$locType}, {$itemType}]"
            ),
        };
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

    /**
     * Sync WAC ke tabel master agar HPP selalu tersedia tanpa JOIN ke stock tables.
     * Master menyimpan WAC dari PO terakhir per item.
     */
    private function syncMasterAverageCost(string $itemType, string $itemId, float $newAvgCost): void
    {
        match ($itemType) {
            'ingredient'         => Ingredient::where('id', $itemId)->update(['average_cost' => $newAvgCost]),
            'packaging_material' => PackagingMaterial::where('id', $itemId)->update(['average_cost' => $newAvgCost]),
            default              => null,
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

    private function resolveItemName(string $type, string $id): string
    {
        return $type === 'ingredient'
            ? (Ingredient::find($id)?->name        ?? '-')
            : (PackagingMaterial::find($id)?->name ?? '-');
    }

    private function bcAdd($a, $b, $scale = 2): string
    {
        return function_exists('bcadd') 
            ? bcadd((string)$a, (string)$b, $scale) 
            : sprintf("%.{$scale}f", (float)$a + (float)$b);
    }

    private function bcSub($a, $b, $scale = 2): string
    {
        return function_exists('bcsub') 
            ? bcsub((string)$a, (string)$b, $scale) 
            : sprintf("%.{$scale}f", (float)$a - (float)$b);
    }
}
