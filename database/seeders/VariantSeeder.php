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

        // Format: [code, name, brand, gender]
        // Wanita (56 items) + Pria (25 items) dari Sheet "CEWEK COWOK"
        $variants = [
            // ── Wanita ────────────────────────────────────────────────────────
            ['NAG',   'Nagita',                    null,                      'female'],
            ['GRT',   'Green Tea',                 null,                      'unisex'],
            ['MRT',   'Morning Tea',               null,                      'unisex'],
            ['RIA',   'Euphoria',                  null,                      'female'],
            ['GI',    'Garuda Indonesia',           null,                      'unisex'],
            ['FOF',   'Flight Of Fancy',            'Anna Sui',                'female'],
            ['CLP',   'Cloud Pink',                 'Ariana Grande',           'female'],
            ['PINK',  'Pink Chifon',                'Bath & Body Works',       'female'],
            ['HER',   'Her',                        'Burberry',                'female'],
            ['HERI',  'Her Intense',                'Burberry',                'female'],
            ['GDS',   'Goddess',                    'Burberry',                'female'],
            ['BOA',   'Omnia',                      'Bvlgari',                 'female'],
            ['BLAN',  'Blanche',                    'Byredo',                  'unisex'],
            ['GG',    'Good Girl',                  'Carolina Herrera',        'female'],
            ['GGB',   'Good Girl Blush',            'Carolina Herrera',        'female'],
            ['COCO',  'Coco Mademoiselle',          'Chanel',                  'female'],
            ['NO5',   'No. 5',                      'Chanel',                  'female'],
            ['NOMA',  'Nomade',                     'Chloe',                   'female'],
            ['BOUQ',  'Blooming Bouquet',            'Christian Dior',          'female'],
            ['MISS',  'Miss Lady',                  'Christian Dior',           'female'],
            ['EAC',   'Eau Capitale',               'Diptyque',                'unisex'],
            ['CTA',   'Cherry In The Air',          'Escada',                  'female'],
            ['WAY',   'My Way',                     'Giorgio Armani',          'female'],
            ['WAYN',  'My Way Nectar',              'Giorgio Armani',          'female'],
            ['SIF',   'Si Fiori',                   'Giorgio Armani',          'female'],
            ['BLOM',  'Bloom',                      'Gucci',                   'female'],
            ['FLO',   'Flora',                      'Gucci',                   'female'],
            ['TWIL',  'Twilly',                     'Hermes',                  'female'],
            ['JPS',   'Scandal',                    'Jean Paul Gaultier',      'female'],
            ['POPY',  'Scarlet Poppy',              'Jo Malone',               'unisex'],
            ['JME',   'English Pear Freesia',       'Jo Malone',               'unisex'],
            ['JMP',   'Peony Blush',                'Jo Malone',               'female'],  // Tidak rilis — oil rusak
            ['VIVA',  'Viva La Juicy',              'Juicy Couture',           'female'],
            ['EDEN',  'Eden Sparkling Lychee',      'Kayali',                  'female'],
            ['CANDY', 'Vanilla Candy',              'Kayali',                  'female'],
            ['VIE',   'La Vie Est Belle',            'Lancome',                 'female'],
            ['IDOL',  'Idole Nectar',               'Lancome',                 'female'],
            ['BRO',   'Baccarat 540',               'Maison Francis Kurkdjian','unisex'],
            ['BATH',  'Bubble Bath',                'Maison Margiela',         'unisex'],
            ['BREAK', 'Coffee Break',               'Maison Margiela',         'unisex'],
            ['MVR',   'Vanilla Rose',               'Mancera',                 'unisex'],
            ['MJP',   'Perfect',                    'Marc Jacobs',             'female'],
            ['FAME',  'Fame',                       'Paco Rabanne',            'female'],
            ['DEL',   'Delina',                     'Parfums de Marly',        'female'],
            ['IS',    'Incanto Shine',              'Salvatore Ferragamo',     'female'],
            ['MUSK',  'White Musk',                 'The Body Shop',           'unisex'],
            ['SCN',   'Scandalous',                 "Victoria's Secret",       'female'],
            ['VBS',   'Bombshell Escape',           "Victoria's Secret",       'female'],
            ['VB',    'Bombshell',                  "Victoria's Secret",       'female'],
            ['VCS',   'Coconut Passion',            "Victoria's Secret",       'female'],
            ['TEAS',  'Tease',                      "Victoria's Secret",       'female'],
            ['ROWI',  'Romantic Wish',              "Victoria's Secret",       'female'],
            ['BOP',   'Black Opium',                'Yves Saint Laurent',      'female'],
            ['BOPR',  'Black Opium Red',            'Yves Saint Laurent',      'female'],
            ['LIB',   'Libre',                      'Yves Saint Laurent',      'female'],
            ['ORC',   'Orchid',                     'Zara',                    'female'],

            // ── Pria ──────────────────────────────────────────────────────────
            ['BE',    'Blue Emotion',               'Aigner',                  'male'],
            ['BLACK', 'Black',                      'Aigner',                  'male'],
            ['BS',    'Blue Seduction',             'Antonio Banderas',        'male'],
            ['WANT',  'The Most Wanted',            'Azzaro',                  'male'],
            ['HERO',  'Hero',                       'Burberry',                'male'],
            ['BLEU',  'Bleu De Chanel',             'Chanel',                  'male'],
            ['SVG',   'Sauvage',                    'Christian Dior',          'male'],
            ['SVGE',  'Sauvage Elixir',             'Christian Dior',          'male'],
            ['HOME',  'Homme',                      'Christian Dior',          'male'],
            ['CAV',   'Creed Aventus',              'Creed',                   'male'],
            ['DDB',   'Desire Blue',                'Dunhill',                 'male'],
            ['SWY',   'Stronger With You',          'Giorgio Armani',          'male'],
            ['MANX',  'Man X',                      'Halloween',               'male'],
            ['JPM',   'Scandal Homme',              'Jean Paul Gaultier',      'male'],
            ['JMW',   'Wood Sage Sea Salt',         'Jo Malone',               'unisex'],
            ['SANT',  'Santal 33',                  'Le Labo',                 'unisex'],
            ['ONE',   'One Million Lucky',          'Paco Rabanne',            'male'],
            ['ONER',  'One Million Royal',          'Paco Rabanne',            'male'],
            ['BM',    'Black Musk',                 'The Body Shop',           'unisex'],
            ['TTV',   'Tobacco Vanille',            'Tom Ford',                'unisex'],
            ['BIR',   'Born In Roma',               'Valentino',               'male'],
            ['EROF',  'Eros Flame',                 'Versace',                 'male'],
            ['EROS',  'Eros',                       'Versace',                 'male'],
            ['Y',     'Y',                          'Yves Saint Laurent',      'male'],
            ['SELF',  'My Self',                    'Yves Saint Laurent',      'male'],
        ];

        foreach ($variants as $v) {
            $name = $v[1];
            DB::table('variants')->insert([
                'id'          => Str::uuid(),
                'code'        => $v[0],
                'name'        => $name,
                'gender'      => $v[3],
                'description' => null,
                'is_active'   => true,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        $this->command->info('✓ Variants seeded (' . count($variants) . ' variants).');
    }
}
