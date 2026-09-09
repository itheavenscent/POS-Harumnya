<?php

namespace App\Console\Commands;

use App\Models\StockMovement;
use App\Traits\SyncsGlobalAverageCost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Backfill global_qty_before / global_qty_after untuk StockMovement lama yang
 * dibuat sebelum kolom ini ada (lihat migration add_global_qty_to_stock_movements_table).
 *
 * Strategi: ANCHOR ke stok global saat ini (globalQuantity(), sumber kebenaran live),
 * lalu jalan MUNDUR dari movement paling baru ke paling lama per item, mengurangkan
 * qty_change tiap baris. Ini tidak butuh asumsi "stok awal = 0" — hanya butuh ledger
 * lengkap sejak movement pertama item tsb sampai sekarang (tidak ada perubahan stok
 * yang lolos tanpa tercatat di stock_movements).
 *
 *   php artisan stock:backfill-global-qty
 *   php artisan stock:backfill-global-qty --dry-run
 */
class BackfillGlobalStockQty extends Command
{
    use SyncsGlobalAverageCost;

    protected $signature = 'stock:backfill-global-qty {--dry-run : Hitung & tampilkan tanpa menulis ke database}';

    protected $description = 'Backfill snapshot stok global (semua lokasi) pada StockMovement lama, di-anchor ke stok global saat ini.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $items = StockMovement::query()
            ->select('item_type', 'item_id')
            ->distinct()
            ->get();

        $this->info(($dryRun ? '[DRY RUN] ' : '') . "Memproses {$items->count()} item...");
        $bar = $this->output->createProgressBar($items->count());
        $bar->start();

        $totalRows = 0;

        foreach ($items as $row) {
            $movements = StockMovement::query()
                ->where('item_type', $row->item_type)
                ->where('item_id', $row->item_id)
                ->orderBy('movement_date')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get(['id', 'qty_change', 'global_qty_before', 'global_qty_after']);

            if ($movements->isEmpty()) {
                $bar->advance();
                continue;
            }

            // Anchor: stok global TRUE saat ini (live, dari tabel stok per-lokasi) —
            // jadi global_qty_after milik movement PALING BARU.
            $runningAfter = $this->globalQuantity($row->item_type, $row->item_id);

            $updates = [];
            foreach ($movements->reverse() as $m) {
                $after  = $runningAfter;
                $before = $runningAfter - (int) $m->qty_change;
                $updates[] = ['id' => $m->id, 'before' => $before, 'after' => $after];
                $runningAfter = $before;
            }

            if (! $dryRun) {
                DB::transaction(function () use ($updates) {
                    foreach ($updates as $u) {
                        StockMovement::whereKey($u['id'])->update([
                            'global_qty_before' => $u['before'],
                            'global_qty_after'  => $u['after'],
                        ]);
                    }
                });
            }

            $totalRows += count($updates);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info(($dryRun ? '[DRY RUN] Akan mengisi ' : 'Selesai. Mengisi ') . "{$totalRows} baris StockMovement pada {$items->count()} item.");

        return self::SUCCESS;
    }
}
