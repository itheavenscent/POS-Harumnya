<?php

namespace App\Console\Commands;

use App\Models\Material;
use Illuminate\Console\Command;

/**
 * Audit HPP material — cari average_cost abnormal & rakitan yang HPP-nya
 * melebihi harga jual (penyebab margin ekstrem / overflow line_gross_margin_pct).
 *
 *   php artisan materials:audit-cost
 *   php artisan materials:audit-cost --threshold=50000
 */
class AuditMaterialCost extends Command
{
    protected $signature = 'materials:audit-cost {--threshold=100000 : Batas average_cost dianggap abnormal}';

    protected $description = 'Deteksi average_cost abnormal & rakitan kemasan yang HPP > harga jual.';

    public function handle(): int
    {
        $threshold = (float) $this->option('threshold');

        // 1. Material non-rakitan dengan average_cost di atas ambang.
        $this->info("=== average_cost > {$threshold} (kemungkinan salah input) ===");
        $hot = Material::query()
            ->where('is_assembly', false)
            ->where('average_cost', '>', $threshold)
            ->orderByDesc('average_cost')
            ->get(['id', 'name', 'code', 'material_type', 'selling_price', 'average_cost']);

        if ($hot->isEmpty()) {
            $this->line('  (bersih)');
        } else {
            foreach ($hot as $m) {
                $this->line(sprintf(
                    '  ! %s [%s] type=%s  avg_cost=%s  jual=%s  id=%s',
                    $m->name, $m->code ?? 'NO-CODE', $m->material_type,
                    number_format((float) $m->average_cost, 2),
                    number_format((float) $m->selling_price, 2),
                    $m->id
                ));
            }
        }

        // 2. Kemasan rakitan: HPP rakitan (Σ komponen × qty) vs harga jual.
        $this->line('');
        $this->info('=== Rakitan kemasan: HPP vs harga jual ===');
        $assemblies = Material::where('is_assembly', true)
            ->with('components.component')
            ->orderBy('name')
            ->get();

        $flagged = 0;
        foreach ($assemblies as $asm) {
            $cost = (float) $asm->assembled_cost;
            $sell = (float) $asm->selling_price;
            $loss = $sell > 0 && $cost > $sell;
            $abnormal = $cost > $threshold;

            if (! $loss && ! $abnormal) continue;
            $flagged++;

            $tag = $abnormal ? 'ABNORMAL' : 'RUGI';
            $this->line(sprintf(
                '  [%s] %s [%s]  HPP=%s  jual=%s  id=%s',
                $tag, $asm->name, $asm->code ?? 'NO-CODE',
                number_format($cost, 2), number_format($sell, 2), $asm->id
            ));

            // Rincian komponen — biang inflasi biasanya terlihat di sini.
            foreach ($asm->components as $line) {
                $c = $line->component;
                if (! $c) {
                    $this->line(sprintf('      - komponen HILANG (component_id=%s) qty=%d',
                        $line->component_packaging_id, (int) $line->quantity));
                    continue;
                }
                $unit = $c->is_assembly ? (float) $c->assembled_cost : (float) $c->average_cost;
                $this->line(sprintf(
                    '      - %s [%s]  qty=%d × %s = %s',
                    $c->name, $c->code ?? 'NO-CODE', (int) $line->quantity,
                    number_format($unit, 2),
                    number_format($unit * (int) $line->quantity, 2)
                ));
            }
        }

        if ($flagged === 0) {
            $this->line('  (semua rakitan wajar)');
        }

        $this->line('');
        $this->info('Selesai. Perbaiki average_cost / quantity baris yang ditandai lewat menu Material / BOM.');

        return self::SUCCESS;
    }
}
