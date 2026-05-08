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

        // FIX: truncate() gagal karena ada FK dari stores.store_category_id.
        // Harus lepas FK dulu, atau pakai delete() dengan urutan yang benar.
        // Paling aman: pakai updateOrInsert agar idempotent tanpa truncate.

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

        // Resolve actual IDs (pakai updateOrInsert agar idempotent)
        $resolvedIds = [];
        foreach ($categories as $cat) {
            $existing = DB::table('store_categories')->where('code', $cat['code'])->first();
            $id = $existing ? $existing->id : $cat['id'];

            DB::table('store_categories')->updateOrInsert(
                ['code' => $cat['code']],
                [
                    'id'                 => $id,
                    'name'               => $cat['name'],
                    'description'        => $cat['description'],
                    'allow_all_variants' => $cat['allow_all_variants'],
                    'sort_order'         => $cat['sort_order'],
                    'is_active'          => true,
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]
            );

            $resolvedIds[$cat['code']] = DB::table('store_categories')->where('code', $cat['code'])->value('id');
        }

        $catL = $resolvedIds['L'];
        $catM = $resolvedIds['M'];
        $catS = $resolvedIds['S'];

        // ── Assign semua toko ke kategori M (default) ─────────────────────────
        DB::table('stores')
            ->whereIn('code', ['STR-JOMBANG1', 'STR-JOMBANG2', 'STR-JOMBANG3'])
            ->update(['store_category_id' => $catM, 'updated_at' => $now]);

        // ── Store Category Variants ───────────────────────────────────────────
        $variants = DB::table('variants')->where('is_active', true)->get();

        if ($variants->isEmpty()) {
            $this->command->warn('Variants belum ada. Store category variants tidak di-seed.');
            return;
        }

        foreach ($variants as $variant) {
            // Kategori M: semua variant aktif
            DB::table('store_category_variants')->updateOrInsert(
                ['store_category_id' => $catM, 'variant_id' => $variant->id],
                [
                    'id'                => Str::uuid(),
                    'store_category_id' => $catM,
                    'variant_id'        => $variant->id,
                    'is_active'         => true,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]
            );
        }

        // Kategori S: hanya 4 variant pertama
        $limitedVariants = DB::table('variants')->where('is_active', true)->orderBy('created_at')->limit(4)->get();
        foreach ($limitedVariants as $variant) {
            DB::table('store_category_variants')->updateOrInsert(
                ['store_category_id' => $catS, 'variant_id' => $variant->id],
                [
                    'id'                => Str::uuid(),
                    'store_category_id' => $catS,
                    'variant_id'        => $variant->id,
                    'is_active'         => true,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]
            );
        }

        // Kategori L: allow_all_variants=true, tidak perlu whitelist
        $this->command->info('✓ Store categories seeded (L/M/S). Semua toko → kategori M.');
    }
}
