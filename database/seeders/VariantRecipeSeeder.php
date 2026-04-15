<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * VARIANT RECIPE SEEDER
 *
 * Sumber: Sheet "Material & Packing" — HPP_Harumnya.xlsx
 *
 * Komposisi resep base (total 30ml):
 *   Campuran FO+DPG (75% FO + 25% DPG = rasio 1L FO : 0.333L DPG per liter campuran)
 *   Resep menggunakan ml campuran FO+DPG, bukan FO murni.
 *
 * Per intensity (volume FO+DPG mixture + Alcohol 99%):
 *   EDT 30ml:  FO+DPG=10ml, alc=20ml
 *   EDT 50ml:  FO+DPG=16ml, alc=34ml
 *   EDT 100ml: FO+DPG=33ml, alc=67ml
 *   EDP 30ml:  FO+DPG=15ml, alc=15ml
 *   EDP 50ml:  FO+DPG=25ml, alc=25ml
 *   EDP 100ml: FO+DPG=50ml, alc=50ml
 *   EXT 30ml:  FO+DPG=20ml, alc=10ml
 *   EXT 50ml:  FO+DPG=34ml, alc=16ml
 *   EXT 100ml: FO+DPG=67ml, alc=33ml
 *
 * Setiap resep menyimpan qty untuk base 30ml saja.
 * ProductSeeder meng-scale ke 50ml & 100ml secara linier.
 *
 * Dalam implementasi, tiap variant_recipe terdiri dari 2 baris per intensity:
 *   1. Fragrance Oil spesifik variant (ingredient ING-FO-Wxxx / ING-FO-Mxxx)
 *      → qty = porsi FO dari campuran FO+DPG (75% dari total FO+DPG)
 *   2. DPG (ING-DPG-001)
 *      → qty = porsi DPG dari campuran FO+DPG (25% dari total FO+DPG)
 *   3. Ethanol 99% (ING-AL-001)
 *      → qty = qty alkohol
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
        // Dipecah: 75% FO, 25% DPG dari qty mixture
        $intensityQty = [
            'EDT' => ['mixture' => 10, 'alc' => 20, 'id' => $edt->id],
            'EDP' => ['mixture' => 15, 'alc' => 15, 'id' => $edp->id],
            'EXT' => ['mixture' => 20, 'alc' => 10, 'id' => $ext->id],
        ];

        // Mapping: variant code → ingredient code untuk FO spesifik
        // Urutan sesuai VariantSeeder
        $variantFoMap = [
            // Wanita
            'SIF' => 'ING-FO-W001', // Si Fiori
            'VCR' => 'ING-FO-W002', // Vanilla Candy Rock
            'BOOR' => 'ING-FO-W003', // Black Opium Over Red
            'BIRG' => 'ING-FO-W004', // Born In Roma Green
            'BSE' => 'ING-FO-W005', // Bombshell Escape
            'HERI' => 'ING-FO-W006', // Her Intense
            'LIB' => 'ING-FO-W007', // Libre
            'MUSK' => 'ING-FO-W008', // White Musk
            'OAM' => 'ING-FO-W009', // Omnia Amethyste
            'FAME' => 'ING-FO-W010', // Fame
            'SCN' => 'ING-FO-W011', // Scandalous
            'BACR' => 'ING-FO-W012', // Baccarat Rouge
            'EDEN' => 'ING-FO-W013', // Eden Sparkling
            'CCP' => 'ING-FO-W014', // Coconut Passion
            'BS' => 'ING-FO-W015', // Bombshell
            'PERF' => 'ING-FO-W016', // Perfect
            'BBTH' => 'ING-FO-W017', // Bubble Bath
            'SPOP' => 'ING-FO-W018', // Scarlet Poppy
            'NOBL' => 'ING-FO-W019', // Noble
            'MWAY' => 'ING-FO-W020', // My Way
            'BLOM' => 'ING-FO-W021', // Bloom
            'CBREK' => 'ING-FO-W022', // Coffee Break
            'EUPH' => 'ING-FO-W023', // Euphoria
            'EROF' => 'ING-FO-W024', // Eros Flame
            'BOP' => 'ING-FO-W025', // Black Opium
            'CLP' => 'ING-FO-W026', // Cloud Pink
            'GG' => 'ING-FO-W027', // Good Girl
            'GDS' => 'ING-FO-W028', // Goddess
            'VR' => 'ING-FO-W029', // Vanilla Rose
            'MWNE' => 'ING-FO-W030', // My Way Nectar
            'SCND' => 'ING-FO-W031', // Scandal
            'MISD' => 'ING-FO-W032', // Miss Dior
            'BBOQ' => 'ING-FO-W033', // Blooming Bouquet
            'HER' => 'ING-FO-W034', // Her
            'GGB' => 'ING-FO-W035', // Good Girl Blush
            'IDOL' => 'ING-FO-W036', // Idol Nectar
            'JME' => 'ING-FO-W037', // JME Persia IBC CV
            'POPC' => 'ING-FO-W038', // Poppy CV
            'NAG' => 'ING-FO-W039', // Nagita CV
            'TWIL' => 'ING-FO-W040', // Twilly CV
            'GRT' => 'ING-FO-W041', // Green Tea CV
            'MRT' => 'ING-FO-W042', // Morning Tea CV
            'FLO' => 'ING-FO-W043', // Flora Gucci
            'TEAS' => 'ING-FO-W044', // Tease
            'EAC' => 'ING-FO-W045', // Eau Capitale
            'FOF' => 'ING-FO-W046', // Flight Of Fancy
            'COCO' => 'ING-FO-W047', // Coco Mademoiselle
            'JPMP' => 'ING-FO-W048', // Jmp Peony Blush
            'CLOE' => 'ING-FO-W049', // Nomadian
            'NO5' => 'ING-FO-W050', // No. 5
            'DEL' => 'ING-FO-W051', // Delina
            'FLGP' => 'ING-FO-W052', // Flora Gucci Premium
            'PCHF' => 'ING-FO-W053', // Pink Chiffon SS
            'VLJ' => 'ING-FO-W054', // Viva La Juicy LZ
            'INCH' => 'ING-FO-W055', // Incanto Shine
            'CHTA' => 'ING-FO-W056', // Cherry In The Air
            'ORCH' => 'ING-FO-W057', // Orchid
            'ROMW' => 'ING-FO-W058', // Romantic Wish
            'BLAN' => 'ING-FO-W059', // Blanche
            // Pria
            'OML' => 'ING-FO-M001', // One Million Lucky
            'BLUS' => 'ING-FO-M002', // Blue Seduction
            'BLEU' => 'ING-FO-M003', // Bleu De Chanel
            'MANX' => 'ING-FO-M004', // Halloween Man X
            'SVG' => 'ING-FO-M005', // Sauvage
            'ABE' => 'ING-FO-M006', // Blue Emotion
            'BOPM' => 'ING-FO-M007', // Black Opium Men
            'SELF' => 'ING-FO-M008', // My Self
            'EROS' => 'ING-FO-M009', // Eros
            'SANT' => 'ING-FO-M010', // Santal 33
            'Y' => 'ING-FO-M011', // Y
            'WANT' => 'ING-FO-M012', // The Most Wanted
            'HERO' => 'ING-FO-M013', // Hero
            'DBL' => 'ING-FO-M014', // Desire Blue
            'OMRV' => 'ING-FO-M015', // One Million Royal
            'WOSS' => 'ING-FO-M016', // Wood Sage & Salt
            'SCNM' => 'ING-FO-M017', // Scandal Men
            'SWY' => 'ING-FO-M018', // Stronger With You
            'TBCO' => 'ING-FO-M019', // Tobacco
            'CDIV' => 'ING-FO-M020', // CDI Aventuro
            'SVGE' => 'ING-FO-M021', // Svg Elixir
            'HOME' => 'ING-FO-M022', // Homme
            'BAGN' => 'ING-FO-M023', // Black Aigner
            'CAV' => 'ING-FO-M024', // Creed Aventus
        ];

        $variants = DB::table('variants')->get()->keyBy('code');

        if ($variants->isEmpty()) {
            $this->command->error('Variants belum ada.');
            return;
        }

        $count = 0;

        foreach ($variantFoMap as $variantCode => $foCode) {
            $variant = $variants[$variantCode] ?? null;
            $foIng = $ingMap[$foCode] ?? null;

            if (!$variant || !$foIng) {
                $this->command->warn("Skip {$variantCode} → {$foCode}: data tidak ditemukan.");
                continue;
            }

            foreach ($intensityQty as $intCode => $qty) {
                $intensityId = $qty['id'];
                $mixQty = $qty['mixture']; // total FO+DPG mixture (ml)
                $alcQty = $qty['alc'];     // alcohol (ml)

                // FO = 75% dari mixture, DPG = 25% dari mixture (pembulatan)
                $foQty = (int) round($mixQty * 0.75);
                $dpgQty = $mixQty - $foQty; // sisa agar total tepat

                $lines = [
                    ['ingredient_id' => $foIng->id, 'qty' => $foQty, 'notes' => 'Fragrance Oil (75% dari campuran)'],
                    ['ingredient_id' => $dpgIng->id, 'qty' => $dpgQty, 'notes' => 'DPG - pelarut fragrance oil (25%)'],
                    ['ingredient_id' => $alcIng->id, 'qty' => $alcQty, 'notes' => 'Ethanol 99% - pelarut utama'],
                ];

                foreach ($lines as $line) {
                    $exists = DB::table('variant_recipes')
                        ->where('variant_id', $variant->id)
                        ->where('intensity_id', $intensityId)
                        ->where('ingredient_id', $line['ingredient_id'])
                        ->exists();

                    if ($exists)
                        continue;

                    DB::table('variant_recipes')->insert([
                        'id' => Str::uuid(),
                        'variant_id' => $variant->id,
                        'intensity_id' => $intensityId,
                        'ingredient_id' => $line['ingredient_id'],
                        'base_quantity' => $line['qty'],
                        'unit' => 'ml',
                        'notes' => $line['notes'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $count++;
                }
            }
        }

        $this->command->info("✓ Variant recipes seeded ({$count} recipe lines).");
    }
}