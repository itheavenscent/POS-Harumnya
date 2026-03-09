<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Clear existing data to prevent duplicates if running multiple times
        DB::table('store_categories')->truncate();
        DB::table('store_category_variants')->truncate();
        // Note: We don't truncate 'stores' table as it's seeded by WarehouseStoreSeeder

        // ── STORE CATEGORIES ───────────────────────────────────────────────────
        $categories = [
            [
                'id'                 => Str::uuid()->toString(),
                'code'               => 'L',
                'name'               => 'Large',
                'description'        => 'Toko besar — semua varian tersedia',
                'allow_all_variants' => true,
                'sort_order'         => 1,
            ],
            [
                'id'                 => Str::uuid()->toString(),
                'code'               => 'M',
                'name'               => 'Medium',
                'description'        => 'Toko medium — varian pilihan',
                'allow_all_variants' => false,
                'sort_order'         => 2,
            ],
            [
                'id'                 => Str::uuid()->toString(),
                'code'               => 'S',
                'name'               => 'Small',
                'description'        => 'Toko kecil — varian terbatas',
                'allow_all_variants' => false,
                'sort_order'         => 3,
            ],
        ];

        foreach ($categories as $cat) {
            DB::table('store_categories')->insert([
                'id'                 => $cat['id'],
                'code'               => $cat['code'],
                'name'               => $cat['name'],
                'description'        => $cat['description'],
                'allow_all_variants' => $cat['allow_all_variants'],
                'sort_order'         => $cat['sort_order'],
                'is_active'          => true,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);
        }

        // ── ASSIGN STORE CATEGORIES TO STORES ──────────────────────────────────
        // Semua toko (Lamongan, Gresik, Jombang) = Medium
        $catM = $categories[1]['id']; // Ambil ID kategori Medium

        // Update semua toko agar memiliki store_category_id = $catM (Medium)
        DB::table('stores')
            ->whereIn('code', ['STR001', 'STR002', 'STR003']) // Sesuaikan dengan kode toko yang Anda gunakan
            ->update(['store_category_id' => $catM, 'updated_at' => $now]);

        // ── STORE CATEGORY VARIANTS (whitelist untuk kategori M & S) ──────────
        // Kategori L allow_all_variants=true, tidak perlu whitelist
        // Kategori M: whitelist semua variant yang ada (sebagai contoh)
        $variants = DB::table('variants')->where('is_active', true)->get();

        foreach ($variants as $variant) {
            // Medium: semua variant aktif (contoh whitelist lengkap)
            DB::table('store_category_variants')->insert([
                'id'                 => Str::uuid(),
                'store_category_id'  => $catM,
                'variant_id'         => $variant->id,
                'is_active'          => true,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);
        }

        // Small: hanya 4 variant pertama
        $limitedVariants = DB::table('variants')->where('is_active', true)->limit(4)->get();
        foreach ($limitedVariants as $variant) {
            DB::table('store_category_variants')->insert([
                'id'                 => Str::uuid(),
                'store_category_id'  => $categories[2]['id'], // ID kategori Small
                'variant_id'         => $variant->id,
                'is_active'          => true,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);
        }

        $this->command->info('Store categories seeded.');
    }
}
