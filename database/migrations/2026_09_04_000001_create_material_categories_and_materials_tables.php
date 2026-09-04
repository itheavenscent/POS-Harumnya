<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MERGE: Ingredient (bahan baku) + Packaging (bahan kemasan) → Material
 *
 * `material_categories` menggabungkan ingredient_categories + packaging_categories.
 * `materials` menggabungkan ingredients + packaging_materials.
 *
 * `material_type` (bahan_baku | bahan_kemasan) adalah diskriminator utama.
 * Kolom yang dulunya khusus packaging (size_id, purchase_price, is_free,
 * free_condition_note, is_available_as_addon, is_assembly) tetap ada tapi
 * hanya relevan/terisi untuk material_type = bahan_kemasan.
 * `ingredient_type` di material_categories hanya relevan untuk bahan_baku
 * (dipakai scaling resep varian & resolusi custom order oil/alcohol).
 *
 * Data lama dipindahkan (migration berikutnya) dengan ID (uuid) yang
 * DIPERTAHANKAN — semua FK existing (ingredient_id, packaging_material_id,
 * dkk di tabel lain) tetap valid tanpa perlu ditulis ulang, hanya target
 * constraint-nya yang dialihkan ke tabel ini (lihat migration repoint FK).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('material_type', ['bahan_baku', 'bahan_kemasan']);
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('ingredient_type', ['oil', 'alcohol', 'other'])->nullable()
                  ->comment('Hanya relevan untuk material_type=bahan_baku. Mapping scaling: oil=fragrance oil, alcohol=ethanol/isopropyl, other=air suling/fixative');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('material_type');
            $table->index('ingredient_type');
            $table->index(['is_active', 'sort_order'], 'idx_matcat_active_sort');
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('material_category_id');
            $table->enum('material_type', ['bahan_baku', 'bahan_kemasan']);

            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('unit', 50)->default('pcs')
                  ->comment('Satuan: ml, gr, kg, liter, pcs');
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();

            // Hanya relevan untuk bahan_kemasan (dulu packaging_materials.size_id)
            $table->uuid('size_id')->nullable()
                  ->comment('Untuk material bahan_kemasan size-specific (botol, tutup)');

            $table->decimal('average_cost', 15, 4)->default(0)
                  ->comment('WAC per unit; auto-update tiap pembelian masuk');
            $table->decimal('selling_price', 15, 2)->nullable()
                  ->comment('bahan_baku: basis harga custom order (oil_qty × selling_price), nullable jika tidak dijual langsung. bahan_kemasan: harga jual add-on POS.');

            // Kolom khusus bahan_kemasan
            $table->boolean('is_available_as_addon')->default(true)
                  ->comment('bahan_kemasan: tampil di tab Kemasan POS sebagai pilihan add-on');
            $table->decimal('purchase_price', 15, 2)->nullable()
                  ->comment('bahan_kemasan: harga beli standar/list price — referensi, bukan WAC');
            $table->boolean('is_free')->default(false)
                  ->comment('bahan_kemasan: true = gratis ke customer; average_cost tetap dihitung untuk COGS');
            $table->string('free_condition_note', 255)->nullable();
            $table->boolean('is_assembly')->default(false)
                  ->comment('bahan_kemasan: true = kemasan rakitan (stok dihitung dari komponen BOM di material_recipes)');

            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('material_category_id')
                  ->references('id')->on('material_categories')
                  ->onDelete('restrict');
            $table->foreign('size_id')
                  ->references('id')->on('sizes')->nullOnDelete();

            $table->index('material_category_id');
            $table->index('material_type');
            $table->index('size_id');
            $table->index('is_assembly');
            $table->index(['code', 'is_active']);
            $table->index(['is_active', 'sort_order']);
            $table->index(['is_free', 'is_active']);
            $table->index(['is_active', 'is_available_as_addon', 'sort_order'], 'idx_mat_active_addon_sort');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
        Schema::dropIfExists('material_categories');
    }
};
