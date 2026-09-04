<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PackagingSeeder
 *
 * Sumber data: Sheet "PRODUK" (Botol & Produk Free) + "HARGA" — Varian Harumnya (1).xlsx
 *
 * Botol (harga jual add-on dari sheet HARGA):
 *   10 mL  → Roll On                  : Rp 3.000
 *   30 mL  → Lady / Prisma / Drop     : Rp 7.500
 *   50 mL  → Orion / Hexagon          : Rp 10.000
 *   100 mL → Persegi                  : Rp 15.000
 *
 * Produk Free:
 *   Plastic bag (KRS) — gratis
 */
class PackagingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Clear existing packaging data for clean, idempotent re-seeding
        DB::table('store_packaging_stocks')->delete();
        DB::table('warehouse_packaging_stocks')->delete();
        DB::table('materials')->where('material_type', 'bahan_kemasan')->delete();
        DB::table('material_categories')->where('material_type', 'bahan_kemasan')->delete();

        // ── CATEGORIES ────────────────────────────────────────────────────────
        $categories = [
            ['id' => Str::uuid(), 'code' => 'PC-001', 'name' => 'Botol',   'sort_order' => 1],
            ['id' => Str::uuid(), 'code' => 'PC-002', 'name' => 'Plastik', 'sort_order' => 2],
        ];

        foreach ($categories as $cat) {
            DB::table('material_categories')->insert([
                'id'            => $cat['id'],
                'material_type' => 'bahan_kemasan',
                'code'          => $cat['code'],
                'name'          => $cat['name'],
                'description'   => 'Kategori packaging ' . $cat['name'],
                'is_active'     => true,
                'sort_order'    => $cat['sort_order'],
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        [$botolCat, $plastikCat] = array_column($categories, 'id');

        // Map volume_ml → size_id agar botol tertaut ke ukuran (dipakai
        // untuk resolve botol otomatis saat reward parfum diklaim).
        $sizeIdByMl = DB::table('sizes')->pluck('id', 'volume_ml');

        // ── MATERIALS (sesuai Excel) ──────────────────────────────────────────
        // Format menyertakan is_free untuk produk gratis.
        $materials = [
            // Botol 10 mL
            ['cat' => $botolCat, 'code' => 'ROLL', 'name' => 'Botol Roll 10 ml',    'purchase' => 2000.00,  'selling' => 3000.00,  'addon' => true,  'sort' => 1,  'ml' => 10],
            // Botol 30 mL (Rp 7.500)
            ['cat' => $botolCat, 'code' => 'LD',   'name' => 'Botol Lady 30 ml',    'purchase' => 5600.00,  'selling' => 7500.00,  'addon' => true,  'sort' => 2,  'ml' => 30],
            ['cat' => $botolCat, 'code' => 'PRI',  'name' => 'Botol Prisma 30 ml',  'purchase' => 5600.00,  'selling' => 7500.00,  'addon' => true,  'sort' => 3,  'ml' => 30],
            ['cat' => $botolCat, 'code' => 'GD',   'name' => 'Botol Drop 30 ml',    'purchase' => 5600.00,  'selling' => 7500.00,  'addon' => true,  'sort' => 4,  'ml' => 30],
            // Botol 50 mL (Rp 10.000)
            ['cat' => $botolCat, 'code' => 'OR',   'name' => 'Botol Orion 50 ml',   'purchase' => 7500.00,  'selling' => 10000.00, 'addon' => true,  'sort' => 5,  'ml' => 50],
            ['cat' => $botolCat, 'code' => 'HEX',  'name' => 'Botol Hexagon 50 ml', 'purchase' => 7500.00,  'selling' => 10000.00, 'addon' => true,  'sort' => 6,  'ml' => 50],
            // Botol 100 mL (Rp 15.000)
            ['cat' => $botolCat, 'code' => 'PER',  'name' => 'Botol Persegi 100 ml','purchase' => 11000.00, 'selling' => 15000.00, 'addon' => true,  'sort' => 7,  'ml' => 100],

            // Produk Free — Plastic bag (kresek), gratis
            ['cat' => $plastikCat, 'code' => 'KRS', 'name' => 'Plastik Bag Kresek', 'purchase' => 500.00, 'selling' => 0.00, 'addon' => true, 'sort' => 1, 'free' => true],
        ];

        foreach ($materials as $item) {
            DB::table('materials')->insert([
                'id'                    => Str::uuid(),
                'material_category_id'  => $item['cat'],
                'material_type'         => 'bahan_kemasan',
                'unit'                  => 'pcs',
                'code'                  => $item['code'],
                'name'                  => $item['name'],
                'size_id'               => isset($item['ml']) ? ($sizeIdByMl[$item['ml']] ?? null) : null,
                'image'                 => null,
                'description'           => $item['name'],
                'is_available_as_addon' => $item['addon'],
                'purchase_price'        => $item['purchase'],
                'selling_price'         => $item['selling'],
                'average_cost'          => $item['purchase'],
                'is_active'             => true,
                'is_free'               => $item['free'] ?? false,
                'sort_order'            => $item['sort'],
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        $this->command->info('✓ Packaging seeded (' . count($materials) . ' materials: 7 botol + 1 free).');
    }
}
