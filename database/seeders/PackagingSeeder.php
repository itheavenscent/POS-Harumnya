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

        // Clear existing packaging categories and materials to allow clean, idempotent re-seeding
        DB::table('store_packaging_stocks')->delete();
        DB::table('warehouse_packaging_stocks')->delete();
        DB::table('packaging_materials')->delete();
        DB::table('packaging_categories')->delete();

        /*
        |--------------------------------------------------------------------------
        | PACKAGING CATEGORIES
        |--------------------------------------------------------------------------
        */
        $categories = [
            ['id' => Str::uuid(), 'code' => 'PC-001', 'name' => 'Botol', 'sort_order' => 1],
            ['id' => Str::uuid(), 'code' => 'PC-002', 'name' => 'Gift Card', 'sort_order' => 2],
            ['id' => Str::uuid(), 'code' => 'PC-003', 'name' => 'Spunbond', 'sort_order' => 3],
            ['id' => Str::uuid(), 'code' => 'PC-004', 'name' => 'Tutup', 'sort_order' => 4],
            ['id' => Str::uuid(), 'code' => 'PC-005', 'name' => 'Ringspray', 'sort_order' => 5],
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
        [$botolCat, $giftCardCat, $spunbondCat, $tutupCat, $ringsprayCat] = array_column($categories, 'id');

        $materials = [
            // ── Botol Roll On 10ml ────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'ROLL',
                'name'                  => 'Botol Roll 10 ml',
                'purchase_price'        => 2000.00,   // estimasi HPP
                'selling_price'         => 3000.00,   // dari sheet HARGA
                'is_available_as_addon' => true,
                'sort_order'            => 0,
            ],
            // ── Botol 30ml — beberapa tipe, harga jual sama Rp 7.500 ─────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'LD',
                'name'                  => 'Botol Lady 30 ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => true,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PRI',
                'name'                  => 'Botol Prisma 30 ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => true,
                'sort_order'            => 2,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'GD',
                'name'                  => 'Botol Drop 30 ml',
                'purchase_price'        => 5600.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => true,
                'sort_order'            => 3,
            ],
            // ── Botol 50ml ────────────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'OR',
                'name'                  => 'Botol Orion 50 ml',
                'purchase_price'        => 7500.00,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 4,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'HEX',
                'name'                  => 'Botol Hexagon 50 ml',
                'purchase_price'        => 7500.00,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 5,
            ],
            // ── Botol 100ml ───────────────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PER',
                'name'                  => 'Botol Persegi 100 ml',
                'purchase_price'        => 11000.00,
                'selling_price'         => 15000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 6,
            ],

            // ── Spunbond (Add-on / Paid) ──────────────────────────────────────
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'PKG-SB-S',
                'name'                  => 'Spunbond Kecil',
                'purchase_price'        => 3000.00,
                'selling_price'         => 5000.00,
                'is_available_as_addon' => true,
                'is_free'               => false,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'PKG-SB-M',
                'name'                  => 'Spunbond Sedang',
                'purchase_price'        => 5000.00,
                'selling_price'         => 8000.00,
                'is_available_as_addon' => true,
                'is_free'               => false,
                'sort_order'            => 2,
            ],

            // ── Botol Brand Spesifik (dari Excel PERSEDIAAN HARUMNYA) ────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-PRADA30',
                'name'                  => 'Botol Prada Paradox 30ml',
                'purchase_price'        => 5250.00,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => true,
                'sort_order'            => 10,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-DELINA25',
                'name'                  => 'Botol Delina Doff 25ml',
                'purchase_price'        => 4433.33,
                'selling_price'         => 6000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 11,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-P10',
                'name'                  => 'Botol P10',
                'purchase_price'        => 1419.00,
                'selling_price'         => 2000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 12,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-ROGL-BOT',
                'name'                  => 'Botol Roll On 10ml Gold List',
                'purchase_price'        => 767.33,
                'selling_price'         => 1000.00,
                'is_available_as_addon' => false,
                'sort_order'            => 13,
            ],
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-ROGL-BALL',
                'name'                  => 'Roll On 10ml Gold List',
                'purchase_price'        => 767.33,
                'selling_price'         => 1000.00,
                'is_available_as_addon' => false,
                'sort_order'            => 14,
            ],
            // ── Botol J'Adore 30ml ───────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-JADORE-BOT',
                'name'                  => 'Botol J\'Adore 30ml',
                'purchase_price'        => 3155.97,
                'selling_price'         => 7500.00,
                'is_available_as_addon' => true,
                'sort_order'            => 15,
            ],
            // ── Botol Geurlain 100ml ─────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-GUER-BOT',
                'name'                  => 'Botol Geurlain 100ml',
                'purchase_price'        => 5665.53,
                'selling_price'         => 15000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 16,
            ],
            // ── Botol Gucci Floral 50ml ──────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-GUCCI-BOT',
                'name'                  => 'Botol Gucci Floral 50ml',
                'purchase_price'        => 4232.75,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 17,
            ],
            // ── Botol Xerjoff 50ml ───────────────────────────────────────────
            [
                'packaging_category_id' => $botolCat,
                'code'                  => 'PKG-XERJ-BOT',
                'name'                  => 'Botol Xerjoff 50ml',
                'purchase_price'        => 4123.56,
                'selling_price'         => 10000.00,
                'is_available_as_addon' => true,
                'sort_order'            => 18,
            ],

            // ── Tutup (dari Excel PERSEDIAAN HARUMNYA) ───────────────────────
            [
                'packaging_category_id' => $tutupCat,
                'code'                  => 'PKG-ROGL-TTP',
                'name'                  => 'Tutup Roll On 10ml Gold List',
                'purchase_price'        => 767.33,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $tutupCat,
                'code'                  => 'PKG-JADORE-TTP',
                'name'                  => 'Tutup J\'Adore 30ml',
                'purchase_price'        => 2610.22,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 2,
            ],
            [
                'packaging_category_id' => $tutupCat,
                'code'                  => 'PKG-GUER-TTP',
                'name'                  => 'Tutup Geurlain 100ml',
                'purchase_price'        => 4274.93,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 3,
            ],
            [
                'packaging_category_id' => $tutupCat,
                'code'                  => 'PKG-GUCCI-TTP',
                'name'                  => 'Tutup Gucci Floral 50ml',
                'purchase_price'        => 3517.65,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 4,
            ],
            [
                'packaging_category_id' => $tutupCat,
                'code'                  => 'PKG-XERJ-TTP',
                'name'                  => 'Tutup Xerjoff 50ml',
                'purchase_price'        => 3591.11,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 5,
            ],

            // ── Ringspray (dari Excel PERSEDIAAN HARUMNYA) ───────────────────
            [
                'packaging_category_id' => $ringsprayCat,
                'code'                  => 'PKG-JADORE-RS',
                'name'                  => 'Ringspray J\'Adore 30ml',
                'purchase_price'        => 2437.18,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 1,
            ],
            [
                'packaging_category_id' => $ringsprayCat,
                'code'                  => 'PKG-GUER-RS',
                'name'                  => 'Ringspray Geurlain 100ml',
                'purchase_price'        => 3987.21,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 2,
            ],
            [
                'packaging_category_id' => $ringsprayCat,
                'code'                  => 'PKG-GUCCI-RS',
                'name'                  => 'Ringspray Gucci Floral 50ml',
                'purchase_price'        => 3075.97,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 3,
            ],
            [
                'packaging_category_id' => $ringsprayCat,
                'code'                  => 'PKG-XERJ-RS',
                'name'                  => 'Ringspray Xerjoff 50ml',
                'purchase_price'        => 2620.17,
                'selling_price'         => 0.00,
                'is_available_as_addon' => false,
                'sort_order'            => 4,
            ],

            // ── Free / Promo Packaging ──────────────────────────────────────
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'SBM',
                'name'                  => 'Spunbond',
                'purchase_price'        => 1500.00,
                'selling_price'         => 0.00,
                'is_available_as_addon' => true,
                'is_free'               => true,
                'sort_order'            => 4,
            ],
            [
                'packaging_category_id' => $spunbondCat,
                'code'                  => 'KRS',
                'name'                  => 'Plastik bag',
                'purchase_price'        => 500.00,
                'selling_price'         => 0.00,
                'is_available_as_addon' => true,
                'is_free'               => true,
                'sort_order'            => 5,
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
                'is_free'               => $item['is_free'] ?? false,
                'sort_order'            => $item['sort_order'],
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        $this->command->info('✓ Packaging seeded (' . count($materials) . ' materials).');
    }
}
