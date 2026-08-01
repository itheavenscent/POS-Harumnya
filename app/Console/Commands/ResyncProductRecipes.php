<?php

namespace App\Console\Commands;

use App\Models\IntensitySizeQuantity;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\VariantRecipe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResyncProductRecipes extends Command
{
    protected $signature = 'recipes:resync-products
        {--variant=* : Kode variant yang di-resync (bisa banyak). Kosong = semua stale}
        {--apply : Eksekusi (tanpa ini = dry-run)}';

    protected $description = 'Bangun ulang product_recipes dari formula (variant_recipes) untuk produk stale. Lewati bila formula kosong / kalibrasi belum ada.';

    public function handle(): int
    {
        $apply    = $this->option('apply');
        $variants = array_map('strtoupper', (array) $this->option('variant'));

        $q = Product::query()->with(['variant', 'intensity']);
        if (! empty($variants)) {
            $q->whereHas('variant', fn ($v) => $v->whereIn('code', $variants));
        }
        $products = $q->get();

        $resynced = 0;
        $skipEmptyFormula = 0;
        $skipNoIsq = 0;
        $notStale = 0;

        foreach ($products as $p) {
            $vr = VariantRecipe::with('ingredient.category')
                ->where('variant_id', $p->variant_id)
                ->where('intensity_id', $p->intensity_id)
                ->get();

            // Cek stale: set ingredient produk vs formula
            $prIds = ProductRecipe::where('product_id', $p->id)
                ->pluck('ingredient_id')->unique()->sort()->values()->toArray();
            $vrIds = $vr->pluck('ingredient_id')->unique()->sort()->values()->toArray();

            if ($prIds === $vrIds) { $notStale++; continue; }

            // Kategori B: formula kosong → JANGAN sentuh (produk sudah benar).
            if ($vr->isEmpty()) {
                $this->warn("  SKIP {$p->sku}: formula kosong (produk dibiarkan apa adanya).");
                $skipEmptyFormula++;
                continue;
            }

            $isq = IntensitySizeQuantity::getFor($p->intensity_id, $p->size_id);
            if (! $isq) {
                $this->warn("  SKIP {$p->sku}: kalibrasi (ISQ) belum ada.");
                $skipNoIsq++;
                continue;
            }

            $scaledMap = VariantRecipe::scaleCollection($vr, $isq);

            $this->line("  RESYNC {$p->sku}");

            if ($apply) {
                DB::transaction(function () use ($p, $vr, $scaledMap) {
                    ProductRecipe::where('product_id', $p->id)->delete();
                    foreach ($vr as $idx => $recipe) {
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
            }
            $resynced++;
        }

        $this->line('');
        $this->info(sprintf(
            '%s | stale-diresync: %d | skip formula-kosong: %d | skip no-ISQ: %d | tidak-stale: %d',
            $apply ? 'APPLIED' : 'DRY-RUN',
            $resynced, $skipEmptyFormula, $skipNoIsq, $notStale
        ));

        if (! $apply) {
            $this->comment('Tambah --apply untuk eksekusi.');
        }

        return self::SUCCESS;
    }
}
