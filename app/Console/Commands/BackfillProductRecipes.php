<?php

namespace App\Console\Commands;

use App\Models\IntensitySizeQuantity;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\VariantRecipe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillProductRecipes extends Command
{
    protected $signature = 'products:backfill-recipes
        {--variant= : Filter kode variant (mis. BLEU)}
        {--fix : Isi ulang product_recipes yang kosong dari variant_recipes}';

    protected $description = 'Cari produk tanpa product_recipes (stok tidak berkurang saat jual) dan isi ulang.';

    public function handle(): int
    {
        $q = Product::query()->with(['variant', 'intensity', 'size']);

        if ($code = $this->option('variant')) {
            $q->whereHas('variant', fn ($v) => $v->where('code', strtoupper($code)));
        }

        $products = $q->get();
        $empty    = [];

        foreach ($products as $p) {
            $count = ProductRecipe::where('product_id', $p->id)->count();
            if ($count === 0) {
                $empty[] = $p;
            }
        }

        $this->info(sprintf('Produk dicek: %d | tanpa recipe: %d', $products->count(), count($empty)));

        foreach ($empty as $p) {
            $this->line(sprintf('  %s | %s / %s / %s',
                $p->sku,
                $p->variant?->code ?? '-',
                $p->intensity?->code ?? '-',
                $p->size ? $p->size->volume_ml . 'ml' : '-'
            ));
        }

        if (empty($empty)) {
            $this->info('Semua produk punya recipe. Aman.');
            return self::SUCCESS;
        }

        if (! $this->option('fix')) {
            $this->comment('Jalankan dengan --fix untuk mengisi ulang.');
            return self::SUCCESS;
        }

        $fixed   = 0;
        $skipped = 0;

        foreach ($empty as $p) {
            if (! $p->variant || ! $p->intensity || ! $p->size) {
                $this->warn("  SKIP {$p->sku}: relasi variant/intensity/size hilang.");
                $skipped++;
                continue;
            }

            $recipes = VariantRecipe::with('ingredient.category')
                ->where('variant_id', $p->variant_id)
                ->where('intensity_id', $p->intensity_id)
                ->get();

            if ($recipes->isEmpty()) {
                $this->warn("  SKIP {$p->sku}: variant_recipes kosong (formula belum dibuat).");
                $skipped++;
                continue;
            }

            $isq = IntensitySizeQuantity::getFor($p->intensity_id, $p->size_id);
            if (! $isq) {
                $this->warn("  SKIP {$p->sku}: kalibrasi (IntensitySizeQuantity) belum ada.");
                $skipped++;
                continue;
            }

            $scaledMap = VariantRecipe::scaleCollection($recipes, $isq);

            DB::transaction(function () use ($p, $recipes, $scaledMap) {
                foreach ($recipes as $idx => $recipe) {
                    $scaledQty  = $scaledMap[$idx] ?? 0;
                    $ingredient = $recipe->ingredient;

                    ProductRecipe::create([
                        'product_id'    => $p->id,
                        'ingredient_id' => $recipe->ingredient_id,
                        'quantity'      => $scaledQty,
                        'unit'          => $recipe->unit,
                        'unit_cost'     => $ingredient->average_cost ?? 0,
                        'total_cost'    => $scaledQty * ($ingredient->average_cost ?? 0),
                    ]);
                }
                $p->calculateProductionCost();
            });

            $this->info("  FIX  {$p->sku}: {$recipes->count()} recipe dibuat.");
            $fixed++;
        }

        $this->info(sprintf('Selesai — fixed: %d | skipped: %d', $fixed, $skipped));
        return self::SUCCESS;
    }
}
