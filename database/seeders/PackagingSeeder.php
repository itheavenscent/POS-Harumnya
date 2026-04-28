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
            ['id' => Str::uuid(), 'code' => 'PC-004', 'name' => 'Spunbond', 'sort_order' => 4],
        ];

        foreach ($categories as $cat) {
            DB::table('packaging_categories')->insert([
                'id'          => $cat['id'],
                'code'        => $cat['code'],
                'name'        => $cat['name'],
                'description' => 'Kategori untuk packaging ' . $cat['name'],
                'is_active'   => true,
                'sort_order'  => $cat['sort_order'],
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | PACKAGING MATERIALS
        |--------------------------------------------------------------------------
        | Sumber: Sheet "HARGA" & "PRODUK" — Varian_Harumnya.xlsx (versi terbaru)
        |
        | Botol — Harga jual per tipe botol:
        |   10 mL → Roll On      : jual Rp 3.000
        |   30 mL → Lady/Prisma/Golden Drop : jual Rp 7.500
        |   50 mL → Orion/Hexagon           : jual Rp 10.000
        |   100 mL → Persegi                : jual Rp 15.000
        |
        | Purchase price estimasi ~75% dari harga jual (HPP botol tidak tercantum
        | eksplisit di sheet HARGA, hanya harga jual add-on):
        |   30 mL → purchase ~5.600  (avg dari PDM Delina/Prada/J'Adore di versi lama → round ke 7500 jual)
        |   50 mL → purchase ~7.500
        |   100 mL → purchase ~11.000
        |--------------------------------------------------------------------------
        */
        [$botolCat, $paperBagCat, $giftCardCat, $spunbondCat] = array_column($categories, 'id');

        $materials = [
            // ── Botol Roll On 10ml ────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-ROLL',
                'name'                  => 'Botol Roll On 10ml',
                'purchase_price'        => 2000.00,   // estimasi HPP
                'selling_price'         => 3000.00,   // dari sheet HARGA
                'is_available_as_addon' => true,
                'sort_order'            => 0,
            ],
            // ── Botol 30ml — beberapa tipe, harga jual sama Rp 7.500 ─────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-LD',
                'name'                  => 'Botol Lady 30ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => false,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-PRI',
                'name'                  => 'Botol Prisma 30ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => false,
                'sort_order'            => 2,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-GD',
                'name'                  => 'Botol Golden Drop 30ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => false,
                'sort_order'            => 3,
            ],
            // ── Botol 50ml ────────────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-OR',
                'name'                  => 'Botol Orion 50ml',
                'purchase_price'        => 7500.00,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => false,
                'sort_order'            => 4,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-HEX',
                'name'                  => 'Botol Hexagon 50ml',
                'purchase_price'        => 7500.00,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => false,
                'sort_order'            => 5,
            ],
            // ── Botol 100ml ───────────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-BOT-PER',
                'name'                  => 'Botol Persegi 100ml',
                'purchase_price'        => 11000.00,
                'selling_price'         => 15000.00,
                'is_available_as_addon' => false,
                'sort_order'            => 6,
            ],

            // ── Paper Bag (Add-on) ────────────────────────────────────────────
            [
                'packaging_category_id' => $paperBagCat,
                'code'                  => 'PKG-PB-S',
                'name'                  => 'Paper Bag Small - Premium',
                'purchase_price'        => 3000.00,
                'selling_price'         => 5000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $paperBagCat,
                'code'                  => 'PKG-PB-M',
                'name'                  => 'Paper Bag Medium - Premium',
                'purchase_price'        => 5000.00,
                'selling_price'         => 8000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 2,
            ],

            // ── Gift Card (Add-on) ────────────────────────────────────────────
            [
                'packaging_category_id' => $giftCardCat,
                'code'                  => 'PKG-GC-STD',
                'name'                  => 'Gift Card Standard',
                'purchase_price'        => 2000.00,
                'selling_price'         => 5000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $giftCardCat,
                'code'                  => 'PKG-GC-PRM',
                'name'                  => 'Gift Card Premium - Embossed',
                'purchase_price'        => 5000.00,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 2,
            ],

            // ── Spunbond (Produk Free / Promo) ────────────────────────────────
            // Sumber: Sheet "PRODUK" → Produk Free: Spunbond Kecil (SBM) & Besar (SBL)
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'PKG-SBM',
                'name'                  => 'Spunbond Kecil',
                'purchase_price'        => 1500.00,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'PKG-SBL',
                'name'                  => 'Spunbond Besar',
                'purchase_price'        => 2500.00,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 2,
            ],
        ];

        foreach ($materials as $item) {
            DB::table('packaging_materials')->insert([
                'id'                    => Str::uuid(),
                'packaging_category_id' => $item['packaging_category_id'],
                'unit'                  => 'pcs',
                'code'                  => $item['code'],
                'name'                  => $item['name'],
                'size_id'               => null,
                'image'                 => null,
                'description'           => 'Deskripsi untuk ' . $item['name'],
                'is_available_as_addon' => $item['is_available_as_addon'],
                'purchase_price'        => $item['purchase_price'],
                'selling_price'         => $item['selling_price'],
                'average_cost'          => $item['purchase_price'],
                'is_active'             => true,
                'sort_order'            => $item['sort_order'],
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        $this->command->info('✓ Packaging seeded (' . count($materials) . ' materials).');
    }
}
