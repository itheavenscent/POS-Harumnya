<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\VariantRecipe;
use Illuminate\Console\Command;

class FindStaleProductRecipes extends Command
{
    protected $signature = 'recipes:find-stale {--variant= : Filter kode variant}';

    protected $description = 'Cari produk yang product_recipes-nya beda ingredient dari formula (variant_recipes) = perlu regenerate.';

    public function handle(): int
    {
        $q = Product::query()->with(['variant', 'intensity']);
        if ($code = $this->option('variant')) {
            $q->whereHas('variant', fn ($v) => $v->where('code', strtoupper($code)));
        }

        $products = $q->get();
        $staleVariants = [];   // kumpulan "VARIANT / INTENSITY" untuk regenerate
        $staleCount = 0;

        foreach ($products as $p) {
            $prIds = ProductRecipe::where('product_id', $p->id)
                ->pluck('ingredient_id')->unique()->sort()->values();

            $vrIds = VariantRecipe::where('variant_id', $p->variant_id)
                ->where('intensity_id', $p->intensity_id)
                ->pluck('ingredient_id')->unique()->sort()->values();

            // Stale bila set ingredient produk beda dari formula.
            if ($prIds->toArray() !== $vrIds->toArray()) {
                $staleCount++;
                $key = ($p->variant?->code ?? '?') . ' / ' . ($p->intensity?->code ?? '?');
                $staleVariants[$key] = ($staleVariants[$key] ?? 0) + 1;

                $extra = $prIds->diff($vrIds); // ada di produk, tak ada di formula
                $miss  = $vrIds->diff($prIds); // ada di formula, tak ada di produk
                $this->line(sprintf('  STALE %s | produk-only: %s | formula-only: %s',
                    $p->sku,
                    $this->names($extra),
                    $this->names($miss)
                ));
            }
        }

        $this->line('');
        $this->info(sprintf('Produk dicek: %d | stale: %d', $products->count(), $staleCount));

        if (! empty($staleVariants)) {
            $this->line('');
            $this->info('Variant/Intensity yang perlu Regenerate:');
            foreach ($staleVariants as $k => $c) {
                $this->line("  {$k}  ({$c} produk)");
            }
        }

        return self::SUCCESS;
    }

    private function names($ids): string
    {
        if ($ids->isEmpty()) return '-';
        return \App\Models\Ingredient::withTrashed()
            ->whereIn('id', $ids)
            ->get(['name', 'code'])
            ->map(fn ($i) => ($i->code ?? 'NO-CODE') . ':' . $i->name)
            ->implode(', ');
    }
}
