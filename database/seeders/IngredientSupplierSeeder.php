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
            ['id' => Str::uuid()->toString(), 'code' => 'IC-001', 'name' => 'Fragrance Oil (Wanita)', 'ingredient_type' => 'oil', 'sort_order' => 1],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-002', 'name' => 'Fragrance Oil (Pria)', 'ingredient_type' => 'oil', 'sort_order' => 2],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-003', 'name' => 'DPG (Pelarut Oil)', 'ingredient_type' => 'other', 'sort_order' => 3],
            ['id' => Str::uuid()->toString(), 'code' => 'IC-004', 'name' => 'Alcohol', 'ingredient_type' => 'alcohol', 'sort_order' => 4],
        ];

        foreach ($categories as $cat) {
            DB::table('ingredient_categories')->insert([
                'id' => $cat['id'],
                'code' => $cat['code'],
                'name' => $cat['name'],
                'description' => 'Kategori untuk ' . $cat['name'],
                'ingredient_type' => $cat['ingredient_type'],
                'is_active' => true,
                'sort_order' => $cat['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── SUPPLIERS ─────────────────────────────────────────────────────────
        DB::table('suppliers')->insert([
            [
                'id' => Str::uuid(),
                'code' => 'SUP-001',
                'name' => 'PT Aroma Nusantara',
                'contact_person' => 'Pak Budi',
                'phone' => '021-11112222',
                'email' => 'sales@aromanusantara.com',
                'address' => 'Jl. Industri Aroma No. 10, Jakarta',
                'payment_term' => 'credit_30',
                'credit_limit' => 50000000.00,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'SUP-002',
                'name' => 'CV Wangi Sejahtera',
                'contact_person' => 'Ibu Sari',
                'phone' => '021-33334444',
                'email' => 'order@wangisejahtera.com',
                'address' => 'Jl. Fragrance No. 25, Tangerang',
                'payment_term' => 'credit_14',
                'credit_limit' => 25000000.00,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'SUP-003',
                'name' => 'Toko Kimia Jaya',
                'contact_person' => 'Pak Herman',
                'phone' => '021-55556666',
                'email' => 'info@kimiajaya.com',
                'address' => 'Jl. Kimia Raya No. 88, Bekasi',
                'payment_term' => 'cash',
                'credit_limit' => 0.00,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // ── INGREDIENTS ───────────────────────────────────────────────────────
        // Sumber: Sheet "Varian Oil" HPP_Harumnya.xlsx
        // Harga per mL dihitung dari Harga/1Kg ÷ 1000
        // Kategori: IC-001 = Fragrance Oil Wanita, IC-002 = Fragrance Oil Pria
        //           IC-003 = DPG, IC-004 = Alcohol 99%

        [$foWId, $foMId, $dpgId, $alcId] = array_column($categories, 'id');

        // Format: [category_id, code, name, unit, average_cost_per_ml]
        // average_cost = Harga/1Kg ÷ 1000 (konversi ke per mL)
        $ingredients = [

            // ── Fragrance Oil — Wanita (Sumber: kolom Cewek, sheet Varian Oil) ──
            [$foWId, 'ING-FO-W001', 'Si Fiori FO', 'ml', round(1329101 / 1000, 4)],
            [$foWId, 'ING-FO-W002', 'Vanilla Candy Rock FO', 'ml', round(1446374 / 1000, 4)],
            [$foWId, 'ING-FO-W003', 'Black Opium Over Red FO', 'ml', round(1412197 / 1000, 4)],
            [$foWId, 'ING-FO-W004', 'Born In Roma Green FO', 'ml', round(1412197 / 1000, 4)],
            [$foWId, 'ING-FO-W005', 'Bombshell Escape FO', 'ml', round(1301737 / 1000, 4)],
            [$foWId, 'ING-FO-W006', 'Her Intense FO', 'ml', round(1277996 / 1000, 4)],
            [$foWId, 'ING-FO-W007', 'Libre FO', 'ml', round(1007716 / 1000, 4)],
            [$foWId, 'ING-FO-W008', 'White Musk FO', 'ml', round(1052595 / 1000, 4)],
            [$foWId, 'ING-FO-W009', 'Omnia Amethyste FO', 'ml', round(955075 / 1000, 4)],
            [$foWId, 'ING-FO-W010', 'Fame FO', 'ml', round(908483 / 1000, 4)],
            [$foWId, 'ING-FO-W011', 'Scandalous FO', 'ml', round(915713 / 1000, 4)],
            [$foWId, 'ING-FO-W012', 'Baccarat Rouge FO', 'ml', round(905726 / 1000, 4)],
            [$foWId, 'ING-FO-W013', 'Eden Sparkling FO', 'ml', round(881499 / 1000, 4)],
            [$foWId, 'ING-FO-W014', 'Coconut Passion FO', 'ml', round(742900 / 1000, 4)],
            [$foWId, 'ING-FO-W015', 'Bombshell FO', 'ml', round(710739 / 1000, 4)],
            [$foWId, 'ING-FO-W016', 'Perfect FO', 'ml', round(782824 / 1000, 4)],
            [$foWId, 'ING-FO-W017', 'Bubble Bath FO', 'ml', round(782555 / 1000, 4)],
            [$foWId, 'ING-FO-W018', 'Scarlet Poppy FO', 'ml', round(788998 / 1000, 4)],
            [$foWId, 'ING-FO-W019', 'Noble FO', 'ml', round(585973 / 1000, 4)],
            [$foWId, 'ING-FO-W020', 'My Way FO', 'ml', round(668376 / 1000, 4)],
            [$foWId, 'ING-FO-W021', 'Bloom FO', 'ml', round(701601 / 1000, 4)],
            [$foWId, 'ING-FO-W022', 'Coffee Break FO', 'ml', round(674616 / 1000, 4)],
            [$foWId, 'ING-FO-W023', 'Euphoria FO', 'ml', round(648337 / 1000, 4)],
            [$foWId, 'ING-FO-W024', 'Eros Flame FO', 'ml', round(641829 / 1000, 4)],
            [$foWId, 'ING-FO-W025', 'Black Opium FO', 'ml', round(704999 / 1000, 4)],
            [$foWId, 'ING-FO-W026', 'Cloud Pink FO', 'ml', round(620647 / 1000, 4)],
            [$foWId, 'ING-FO-W027', 'Good Girl FO', 'ml', round(620647 / 1000, 4)],
            [$foWId, 'ING-FO-W028', 'Goddess FO', 'ml', round(602657 / 1000, 4)],
            [$foWId, 'ING-FO-W029', 'Vanilla Rose FO', 'ml', round(579050 / 1000, 4)],
            [$foWId, 'ING-FO-W030', 'My Way Nectar FO', 'ml', round(1114351 / 1000, 4)],
            [$foWId, 'ING-FO-W031', 'Scandal FO', 'ml', round(569467 / 1000, 4)],
            [$foWId, 'ING-FO-W032', 'Miss Dior FO', 'ml', round(557683 / 1000, 4)],
            [$foWId, 'ING-FO-W033', 'Blooming Bouquet FO', 'ml', round(604285 / 1000, 4)],
            [$foWId, 'ING-FO-W034', 'Her FO', 'ml', round(576818 / 1000, 4)],
            [$foWId, 'ING-FO-W035', 'Good Girl Blush FO', 'ml', round(539693 / 1000, 4)],
            [$foWId, 'ING-FO-W036', 'Idol Nectar FO', 'ml', round(512740 / 1000, 4)],
            [$foWId, 'ING-FO-W037', 'JME Persia IBC CV FO', 'ml', round(758000 / 1000, 4)],
            [$foWId, 'ING-FO-W038', 'Poppy CV FO', 'ml', round(737000 / 1000, 4)],
            [$foWId, 'ING-FO-W039', 'Nagita CV FO', 'ml', round(314000 / 1000, 4)],
            [$foWId, 'ING-FO-W040', 'Twilly CV FO', 'ml', round(650000 / 1000, 4)],
            [$foWId, 'ING-FO-W041', 'Green Tea CV FO', 'ml', round(274000 / 1000, 4)],
            [$foWId, 'ING-FO-W042', 'Morning Tea CV FO', 'ml', round(449000 / 1000, 4)],
            [$foWId, 'ING-FO-W043', 'Flora Gucci FO', 'ml', round(600000 / 1000, 4)],
            [$foWId, 'ING-FO-W044', 'Tease FO', 'ml', round(695000 / 1000, 4)],
            [$foWId, 'ING-FO-W045', 'Eau Capitale FO', 'ml', round(1086000 / 1000, 4)],
            [$foWId, 'ING-FO-W046', 'Flight Of Fancy FO', 'ml', round(357000 / 1000, 4)],
            [$foWId, 'ING-FO-W047', 'Coco Mademoiselle FO', 'ml', round(350000 / 1000, 4)],
            [$foWId, 'ING-FO-W048', 'Jmp Peony Blush FO', 'ml', round(313000 / 1000, 4)],
            [$foWId, 'ING-FO-W049', 'Nomadian (Chloe Nomade) FO', 'ml', round(1330000 / 1000, 4)],
            [$foWId, 'ING-FO-W050', 'No. 5 FO', 'ml', round(338000 / 1000, 4)],
            [$foWId, 'ING-FO-W051', 'Delina FO', 'ml', round(283000 / 1000, 4)],
            [$foWId, 'ING-FO-W052', 'Flora Gucci (Premium) FO', 'ml', round(1402700 / 1000, 4)],
            [$foWId, 'ING-FO-W053', 'Pink Chiffon SS FO', 'ml', round(823200 / 1000, 4)],
            [$foWId, 'ING-FO-W054', 'Viva La Juicy LZ FO', 'ml', round(850000 / 1000, 4)],
            [$foWId, 'ING-FO-W055', 'Incanto Shine FO', 'ml', round(793500 / 1000, 4)],
            [$foWId, 'ING-FO-W056', 'Cherry In The Air FO', 'ml', round(585349 / 1000, 4)],
            [$foWId, 'ING-FO-W057', 'Orchid FO', 'ml', round(645237 / 1000, 4)],
            [$foWId, 'ING-FO-W058', 'Romantic Wish FO', 'ml', round(463542 / 1000, 4)],
            [$foWId, 'ING-FO-W059', 'Blanche FO', 'ml', round(904200 / 1000, 4)],

            // ── Fragrance Oil — Pria (Sumber: kolom Cowok, sheet Varian Oil) ────
            [$foMId, 'ING-FO-M001', 'One Million Lucky FO', 'ml', round(850966 / 1000, 4)],
            [$foMId, 'ING-FO-M002', 'Blue Seduction FO', 'ml', round(1147500 / 1000, 4)],
            [$foMId, 'ING-FO-M003', 'Bleu De Chanel FO', 'ml', round(1172475 / 1000, 4)],
            [$foMId, 'ING-FO-M004', 'Halloween Man X FO', 'ml', round(819216 / 1000, 4)],
            [$foMId, 'ING-FO-M005', 'Sauvage FO', 'ml', round(1030031 / 1000, 4)],
            [$foMId, 'ING-FO-M006', 'Blue Emotion FO', 'ml', round(978142 / 1000, 4)],
            [$foMId, 'ING-FO-M007', 'Black Opium Men FO', 'ml', round(813342 / 1000, 4)],
            [$foMId, 'ING-FO-M008', 'My Self FO', 'ml', round(903082 / 1000, 4)],
            [$foMId, 'ING-FO-M009', 'Eros FO', 'ml', round(837292 / 1000, 4)],
            [$foMId, 'ING-FO-M010', 'Santal 33 FO', 'ml', round(754783 / 1000, 4)],
            [$foMId, 'ING-FO-M011', 'Y FO', 'ml', round(668376 / 1000, 4)],
            [$foMId, 'ING-FO-M012', 'The Most Wanted FO', 'ml', round(749622 / 1000, 4)],
            [$foMId, 'ING-FO-M013', 'Hero FO', 'ml', round(724625 / 1000, 4)],
            [$foMId, 'ING-FO-M014', 'Desire Blue FO', 'ml', round(653217 / 1000, 4)],
            [$foMId, 'ING-FO-M015', 'One Million Royal FO', 'ml', round(665621 / 1000, 4)],
            [$foMId, 'ING-FO-M016', 'Wood Sage & Salt FO', 'ml', round(672954 / 1000, 4)],
            [$foMId, 'ING-FO-M017', 'Scandal Men FO', 'ml', round(560573 / 1000, 4)],
            [$foMId, 'ING-FO-M018', 'Stronger With You FO', 'ml', round(501000 / 1000, 4)],
            [$foMId, 'ING-FO-M019', 'Tobacco FO', 'ml', round(359000 / 1000, 4)],
            [$foMId, 'ING-FO-M020', 'CDI Aventuro FO', 'ml', round(858000 / 1000, 4)],
            [$foMId, 'ING-FO-M021', 'Svg Elixir FO', 'ml', round(600000 / 1000, 4)],
            [$foMId, 'ING-FO-M022', 'Homme FO', 'ml', round(307000 / 1000, 4)],
            [$foMId, 'ING-FO-M023', 'Black Aigner FO', 'ml', round(672000 / 1000, 4)],
            [$foMId, 'ING-FO-M024', 'Creed Aventus FO', 'ml', round(850000 / 1000, 4)],

            // ── DPG (Dipropylene Glycol) — pelarut fragrance oil ──────────────
            // Sumber: Sheet "Material & Packing" → 1 L DPG = Rp 47,500 → Rp 47.5/ml
            [$dpgId, 'ING-DPG-001', 'Dipropylene Glycol (DPG)', 'ml', 47.5000],

            // ── Alcohol 99% — pelarut ─────────────────────────────────────────
            // Sumber: Sheet "Material & Packing" → Alcohol (99%) = Rp 19.6/ml
            [$alcId, 'ING-AL-001', 'Ethanol 99%', 'ml', 19.6000],
        ];

        foreach ($ingredients as [$catId, $code, $name, $unit, $avgCost]) {
            DB::table('ingredients')->insert([
                'id' => Str::uuid(),
                'ingredient_category_id' => $catId,
                'code' => $code,
                'name' => $name,
                'unit' => $unit,
                'description' => 'Standard ' . $name,
                'image' => null,
                'average_cost' => $avgCost,
                'selling_price' => null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info('✓ Ingredients & Suppliers seeded (' . count($ingredients) . ' ingredients, 3 suppliers).');
    }
}