<?php

namespace App\Console\Commands;

use App\Models\Material;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class HealIngredientRefs extends Command
{
    protected $signature = 'ingredients:heal
        {--apply : Eksekusi perubahan (tanpa ini = dry-run)}
        {--merge-stock : Pindahkan qty stok ghost ke ingredient tujuan saat repoint}';

    protected $description = 'Perbaiki recipe yang menunjuk ingredient trashed: repoint ke versi live (bila ada) atau restore.';

    public function handle(): int
    {
        $apply      = $this->option('apply');
        $mergeStock = $this->option('merge-stock');

        // Kumpulkan ingredient_id trashed yang direferensikan recipe.
        $refIds = collect()
            ->merge(DB::table('product_recipes')->distinct()->pluck('ingredient_id'))
            ->merge(DB::table('variant_recipes')->distinct()->pluck('ingredient_id'))
            ->unique()
            ->filter();

        $ghosts = Material::bahanBaku()->withTrashed()
            ->whereIn('id', $refIds)
            ->whereNotNull('deleted_at')
            ->get();

        if ($ghosts->isEmpty()) {
            $this->info('Tidak ada recipe yang menunjuk ingredient trashed. Aman.');
            return self::SUCCESS;
        }

        $liveByName = Material::bahanBaku()
            ->get(['id', 'name'])
            ->keyBy(fn ($i) => mb_strtolower(trim($i->name)));

        foreach ($ghosts as $ghost) {
            $key    = mb_strtolower(trim($ghost->name));
            $target = $liveByName->get($key);

            $prCount = DB::table('product_recipes')->where('ingredient_id', $ghost->id)->count();
            $vrCount = DB::table('variant_recipes')->where('ingredient_id', $ghost->id)->count();

            $this->line('');
            $this->info("Ghost: {$ghost->name} ({$ghost->code}) id={$ghost->id}");
            $this->line("  product_recipes={$prCount} variant_recipes={$vrCount}");

            if ($target && $target->id !== $ghost->id) {
                // ── REPOINT ke versi live ──
                $this->line("  → REPOINT ke live id={$target->id}");

                if ($apply) {
                    DB::transaction(function () use ($ghost, $target, $mergeStock) {
                        DB::table('product_recipes')->where('ingredient_id', $ghost->id)
                            ->update(['ingredient_id' => $target->id]);
                        DB::table('variant_recipes')->where('ingredient_id', $ghost->id)
                            ->update(['ingredient_id' => $target->id]);

                        if ($mergeStock) {
                            $this->mergeStock('store_ingredient_stocks', 'store_id', $ghost->id, $target->id);
                            $this->mergeStock('warehouse_ingredient_stocks', 'warehouse_id', $ghost->id, $target->id);
                        }
                    });
                    $this->line('  ✓ repoint selesai' . ($mergeStock ? ' + stok digabung' : ''));
                }
            } else {
                // ── RESTORE (tidak ada versi live) ──
                $this->line('  → RESTORE (tidak ada ingredient live dengan nama sama)');
                if ($apply) {
                    $ghost->restore();
                    $this->line('  ✓ restored');
                }
            }
        }

        if (! $apply) {
            $this->line('');
            $this->comment('Dry-run. Tambah --apply untuk eksekusi, --merge-stock untuk gabung qty stok.');
        }

        return self::SUCCESS;
    }

    /**
     * Gabung qty stok dari ghost ke target per lokasi, lalu nolkan ghost.
     * Menjaga unique(location_id, ingredient_id).
     */
    private function mergeStock(string $table, string $locCol, string $ghostId, string $targetId): void
    {
        $ghostRows = DB::table($table)->where('ingredient_id', $ghostId)->get();

        foreach ($ghostRows as $g) {
            $target = DB::table($table)
                ->where($locCol, $g->{$locCol})
                ->where('ingredient_id', $targetId)
                ->first();

            if ($target) {
                $newQty = (int) $target->quantity + (int) $g->quantity;
                DB::table($table)
                    ->where($locCol, $g->{$locCol})
                    ->where('ingredient_id', $targetId)
                    ->update([
                        'quantity'    => $newQty,
                        'total_value' => round(max(0, $newQty) * (float) $target->average_cost, 2),
                        'updated_at'  => now(),
                    ]);
                // Ghost row dinolkan (bukan dihapus — jejak audit).
                DB::table($table)
                    ->where($locCol, $g->{$locCol})
                    ->where('ingredient_id', $ghostId)
                    ->update(['quantity' => 0, 'total_value' => 0, 'updated_at' => now()]);
            } else {
                // Target belum punya baris di lokasi ini → pindahkan langsung.
                DB::table($table)
                    ->where($locCol, $g->{$locCol})
                    ->where('ingredient_id', $ghostId)
                    ->update(['ingredient_id' => $targetId, 'updated_at' => now()]);
            }
        }
    }
}
