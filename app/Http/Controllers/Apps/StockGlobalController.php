<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use App\Models\Store;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\WarehouseIngredientStock;
use App\Models\WarehousePackagingStock;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;

/**
 * StockGlobalController — gabungan Stok Gudang + Stok Toko dalam satu menu.
 *
 * Filter pembeda:
 *   - scope     : 'warehouse' | 'store'         (Gudang atau Toko)
 *   - item_type : 'ingredient' | 'packaging'    (Bahan atau Kemasan)
 *
 * Aksi create/edit/delete tetap memakai controller lama
 * (warehouse-stocks.* / store-stocks.*).
 */
class StockGlobalController extends Controller
{
    public function index(Request $request)
    {
        $scope    = $request->scope === 'store' ? 'store' : 'warehouse';
        $itemType = $request->item_type === 'packaging' ? 'packaging' : 'ingredient';

        // ── Pilih model sesuai scope + item_type ───────────────────────────────
        $model = match ([$scope, $itemType]) {
            ['warehouse', 'ingredient'] => WarehouseIngredientStock::class,
            ['warehouse', 'packaging']  => WarehousePackagingStock::class,
            ['store', 'ingredient']     => StoreIngredientStock::class,
            ['store', 'packaging']      => StorePackagingStock::class,
        };

        $isWarehouse = $scope === 'warehouse';
        $isIngredient = $itemType === 'ingredient';

        $locationRel = $isWarehouse ? 'warehouse' : 'store';
        $itemRel     = $isIngredient ? 'ingredient' : 'packagingMaterial';
        $locationFk  = $isWarehouse ? 'warehouse_id' : 'store_id';

        $with = $isIngredient
            ? [$locationRel . ':id,name,code', $itemRel . ':id,name,code,unit']
            : [$locationRel . ':id,name,code', $itemRel . ':id,name,code,size_id', $itemRel . '.size:id,name'];

        $stocks = $model::query()
            ->with($with)
            ->when($request->search, function ($q, $s) use ($itemRel, $locationRel) {
                $q->where(function ($q) use ($s, $itemRel, $locationRel) {
                    $q->whereHas($itemRel, fn ($q) =>
                        $q->where('name', 'ilike', "%{$s}%")->orWhere('code', 'ilike', "%{$s}%")
                    )->orWhereHas($locationRel, fn ($q) =>
                        $q->where('name', 'ilike', "%{$s}%")
                    );
                });
            })
            ->when($request->location_id, fn ($q, $id) => $q->where($locationFk, $id))
            ->when($request->stock_status, function ($q, $status) {
                return match ($status) {
                    'low'  => $q->lowStock(),
                    'out'  => $q->outOfStock(),
                    'over' => $q->overStock(),
                    default => $q,
                };
            })
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($s) use ($locationRel, $itemRel) {
                $item = $s->{$itemRel};
                $loc  = $s->{$locationRel};

                return [
                    'id'            => $s->id,
                    'location_name' => $loc?->name ?? '-',
                    'location_code' => $loc?->code ?? '',
                    'item_name'     => $item?->name ?? '-',
                    'item_code'     => $item?->code ?? '',
                    'item_unit'     => $item?->unit ?? ($item?->size?->name ?? 'pcs'),
                    'quantity'      => (int) $s->quantity,
                    'min_stock'     => $s->min_stock,
                    'max_stock'     => $s->max_stock,
                    'average_cost'  => (float) $s->average_cost,
                    'total_value'   => (float) $s->total_value,
                    'last_in_at'    => $s->last_in_at,
                    'last_in_qty'   => $s->last_in_qty,
                    'updated_at'    => $s->updated_at,
                ];
            });

        $summary = [
            'total_items'  => $model::count(),
            'low_stock'    => $model::lowStock()->count(),
            'out_of_stock' => $model::outOfStock()->count(),
            'over_stock'   => $model::overStock()->count(),
            'total_value'  => (float) $model::sum('total_value'),
        ];

        $locations = $isWarehouse
            ? Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
            : Store::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Dashboard/StockGlobal/Index', [
            'stocks'    => $stocks,
            'locations' => $locations,
            'scope'     => $scope,
            'itemType'  => $itemType,
            'summary'   => $summary,
            'filters'   => $request->only(['search', 'location_id', 'stock_status', 'scope', 'item_type']),
        ]);
    }
}
