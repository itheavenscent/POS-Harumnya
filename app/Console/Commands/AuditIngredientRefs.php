<?php

namespace App\Console\Commands;

use App\Models\Material;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditIngredientRefs extends Command
{
    protected $signature = 'ingredients:audit';

    protected $description = 'Cari recipe yang menunjuk ingredient trashed/hilang + duplikat nama ingredient.';

    public function handle(): int
    {
        // 1. Duplikat nama (live vs trashed)
        $this->info('=== Ingredient dengan nama duplikat ===');
        $byName = Material::bahanBaku()->withTrashed()
            ->get(['id', 'name', 'code', 'deleted_at'])
            ->groupBy(fn ($i) => mb_strtolower(trim($i->name)));

        foreach ($byName as $name => $rows) {
            if ($rows->count() < 2) continue;
            $this->line("• {$name}");
            foreach ($rows as $r) {
                $state = $r->deleted_at ? 'TRASHED' : 'live';
                $this->line(sprintf('    id=%s code=%s [%s]', $r->id, $r->code ?? 'NO-CODE', $state));
            }
        }

        // 2. Recipe menunjuk ingredient trashed/hilang
        foreach (['product_recipes', 'variant_recipes'] as $table) {
            $this->line('');
            $this->info("=== {$table}: ingredient_id trashed/hilang ===");

            $rows = DB::table("{$table} as r")
                ->leftJoin('materials as i', 'i.id', '=', 'r.ingredient_id')
                ->select(
                    'r.ingredient_id',
                    'i.name', 'i.code', 'i.deleted_at',
                    DB::raw('count(*) as ref_count')
                )
                ->groupBy('r.ingredient_id', 'i.name', 'i.code', 'i.deleted_at')
                ->get()
                ->filter(fn ($r) => $r->name === null || $r->deleted_at !== null);

            if ($rows->isEmpty()) {
                $this->line('  (tidak ada — semua recipe menunjuk ingredient live)');
                continue;
            }

            foreach ($rows as $r) {
                $state = $r->name === null ? 'HILANG (tidak ada baris ingredient)' : 'TRASHED';
                $this->line(sprintf('  ingredient_id=%s name=%s code=%s refs=%d [%s]',
                    $r->ingredient_id,
                    $r->name ?? '?',
                    $r->code ?? 'NO-CODE',
                    $r->ref_count,
                    $state
                ));
            }
        }

        // 3. Stok & pergerakan menunjuk ingredient trashed/hilang
        $stockTables = [
            'store_ingredient_stocks'     => 'stok toko',
            'warehouse_ingredient_stocks' => 'stok gudang',
        ];
        foreach ($stockTables as $table => $label) {
            $this->line('');
            $this->info("=== {$label} ({$table}): ingredient trashed/hilang ===");
            $rows = DB::table("{$table} as s")
                ->leftJoin('materials as i', 'i.id', '=', 's.ingredient_id')
                ->select('s.ingredient_id', 'i.name', 'i.code', 'i.deleted_at',
                    DB::raw('sum(s.quantity) as qty'), DB::raw('count(*) as rows'))
                ->groupBy('s.ingredient_id', 'i.name', 'i.code', 'i.deleted_at')
                ->get()
                ->filter(fn ($r) => $r->name === null || $r->deleted_at !== null);

            if ($rows->isEmpty()) { $this->line('  (bersih)'); continue; }
            foreach ($rows as $r) {
                $state = $r->name === null ? 'HILANG' : 'TRASHED';
                $this->line(sprintf('  id=%s name=%s code=%s qty=%s rows=%d [%s]',
                    $r->ingredient_id, $r->name ?? '?', $r->code ?? 'NO-CODE', $r->qty, $r->rows, $state));
            }
        }

        // 4. Stock movement dengan ingredient trashed/hilang (jejak historis)
        $this->line('');
        $this->info('=== stock_movements (ingredient) trashed/hilang ===');
        $mv = DB::table('stock_movements as m')
            ->leftJoin('materials as i', 'i.id', '=', 'm.item_id')
            ->where('m.item_type', 'ingredient')
            ->select('m.item_id', 'i.name', 'i.code', 'i.deleted_at', DB::raw('count(*) as moves'))
            ->groupBy('m.item_id', 'i.name', 'i.code', 'i.deleted_at')
            ->get()
            ->filter(fn ($r) => $r->name === null || $r->deleted_at !== null);

        if ($mv->isEmpty()) {
            $this->line('  (bersih)');
        } else {
            foreach ($mv as $r) {
                $state = $r->name === null ? 'HILANG' : 'TRASHED';
                $this->line(sprintf('  id=%s name=%s code=%s moves=%d [%s]',
                    $r->item_id, $r->name ?? '?', $r->code ?? 'NO-CODE', $r->moves, $state));
            }
        }

        return self::SUCCESS;
    }
}
