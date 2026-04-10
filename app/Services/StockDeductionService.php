<?php

namespace App\Services;

use App\Models\IntensitySizeQuantity;
use App\Models\ProductRecipe;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;
use App\Models\VariantRecipe;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StockDeductionService
{
    // =========================================================================
    // PUBLIC API
    // =========================================================================

    public function deductAfterSale(Sale $sale, string $storeId, Collection $saleItems): void
    {
        // ── DIAGNOSTIK ────────────────────────────────────────────────────────
        Log::info('[StockDeduction] deductAfterSale dipanggil', [
            'sale_number'     => $sale->sale_number,
            'store_id'        => $storeId,
            'total_saleItems' => $saleItems->count(),
            'items'           => $saleItems->map(fn ($si) => [
                'id'                    => $si->id,
                'product_id'            => $si->product_id,
                'variant_id_snapshot'   => $si->variant_id_snapshot,
                'intensity_id_snapshot' => $si->intensity_id_snapshot,
                'size_id_snapshot'      => $si->size_id_snapshot,
                'qty'                   => $si->qty,
                'packagings_count'      => $si->relationLoaded('packagings')
                    ? $si->packagings->count()
                    : 'NOT_LOADED',
            ])->toArray(),
        ]);
        // ─────────────────────────────────────────────────────────────────────

        foreach ($saleItems as $saleItem) {
            if ($saleItem->is_custom_order) {
                // ── JALUR CUSTOM ORDER ──────────────────────────────────────────
                $this->deductCustomOrderIngredients($sale, $storeId, $saleItem);
            } elseif ($saleItem->intensity_id_snapshot && $saleItem->size_id_snapshot) {
                // ── JALUR REGULAR ───────────────────────────────────────────────
                $this->deductIngredients($sale, $storeId, $saleItem);
            } else {
                Log::info('[StockDeduction] SaleItem dilewati (bukan item parfum / snapshot null)', [
                    'sale_number'           => $sale->sale_number,
                    'sale_item_id'          => $saleItem->id,
                    'product_name'          => $saleItem->product_name,
                    'intensity_id_snapshot' => $saleItem->intensity_id_snapshot,
                    'size_id_snapshot'      => $saleItem->size_id_snapshot,
                ]);
            }

            foreach ($saleItem->packagings ?? [] as $sip) {
                if (! $sip->packaging_material_id) continue;

                $this->deductOnePackaging(
                    sale:    $sale,
                    storeId: $storeId,
                    pkgId:   $sip->packaging_material_id,
                    pkgName: $sip->packaging_name,
                    qty:     (int) $sip->qty,
                );
            }
        }
    }

    public function deductStandalonePackagings(Sale $sale, string $storeId, array $standalonePkgs): void
    {
        foreach ($standalonePkgs as $sp) {
            $this->deductOnePackaging(
                sale:    $sale,
                storeId: $storeId,
                pkgId:   $sp['pkg']->id,
                pkgName: $sp['pkg']->name,
                qty:     (int) ($sp['qty'] ?? 1),
            );
        }
    }

    // =========================================================================
    // PRIVATE — INGREDIENT
    // =========================================================================

    /**
     * Alur:
     *   A. product_id ada → cari product_recipes → deduct langsung TANPA ISQ.
     *   B. Fallback variant_recipes → butuh IntensitySizeQuantity untuk scaling.
     */
    private function deductIngredients(Sale $sale, string $storeId, SaleItem $saleItem): void
    {
        $intensityId = $saleItem->intensity_id_snapshot;
        $sizeId      = $saleItem->size_id_snapshot;
        $variantId   = $saleItem->variant_id_snapshot;
        $qtySold     = (int) $saleItem->qty;

        Log::info('[StockDeduction] deductIngredients masuk', [
            'sale_number'  => $sale->sale_number,
            'sale_item_id' => $saleItem->id,
            'product_id'   => $saleItem->product_id,
            'variant_id'   => $variantId,
            'intensity_id' => $intensityId,
            'size_id'      => $sizeId,
            'qty_sold'     => $qtySold,
        ]);

        // ═════════════════════════════════════════════════════════════════════
        // JALUR A — product_recipes (tidak butuh IntensitySizeQuantity)
        // ═════════════════════════════════════════════════════════════════════
        if ($saleItem->product_id) {
            $productRecipes = ProductRecipe::where('product_id', $saleItem->product_id)->get();

            Log::info('[StockDeduction] product_recipes ditemukan', [
                'sale_number'   => $sale->sale_number,
                'product_id'    => $saleItem->product_id,
                'recipe_count'  => $productRecipes->count(),
                'recipes'       => $productRecipes->map(fn ($r) => [
                    'ingredient_id' => $r->ingredient_id,
                    'quantity'      => $r->quantity,
                    'unit'          => $r->unit,
                ])->toArray(),
            ]);

            if ($productRecipes->isNotEmpty()) {
                foreach ($productRecipes as $recipe) {
                    $totalToDeduct = (float) $recipe->quantity * $qtySold;

                    if ($totalToDeduct <= 0) {
                        Log::warning('[StockDeduction] recipe quantity <= 0, dilewati', [
                            'ingredient_id' => $recipe->ingredient_id,
                            'quantity'      => $recipe->quantity,
                        ]);
                        continue;
                    }

                    $this->deductOneIngredient(
                        sale:         $sale,
                        storeId:      $storeId,
                        ingredientId: $recipe->ingredient_id,
                        qty:          $totalToDeduct,
                        unitLabel:    $recipe->unit ?? 'ml',
                    );
                }

                return;
            }

            Log::info('[StockDeduction] product_recipes kosong → fallback variant_recipes', [
                'sale_number' => $sale->sale_number,
                'product_id'  => $saleItem->product_id,
            ]);
        } else {
            Log::info('[StockDeduction] product_id null → langsung ke variant_recipes', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
            ]);
        }

        // ═════════════════════════════════════════════════════════════════════
        // JALUR B — variant_recipes (butuh IntensitySizeQuantity)
        // ═════════════════════════════════════════════════════════════════════
        if (! $variantId) {
            Log::warning('[StockDeduction] variant_id_snapshot null dan product_recipes kosong — stok tidak dikurangi', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
            ]);
            return;
        }

        $isq = IntensitySizeQuantity::getFor($intensityId, $sizeId);

        Log::info('[StockDeduction] IntensitySizeQuantity lookup', [
            'sale_number'  => $sale->sale_number,
            'intensity_id' => $intensityId,
            'size_id'      => $sizeId,
            'isq_found'    => $isq !== null,
        ]);

        if (! $isq) {
            Log::warning('[StockDeduction] IntensitySizeQuantity tidak ditemukan — stok ingredient tidak dikurangi', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
                'intensity_id' => $intensityId,
                'size_id'      => $sizeId,
            ]);
            return;
        }

        $variantRecipes = VariantRecipe::with('ingredient.category')
            ->where('variant_id', $variantId)
            ->where('intensity_id', $intensityId)
            ->get();

        Log::info('[StockDeduction] variant_recipes query', [
            'sale_number'  => $sale->sale_number,
            'variant_id'   => $variantId,
            'intensity_id' => $intensityId,
            'recipe_count' => $variantRecipes->count(),
        ]);

        if ($variantRecipes->isEmpty()) {
            Log::warning('[StockDeduction] variant_recipes tidak ditemukan — stok ingredient tidak dikurangi', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
                'variant_id'   => $variantId,
                'intensity_id' => $intensityId,
            ]);
            return;
        }

        $scaledMap = VariantRecipe::scaleCollection($variantRecipes, $isq);

        foreach ($variantRecipes as $idx => $recipe) {
            $scaledQtyPerUnit = $scaledMap[$idx] ?? 0;
            if ($scaledQtyPerUnit <= 0) continue;

            $this->deductOneIngredient(
                sale:         $sale,
                storeId:      $storeId,
                ingredientId: $recipe->ingredient_id,
                qty:          $scaledQtyPerUnit * $qtySold,
                unitLabel:    $recipe->unit ?? 'ml',
            );
        }
    }

    /**
     * Deduct bahan baku spesifik untuk Custom Order (oil dan alcohol terpisah)
     */
    private function deductCustomOrderIngredients(Sale $sale, string $storeId, SaleItem $saleItem): void
    {
        Log::info('[StockDeduction] deductCustomOrderIngredients masuk', [
            'sale_number'  => $sale->sale_number,
            'sale_item_id' => $saleItem->id,
            'variant_id'   => $saleItem->variant_id_snapshot,
            'qty_sold'     => $saleItem->qty,
            'custom_oil'   => $saleItem->custom_oil_qty,
            'custom_alc'   => $saleItem->custom_alcohol_qty,
        ]);

        $qtySold = (int) $saleItem->qty;

        // 1. Deduct Oil
        if ($saleItem->custom_oil_qty > 0) {
            $oilIngredient = $this->resolveOilIngredient($saleItem->variant_id_snapshot);
            if ($oilIngredient) {
                $this->deductOneIngredient(
                    sale:         $sale,
                    storeId:      $storeId,
                    ingredientId: $oilIngredient->id,
                    qty:          (float) $saleItem->custom_oil_qty * $qtySold,
                    unitLabel:    'ml'
                );
            } else {
                Log::warning('[StockDeduction] Oil ingredient tidak ditemukan untuk custom order', [
                    'variant_id' => $saleItem->variant_id_snapshot,
                ]);
            }
        }

        // 2. Deduct Alcohol
        if ($saleItem->custom_alcohol_qty > 0) {
            $alcoholIngredient = $this->resolveAlcoholIngredient();
            if ($alcoholIngredient) {
                $this->deductOneIngredient(
                    sale:         $sale,
                    storeId:      $storeId,
                    ingredientId: $alcoholIngredient->id,
                    qty:          (float) $saleItem->custom_alcohol_qty * $qtySold,
                    unitLabel:    'ml'
                );
            } else {
                Log::warning('[StockDeduction] Alcohol ingredient tidak ditemukan untuk custom order');
            }
        }
    }

    private function resolveOilIngredient(?string $variantId): ?object
    {
        if ($variantId) {
            $ingredient = \Illuminate\Support\Facades\DB::table('ingredients as i')
                ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
                ->join('variant_recipes as vr', 'vr.ingredient_id', '=', 'i.id')
                ->where('vr.variant_id', $variantId)
                ->where('ic.ingredient_type', 'oil')
                ->where('i.is_active', true)
                ->select('i.id')
                ->first();

            if ($ingredient) return $ingredient;
        }

        return \Illuminate\Support\Facades\DB::table('ingredients as i')
            ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
            ->where('ic.ingredient_type', 'oil')
            ->where('i.is_active', true)
            ->select('i.id')
            ->first();
    }

    private function resolveAlcoholIngredient(): ?object
    {
        return \Illuminate\Support\Facades\DB::table('ingredients as i')
            ->join('ingredient_categories as ic', 'ic.id', '=', 'i.ingredient_category_id')
            ->where('ic.ingredient_type', 'alcohol')
            ->where('i.is_active', true)
            ->select('i.id')
            ->first();
    }

    private function deductOneIngredient(
        Sale   $sale,
        string $storeId,
        string $ingredientId,
        float  $qty,
        string $unitLabel = 'ml',
    ): void {
        $stock = StoreIngredientStock::firstOrCreate(
            ['store_id' => $storeId, 'ingredient_id' => $ingredientId],
            ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0],
        );

        $qtyBefore = (int)   $stock->quantity;
        $avgCost   = (float) $stock->average_cost;
        $qtyDeduct = (int)   round($qty);
        $qtyAfter  = $qtyBefore - $qtyDeduct;

        Log::info('[StockDeduction] deductOneIngredient EXECUTE', [
            'sale_number'   => $sale->sale_number,
            'store_id'      => $storeId,
            'ingredient_id' => $ingredientId,
            'qty_before'    => $qtyBefore,
            'qty_deduct'    => $qtyDeduct,
            'qty_after'     => $qtyAfter,
        ]);

        $stock->update([
            'quantity'     => $qtyAfter,
            'total_value'  => round(max(0, $qtyAfter) * $avgCost, 2),
            'last_out_at'  => now(),
            'last_out_by'  => Auth::id(),
            'last_out_qty' => $qtyDeduct,
        ]);

        if ($qtyAfter < 0) {
            Log::warning('[StockDeduction] Stok ingredient NEGATIF', [
                'store_id'      => $storeId,
                'ingredient_id' => $ingredientId,
                'qty_before'    => $qtyBefore,
                'qty_deduct'    => $qtyDeduct,
                'qty_after'     => $qtyAfter,
                'sale_number'   => $sale->sale_number,
            ]);
        }

        StockMovement::create([
            'location_type'    => 'store',
            'location_id'      => $storeId,
            'movement_type'    => 'sale_deduction',
            'item_type'        => 'ingredient',
            'item_id'          => $ingredientId,
            'qty_change'       => -$qtyDeduct,
            'qty_before'       => $qtyBefore,
            'qty_after'        => $qtyAfter,
            'unit_cost'        => $avgCost,
            'total_cost'       => round($qtyDeduct * $avgCost, 2),
            'avg_cost_before'  => $avgCost,
            'avg_cost_after'   => $avgCost,
            'reference_type'   => Sale::class,
            'reference_id'     => $sale->id,
            'reference_number' => $sale->sale_number,
            'movement_date'    => $sale->sold_at->toDateString(),
            'created_by'       => Auth::id(),
            'notes'            => "Penjualan {$sale->sale_number}",
        ]);
    }

    // =========================================================================
    // PRIVATE — PACKAGING
    // =========================================================================

    private function deductOnePackaging(
        Sale    $sale,
        string  $storeId,
        string  $pkgId,
        ?string $pkgName,
        int     $qty,
    ): void {
        $stock = StorePackagingStock::firstOrCreate(
            ['store_id' => $storeId, 'packaging_material_id' => $pkgId],
            ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0],
        );

        $qtyBefore = (int)   $stock->quantity;
        $avgCost   = (float) $stock->average_cost;
        $qtyAfter  = $qtyBefore - $qty;

        $stock->update([
            'quantity'     => $qtyAfter,
            'total_value'  => round(max(0, $qtyAfter) * $avgCost, 2),
            'last_out_at'  => now(),
            'last_out_by'  => Auth::id(),
            'last_out_qty' => $qty,
        ]);

        if ($qtyAfter < 0) {
            Log::warning('[StockDeduction] Stok packaging NEGATIF', [
                'store_id'              => $storeId,
                'packaging_material_id' => $pkgId,
                'pkg_name'              => $pkgName,
                'qty_before'            => $qtyBefore,
                'qty_deduct'            => $qty,
                'qty_after'             => $qtyAfter,
                'sale_number'           => $sale->sale_number,
            ]);
        }

        StockMovement::create([
            'location_type'    => 'store',
            'location_id'      => $storeId,
            'movement_type'    => 'sale_deduction',
            'item_type'        => 'packaging_material',
            'item_id'          => $pkgId,
            'qty_change'       => -$qty,
            'qty_before'       => $qtyBefore,
            'qty_after'        => $qtyAfter,
            'unit_cost'        => $avgCost,
            'total_cost'       => round($qty * $avgCost, 2),
            'avg_cost_before'  => $avgCost,
            'avg_cost_after'   => $avgCost,
            'reference_type'   => Sale::class,
            'reference_id'     => $sale->id,
            'reference_number' => $sale->sale_number,
            'movement_date'    => $sale->sold_at->toDateString(),
            'created_by'       => Auth::id(),
            'notes'            => "Penjualan {$sale->sale_number}" . ($pkgName ? " [{$pkgName}]" : ''),
        ]);
    }
}
