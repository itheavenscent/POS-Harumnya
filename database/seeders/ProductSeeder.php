<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PRODUCT SEEDER
 * Seeds semua kombinasi Variant × Intensity × Size.
 * 8 variants × 3 intensities × 3 sizes = 72 products.
 *
 * FIX dari versi lama:
 *   - Hapus 'is_made_to_order' (kolom tidak ada di migration terbaru)
 *   - Isi selling_price dari intensity_size_prices
 *   - Isi production_cost dari product_recipes yang sudah di-generate
 *   - Isi gross_profit & gross_margin_percentage
 *   - Isi product_recipes (resep ter-denormalisasi, sudah di-scale)
 *
 * Harus dijalankan SETELAH:
 *   IntensitySeeder, VariantSeeder, IngredientSupplierSeeder, VariantRecipeSeeder
 */
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $variants    = DB::table('variants')->where('is_active', true)->get();
        $intensities = DB::table('intensities')->where('is_active', true)->get();
        $sizes       = DB::table('sizes')->where('is_active', true)->get();

        if ($variants->isEmpty() || $intensities->isEmpty() || $sizes->isEmpty()) {
            $this->command->error('Variants / Intensities / Sizes belum ada.');
            return;
        }

        // Preload intensity_size_prices & quantities untuk lookup cepat
        $ispMap = [];
        foreach (DB::table('intensity_size_prices')->where('is_active', true)->get() as $p) {
            $ispMap[$p->intensity_id][$p->size_id] = (float) $p->price;
        }

        $isqMap = [];
        foreach (DB::table('intensity_size_quantities')->where('is_active', true)->get() as $q) {
            $isqMap[$q->intensity_id][$q->size_id] = $q;
        }

        // Preload variant_recipes untuk generate product_recipes
        $vrMap = [];
        foreach (DB::table('variant_recipes')->get() as $vr) {
            $vrMap[$vr->variant_id][$vr->intensity_id][] = $vr;
        }

        // Preload ingredient average_cost untuk kalkulasi COGS
        $ingCostMap = [];
        foreach (DB::table('ingredients')->get() as $ing) {
            $ingCostMap[$ing->id] = (float) $ing->average_cost;
        }

        $productCount = 0;
        $recipeCount  = 0;

        foreach ($variants as $variant) {
            foreach ($intensities as $intensity) {
                foreach ($sizes as $size) {

                    // Idempotent check
                    if (DB::table('products')
                        ->where('variant_id',   $variant->id)
                        ->where('intensity_id', $intensity->id)
                        ->where('size_id',      $size->id)
                        ->exists()) {
                        continue;
                    }

                    // Harga jual dari intensity_size_prices
                    $sellingPrice = $ispMap[$intensity->id][$size->id] ?? 0;

                    // Skala dari base 30ml ke ukuran aktual
                    $scale = $size->volume_ml / 30;

                    // Kalkulasi COGS dari variant_recipes (denormalisasi)
                    $baseRecipes     = $vrMap[$variant->id][$intensity->id] ?? [];
                    $productionCost  = 0;
                    $recipeRows      = [];

                    // Jika ada recipe, scale qty dan hitung cost
                    if (! empty($baseRecipes) && isset($isqMap[$intensity->id][$size->id])) {
                        $isq = $isqMap[$intensity->id][$size->id];

                        foreach ($baseRecipes as $vr) {
                            // Scale qty berdasarkan tipe ingredient (oil/alcohol/other)
                            // Untuk simplifikasi: scale linier dari base 30ml
                            $scaledQty = (int) round($vr->base_quantity * $scale);
                            $unitCost  = $ingCostMap[$vr->ingredient_id] ?? 0;
                            $totalCost = round($scaledQty * $unitCost, 2);

                            $productionCost += $totalCost;
                            $recipeRows[]    = [
                                'ingredient_id' => $vr->ingredient_id,
                                'quantity'      => $scaledQty,
                                'unit'          => $vr->unit,
                                'unit_cost'     => $unitCost,
                                'total_cost'    => $totalCost,
                                'notes'         => $vr->notes,
                            ];
                        }
                    }

                    $grossProfit    = $sellingPrice - $productionCost;
                    $grossMarginPct = $sellingPrice > 0
                        ? round(($grossProfit / $sellingPrice) * 100, 2)
                        : 0;

                    $sku  = strtoupper($variant->code) . '-' . strtoupper($intensity->code) . '-' . $size->volume_ml;
                    $name = $variant->name . ' - ' . $intensity->code . ' - ' . $size->volume_ml . 'ml';

                    $productId = Str::uuid()->toString();

                    DB::table('products')->insert([
                        'id'                       => $productId,
                        'variant_id'               => $variant->id,
                        'intensity_id'             => $intensity->id,
                        'size_id'                  => $size->id,
                        'sku'                      => $sku,
                        'name'                     => $name,
                        'selling_price'            => $sellingPrice,
                        'production_cost'          => $productionCost,
                        'gross_profit'             => $grossProfit,
                        'gross_margin_percentage'  => $grossMarginPct,
                        'barcode'                  => null,
                        'image'                    => null,
                        'description'              => null,
                        'is_active'                => true,
                        'sort_order'               => 0,
                        'created_at'               => $now,
                        'updated_at'               => $now,
                    ]);
                    $productCount++;

                    // Seed product_recipes (denormalized)
                    foreach ($recipeRows as $row) {
                        DB::table('product_recipes')->insert([
                            'id'            => Str::uuid(),
                            'product_id'    => $productId,
                            'ingredient_id' => $row['ingredient_id'],
                            'quantity'      => $row['quantity'],
                            'unit'          => $row['unit'],
                            'unit_cost'     => $row['unit_cost'],
                            'total_cost'    => $row['total_cost'],
                            'notes'         => $row['notes'],
                            'created_at'    => $now,
                            'updated_at'    => $now,
                        ]);
                        $recipeCount++;
                    }
                }
            }
        }

        $this->command->info("✓ Products seeded: {$productCount} products, {$recipeCount} recipe lines.");
    }
}
