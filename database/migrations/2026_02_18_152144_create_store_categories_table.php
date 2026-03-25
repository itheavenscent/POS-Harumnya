<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 09 — STORE CATEGORIES
 * Membutuhkan: stores (01), variants (08)
 *
 * Setiap store dapat dikategorikan (L / M / S atau GOLD / SILVER / dll).
 * Tiap kategori menentukan variant mana yang BOLEH dijual (whitelist).
 *
 * DESAIN:
 *   Whitelist (bukan blacklist) → variant baru tidak otomatis muncul di toko.
 *   Fallback: store tanpa kategori (store_category_id = null) → tampil semua variant.
 *   Override: allow_all_variants = true → abaikan whitelist, tampil semua.
 *
 * store_category_id ditambahkan ke tabel stores di migration ini
 * (setelah store_categories dibuat) untuk menghindari circular dependency.
 *
 * FIX dari versi lama:
 *   - Ditambahkan kolom sort_order (sebelumnya index mereferensikan kolom yang tidak ada)
 *   - Dipisah dari migration variants untuk urutan dependency yang lebih jelas
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique()
                  ->comment('Kode pendek: L, M, S atau GOLD, SILVER');
            $table->string('name', 100)
                  ->comment('Nama lengkap: Large, Medium, Small');
            $table->text('description')->nullable();
            $table->boolean('allow_all_variants')->default(false)
                  ->comment('true = abaikan whitelist, semua variant tampil');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0)
                  ->comment('Urutan tampil di dropdown / list');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order'], 'idx_storecat_active_sort');
        });

        Schema::create('store_category_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_category_id');
            $table->uuid('variant_id');
            $table->boolean('is_active')->default(true)
                  ->comment('Bisa dinonaktifkan sementara tanpa hapus record');
            $table->timestamps();

            $table->foreign('store_category_id')
                  ->references('id')->on('store_categories')->cascadeOnDelete();
            $table->foreign('variant_id')
                  ->references('id')->on('variants')->cascadeOnDelete();

            $table->unique(['store_category_id', 'variant_id'], 'uq_scv_category_variant');
            $table->index(['store_category_id', 'is_active'], 'idx_scv_active');
            $table->index('variant_id');
        });

        // Tambah FK store_category_id ke stores (setelah store_categories ada)
        Schema::table('stores', function (Blueprint $table) {
            $table->uuid('store_category_id')->nullable()->after('code')
                  ->comment('null = tidak ada filter variant (semua variant tampil)');
            $table->foreign('store_category_id')
                  ->references('id')->on('store_categories')->nullOnDelete();
            $table->index('store_category_id', 'idx_store_category');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['store_category_id']);
            $table->dropIndex('idx_store_category');
            $table->dropColumn('store_category_id');
        });

        Schema::dropIfExists('store_category_variants');
        Schema::dropIfExists('store_categories');
    }
};
