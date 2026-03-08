<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\RepackTransaction;
use App\Models\StockMovement;
use App\Models\Ingredient;
use App\Models\Warehouse;
use App\Models\Store;
use App\Models\WarehouseIngredientStock;
use App\Models\StoreIngredientStock;

class RepackController extends Controller
{
    // =========================================================================
    // INDEX
    // =========================================================================

    public function index(Request $request)
    {
        $repacks = RepackTransaction::query()
            ->with([
                'outputIngredient:id,name,code,unit',
                'creator:id,name',
                'approver:id,name',
                'items',
            ])
            ->when($request->search, fn ($q, $s) =>
                $q->where('repack_number', 'like', "%{$s}%")
                  ->orWhereHas('outputIngredient', fn ($q2) =>
                      $q2->where('name', 'like', "%{$s}%")
                  )
            )
            ->when($request->status,        fn ($q, $s) => $q->where('status', $s))
            ->when($request->location_type, fn ($q, $t) => $q->where('location_type', $t))
            ->latest('repack_date')
            ->paginate(15)
            ->withQueryString();

        $repacks->getCollection()->transform(function ($r) {
            $r->location_name    = $this->resolveLocationName($r->location_type, $r->location_id);
            $r->total_input_cost = (float) $r->items->sum('total_cost');
            return $r;
        });

        return Inertia::render('Dashboard/Repacks/Index', [
            'repacks' => $repacks,
            'filters' => $request->only(['search', 'status', 'location_type']),
            'summary' => [
                'total'     => RepackTransaction::count(),
                'draft'     => RepackTransaction::where('status', 'draft')->count(),
                'pending'   => RepackTransaction::where('status', 'pending')->count(),
                'completed' => RepackTransaction::where('status', 'completed')->count(),
                'cancelled' => RepackTransaction::where('status', 'cancelled')->count(),
            ],
        ]);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public function create()
    {
        return Inertia::render('Dashboard/Repacks/Create', [
            'warehouses'  => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'stores'      => Store::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'ingredients' => Ingredient::where('is_active', true)
                ->with('category:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'unit', 'ingredient_category_id']),
        ]);
    }

    // =========================================================================
    // STORE — simpan draft
    // =========================================================================

    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_type'         => 'required|in:warehouse,store',
            'location_id'           => 'required|uuid',
            'repack_ingredient_id'  => 'required|uuid|exists:ingredients,id',
            'output_quantity'       => 'required|integer|min:1',
            'repack_date'           => 'required|date',
            'notes'                 => 'nullable|string|max:1000',
            'items'                 => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|uuid|exists:ingredients,id',
            'items.*.quantity'      => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($validated) {
            $items = collect($validated['items'])->map(function ($item) use ($validated) {
                $stock     = $this->findStock($validated['location_type'], $validated['location_id'], $item['ingredient_id']);
                $unitCost  = $stock ? (float) $stock->average_cost : 0.0;
                $qty       = (int) $item['quantity'];
                $totalCost = round($qty * $unitCost, 2);

                return [
                    'ingredient_id' => $item['ingredient_id'],
                    'quantity'      => $qty,
                    'unit_cost'     => $unitCost,
                    'total_cost'    => $totalCost,
                ];
            });

            $totalInputCost = (float) $items->sum('total_cost');
            $outputQty      = (int) $validated['output_quantity'];
            $outputCost     = $outputQty > 0
                ? round($totalInputCost / $outputQty, 4)
                : 0.0;

            $repack = RepackTransaction::create([
                'repack_number'        => RepackTransaction::generateNumber(),
                'location_type'        => $validated['location_type'],
                'location_id'          => $validated['location_id'],
                'output_ingredient_id' => $validated['repack_ingredient_id'],
                'output_quantity'      => $outputQty,
                'output_cost'          => $outputCost,
                'repack_date'          => $validated['repack_date'],
                'status'               => 'draft',
                'notes'                => $validated['notes'] ?? null,
                'created_by'           => auth()->id(),
            ]);

            foreach ($items as $item) {
                $repack->items()->create($item);
            }
        });

        return to_route('repacks.index')
            ->with('success', 'Repack berhasil disimpan sebagai draft!');
    }

    // =========================================================================
    // SHOW
    // =========================================================================

    public function show(string $id)
    {
        $repack = RepackTransaction::with([
            'outputIngredient:id,name,code,unit',
            'items.ingredient:id,name,code,unit',
            'creator:id,name',
            'approver:id,name',
        ])->findOrFail($id);

        $repack->location_name = $this->resolveLocationName($repack->location_type, $repack->location_id);

        // Stok saat ini untuk tiap ingredient input
        $repack->items->each(function ($item) use ($repack) {
            $stock               = $this->findStock($repack->location_type, $repack->location_id, $item->ingredient_id);
            $item->current_stock = $stock ? (int) $stock->quantity : 0;
        });

        // Stok saat ini untuk output ingredient
        $outputStock                  = $this->findStock($repack->location_type, $repack->location_id, $repack->output_ingredient_id);
        $repack->output_current_stock = $outputStock ? (int) $outputStock->quantity : 0;

        $movements = StockMovement::where('reference_type', RepackTransaction::class)
            ->where('reference_id', $repack->id)
            ->with('creator:id,name')
            ->orderBy('created_at')
            ->get();

        return Inertia::render('Dashboard/Repacks/Show', [
            'repack'    => $repack,
            'movements' => $movements,
        ]);
    }

    // =========================================================================
    // EDIT
    // =========================================================================

    public function edit(string $id)
    {
        $repack = RepackTransaction::with([
            'outputIngredient:id,name,code,unit',
            'items.ingredient:id,name,code,unit',
        ])->findOrFail($id);

        if (! in_array($repack->status, ['draft', 'pending'])) {
            return back()->withErrors(['edit' => 'Hanya repack berstatus draft/pending yang dapat diedit.']);
        }

        return Inertia::render('Dashboard/Repacks/Edit', [
            'repack'      => $repack,
            'warehouses'  => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'stores'      => Store::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'ingredients' => Ingredient::where('is_active', true)
                ->with('category:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'unit', 'ingredient_category_id']),
        ]);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public function update(Request $request, string $id)
    {
        $repack = RepackTransaction::findOrFail($id);

        if (! in_array($repack->status, ['draft', 'pending'])) {
            return back()->withErrors(['edit' => 'Hanya repack berstatus draft/pending yang dapat diedit.']);
        }

        $validated = $request->validate([
            'repack_ingredient_id'  => 'required|uuid|exists:ingredients,id',
            'output_quantity'       => 'required|integer|min:1',
            'repack_date'           => 'required|date',
            'notes'                 => 'nullable|string|max:1000',
            'items'                 => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|uuid|exists:ingredients,id',
            'items.*.quantity'      => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($repack, $validated) {
            $items = collect($validated['items'])->map(function ($item) use ($repack) {
                $stock     = $this->findStock($repack->location_type, $repack->location_id, $item['ingredient_id']);
                $unitCost  = $stock ? (float) $stock->average_cost : 0.0;
                $qty       = (int) $item['quantity'];
                $totalCost = round($qty * $unitCost, 2);

                return [
                    'ingredient_id' => $item['ingredient_id'],
                    'quantity'      => $qty,
                    'unit_cost'     => $unitCost,
                    'total_cost'    => $totalCost,
                ];
            });

            $totalInputCost = (float) $items->sum('total_cost');
            $outputQty      = (int) $validated['output_quantity'];
            $outputCost     = $outputQty > 0 ? round($totalInputCost / $outputQty, 4) : 0.0;

            $repack->update([
                'output_ingredient_id' => $validated['repack_ingredient_id'],
                'output_quantity'      => $outputQty,
                'output_cost'          => $outputCost,
                'repack_date'          => $validated['repack_date'],
                'notes'                => $validated['notes'] ?? null,
            ]);

            $repack->items()->delete();
            foreach ($items as $item) {
                $repack->items()->create($item);
            }
        });

        return to_route('repacks.show', $id)
            ->with('success', 'Repack berhasil diperbarui!');
    }

    // =========================================================================
    // COMPLETE — kurangi stok input + tambah stok output + StockMovement
    // =========================================================================

    public function complete(string $id)
    {
        $repack = RepackTransaction::with('items.ingredient')->findOrFail($id);

        if (! in_array($repack->status, ['draft', 'pending', 'approved'])) {
            return back()->withErrors(['complete' => 'Repack tidak dapat diselesaikan dari status ini.']);
        }

        DB::transaction(function () use ($repack) {
            $userId  = auth()->id();
            $now     = now();
            $locType = $repack->location_type;
            $locId   = $repack->location_id;

            // ── 1. Kurangi stok setiap ingredient input ───────────────────────
            foreach ($repack->items as $item) {
                $stock = $this->findStock($locType, $locId, $item->ingredient_id);

                if (! $stock) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'complete' => "Stok ingredient {$item->ingredient->name} tidak ditemukan di lokasi ini.",
                    ]);
                }
                if ((int) $stock->quantity < (int) $item->quantity) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'complete' => "Stok {$item->ingredient->name} tidak mencukupi. "
                            . "Tersedia: {$stock->quantity}, dibutuhkan: {$item->quantity}.",
                    ]);
                }

                $qtyBefore     = (int)   $stock->quantity;
                $avgCostBefore = (float) $stock->average_cost;
                $qtyAfter      = $qtyBefore - (int) $item->quantity;

                $stock->update([
                    'quantity'     => $qtyAfter,
                    'total_value'  => round($qtyAfter * $avgCostBefore, 2),
                    'last_out_at'  => $now,
                    'last_out_by'  => $userId,
                    'last_out_qty' => (int) $item->quantity,
                ]);

                // ★ FIX: production_out (bukan repack_out — tidak ada di enum migration)
                StockMovement::create([
                    'location_type'    => $locType,
                    'location_id'      => $locId,
                    'movement_type'    => 'production_out',
                    'item_type'        => 'ingredient',
                    'item_id'          => $item->ingredient_id,
                    'qty_change'       => -(int) $item->quantity,
                    'qty_before'       => $qtyBefore,
                    'qty_after'        => $qtyAfter,
                    'unit_cost'        => (float) $item->unit_cost,
                    'total_cost'       => round((float) $item->total_cost, 2),
                    'avg_cost_before'  => $avgCostBefore,
                    'avg_cost_after'   => $avgCostBefore,
                    'reference_type'   => RepackTransaction::class,
                    'reference_id'     => $repack->id,
                    'reference_number' => $repack->repack_number,
                    'movement_date'    => $repack->repack_date,
                    'notes'            => "Repack {$repack->repack_number} — bahan input",
                    'created_by'       => $userId,
                ]);
            }

            // ── 2. Tambah stok output ingredient ─────────────────────────────
            $outputStock = $this->findStock($locType, $locId, $repack->output_ingredient_id);
            if (! $outputStock) {
                $outputStock = $this->createStock($locType, $locId, $repack->output_ingredient_id, [
                    'quantity' => 0, 'average_cost' => 0.0, 'total_value' => 0.0,
                ]);
            }

            $outQtyBefore = (int)   $outputStock->quantity;
            $outAvgBefore = (float) $outputStock->average_cost;
            $addQty       = (int)   $repack->output_quantity;
            $addCost      = (float) $repack->output_cost;
            $outQtyAfter  = $outQtyBefore + $addQty;

            // WAC baru — decimal(15,4)
            $newAvgCost = $outQtyAfter > 0
                ? round((($outQtyBefore * $outAvgBefore) + ($addQty * $addCost)) / $outQtyAfter, 4)
                : $addCost;

            $outputStock->update([
                'quantity'     => $outQtyAfter,
                'average_cost' => $newAvgCost,
                'total_value'  => round($outQtyAfter * $newAvgCost, 2),
                'last_in_at'   => $now,
                'last_in_by'   => $userId,
                'last_in_qty'  => $addQty,
            ]);

            // ★ FIX: production_in (bukan repack_in — tidak ada di enum migration)
            StockMovement::create([
                'location_type'    => $locType,
                'location_id'      => $locId,
                'movement_type'    => 'production_in',
                'item_type'        => 'ingredient',
                'item_id'          => $repack->output_ingredient_id,
                'qty_change'       => $addQty,
                'qty_before'       => $outQtyBefore,
                'qty_after'        => $outQtyAfter,
                'unit_cost'        => $addCost,
                'total_cost'       => round($addQty * $addCost, 2),
                'avg_cost_before'  => $outAvgBefore,
                'avg_cost_after'   => $newAvgCost,
                'reference_type'   => RepackTransaction::class,
                'reference_id'     => $repack->id,
                'reference_number' => $repack->repack_number,
                'movement_date'    => $repack->repack_date,
                'notes'            => "Repack {$repack->repack_number} — hasil output",
                'created_by'       => $userId,
            ]);

            // ── 3. Tandai completed ───────────────────────────────────────────
            $repack->update([
                'status'      => 'completed',
                'approved_by' => $repack->approved_by ?? $userId,
                'approved_at' => $repack->approved_at ?? $now,
            ]);
        });

        return to_route('repacks.show', $id)
            ->with('success', 'Repack berhasil diselesaikan! Stok telah diperbarui.');
    }

    // =========================================================================
    // CANCEL
    // =========================================================================

    public function cancel(Request $request, string $id)
    {
        $repack = RepackTransaction::findOrFail($id);

        if (! $repack->canBeCancelled()) {
            return back()->withErrors(['cancel' => 'Repack yang sudah selesai tidak dapat dibatalkan.']);
        }

        $reason = $request->reason ?? '-';
        $repack->update([
            'status' => 'cancelled',
            'notes'  => trim($repack->notes . "\n[Dibatalkan: {$reason}]"),
        ]);

        return to_route('repacks.index')->with('success', 'Repack berhasil dibatalkan.');
    }

    // =========================================================================
    // DESTROY — hanya draft
    // =========================================================================

    public function destroy(string $id)
    {
        $repack = RepackTransaction::findOrFail($id);

        if ($repack->status !== 'draft') {
            return back()->withErrors(['delete' => 'Hanya repack berstatus draft yang dapat dihapus.']);
        }

        $repack->delete();

        return to_route('repacks.index')->with('success', 'Repack draft berhasil dihapus.');
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function findStock(string $locType, string $locId, string $ingredientId)
    {
        return $locType === 'warehouse'
            ? WarehouseIngredientStock::where('warehouse_id', $locId)->where('ingredient_id', $ingredientId)->first()
            : StoreIngredientStock::where('store_id', $locId)->where('ingredient_id', $ingredientId)->first();
    }

    private function createStock(string $locType, string $locId, string $ingredientId, array $data)
    {
        $base = array_merge(['quantity' => 0, 'average_cost' => 0.0, 'total_value' => 0.0], $data);
        return $locType === 'warehouse'
            ? WarehouseIngredientStock::create(array_merge($base, ['warehouse_id' => $locId, 'ingredient_id' => $ingredientId]))
            : StoreIngredientStock::create(array_merge($base, ['store_id' => $locId, 'ingredient_id' => $ingredientId]));
    }

    private function resolveLocationName(string $type, string $id): string
    {
        return $type === 'warehouse'
            ? (Warehouse::find($id)?->name ?? '-')
            : (Store::find($id)?->name     ?? '-');
    }
}
