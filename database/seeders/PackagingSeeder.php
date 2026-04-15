<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PackagingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        /*
        |--------------------------------------------------------------------------
        | PACKAGING CATEGORIES
        |--------------------------------------------------------------------------
        */
        $categories = [
            ['id' => Str::uuid(), 'code' => 'PC-001', 'name' => 'Botol', 'sort_order' => 1],
            ['id' => Str::uuid(), 'code' => 'PC-002', 'name' => 'Paper Bag', 'sort_order' => 2],
            ['id' => Str::uuid(), 'code' => 'PC-003', 'name' => 'Gift Card', 'sort_order' => 3],
        ];

        foreach ($categories as $cat) {
            DB::table('packaging_categories')->insert([
                'id' => $cat['id'],
                'code' => $cat['code'],
                'name' => $cat['name'],
                'description' => 'Kategori untuk packaging ' . $cat['name'],
                'is_active' => true,
                'sort_order' => $cat['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | PACKAGING MATERIALS
        |--------------------------------------------------------------------------
        | Sumber: Sheet "Material & Packing" HPP_Harumnya.xlsx
        |
        | Botol — Rata-rata harga dari beberapa tipe botol yang dipakai:
        |   30 mL → Rata-rata (Delina 5300 + Prada 4250 + J'Adore 8200) = 5,916.67
        |   50 mL → Rata-rata (Xerjoff 8660 + Gucci Flora 9825) = 9,242.5
        |   100 mL → Guerlain = 12,553
        |--------------------------------------------------------------------------
        */
        $botolCat = $categories[0]['id'];
        $paperBagCat = $categories[1]['id'];
        $giftCardCat = $categories[2]['id'];

        $materials = [
            // ── Botol ─────────────────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code' => 'PKG-BOT-30',
                'name' => 'Botol Spray 30ml',
                'purchase_price' => 5916.67,  // rata-rata dari excel: (5300+4250+8200)/3
                'selling_price' => 0,
                'is_available_as_addon' => false,
                'sort_order' => 1,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code' => 'PKG-BOT-50',
                'name' => 'Botol Spray 50ml',
                'purchase_price' => 9242.50,  // rata-rata dari excel: (8660+9825)/2
                'selling_price' => 0,
                'is_available_as_addon' => false,
                'sort_order' => 2,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code' => 'PKG-BOT-100',
                'name' => 'Botol Spray 100ml',
                'purchase_price' => 12553.00,  // dari excel: Guerlain 12553
                'selling_price' => 0,
                'is_available_as_addon' => false,
                'sort_order' => 3,
            ],

            // ── Paper Bag (Add-on) ────────────────────────────────────────────
            [
                'packaging_category_id' => $paperBagCat,
                'code' => 'PKG-PB-S',
                'name' => 'Paper Bag Small - Premium',
                'purchase_price' => 3000,
                'selling_price' => 5000,
                'is_available_as_addon' => true,
                'sort_order' => 1,
            ],
            [
                'packaging_category_id' => $paperBagCat,
                'code' => 'PKG-PB-M',
                'name' => 'Paper Bag Medium - Premium',
                'purchase_price' => 5000,
                'selling_price' => 8000,
                'is_available_as_addon' => true,
                'sort_order' => 2,
            ],

            // ── Gift Card (Add-on) ────────────────────────────────────────────
            [
                'packaging_category_id' => $giftCardCat,
                'code' => 'PKG-GC-STD',
                'name' => 'Gift Card Standard',
                'purchase_price' => 2000,
                'selling_price' => 5000,
                'is_available_as_addon' => true,
                'sort_order' => 1,
            ],
            [
                'packaging_category_id' => $giftCardCat,
                'code' => 'PKG-GC-PRM',
                'name' => 'Gift Card Premium - Embossed',
                'purchase_price' => 5000,
                'selling_price' => 10000,
                'is_available_as_addon' => true,
                'sort_order' => 2,
            ],
        ];

        foreach ($materials as $item) {
            DB::table('packaging_materials')->insert([
                'id' => Str::uuid(),
                'packaging_category_id' => $item['packaging_category_id'],
                'unit' => 'pcs',
                'code' => $item['code'],
                'name' => $item['name'],
                'size_id' => null,
                'image' => null,
                'description' => 'Deskripsi untuk ' . $item['name'],
                'is_available_as_addon' => $item['is_available_as_addon'],
                'purchase_price' => $item['purchase_price'],
                'selling_price' => $item['selling_price'],
                'average_cost' => $item['purchase_price'],
                'is_active' => true,
                'sort_order' => $item['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info('✓ Packaging seeded (' . count($materials) . ' materials).');
    }
}