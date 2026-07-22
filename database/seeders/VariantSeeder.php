<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * VariantSeeder
 *
 * Sumber data: Sheet "CEWEK COWOK" — Varian Harumnya (1).xlsx
 *   - Kolom CEWEK (A-C): Varian | Brand | SKU  → gender female
 *   - Kolom COWOK (D-F): Varian | Brand | SKU  → gender male
 *   - Brand disimpan di kolom `description`.
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

        // Format: [code, name, gender, brand|null]
        $variants = [
            // ── CEWEK (Female) — 48 varian ───────────────────────────────────
            ['NAG',   'Nagita',                     'female', null],
            ['GRT',   'Green Tea',                  'female', null],
            ['LIM',   "L'Imperatrice 3 (Euphoria)", 'female', 'Dolce & Gabbana'],
            ['GI',    'Garuda Indonesia',           'female', null],
            ['FOF',   'Flight Of Fancy',            'female', 'Anna Sui'],
            ['CLP',   'Cloud Pink',                 'female', 'Ariana Grande'],
            ['PINK',  'Pink Chifon',                'female', 'Bath & Body Works'],
            ['HER',   'Her',                        'female', 'Burberry'],
            ['GDS',   'Goddess',                    'female', 'Burberry'],
            ['BOA',   'Omnia',                      'female', 'Bvlgari'],
            ['BLAN',  'Blanche',                    'female', 'Byredo'],
            ['GG',    'Good Girl',                  'female', 'Carolina Herrera'],
            ['GGB',   'Good Girl Blush',            'female', 'Carolina Herrera'],
            ['NOMA',  'Nomade',                     'female', 'Chloe'],
            ['BOUQ',  'Blooming Bouquet',           'female', 'Christian Dior'],
            ['MISS',  'Miss Dior',                  'female', 'Christian Dior'],
            ['EAC',   'Eau Capitale',               'female', 'Diptyque'],
            ['CTA',   'Cherry in The Air',          'female', 'Escada'],
            ['WAY',   'My Way',                      'female', 'Giorgio Armani'],
            ['SIF',   'Si Fiori',                   'female', 'Giorgio Armani'],
            ['BLOM',  'Bloom',                      'female', 'Gucci'],
            ['FLO',   'Flora',                      'female', 'Gucci'],
            ['TWIL',  'Twilly',                     'female', 'Hermes'],
            ['JPS',   'Scandal',                    'female', 'Jean Paul Gaultier'],
            ['POPY',  'Scarlet Poppy',              'female', 'Jo Malone'],
            ['JME',   'English Pear Freesia',       'female', 'Jo Malone'],
            ['VIVA',  'Viva La Juicy',              'female', 'Juicy Couture'],
            ['EDEN',  'Eden Sparkling Lychee',      'female', 'Kayali'],
            ['CANDY', 'Vanilla Candy',              'female', 'Kayali'],
            ['VIE',   'La Vie Est Belle',           'female', 'Lancome'],
            ['IDOL',  'Idole Nectar',               'female', 'Lancome'],
            ['BRO',   'Baccarat 540',               'female', 'Maison Francis Kurkdjian'],
            ['BATH',  'Bubble Bath',                'female', 'Maison Margiela'],
            ['BREAK', 'Coffee Break',               'female', 'Maison Margiela'],
            ['MVR',   'Vanilla Rose',               'female', 'Mancera'],
            ['MJP',   'Perfect',                    'female', 'Marc Jacobs'],
            ['FAME',  'Fame',                       'female', 'Paco Rabbane'],
            ['IS',    'Incanto Shine',              'female', 'Salvatore Feragamo'],
            ['MUSK',  'White Musk',                 'female', 'The Body Shop'],
            ['SCN',   'Scandalous',                 'female', "Victoria's Secret"],
            ['VBS',   'Bombshell Escape',           'female', "Victoria's Secret"],
            ['VB',    'Bombshell',                  'female', "Victoria's Secret"],
            ['VSC',   'Coconut Passion',            'female', "Victoria's Secret"],
            ['ROWI',  'Romantic Wish',              'female', "Victoria's Secret"],
            ['BOP',   'Black Opium',                'female', 'Yves Saint Laurent'],
            ['BOPR',  'Black Opium Red',            'female', 'Yves Saint Laurent'],
            ['LIB',   'Libre',                      'female', 'Yves Saint Laurent'],
            ['ORC',   'Orchid',                     'female', 'Zara'],

            // ── COWOK (Male) — 23 varian ─────────────────────────────────────
            ['BE',    'Blue Emotion',               'male', 'Aigner'],
            ['BLACK', 'Black',                       'male', 'Aigner'],
            ['BS',    'Blue Seduction',             'male', 'Antonio Banderas'],
            ['WANT',  'The Most Wanted',            'male', 'Azzaro'],
            ['HERO',  'Hero',                        'male', 'Burberry'],
            ['BLEU',  'Bleu De Chanel',             'male', 'Chanel'],
            ['SVG',   'Sauvage',                    'male', 'Christian Dior'],
            ['SVGE',  'Sauvage Elixir',             'male', 'Christian Dior'],
            ['HOME',  'Homme',                       'male', 'Christian Dior'],
            ['CAV',   'Aventus',                    'male', 'Creed'],
            ['DDB',   'Desire Blue',                'male', 'Dunhill'],
            ['SWY',   'Stronger With You',          'male', 'Giorgio Armani'],
            ['MANX',  'Man X',                       'male', 'Hallowen'],
            ['SH',    'Scandal Homme',              'male', 'Jean Paul Gaultier'],
            ['JMW',   'Wood Sage Sea Salt',         'male', 'Jo Malone'],
            ['SANT',  'Santal 33',                  'male', 'Le Labo'],
            ['ONE',   'One Million Lucky',          'male', 'Paco Rabbane'],
            ['ONER',  'One Million Royal',          'male', 'Paco Rabbane'],
            ['BM',    'Black Musk',                 'male', 'The Body Shop'],
            ['BIR',   'Born in Roma',               'male', 'Valentino'],
            ['EROF',  'Eros Flame',                 'male', 'Versace'],
            ['EROS',  'Eros',                        'male', 'Versace'],
            ['Y',     'Y',                           'male', 'Yves Saint Laurent'],
        ];

        $sortOrder = 0;
        foreach ($variants as $v) {
            DB::table('variants')->insert([
                'id'          => Str::uuid(),
                'code'        => $v[0],
                'name'        => $v[1],
                'gender'      => $v[2],
                'description' => $v[3], // brand
                'is_active'   => true,
                'sort_order'  => $sortOrder++,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        $this->command->info('✓ Variants seeded (' . count($variants) . ' variants: 48 female + 23 male).');
    }
}
