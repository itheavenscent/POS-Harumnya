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

        // ── INGREDIENT CATEGORIES ─────────────────────────────────────────────
        $categories = [
            ['id' => Str::uuid()->toString(), 'code' => 'IC-001', 'name' => 'Essential Oil',  'ingredient_type' => 'oil',     'sort_order' => 1],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-002', 'name' => 'Fragrance Oil',   'ingredient_type' => 'oil',     'sort_order' => 2],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-003', 'name' => 'Base Oil',        'ingredient_type' => 'oil',     'sort_order' => 3],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-004', 'name' => 'Alcohol',         'ingredient_type' => 'alcohol', 'sort_order' => 4],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-005', 'name' => 'Additive',        'ingredient_type' => 'other',   'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            DB::table('ingredient_categories')->insert([
                'id'              => $cat['id'],
                'code'            => $cat['code'],
                'name'            => $cat['name'],
                'description'     => 'Kategori untuk ' . $cat['name'],
                'ingredient_type' => $cat['ingredient_type'],
                'is_active'       => true,
                'sort_order'      => $cat['sort_order'],
                'created_at'      => $now,
                'updated_at'      => $now,
            ]);
        }

        // ── SUPPLIERS ─────────────────────────────────────────────────────────
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

        // ── INGREDIENTS ───────────────────────────────────────────────────────
        // FIX: kolom 'sort_order' TIDAK ADA di tabel ingredients (migration terbaru).
        // Hanya: id, ingredient_category_id, code, name, unit, description, image,
        //        average_cost, selling_price, is_active, timestamps, softDeletes.

        [$eoId, $foId, $boId, $alId, $adId] = array_column($categories, 'id');

        $ingredients = [
            // ── Essential Oils ────────────────────────────────────────────────
            [$eoId, 'ING-EO-001', 'Lavender Essential Oil',  'ml', 1500.00,  null],
            [$eoId, 'ING-EO-002', 'Rose Essential Oil',      'ml', 5000.00,  null],
            [$eoId, 'ING-EO-003', 'Jasmine Essential Oil',   'ml', 4500.00,  null],

            // ── Fragrance Oils — Wanita ───────────────────────────────────────
            [$foId, 'ING-FO-W001', 'Si Fiori FO',                  'ml', 2200.00, null],
            [$foId, 'ING-FO-W002', 'Vanilla Candy Rock FO',        'ml', 1800.00, null],
            [$foId, 'ING-FO-W003', 'Blue Seduction FO',            'ml', 1600.00, null],
            [$foId, 'ING-FO-W004', 'Black Opium Over Red FO',      'ml', 2500.00, null],
            [$foId, 'ING-FO-W005', 'Born In Roma Green FO',        'ml', 2300.00, null],
            [$foId, 'ING-FO-W006', 'Bombshell Escape FO',          'ml', 1900.00, null],
            [$foId, 'ING-FO-W007', 'Her Intense FO',               'ml', 2100.00, null],
            [$foId, 'ING-FO-W008', 'Blue Emotion FO',              'ml', 1700.00, null],
            [$foId, 'ING-FO-W009', 'Libre FO',                     'ml', 2400.00, null],
            [$foId, 'ING-FO-W010', 'White Musk FO',                'ml', 1500.00, null],
            [$foId, 'ING-FO-W011', 'My Self FO',                   'ml', 1600.00, null],
            [$foId, 'ING-FO-W012', 'Omnia Amethyste FO',           'ml', 2000.00, null],
            [$foId, 'ING-FO-W013', 'Fame FO',                      'ml', 2200.00, null],
            [$foId, 'ING-FO-W014', 'Scandalous FO',                'ml', 1800.00, null],
            [$foId, 'ING-FO-W015', 'Baccarat Rouge FO',            'ml', 3500.00, null],
            [$foId, 'ING-FO-W016', 'Eden Sparkling FO',            'ml', 2600.00, null],
            [$foId, 'ING-FO-W017', 'Coconut Passion FO',           'ml', 1700.00, null],
            [$foId, 'ING-FO-W018', 'Bombshell FO',                 'ml', 1900.00, null],
            [$foId, 'ING-FO-W019', 'Perfect FO',                   'ml', 2100.00, null],
            [$foId, 'ING-FO-W020', 'Bubble Bath FO',               'ml', 1400.00, null],
            [$foId, 'ING-FO-W021', 'Scarlet Poppy FO',             'ml', 2300.00, null],
            [$foId, 'ING-FO-W022', 'Noble FO',                     'ml', 1600.00, null],
            [$foId, 'ING-FO-W023', 'My Way FO',                    'ml', 2200.00, null],
            [$foId, 'ING-FO-W024', 'Bloom FO',                     'ml', 2000.00, null],
            [$foId, 'ING-FO-W025', 'Coffee Break FO',              'ml', 1500.00, null],
            [$foId, 'ING-FO-W026', 'Euphoria FO',                  'ml', 1800.00, null],
            [$foId, 'ING-FO-W027', 'Eros Flame FO',                'ml', 2400.00, null],
            [$foId, 'ING-FO-W028', 'Black Opium FO',               'ml', 2200.00, null],
            [$foId, 'ING-FO-W029', 'Cloud Pink FO',                'ml', 2000.00, null],
            [$foId, 'ING-FO-W030', 'Good Girl FO',                 'ml', 2500.00, null],
            [$foId, 'ING-FO-W031', 'Goddess FO',                   'ml', 2300.00, null],
            [$foId, 'ING-FO-W032', 'Vanilla Rose FO',              'ml', 1900.00, null],
            [$foId, 'ING-FO-W033', 'My Way Nectar FO',             'ml', 2200.00, null],
            [$foId, 'ING-FO-W034', 'Scandal FO',                   'ml', 2000.00, null],
            [$foId, 'ING-FO-W035', 'Miss Dior FO',                 'ml', 2600.00, null],
            [$foId, 'ING-FO-W036', 'Blooming Bouquet FO',          'ml', 2100.00, null],
            [$foId, 'ING-FO-W037', 'Her FO',                       'ml', 1900.00, null],
            [$foId, 'ING-FO-W038', 'Good Girl Blush FO',           'ml', 2500.00, null],
            [$foId, 'ING-FO-W039', 'Idol Nectar FO',               'ml', 2300.00, null],
            [$foId, 'ING-FO-W040', 'JME Persia IBC CV FO',         'ml', 2000.00, null],
            [$foId, 'ING-FO-W041', 'Poppy CV FO',                  'ml', 1800.00, null],
            [$foId, 'ING-FO-W042', 'Nagita CV FO',                 'ml', 1500.00, null],
            [$foId, 'ING-FO-W043', 'Twilly CV FO',                 'ml', 2200.00, null],
            [$foId, 'ING-FO-W044', 'Green Tea CV FO',              'ml', 1400.00, null],
            [$foId, 'ING-FO-W045', 'Morning Tea CV FO',            'ml', 1400.00, null],
            [$foId, 'ING-FO-W046', 'Flower FO',                    'ml', 1900.00, null],
            [$foId, 'ING-FO-W047', 'Tease FO',                     'ml', 2000.00, null],
            [$foId, 'ING-FO-W048', 'Eau Capitale FO',              'ml', 2100.00, null],
            [$foId, 'ING-FO-W049', 'Flight Of Fancy FO',           'ml', 1700.00, null],
            [$foId, 'ING-FO-W050', 'Coco Mademoiselle FO',         'ml', 3000.00, null],
            [$foId, 'ING-FO-W051', 'Jmp Peony Blush FO',           'ml', 2400.00, null],
            [$foId, 'ING-FO-W052', 'Nomadian (Chloe Nomade) FO',   'ml', 2300.00, null],
            [$foId, 'ING-FO-W053', 'No. 5 FO',                     'ml', 3200.00, null],
            [$foId, 'ING-FO-W054', 'Delina FO',                    'ml', 2800.00, null],
            [$foId, 'ING-FO-W055', 'Flora Gucci FO',               'ml', 2100.00, null],
            [$foId, 'ING-FO-W056', 'Pink Chiffon SS FO',           'ml', 1800.00, null],
            [$foId, 'ING-FO-W057', 'Viva La Juicy LZ FO',          'ml', 2000.00, null],

            // ── Fragrance Oils — Pria ─────────────────────────────────────────
            [$foId, 'ING-FO-M001', 'One Million Lucky FO',         'ml', 2200.00, null],
            [$foId, 'ING-FO-M002', 'Sauvage FO',                   'ml', 2800.00, null],
            [$foId, 'ING-FO-M003', 'Black Opium Men FO',           'ml', 2200.00, null],
            [$foId, 'ING-FO-M004', 'Bleu De Chanel FO',            'ml', 3000.00, null],
            [$foId, 'ING-FO-M005', 'Halloween Man X FO',           'ml', 1700.00, null],
            [$foId, 'ING-FO-M006', 'Eros FO',                      'ml', 2400.00, null],
            [$foId, 'ING-FO-M007', 'Santal 33 FO',                 'ml', 3200.00, null],
            [$foId, 'ING-FO-M008', 'Y FO',                         'ml', 2100.00, null],
            [$foId, 'ING-FO-M009', 'The Most Wanted FO',           'ml', 2500.00, null],
            [$foId, 'ING-FO-M010', 'Hero FO',                      'ml', 2000.00, null],
            [$foId, 'ING-FO-M011', 'Desire Blue FO',               'ml', 1800.00, null],
            [$foId, 'ING-FO-M012', 'One Million Royal FO',         'ml', 2600.00, null],
            [$foId, 'ING-FO-M013', 'Wood Sage & Salt FO',          'ml', 2300.00, null],
            [$foId, 'ING-FO-M014', 'Scandal Men FO',               'ml', 2000.00, null],
            [$foId, 'ING-FO-M015', 'Stronger With You FO',         'ml', 2200.00, null],
            [$foId, 'ING-FO-M016', 'Tobacco FO',                   'ml', 2400.00, null],
            [$foId, 'ING-FO-M017', 'CDI Aventuro FO',              'ml', 2800.00, null],
            [$foId, 'ING-FO-M018', 'Svg Elixir FO',                'ml', 3000.00, null],
            [$foId, 'ING-FO-M019', 'Homme FO',                     'ml', 2100.00, null],
            [$foId, 'ING-FO-M020', 'Black Aigner FO',              'ml', 1900.00, null],
            [$foId, 'ING-FO-M021', 'Creed Aventus FO',             'ml', 3500.00, null],

            // ── Base Oils ─────────────────────────────────────────────────────
            [$boId, 'ING-BO-001', 'Jojoba Oil',       'ml', 500.00, null],
            [$boId, 'ING-BO-002', 'Sweet Almond Oil', 'ml', 400.00, null],

            // ── Alcohol ───────────────────────────────────────────────────────
            [$alId, 'ING-AL-001', 'Ethanol 96%',              'ml',  50.00, null],
            [$alId, 'ING-AL-002', 'Dipropylene Glycol (DPG)', 'ml', 150.00, null],

            // ── Additives ─────────────────────────────────────────────────────
            [$adId, 'ING-ADD-001', 'Vitamin E Oil',   'ml',  2000.00, null],
            [$adId, 'ING-ADD-002', 'Fixative Powder', 'gr',   300.00, null],
        ];

        foreach ($ingredients as [$catId, $code, $name, $unit, $avgCost, $sellingPrice]) {
            DB::table('ingredients')->insert([
                'id'                     => Str::uuid(),
                'ingredient_category_id' => $catId,
                'code'                   => $code,
                'name'                   => $name,
                'unit'                   => $unit,
                'description'            => 'Standard ' . $name,
                'image'                  => null,
                'average_cost'           => $avgCost,
                'selling_price'          => $sellingPrice,
                'is_active'              => true,
                'created_at'             => $now,
                'updated_at'             => $now,
            ]);
        }

        $this->command->info('✓ Ingredients & Suppliers seeded (' . count($ingredients) . ' ingredients, 3 suppliers).');
    }
}
