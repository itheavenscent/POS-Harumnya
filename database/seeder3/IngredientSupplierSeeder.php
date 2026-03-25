<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IngredientSupplierSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        /*
        |--------------------------------------------------------------------------
        | INGREDIENT CATEGORIES
        |--------------------------------------------------------------------------
        */
        $categories = [
            [
                'id'              => Str::uuid(),
                'code'            => 'IC-001',
                'name'            => 'Essential Oil',
                'ingredient_type' => 'oil',
                'sort_order'      => 1,
            ],
            [
                'id'              => Str::uuid(),
                'code'            => 'IC-002',
                'name'            => 'Fragrance Oil',
                'ingredient_type' => 'oil',
                'sort_order'      => 2,
            ],
            [
                'id'              => Str::uuid(),
                'code'            => 'IC-003',
                'name'            => 'Base Oil',
                'ingredient_type' => 'oil',
                'sort_order'      => 3,
            ],
            [
                'id'              => Str::uuid(),
                'code'            => 'IC-004',
                'name'            => 'Alcohol',
                'ingredient_type' => 'alcohol',
                'sort_order'      => 4,
            ],
            [
                'id'              => Str::uuid(),
                'code'            => 'IC-005',
                'name'            => 'Additive',
                'ingredient_type' => 'other',
                'sort_order'      => 5,
            ],
        ];

        foreach ($categories as $cat) {
            DB::table('ingredient_categories')->insert([
                'id'              => $cat['id'],
                'code'            => $cat['code'],
                'name'            => $cat['name'],
                'description'     => 'Category for ' . $cat['name'],
                'ingredient_type' => $cat['ingredient_type'],
                'is_active'       => true,
                'sort_order'      => $cat['sort_order'],
                'created_at'      => $now,
                'updated_at'      => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SUPPLIERS
        |--------------------------------------------------------------------------
        */
        DB::table('suppliers')->insert([
            [
                'id'             => Str::uuid(),
                'code'           => 'SUP-001',
                'name'           => 'PT Aroma Nusantara',
                'contact_person' => 'Pak Budi',
                'phone'          => '021-11112222',
                'email'          => 'sales@aromanusantara.com',
                'address'        => 'Jl. Industri Aroma No. 10, Jakarta',
                'payment_term'   => 'credit_30',
                'credit_limit'   => 50000000.00,
                'is_active'      => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'id'             => Str::uuid(),
                'code'           => 'SUP-002',
                'name'           => 'CV Wangi Sejahtera',
                'contact_person' => 'Ibu Sari',
                'phone'          => '021-33334444',
                'email'          => 'order@wangisejahtera.com',
                'address'        => 'Jl. Fragrance No. 25, Tangerang',
                'payment_term'   => 'credit_14',
                'credit_limit'   => 25000000.00,
                'is_active'      => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'id'             => Str::uuid(),
                'code'           => 'SUP-003',
                'name'           => 'Toko Kimia Jaya',
                'contact_person' => 'Pak Herman',
                'phone'          => '021-55556666',
                'email'          => 'info@kimiajaya.com',
                'address'        => 'Jl. Kimia Raya No. 88, Bekasi',
                'payment_term'   => 'cash',
                'credit_limit'   => 0.00,
                'is_active'      => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | INGREDIENTS
        |--------------------------------------------------------------------------
        */
        $essentialOilCat = $categories[0]['id'];
        $fragranceCat    = $categories[1]['id'];
        $baseCat         = $categories[2]['id'];
        $alcoholCat      = $categories[3]['id'];
        $additiveCat     = $categories[4]['id'];

        $ingredients = [

            // ── Essential Oils ────────────────────────────────────────────────
            ['ingredient_category_id' => $essentialOilCat, 'code' => 'ING-EO-001', 'name' => 'Lavender Essential Oil',  'unit' => 'ml'],
            ['ingredient_category_id' => $essentialOilCat, 'code' => 'ING-EO-002', 'name' => 'Rose Essential Oil',      'unit' => 'ml'],
            ['ingredient_category_id' => $essentialOilCat, 'code' => 'ING-EO-003', 'name' => 'Jasmine Essential Oil',   'unit' => 'ml'],

            // ── Fragrance Oils — Wanita ───────────────────────────────────────
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W001', 'name' => 'Si Fiori FO',                  'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W002', 'name' => 'Vanilla Candy Rock FO',        'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W003', 'name' => 'Blue Seduction FO',            'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W004', 'name' => 'Black Opium Over Red FO',      'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W005', 'name' => 'Born In Roma Green FO',        'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W006', 'name' => 'Bombshell Escape FO',          'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W007', 'name' => 'Her Intense FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W008', 'name' => 'Blue Emotion FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W009', 'name' => 'Libre FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W010', 'name' => 'White Musk FO',                'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W011', 'name' => 'My Self FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W012', 'name' => 'Omnia Amethyste FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W013', 'name' => 'Fame FO',                      'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W014', 'name' => 'Scandalous FO',                'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W015', 'name' => 'Baccarat Rouge FO',            'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W016', 'name' => 'Eden Sparkling FO',            'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W017', 'name' => 'Coconut Passion FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W018', 'name' => 'Bombshell FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W019', 'name' => 'Perfect FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W020', 'name' => 'Bubble Bath FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W021', 'name' => 'Scarlet Poppy FO',             'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W022', 'name' => 'Noble FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W023', 'name' => 'My Way FO',                    'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W024', 'name' => 'Bloom FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W025', 'name' => 'Coffee Break FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W026', 'name' => 'Euphoria FO',                  'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W027', 'name' => 'Eros Flame FO',                'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W028', 'name' => 'Black Opium FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W029', 'name' => 'Cloud Pink FO',                'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W030', 'name' => 'Good Girl FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W031', 'name' => 'Goddess FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W032', 'name' => 'Vanilla Rose FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W033', 'name' => 'My Way Nectar FO',             'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W034', 'name' => 'Scandal FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W035', 'name' => 'Miss Dior FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W036', 'name' => 'Blooming Bouquet FO',          'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W037', 'name' => 'Her FO',                       'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W038', 'name' => 'Good Girl Blush FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W039', 'name' => 'Idol Nectar FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W040', 'name' => 'JME Persia IBC CV FO',         'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W041', 'name' => 'Poppy CV FO',                  'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W042', 'name' => 'Nagita CV FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W043', 'name' => 'Twilly CV FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W044', 'name' => 'Green Tea CV FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W045', 'name' => 'Morning Tea CV FO',            'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W046', 'name' => 'Flower FO',                    'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W047', 'name' => 'Tease FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W048', 'name' => 'Eau Capitale FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W049', 'name' => 'Flight Of Fancy FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W050', 'name' => 'Coco Mademoiselle FO',         'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W051', 'name' => 'Jmp Peony Blush FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W052', 'name' => 'Nomadian (Chloe Nomade) FO',   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W053', 'name' => 'No. 5 FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W054', 'name' => 'Delina FO',                    'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W055', 'name' => 'Flora Gucci FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W056', 'name' => 'Pink Chiffon SS FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-W057', 'name' => 'Viva La Juicy LZ FO',          'unit' => 'ml'],

            // ── Fragrance Oils — Pria ─────────────────────────────────────────
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M001', 'name' => 'One Million Lucky FO',         'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M002', 'name' => 'Sauvage FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M003', 'name' => 'Black Opium Men FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M004', 'name' => 'Bleu De Chanel FO',            'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M005', 'name' => 'Halloween Man X FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M006', 'name' => 'Eros FO',                      'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M007', 'name' => 'Santal 33 FO',                 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M008', 'name' => 'Y FO',                         'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M009', 'name' => 'The Most Wanted FO',           'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M010', 'name' => 'Hero FO',                      'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M011', 'name' => 'Desire Blue FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M012', 'name' => 'One Million Royal FO',         'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M013', 'name' => 'Wood Sage & Salt FO',          'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M014', 'name' => 'Scandal Men FO',               'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M015', 'name' => 'Simeo / Stronger With You FO', 'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M016', 'name' => 'Tobacco FO',                   'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M017', 'name' => 'CDI Aventuro FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M018', 'name' => 'Svg Elixir FO',                'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M019', 'name' => 'Homme FO',                     'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M020', 'name' => 'Black Aigner FO',              'unit' => 'ml'],
            ['ingredient_category_id' => $fragranceCat, 'code' => 'ING-FO-M021', 'name' => 'Creed Aventus FO',             'unit' => 'ml'],

            // ── Base Oils ─────────────────────────────────────────────────────
            ['ingredient_category_id' => $baseCat, 'code' => 'ING-BO-001', 'name' => 'Jojoba Oil',       'unit' => 'ml'],
            ['ingredient_category_id' => $baseCat, 'code' => 'ING-BO-002', 'name' => 'Sweet Almond Oil', 'unit' => 'ml'],

            // ── Alcohol ───────────────────────────────────────────────────────
            ['ingredient_category_id' => $alcoholCat, 'code' => 'ING-AL-001', 'name' => 'Ethanol 96%',              'unit' => 'ml'],
            ['ingredient_category_id' => $alcoholCat, 'code' => 'ING-AL-002', 'name' => 'Dipropylene Glycol (DPG)', 'unit' => 'ml'],

            // ── Additives ─────────────────────────────────────────────────────
            ['ingredient_category_id' => $additiveCat, 'code' => 'ING-ADD-001', 'name' => 'Vitamin E Oil',    'unit' => 'ml'],
            ['ingredient_category_id' => $additiveCat, 'code' => 'ING-ADD-002', 'name' => 'Fixative Powder',  'unit' => 'gr'],
        ];

        foreach ($ingredients as $index => $ing) {
            DB::table('ingredients')->insert([
                'id'                     => Str::uuid(),
                'ingredient_category_id' => $ing['ingredient_category_id'],
                'code'                   => $ing['code'],
                'name'                   => $ing['name'],
                'unit'                   => $ing['unit'],
                'description'            => 'Standard ' . $ing['name'],
                'is_active'              => true,
                'sort_order'             => $index + 1,
                'created_at'             => $now,
                'updated_at'             => $now,
            ]);
        }
    }
}
