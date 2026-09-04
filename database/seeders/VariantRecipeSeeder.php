<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * VARIANT RECIPE SEEDER (versi terbaru)
 *
 * Sumber: Sheet "CEWEK COWOK" — Varian_Harumnya.xlsx
 *
 * SKU varian disesuaikan dengan VariantSeeder terbaru.
 * Mapping variant → ingredient FO dipertahankan berdasarkan nama parfum,
 * meskipun SKU kode berubah.
 *
 * Varian baru yang tidak ada ingredient FO eksplisit di IngredientSupplierSeeder
 * menggunakan FO terdekat atau diberi catatan.
 *
 * Komposisi resep base (total 30ml per intensity):
 *   EDT: FO+DPG=10ml (FO=8ml, DPG=2ml), alc=20ml
 *   EDP: FO+DPG=15ml (FO=11ml, DPG=4ml), alc=15ml  — 75%/25% split
 *   EXT: FO+DPG=20ml (FO=15ml, DPG=5ml), alc=10ml
 *
 * ProductSeeder meng-scale ke 50ml & 100ml secara linier dari base 30ml.
 */
class VariantRecipeSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Cek jika butuh clear table, saat ini dinonaktifkan agar tidak menghapus yang sudah ada.
        // DB::table('variant_recipes')->delete();

        $edt  = DB::table('intensities')->where('code', 'EDT')->first();
        $edp  = DB::table('intensities')->where('code', 'EDP')->first();
        $ext  = DB::table('intensities')->where('code', 'EXT')->first();
        $pure = DB::table('intensities')->where('code', 'PURE')->first();

        if (!$edt || !$edp || !$ext) {
            $this->command->error('Intensities belum ada.');
            return;
        }

        $ingMap = DB::table('materials')->where('material_type', 'bahan_baku')->get()->keyBy('code');
        $alcIng = $ingMap['ALK'] ?? null;

        if (!$alcIng) {
            $this->command->error('Ingredients ALK (Alkohol) tidak ditemukan.');
            return;
        }

        // Qty Fragrance Oil dan Alkohol per intensity (base 30ml)
        $intensityQty = [
            'EDT' => ['oil' => 10, 'alc' => 20, 'id' => $edt->id],
            'EDP' => ['oil' => 15, 'alc' => 15, 'id' => $edp->id],
            'EXT' => ['oil' => 20, 'alc' => 10, 'id' => $ext->id],
        ];

        if ($pure) {
            $intensityQty['PURE'] = ['oil' => 30, 'alc' => 0, 'id' => $pure->id];
        }

        // ─────────────────────────────────────────────────────────────────────
        // Mapping: variant code → ingredient code FO (LQD- / BSD-)
        // ─────────────────────────────────────────────────────────────────────
        $variants = DB::table('variants')->get();

        if ($variants->isEmpty()) {
            $this->command->error('Variants belum ada.');
            return;
        }

        $count   = 0;
        $skipped = 0;

        foreach ($variants as $variant) {
            $variantCode = $variant->code;

            // 1. Coba cari dengan format LQD-CODE atau BSD-CODE
            $foIng = $ingMap["LQD-{$variantCode}"] ?? $ingMap["BSD-{$variantCode}"] ?? null;

            // 2. Fallback mapping manual jika kodenya tidak presisi
            if (!$foIng) {
                $manualMap = [
                    'CLP' => 'BSD-CLO',
                    'NOMA' => 'LQD-NOMADE',
                    'BOUQ' => 'BSD-BOOUQ',
                    'EAC' => 'BSD-EAU',
                    'BLOM' => 'BSD-BLOOM',
                    'CANDY' => 'LQD-ROCK',
                    'BRO' => 'BSD-BRO',
                    'BATH' => 'BSD-BATH',
                    'BREAK' => 'BSD-BREAK',
                    'BOP' => 'BSD-BOP',
                    'BOPR' => 'BSD-BOPR',
                    'BLAN' => 'BSD-BLANC',
                    'BLACK' => 'BSD-BLK',
                    'CAV' => 'BSD-CAV',
                    'DDB' => 'BSD-DDB',
                    'BE' => 'BSD-BE',
                    'BS' => 'BSD-BS',
                    'BLEU' => 'BSD-BLEU',
                    'SVGE' => 'LQD-ELIX',
                    'POPY' => 'LQD-POPPY',
                    'BOA' => 'BSD-BOA',
                    'BIR' => 'BSD-BIR',
                ];
                
                if (isset($manualMap[$variantCode])) {
                    $foIng = $ingMap[$manualMap[$variantCode]] ?? null;
                }
            }
            
            // 3. Fallback fuzzy: cari nama yang mirip
            if (!$foIng) {
                foreach ($ingMap as $ingCode => $ing) {
                    if (str_starts_with($ingCode, 'LQD-') || str_starts_with($ingCode, 'BSD-')) {
                        $cleanIngName = trim(str_ireplace(['Liquid', 'Based'], '', $ing->name));
                        if (stripos($variant->name, $cleanIngName) !== false || stripos($cleanIngName, $variant->name) !== false) {
                            $foIng = $ing;
                            break;
                        }
                    }
                }
            }

            if (!$foIng) {
                $this->command->warn("FO (Liquid/Based) untuk variant {$variantCode} ({$variant->name}) tidak ditemukan, skip.");
                $skipped++;
                continue;
            }

            foreach ($intensityQty as $intCode => $qty) {
                $intensityId = $qty['id'];
                $foQty       = $qty['oil'];
                $alcQty      = $qty['alc'];

                $lines = [
                    ['ingredient_id' => $foIng->id,   'qty' => $foQty,  'notes' => 'Fragrance Oil — (Liquid / Based)'],
                ];

                if ($alcQty > 0) {
                    $lines[] = ['ingredient_id' => $alcIng->id,  'qty' => $alcQty, 'notes' => 'Alkohol'];
                }

                foreach ($lines as $line) {
                    $exists = DB::table('variant_recipes')
                        ->where('variant_id',    $variant->id)
                        ->where('intensity_id',  $intensityId)
                        ->where('ingredient_id', $line['ingredient_id'])
                        ->exists();

                    if ($exists) continue;

                    DB::table('variant_recipes')->insert([
                        'id'            => Str::uuid(),
                        'variant_id'    => $variant->id,
                        'intensity_id'  => $intensityId,
                        'ingredient_id' => $line['ingredient_id'],
                        'base_quantity' => $line['qty'],
                        'unit'          => 'ml',
                        'notes'         => $line['notes'],
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]);
                    $count++;
                }
            }
        }

        $this->command->info("✓ Variant recipes seeded ({$count} recipe lines, {$skipped} skipped).");

        if ($skipped > 0) {
            $this->command->warn('Beberapa variant tidak menemukan Liquid/Based yang cocok.');
        }
    }
}
