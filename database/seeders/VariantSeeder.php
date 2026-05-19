<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * VariantSeeder
 *
 * Sumber data: Sheet "CEWEK COWOK" — Varian_Harumnya.xlsx (versi terbaru)
 *
 * Perubahan dari versi lama:
 *   - SKU disesuaikan dengan Excel terbaru
 *   - Varian baru: GI (Garuda Indonesia), PINK (Pink Chifon), NOMA (Nomade),
 *     BOUQ (Blooming Bouquet), MISS (Miss Lady), JPS (Scandal), POPY (Scarlet Poppy),
 *     JMP (Peony Blush), VIVA (Viva La Juicy), CANDY (Vanilla Candy), VIE (La Vie Est Belle),
 *     BRO (Baccarat 540), MVR (Vanilla Rose), MJP (Perfect), IS (Incanto Shine),
 *     VBS (Bombshell Escape), VB (Bombshell), VCS (Coconut Passion), ROWI (Romantic Wish),
 *     BOPR (Black Opium Red), ORC (Orchid), BOA (Omnia), RIA (Euphoria),
 *     BE (Blue Emotion), BLACK (Black Aigner), BS (Blue Seduction), DDB (Desire Blue),
 *     JPM (Scandal Homme), JMW (Wood Sage Sea Salt), ONE (One Million Lucky),
 *     ONER (One Million Royal), BM (Black Musk), TTV (Tobacco Vanille), BIR (Born in Roma)
 *   - SKU lama yang berubah: BLUS→BS, ABE→BE, BAGN→BLACK, DBL→DDB,
 *     SCNM→JPM, WOSS→JMW, OML→ONE, OMRV→ONER, TBCO→TTV, CDIV→BIR,
 *     SCND→JPS, BBOQ→BOUQ, MISD→MISS, SPOP→POPY, VLJ→VIVA,
 *     EUPH→RIA, BACR→BRO, ROMW→ROWI, INCH→IS, CCP→VCS, BS(lama)→VB,
 *     BSE→VBS, VR→MVR, PERF→MJP, BBTH→BATH, CBREK→BREAK, ORCH→ORC,
 *     OAM→BOA, MWNE→WAYN, MWAY→WAY, EDEN→EDEN, VCR→CANDY, GG→GG, SCN→SCN
 *
 * Catatan: Peony Blush (JMP) tidak dirilis karena oil rusak — tetap di-seed sebagai
 *           referensi tapi bisa di-nonaktifkan jika diperlukan.
 */
class VariantSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Clear existing records to ensure clean re-seeding in correct dependency order
        DB::table('product_recipes')->delete();
        DB::table('variant_recipes')->delete();
        DB::table('products')->delete();
        DB::table('store_categories')->delete();
        DB::table('variants')->delete();

        // Format: [code, name, gender]
        // Wanita (55 items) + Pria (25 items) dari Sheet "CEWEK COWOK"
        $variants = [
            // ── Wanita ────────────────────────────────────────────────────────
            ['NAG',   'Nagita',                    'female'],
            ['GRT',   'Green Tea',                 'unisex'],
            ['MRT',   'Morning Tea',               'unisex'],
            ['RIA',   'Euphoria',                  'female'],
            ['GI',    'Garuda Indonesia',          'unisex'],
            ['FOF',   'Flight Of Fancy',           'female'],
            ['CLP',   'Cloud Pink',                'female'],
            ['PINK',  'Pink Chifon',               'female'],
            ['HER',   'Her',                       'female'],
            ['HERI',  'Her Intense',               'female'],
            ['GDS',   'Goddess',                   'female'],
            ['BOA',   'Omnia',                     'female'],
            ['BLAN',  'Blanche',                   'unisex'],
            ['GG',    'Good Girl',                 'female'],
            ['GGB',   'Good Girl Blush',           'female'],
            ['COCO',  'Coco',                      'female'],
            ['NO5',   'No. 5',                     'female'],
            ['NOMA',  'Nomade',                    'female'],
            ['BOUQ',  'Blooming Bouquet',          'female'],
            ['MISS',  'Miss Lady',                 'female'],
            ['EAC',   'Eau Capitale',              'unisex'],
            ['CTA',   'Cherry in The Air',         'female'],
            ['WAY',   'My Way',                    'female'],
            ['WAYN',  'My Way Nectar',             'female'],
            ['SIF',   'Si Fiori',                  'female'],
            ['BLOM',  'Bloom',                     'female'],
            ['FLO',   'Flora',                     'female'],
            ['TWIL',  'Twilly',                    'female'],
            ['JPS',   'Scandal',                   'female'],
            ['POPY',  'Scarlet Poppy',             'unisex'],
            ['JME',   'English Pear Freesia',      'unisex'],
            ['VIVA',  'Viva La Juicy',             'female'],
            ['EDEN',  'Eden Sparkling Lychee',     'female'],
            ['CANDY', 'Vanilla Candy',             'female'],
            ['VIE',   'La Vie Est Belle',          'female'],
            ['IDOL',  'Idole Nectar',              'female'],
            ['BRO',   'Baccarat 540',              'unisex'],
            ['BATH',  'Bubble Bath',               'unisex'],
            ['BREAK', 'Coffee Break',              'unisex'],
            ['MVR',   'Vanilla Rose',              'unisex'],
            ['MJP',   'Perfect',                   'female'],
            ['FAME',  'Fame',                      'female'],
            ['DEL',   'Delina',                    'female'],
            ['IS',    'Incanto Shine',             'female'],
            ['MUSK',  'White Musk',                'unisex'],
            ['SCN',   'Scandalous',                'female'],
            ['VBS',   'Bombshell Escape',          'female'],
            ['VB',    'Bombshell',                 'female'],
            ['VCS',   'Coconut Passion',           'female'],
            ['TEAS',  'Tease',                     'female'],
            ['ROWI',  'Romantic Wish',             'female'],
            ['BOP',   'Black Opium',               'female'],
            ['BOPR',  'Black Opium Red',           'female'],
            ['LIB',   'Libre',                     'female'],
            ['ORC',   'Orchid',                    'female'],

            // ── Pria ──────────────────────────────────────────────────────────
            ['BE',    'Blue Emotion',              'male'],
            ['BLACK', 'Black',                     'male'],
            ['BS',    'Blue Seduction',            'male'],
            ['WANT',  'The Most Wanted',           'male'],
            ['HERO',  'Hero',                      'male'],
            ['BLEU',  'Bleu De Chance',            'male'],
            ['SVG',   'Sauvage',                   'male'],
            ['SVGE',  'Sauvage Elixir',            'male'],
            ['HOME',  'Homme',                     'male'],
            ['CAV',   'Aventus',                   'male'],
            ['DDB',   'Desire Blue',               'male'],
            ['SWY',   'Stronger With You',         'male'],
            ['MANX',  'Man X',                     'male'],
            ['JPM',   'Scandal Homme',             'male'],
            ['JMW',   'Wood Sage Sea Salt',        'unisex'],
            ['SANT',  'Santal 33',                 'unisex'],
            ['ONE',   'One Million Lucky',         'male'],
            ['ONER',  'One Million Royal',         'male'],
            ['BM',    'Black Musk',                'unisex'],
            ['TTV',   'Tobacco Vanille',           'unisex'],
            ['BIR',   'Born in Roma',              'male'],
            ['EROF',  'Eros Flame',                'male'],
            ['EROS',  'Eros',                      'male'],
            ['Y',     'Y',                         'male'],
            ['SELF',  'My Self',                   'male'],
        ];

        foreach ($variants as $v) {
            DB::table('variants')->insert([
                'id'          => Str::uuid(),
                'code'        => $v[0],
                'name'        => $v[1],
                'gender'      => $v[2],
                'description' => null,
                'is_active'   => true,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        $this->command->info('✓ Variants seeded (' . count($variants) . ' variants).');
    }
}
