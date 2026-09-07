<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Botol (bahan_kemasan) yang size_id-nya kosong tidak ikut difilter oleh
 * ukuran parfum di POS — semua botol muncul untuk semua ukuran. Migration
 * ini mengisi size_id dari angka "<n> ml" yang ada di nama material, untuk
 * baris yang cocok dengan salah satu ukuran di tabel sizes.
 */
return new class extends Migration
{
    public function up(): void
    {
        $sizes = DB::table('sizes')->pluck('id', 'volume_ml');

        $materials = DB::table('materials')
            ->where('material_type', 'bahan_kemasan')
            ->whereNull('size_id')
            ->get(['id', 'name']);

        foreach ($materials as $material) {
            if (! preg_match('/(\d+)\s*ml/i', $material->name, $matches)) {
                continue;
            }

            $volumeMl = (int) $matches[1];
            $sizeId = $sizes[$volumeMl] ?? null;

            if ($sizeId) {
                DB::table('materials')->where('id', $material->id)->update(['size_id' => $sizeId]);
            }
        }
    }

    public function down(): void
    {
        // Sengaja tidak dikembalikan ke null — ini perbaikan data, bukan skema.
    }
};
