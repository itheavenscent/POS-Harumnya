<?php

namespace App\Services;

use App\Models\PackagingMaterial;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * StockDeductionService
 *
 * Mengurangi stok toko setelah penjualan selesai.
 * Dipanggil dari dalam DB::transaction() di TransactionController::store().
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ALUR PENGURANGAN STOK PER SALE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * 1. INGREDIENT (bahan parfum) — per SaleItem yang punya intensity+size snapshot:
 *    a. Cari volume dari intensity_size_quantities (oil_qty, alcohol_qty, total)
 *    b. Cari proporsi per ingredient dari product_recipes atau variant_recipes
 *    c. Scale quantity ke actual size jika pakai variant_recipes (base 30ml)
 *    d. Kurangi store_ingredient_stocks
 *    e. Catat StockMovement (movement_type = 'sale_deduction')
 *
 * 2. PACKAGING MATERIAL — per SaleItemPackaging melekat pada item parfum:
 *    a. Kurangi store_packaging_stocks qty = sip.qty
 *    b. Catat StockMovement
 *
 * 3. STANDALONE PACKAGING — packaging tanpa item parfum:
 *    a. Sama seperti poin 2
 *
 * CATATAN:
 *   - Stok BOLEH NEGATIF (bigInteger SIGNED di migration) → hanya Log::warning
 *   - Semua operasi sudah di dalam DB::transaction() dari caller
 *   - Field StockMovement mengikuti skema StockAdjustmentController &
 *     StockTransferController: qty_change, qty_before, qty_after,
 *     avg_cost_before, avg_cost_after, location_type, location_id,
 *     reference_number, movement_date
 * ══════════════════════════════════════════════════════════════════════════
 */
class StockDeductionService
{
    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Kurangi ingredient + packaging yang melekat pada setiap SaleItem.
     *
     * @param  Sale        $sale
     * @param  string      $storeId
     * @param  Collection  $saleItems  Koleksi SaleItem sudah di-load relasi 'packagings'
     */
    public function deductAfterSale(Sale $sale, string $storeId, Collection $saleItems): void
    {
        foreach ($saleItems as $saleItem) {
            // ── A. Ingredient bahan parfum ────────────────────────────────────
            if ($saleItem->intensity_id_snapshot && $saleItem->size_id_snapshot) {
                $this->deductIngredients($sale, $storeId, $saleItem);
            }

            // ── B. Packaging melekat pada item parfum ─────────────────────────
            foreach ($saleItem->packagings ?? [] as $sip) {
                if (! $sip->packaging_material_id) continue;

                $this->deductOnePackaging(
                    sale:       $sale,
                    storeId:    $storeId,
                    pkgId:      $sip->packaging_material_id,
                    pkgName:    $sip->packaging_name,
                    qty:        (int) $sip->qty,
                );
            }
        }
    }

    /**
     * Kurangi packaging standalone (tidak terikat item parfum).
     *
     * @param  Sale   $sale
     * @param  string $storeId
     * @param  array  $standalonePkgs  [['pkg' => PackagingMaterial, 'qty' => int], ...]
     */
    public function deductStandalonePackagings(Sale $sale, string $storeId, array $standalonePkgs): void
    {
        foreach ($standalonePkgs as $sp) {
            $pkg = $sp['pkg'];
            $qty = (int) ($sp['qty'] ?? 1);

            $this->deductOnePackaging(
                sale:    $sale,
                storeId: $storeId,
                pkgId:   $pkg->id,
                pkgName: $pkg->name,
                qty:     $qty,
            );
        }
    }

    // =========================================================================
    // PRIVATE — INGREDIENT
    // =========================================================================

    private function deductIngredients(Sale $sale, string $storeId, SaleItem $saleItem): void
    {
        $intensityId = $saleItem->intensity_id_snapshot;
        $sizeId      = $saleItem->size_id_snapshot;
        $variantId   = $saleItem->variant_id_snapshot;
        $qtySold     = (int) $saleItem->qty;

        // ── 1. Ambil volume total dari intensity_size_quantities ──────────────
        $isq = DB::table('intensity_size_quantities')
            ->where('intensity_id', $intensityId)
            ->where('size_id', $sizeId)
            ->where('is_active', true)
            ->first();

        if (! $isq) {
            Log::warning('[StockDeduction] intensity_size_quantities tidak ditemukan', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
                'intensity_id' => $intensityId,
                'size_id'      => $sizeId,
            ]);
            return;
        }

        $totalVolume = (int) $isq->total_volume; // ml aktual botol ini

        // ── 2. Ambil resep ingredient ─────────────────────────────────────────
        $recipes = $this->resolveRecipes($saleItem->product_id, $variantId, $intensityId);

        if ($recipes->isEmpty()) {
            Log::warning('[StockDeduction] Resep ingredient tidak ditemukan', [
                'sale_number'  => $sale->sale_number,
                'sale_item_id' => $saleItem->id,
                'product_id'   => $saleItem->product_id,
                'variant_id'   => $variantId,
                'intensity_id' => $intensityId,
            ]);
            return;
        }

        // ── 3. Hitung & kurangi per ingredient ───────────────────────────────
        foreach ($recipes as $recipe) {
            // product_recipes → sudah scaled ke size ini
            // variant_recipes → base 30ml, perlu scale
            $qtyPerUnit = $recipe->source === 'product'
                ? (float) $recipe->quantity
                : (float) $recipe->base_quantity * ($totalVolume / 30.0);

            $totalToDeduct = $qtyPerUnit * $qtySold;
            if ($totalToDeduct <= 0) continue;

            $this->deductOneIngredient(
                sale:         $sale,
                storeId:      $storeId,
                ingredientId: $recipe->ingredient_id,
                qty:          $totalToDeduct,
                unitLabel:    $recipe->unit ?? 'ml',
            );
        }
    }

    /**
     * Ambil resep — coba product_recipes dulu, fallback ke variant_recipes.
     * Return collection dengan property: ingredient_id, quantity/base_quantity,
     *                                     unit, source ('product'|'variant')
     */
    private function resolveRecipes(?string $productId, ?string $variantId, string $intensityId): Collection
    {
        // OPSI 1: product_recipes (sudah scaled, lebih presisi)
        if ($productId) {
            $rows = DB::table('product_recipes')
                ->where('product_id', $productId)
                ->select('ingredient_id', 'quantity', 'unit')
                ->get()
                ->map(fn ($r) => (object) [...(array) $r, 'source' => 'product']);

            if ($rows->isNotEmpty()) return $rows;
        }

        // OPSI 2: variant_recipes (base 30ml, butuh scale)
        if ($variantId) {
            return DB::table('variant_recipes')
                ->where('variant_id', $variantId)
                ->where('intensity_id', $intensityId)
                ->select('ingredient_id', 'base_quantity', 'unit')
                ->get()
                ->map(fn ($r) => (object) [...(array) $r, 'source' => 'variant']);
        }

        return collect();
    }

    /**
     * Kurangi store_ingredient_stocks dan catat StockMovement.
     */
    private function deductOneIngredient(
        Sale   $sale,
        string $storeId,
        string $ingredientId,
        float  $qty,
        string $unitLabel = 'ml',
    ): void {
        // Upsert: buat record stok jika belum ada
        $stock = StoreIngredientStock::firstOrCreate(
            ['store_id' => $storeId, 'ingredient_id' => $ingredientId],
            ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0],
        );

        $qtyBefore  = (int)   $stock->quantity;
        $avgCost    = (float) $stock->average_cost;
        // qty ingredient di stock tables adalah integer (ml dikalibrasi)
        // namun penjualan bisa decimal karena scaling; kita bulatkan ke integer
        $qtyDeduct  = (int) round($qty);
        $qtyAfter   = $qtyBefore - $qtyDeduct;

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
            'qty_change'       => -$qtyDeduct,          // NEGATIF = keluar
            'qty_before'       => $qtyBefore,
            'qty_after'        => $qtyAfter,
            'unit_cost'        => $avgCost,              // decimal(15,4)
            'total_cost'       => round($qtyDeduct * $avgCost, 2), // decimal(15,2)
            'avg_cost_before'  => $avgCost,              // tidak berubah saat keluar
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

    /**
     * Kurangi store_packaging_stocks dan catat StockMovement.
     */
    private function deductOnePackaging(
        Sale   $sale,
        string $storeId,
        string $pkgId,
        ?string $pkgName,
        int    $qty,
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
                'store_id'             => $storeId,
                'packaging_material_id'=> $pkgId,
                'pkg_name'             => $pkgName,
                'qty_before'           => $qtyBefore,
                'qty_after'            => $qtyAfter,
                'sale_number'          => $sale->sale_number,
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
