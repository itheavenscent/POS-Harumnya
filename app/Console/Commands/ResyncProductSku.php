<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResyncProductSku extends Command
{
    protected $signature = 'products:resync-sku {--dry-run : Tampilkan perubahan tanpa menyimpan}';

    protected $description = 'Hitung ulang SKU semua produk pakai kode variant penuh (fix collision HER vs HERO).';

    public function handle(): int
    {
        $products = Product::withTrashed()
            ->with(['variant', 'intensity', 'size'])
            ->get();

        $planned = [];
        $skippedNoRel = 0;

        foreach ($products as $p) {
            if (!$p->variant || !$p->intensity || !$p->size) {
                $skippedNoRel++;
                continue;
            }

            $newSku = sprintf('%s-%s-%d',
                strtoupper($p->variant->code),
                strtoupper($p->intensity->code),
                $p->size->volume_ml
            );

            if ($newSku !== $p->sku) {
                $planned[] = ['id' => $p->id, 'old' => $p->sku, 'new' => $newSku];
            }
        }

        // Deteksi bentrok pada target SKU (kode variant tidak unik / duplikat kombo).
        $targets = array_map(fn ($r) => $r['new'], $planned);
        $dupes   = array_filter(array_count_values($targets), fn ($c) => $c > 1);

        $this->info(sprintf('Produk: %d | perlu diubah: %d | tanpa relasi (dilewati): %d',
            $products->count(), count($planned), $skippedNoRel));

        foreach ($planned as $r) {
            $this->line("  {$r['old']}  ->  {$r['new']}");
        }

        if (!empty($dupes)) {
            $this->error('BENTROK target SKU (tidak dieksekusi) — kode variant kemungkinan tidak unik:');
            foreach ($dupes as $sku => $c) {
                $this->error("  {$sku} x{$c}");
            }
            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->comment('Dry-run — tidak ada perubahan disimpan.');
            return self::SUCCESS;
        }

        if (empty($planned)) {
            $this->info('Tidak ada yang perlu diubah.');
            return self::SUCCESS;
        }

        // Two-phase: set SKU sementara unik dulu, lalu SKU final.
        // Menghindari unique-violation transien saat dua baris saling tukar.
        DB::transaction(function () use ($planned) {
            foreach ($planned as $r) {
                DB::table('products')->where('id', $r['id'])
                    ->update(['sku' => 'TMP-' . $r['id']]);
            }
            foreach ($planned as $r) {
                DB::table('products')->where('id', $r['id'])
                    ->update(['sku' => $r['new']]);
            }
        });

        $this->info(sprintf('Selesai — %d SKU di-resync.', count($planned)));
        return self::SUCCESS;
    }
}
