<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Hapus tabel lama (ingredients, packaging_materials, ingredient_categories,
 * packaging_categories) — aman karena semua FK yang tadinya menunjuk ke
 * tabel-tabel ini sudah dialihkan ke materials/material_categories di
 * migration sebelumnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('ingredients');
        Schema::dropIfExists('packaging_materials');
        Schema::dropIfExists('ingredient_categories');
        Schema::dropIfExists('packaging_categories');
    }

    public function down(): void
    {
        Schema::create('ingredient_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('ingredient_type', ['oil', 'alcohol', 'other'])->default('other');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('ingredient_type');
            $table->index(['is_active', 'sort_order'], 'idx_ingcat_active_sort');
        });

        Schema::create('packaging_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order'], 'idx_pkgcat_active_sort');
        });

        Schema::create('ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ingredient_category_id');
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('unit', 50)->default('ml');
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('selling_price', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('ingredient_category_id')
                  ->references('id')->on('ingredient_categories')->onDelete('restrict');

            $table->index('ingredient_category_id');
            $table->index(['code', 'is_active']);
            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('packaging_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('packaging_category_id');
            $table->uuid('size_id')->nullable();
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('unit', 20)->default('pcs');
            $table->string('image', 500)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_available_as_addon')->default(true);
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->boolean('is_free')->default(false);
            $table->string('free_condition_note', 255)->nullable();
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->boolean('is_assembly')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('packaging_category_id')
                  ->references('id')->on('packaging_categories')->restrictOnDelete();
            $table->foreign('size_id')
                  ->references('id')->on('sizes')->nullOnDelete();

            $table->index('packaging_category_id');
            $table->index('size_id');
            $table->index('is_assembly');
            $table->index(['code', 'is_active'], 'idx_pkg_code_active');
            $table->index(['is_active', 'is_available_as_addon', 'sort_order'], 'idx_pkg_active_addon_sort');
            $table->index(['is_free', 'is_active'], 'idx_pkg_free_active');
        });

        DB::table('ingredient_categories')->insertUsing(
            ['id', 'code', 'name', 'description', 'ingredient_type', 'is_active', 'sort_order', 'created_at', 'updated_at'],
            DB::table('material_categories')->where('material_type', 'bahan_baku')->select([
                'id', 'code', 'name', 'description', 'ingredient_type', 'is_active', 'sort_order', 'created_at', 'updated_at',
            ])
        );

        DB::table('packaging_categories')->insertUsing(
            ['id', 'code', 'name', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at'],
            DB::table('material_categories')->where('material_type', 'bahan_kemasan')->select([
                'id', 'code', 'name', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at',
            ])
        );

        DB::table('ingredients')->insertUsing(
            ['id', 'ingredient_category_id', 'code', 'name', 'unit', 'description', 'image', 'average_cost', 'selling_price', 'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at'],
            DB::table('materials')->where('material_type', 'bahan_baku')->select([
                'id', 'material_category_id as ingredient_category_id', 'code', 'name', 'unit', 'description', 'image',
                'average_cost', 'selling_price', 'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ])
        );

        DB::table('packaging_materials')->insertUsing(
            ['id', 'packaging_category_id', 'size_id', 'code', 'name', 'unit', 'image', 'description', 'is_available_as_addon', 'purchase_price', 'selling_price', 'is_free', 'free_condition_note', 'average_cost', 'is_assembly', 'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at'],
            DB::table('materials')->where('material_type', 'bahan_kemasan')->select([
                'id', 'material_category_id as packaging_category_id', 'size_id', 'code', 'name', 'unit', 'image', 'description',
                'is_available_as_addon',
                DB::raw('coalesce(purchase_price, 0) as purchase_price'),
                DB::raw('coalesce(selling_price, 0) as selling_price'),
                'is_free', 'free_condition_note', 'average_cost', 'is_assembly', 'is_active', 'sort_order', 'created_at', 'updated_at', 'deleted_at',
            ])
        );
    }
};
