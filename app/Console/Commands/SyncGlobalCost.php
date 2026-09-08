<?php

namespace App\Console\Commands;

use App\Models\Material;
use App\Traits\SyncsGlobalAverageCost;
use Illuminate\Console\Command;

/**
 * Satukan HPP (average_cost) ke nilai GLOBAL untuk semua material.
 *
 * Recompute WAC gabungan gudang + toko, lalu tulis ke master (Material) DAN ke
 * setiap baris stok per-lokasi. Jalankan sekali setelah deploy untuk menyembuhkan
 * data lama yang average_cost-nya masih menyimpang antar-lokasi.
 *
 *   php artisan materials:sync-global-cost
 */
class SyncGlobalCost extends Command
{
    use SyncsGlobalAverageCost;

    protected $signature = 'materials:sync-global-cost';

    protected $description = 'Satukan HPP semua material ke WAC global (master + semua baris stok per-lokasi).';

    public function handle(): int
    {
        $materials = Material::query()
            ->whereIn('material_type', ['bahan_baku', 'bahan_kemasan'])
            ->get(['id', 'material_type', 'name', 'average_cost']);

        $bar = $this->output->createProgressBar($materials->count());
        $bar->start();

        foreach ($materials as $m) {
            $type = $m->material_type === 'bahan_baku' ? 'ingredient' : 'packaging_material';
            $this->syncGlobalAverageCost($type, $m->id);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Selesai. {$materials->count()} material disinkronkan ke HPP global.");

        return self::SUCCESS;
    }
}
