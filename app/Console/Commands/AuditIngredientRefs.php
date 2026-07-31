<?php

namespace App\Console\Commands;

use App\Models\Ingredient;
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
        $byName = Ingredient::withTrashed()
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
                ->leftJoin('ingredients as i', 'i.id', '=', 'r.ingredient_id')
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

        return self::SUCCESS;
    }
}
