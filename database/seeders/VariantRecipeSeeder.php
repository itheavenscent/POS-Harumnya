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

        $edt = DB::table('intensities')->where('code', 'EDT')->first();
        $edp = DB::table('intensities')->where('code', 'EDP')->first();
        $ext = DB::table('intensities')->where('code', 'EXT')->first();

        if (!$edt || !$edp || !$ext) {
            $this->command->error('Intensities belum ada.');
            return;
        }

        $ingMap = DB::table('ingredients')->get()->keyBy('code');
        $alcIng = $ingMap['ING-AL-001'] ?? null;
        $dpgIng = $ingMap['ING-DPG-001'] ?? null;

        if (!$alcIng || !$dpgIng) {
            $this->command->error('Ingredients ING-AL-001 atau ING-DPG-001 tidak ditemukan.');
            return;
        }

        // Qty campuran FO+DPG dan Alkohol per intensity (base 30ml)
        // FO = 75% dari mixture, DPG = 25%
        $intensityQty = [
            'EDT' => ['mixture' => 10, 'alc' => 20, 'id' => $edt->id],
            'EDP' => ['mixture' => 15, 'alc' => 15, 'id' => $edp->id],
            'EXT' => ['mixture' => 20, 'alc' => 10, 'id' => $ext->id],
        ];

        // ─────────────────────────────────────────────────────────────────────
        // Mapping: variant code (SKU BARU) → ingredient code FO
        // Disesuaikan dengan VariantSeeder terbaru (Varian_Harumnya.xlsx)
        // ─────────────────────────────────────────────────────────────────────
        $variantFoMap = [
            // ── Wanita ────────────────────────────────────────────────────────
            'NAG'   => 'ING-FO-W039', // Nagita CV
            'GRT'   => 'ING-FO-W041', // Green Tea CV
            'MRT'   => 'ING-FO-W042', // Morning Tea CV
            'RIA'   => 'ING-FO-W023', // Euphoria (Calvin Klein)
            'GI'    => 'ING-FO-W041', // Garuda Indonesia — pakai Green Tea sebagai proxy (belum ada FO khusus)
            'FOF'   => 'ING-FO-W046', // Flight Of Fancy
            'CLP'   => 'ING-FO-W026', // Cloud Pink
            'PINK'  => 'ING-FO-W053', // Pink Chifon SS
            'HER'   => 'ING-FO-W034', // Her (Burberry)
            'HERI'  => 'ING-FO-W006', // Her Intense
            'GDS'   => 'ING-FO-W028', // Goddess
            'BOA'   => 'ING-FO-W009', // Omnia Amethyste
            'BLAN'  => 'ING-FO-W059', // Blanche
            'GG'    => 'ING-FO-W027', // Good Girl
            'GGB'   => 'ING-FO-W035', // Good Girl Blush
            'COCO'  => 'ING-FO-W047', // Coco Mademoiselle
            'NO5'   => 'ING-FO-W050', // No. 5
            'NOMA'  => 'ING-FO-W049', // Nomadian (Chloe Nomade)
            'BOUQ'  => 'ING-FO-W033', // Blooming Bouquet
            'MISS'  => 'ING-FO-W032', // Miss Dior (proxy untuk Miss Lady)
            'EAC'   => 'ING-FO-W045', // Eau Capitale
            'CTA'   => 'ING-FO-W056', // Cherry In The Air
            'WAY'   => 'ING-FO-W020', // My Way
            'WAYN'  => 'ING-FO-W030', // My Way Nectar
            'SIF'   => 'ING-FO-W001', // Si Fiori
            'BLOM'  => 'ING-FO-W021', // Bloom
            'FLO'   => 'ING-FO-W043', // Flora Gucci
            'TWIL'  => 'ING-FO-W040', // Twilly CV
            'JPS'   => 'ING-FO-W031', // Scandal
            'POPY'  => 'ING-FO-W018', // Scarlet Poppy
            'JME'   => 'ING-FO-W037', // JME Persia IBC CV (English Pear Freesia)
            'JMP'   => 'ING-FO-W048', // Jmp Peony Blush
            'VIVA'  => 'ING-FO-W054', // Viva La Juicy LZ
            'EDEN'  => 'ING-FO-W013', // Eden Sparkling
            'CANDY' => 'ING-FO-W002', // Vanilla Candy Rock
            'VIE'   => 'ING-FO-W007', // La Vie Est Belle — pakai Libre sebagai proxy
            'IDOL'  => 'ING-FO-W036', // Idol Nectar
            'BRO'   => 'ING-FO-W012', // Baccarat Rouge 540
            'BATH'  => 'ING-FO-W017', // Bubble Bath
            'BREAK' => 'ING-FO-W022', // Coffee Break
            'MVR'   => 'ING-FO-W029', // Vanilla Rose
            'MJP'   => 'ING-FO-W016', // Perfect
            'FAME'  => 'ING-FO-W010', // Fame
            'DEL'   => 'ING-FO-W051', // Delina
            'IS'    => 'ING-FO-W055', // Incanto Shine
            'MUSK'  => 'ING-FO-W008', // White Musk
            'SCN'   => 'ING-FO-W011', // Scandalous
            'VBS'   => 'ING-FO-W005', // Bombshell Escape
            'VB'    => 'ING-FO-W015', // Bombshell
            'VCS'   => 'ING-FO-W014', // Coconut Passion
            'TEAS'  => 'ING-FO-W044', // Tease
            'ROWI'  => 'ING-FO-W058', // Romantic Wish
            'BOP'   => 'ING-FO-W025', // Black Opium
            'BOPR'  => 'ING-FO-W003', // Black Opium Over Red
            'LIB'   => 'ING-FO-W007', // Libre
            'ORC'   => 'ING-FO-W057', // Orchid

            // ── Pria ──────────────────────────────────────────────────────────
            'BE'    => 'ING-FO-M006', // Blue Emotion
            'BLACK' => 'ING-FO-M023', // Black Aigner
            'BS'    => 'ING-FO-M002', // Blue Seduction
            'WANT'  => 'ING-FO-M012', // The Most Wanted
            'HERO'  => 'ING-FO-M013', // Hero
            'BLEU'  => 'ING-FO-M003', // Bleu De Chanel
            'SVG'   => 'ING-FO-M005', // Sauvage
            'SVGE'  => 'ING-FO-M021', // Svg Elixir
            'HOME'  => 'ING-FO-M022', // Homme
            'CAV'   => 'ING-FO-M024', // Creed Aventus
            'DDB'   => 'ING-FO-M014', // Desire Blue
            'SWY'   => 'ING-FO-M018', // Stronger With You
            'MANX'  => 'ING-FO-M004', // Halloween Man X
            'JPM'   => 'ING-FO-M017', // Scandal Men
            'JMW'   => 'ING-FO-M016', // Wood Sage & Salt
            'SANT'  => 'ING-FO-M010', // Santal 33
            'ONE'   => 'ING-FO-M001', // One Million Lucky
            'ONER'  => 'ING-FO-M015', // One Million Royal
            'BM'    => 'ING-FO-W008', // Black Musk — pakai White Musk FO sebagai proxy
            'TTV'   => 'ING-FO-M019', // Tobacco (Tobacco Vanille)
            'BIR'   => 'ING-FO-W004', // Born In Roma Green
            'EROF'  => 'ING-FO-W024', // Eros Flame
            'EROS'  => 'ING-FO-M009', // Eros
            'Y'     => 'ING-FO-M011', // Y
            'SELF'  => 'ING-FO-M008', // My Self
        ];

        $variants = DB::table('variants')->get()->keyBy('code');

        if ($variants->isEmpty()) {
            $this->command->error('Variants belum ada.');
            return;
        }

        $count   = 0;
        $skipped = 0;

        foreach ($variantFoMap as $variantCode => $foCode) {
            $variant = $variants[$variantCode] ?? null;
            $foIng   = $ingMap[$foCode] ?? null;

            if (!$variant) {
                $this->command->warn("Variant {$variantCode} tidak ditemukan di DB, skip.");
                $skipped++;
                continue;
            }
            if (!$foIng) {
                $this->command->warn("Ingredient {$foCode} tidak ditemukan (variant {$variantCode}), skip.");
                $skipped++;
                continue;
            }

            foreach ($intensityQty as $intCode => $qty) {
                $intensityId = $qty['id'];
                $mixQty      = $qty['mixture'];
                $alcQty      = $qty['alc'];

                // FO = 75% dari mixture, DPG = sisa (25%)
                $foQty  = (int) round($mixQty * 0.75);
                $dpgQty = $mixQty - $foQty;

                $lines = [
                    ['ingredient_id' => $foIng->id,   'qty' => $foQty,  'notes' => 'Fragrance Oil (75% dari campuran FO+DPG)'],
                    ['ingredient_id' => $dpgIng->id,  'qty' => $dpgQty, 'notes' => 'DPG — pelarut fragrance oil (25%)'],
                    ['ingredient_id' => $alcIng->id,  'qty' => $alcQty, 'notes' => 'Ethanol 99% — pelarut utama'],
                ];

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
            $this->command->warn('Beberapa variant/ingredient tidak ditemukan. Pastikan VariantSeeder & IngredientSupplierSeeder sudah dijalankan.');
        }
    }
}
