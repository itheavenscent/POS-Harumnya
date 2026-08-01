<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneOrphanIngredientStock extends Command
{
    protected $signature = 'stock:prune-orphan-ingredients
        {--apply : Eksekusi hapus (tanpa ini = dry-run)}
        {--warehouse : Ikut prune stok gudang juga (default: hanya stok toko)}';

    protected $description = 'Hapus baris store ingredient stock yang qty=0 dan ingredient-nya tidak dipakai product_recipe/variant_recipe manapun (mis. Based Abe sisa mapping lama). Gudang hanya jika --warehouse.';

    public function handle(): int
    {
        $apply = $this->option('apply');

        // Ingredient yang MASIH dipakai formula/produk — jangan disentuh.
        $used = collect()
            ->merge(DB::table('product_recipes')->distinct()->pluck('ingredient_id'))
            ->merge(DB::table('variant_recipes')->distinct()->pluck('ingredient_id'))
            ->unique()->filter()->values();

        $tables = ['store_ingredient_stocks' => 'stok toko'];
        if ($this->option('warehouse')) {
            $tables['warehouse_ingredient_stocks'] = 'stok gudang';
        }

        $totalPruned = 0;

        foreach ($tables as $table => $label) {
            $rows = DB::table("{$table} as s")
                ->leftJoin('ingredients as i', 'i.id', '=', 's.ingredient_id')
                ->whereNotIn('s.ingredient_id', $used)
                ->where('s.quantity', 0)
                ->select('s.id', 's.ingredient_id', 'i.name', 'i.code')
                ->get();

            $this->line('');
            $this->info("=== {$label} ({$table}): orphan qty=0, tak dipakai recipe ===");

            if ($rows->isEmpty()) {
                $this->line('  (bersih)');
                continue;
            }

            foreach ($rows as $r) {
                $this->line(sprintf('  hapus: %s [%s] (id=%s)',
                    $r->name ?? '?', $r->code ?? 'NO-CODE', $r->ingredient_id));
            }

            if ($apply) {
                DB::table($table)->whereIn('id', $rows->pluck('id'))->delete();
            }
            $totalPruned += $rows->count();
        }

        $this->line('');
        $this->info(sprintf('%s | baris orphan: %d', $apply ? 'DIHAPUS' : 'DRY-RUN', $totalPruned));
        if (! $apply) {
            $this->comment('Tambah --apply untuk menghapus.');
        }

        return self::SUCCESS;
    }
}
