<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Models\Store;
use App\Models\Ingredient;
use App\Models\PackagingMaterial;

/**
 * StockMovementController — PRODUCTION READY
 *
 * Perbaikan dari versi sebelumnya:
 *
 * [1] movementTypeOptions() — nilai 'sales_out' TIDAK ADA di enum migration
 *       ✗ ['value' => 'sales_out', 'label' => 'Penjualan']
 *       ✓ ['value' => 'sale_deduction', 'label' => 'Penjualan']
 *
 * Enum lengkap di migration stock_movements:
 *   purchase_in, transfer_in, transfer_out,
 *   adjustment_in, adjustment_out, waste,
 *   sale_deduction,
 *   repack_in, repack_out,
 *   return_in, return_out,
 *   production_in, production_out
 *
 * Read-only controller: tidak ada mutation di sini.
 * Direction: qty_change > 0 = masuk, qty_change < 0 = keluar.
 */
class StockMovementController extends Controller
{
    // =========================================================================
    // INDEX
    // =========================================================================

    public function index(Request $request)
    {
        $movements = StockMovement::query()
            ->with('creator:id,name')
            ->when($request->search, function ($q, $s) {
                $term = strtolower($s);
                $q->where(function ($inner) use ($term) {
                    $inner->whereRaw('LOWER(reference_number) LIKE ?', ["%{$term}%"])
                          ->orWhereRaw('LOWER(notes) LIKE ?', ["%{$term}%"])
                          
                          // Search in Ingredients
                          ->orWhere(function($sub) use ($term) {
                              $sub->where('item_type', 'ingredient')
                                  ->whereIn('item_id', function($query) use ($term) {
                                      $query->select('id')->from('ingredients')->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                                  });
                          })
                          
                          // Search in Packaging Materials
                          ->orWhere(function($sub) use ($term) {
                              $sub->where('item_type', 'packaging')
                                  ->whereIn('item_id', function($query) use ($term) {
                                      $query->select('id')->from('packaging_materials')->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                                  });
                          })
                          
                          // Search in Stores
                          ->orWhere(function($sub) use ($term) {
                              $sub->where('location_type', 'store')
                                  ->whereIn('location_id', function($query) use ($term) {
                                      $query->select('id')->from('stores')->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                                  });
                          })
                          
                          // Search in Warehouses
                          ->orWhere(function($sub) use ($term) {
                              $sub->where('location_type', 'warehouse')
                                  ->whereIn('location_id', function($query) use ($term) {
                                      $query->select('id')->from('warehouses')->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                                  });
                          });
                });
            })
            ->when($request->movement_type, fn ($q, $t) => $q->where('movement_type', $t))
            ->when($request->location_type, fn ($q, $t) => $q->where('location_type', $t))
            ->when($request->location_id,   fn ($q, $id) => $q->where('location_id', $id))
            ->when($request->item_type,     fn ($q, $t) => $q->where('item_type', $t))
            ->when($request->date_from,     fn ($q, $d) => $q->whereDate('movement_date', '>=', $d))
            ->when($request->date_to,       fn ($q, $d) => $q->whereDate('movement_date', '<=', $d))
            ->orderByDesc('movement_date')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // Enrich: resolve nama lokasi & item, tambah direction
        $movementTypeMap = collect($this->movementTypeOptions())->pluck('label', 'value')->toArray();
        
        $movements->getCollection()->transform(function ($m) use ($movementTypeMap) {
            $m->location_name       = $this->resolveLocationName($m->location_type, $m->location_id);
            $m->item_name           = $this->resolveItemName($m->item_type, $m->item_id);
            $m->movement_type_label = $movementTypeMap[$m->movement_type] ?? $m->movement_type;
            // ★ qty_change positif = masuk, negatif = keluar
            $m->direction           = (int) $m->qty_change > 0 ? 'in' : 'out';
            return $m;
        });

        $allLocations = array_merge(
            Warehouse::where('is_active', true)->get(['id', 'name'])
                ->map(fn ($w) => ['id' => $w->id, 'name' => $w->name, 'type' => 'warehouse'])
                ->toArray(),
            Store::where('is_active', true)->get(['id', 'name'])
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'type' => 'store'])
                ->toArray(),
        );

        return Inertia::render('Dashboard/StockMovements/Index', [
            'movements'     => $movements,
            'locations'     => $allLocations,
            'filters'       => $request->only(['search', 'movement_type', 'location_type', 'location_id', 'item_type', 'date_from', 'date_to']),
            'movementTypes' => $this->movementTypeOptions(),
            'summary'       => [
                'total'    => StockMovement::count(),
                'today'    => StockMovement::whereDate('movement_date', today())->count(),
                'repack'   => StockMovement::whereIn('movement_type', ['production_in', 'production_out'])->count(),
                'transfer' => StockMovement::whereIn('movement_type', ['transfer_in', 'transfer_out'])->count(),
            ],
        ]);
    }

    // =========================================================================
    // SHOW
    // =========================================================================

    public function show(string $id)
    {
        $movement = StockMovement::with('creator:id,name')->findOrFail($id);

        $movementTypeMap = collect($this->movementTypeOptions())->pluck('label', 'value')->toArray();

        $movement->location_name       = $this->resolveLocationName($movement->location_type, $movement->location_id);
        $movement->item_name           = $this->resolveItemName($movement->item_type, $movement->item_id);
        $movement->movement_type_label = $movementTypeMap[$movement->movement_type] ?? $movement->movement_type;
        $movement->direction           = (int) $movement->qty_change > 0 ? 'in' : 'out';

        return Inertia::render('Dashboard/StockMovements/Show', [
            'movement' => $movement,
        ]);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function resolveLocationName(string $type, string $id): string
    {
        return $type === 'warehouse'
            ? (Warehouse::find($id)?->name ?? '-')
            : (Store::find($id)?->name     ?? '-');
    }

    private function resolveItemName(string $type, string $id): string
    {
        return $type === 'ingredient'
            ? (Ingredient::find($id)?->name        ?? '-')
            : (PackagingMaterial::find($id)?->name ?? '-');
    }

    /**
     * Opsi filter movement_type — HARUS sesuai enum di migration stock_movements.
     *
     * ★ FIX [1]: 'sales_out' diganti 'sale_deduction' — sesuai migration enum
     */
    private function movementTypeOptions(): array
    {
        return [
            ['value' => 'purchase_in',    'label' => 'Pembelian Masuk'],
            ['value' => 'transfer_in',    'label' => 'Transfer Masuk'],
            ['value' => 'transfer_out',   'label' => 'Transfer Keluar'],
            ['value' => 'sale_deduction', 'label' => 'Penjualan'],       // ★ FIX: bukan 'sales_out'
            ['value' => 'adjustment_in',  'label' => 'Penyesuaian (+)'],
            ['value' => 'adjustment_out', 'label' => 'Penyesuaian (-)'],
            ['value' => 'waste',          'label' => 'Waste / Rusak'],
            ['value' => 'return_in',      'label' => 'Retur Masuk'],
            ['value' => 'return_out',     'label' => 'Retur Keluar'],
            ['value' => 'production_in',  'label' => 'Produksi Masuk'],
            ['value' => 'production_out', 'label' => 'Produksi Keluar'],
        ];
    }
}
