<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Copy semua baris ingredients/ingredient_categories dan
 * packaging_materials/packaging_categories ke materials/material_categories,
 * MEMPERTAHANKAN id (uuid) asli supaya setiap FK yang sudah ada di tabel lain
 * (ingredient_id, packaging_material_id, dst) tetap menunjuk ke baris yang
 * benar setelah constraint-nya dialihkan (lihat migration repoint FK
 * berikutnya). Tabel sumber TIDAK dihapus di sini — baru dihapus setelah FK
 * selesai dialihkan (migration drop terakhir).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('material_categories')->insertUsing(
            ['id', 'material_type', 'code', 'name', 'description', 'ingredient_type', 'is_active', 'sort_order', 'created_at', 'updated_at'],
            DB::table('ingredient_categories')->select([
                'id',
                DB::raw("'bahan_baku' as material_type"),
                'code', 'name', 'description', 'ingredient_type', 'is_active', 'sort_order', 'created_at', 'updated_at',
            ])
        );

        DB::table('material_categories')->insertUsing(
            ['id', 'material_type', 'code', 'name', 'description', 'ingredient_type', 'is_active', 'sort_order', 'created_at', 'updated_at'],
            DB::table('packaging_categories')->select([
                'id',
                DB::raw("'bahan_kemasan' as material_type"),
                'code', 'name', 'description',
                DB::raw('NULL::varchar as ingredient_type'),
                'is_active', 'sort_order', 'created_at', 'updated_at',
            ])
        );

        DB::table('materials')->insertUsing(
            [
                'id', 'material_category_id', 'material_type', 'code', 'name', 'unit', 'description', 'image',
                'size_id', 'average_cost', 'selling_price',
                'is_available_as_addon', 'purchase_price', 'is_free', 'free_condition_note', 'is_assembly',
                'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ],
            DB::table('ingredients')->select([
                'id',
                'ingredient_category_id as material_category_id',
                DB::raw("'bahan_baku' as material_type"),
                'code', 'name', 'unit', 'description', 'image',
                DB::raw('NULL::uuid as size_id'),
                'average_cost', 'selling_price',
                DB::raw('true as is_available_as_addon'),
                DB::raw('NULL::numeric as purchase_price'),
                DB::raw('false as is_free'),
                DB::raw('NULL::varchar as free_condition_note'),
                DB::raw('false as is_assembly'),
                'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ])
        );

        DB::table('materials')->insertUsing(
            [
                'id', 'material_category_id', 'material_type', 'code', 'name', 'unit', 'description', 'image',
                'size_id', 'average_cost', 'selling_price',
                'is_available_as_addon', 'purchase_price', 'is_free', 'free_condition_note', 'is_assembly',
                'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ],
            DB::table('packaging_materials')->select([
                'id',
                'packaging_category_id as material_category_id',
                DB::raw("'bahan_kemasan' as material_type"),
                'code', 'name', 'unit', 'description', 'image',
                'size_id', 'average_cost', 'selling_price',
                'is_available_as_addon', 'purchase_price', 'is_free', 'free_condition_note', 'is_assembly',
                'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ])
        );
    }

    public function down(): void
    {
        DB::table('materials')->delete();
        DB::table('material_categories')->delete();
    }
};
