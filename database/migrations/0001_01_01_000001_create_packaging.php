<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 07 — PACKAGING MATERIALS
 * Membutuhkan: — (tidak ada dependency bisnis)
 *
 * CATATAN is_free:
 *   true  = packaging selalu gratis ke customer
 *   false = gunakan selling_price
 *   Meskipun is_free = true, average_cost TETAP dihitung untuk laporan COGS.
 *
 * CATATAN size_id:
 *   FK ke sizes (migration 08); ditambahkan setelah sizes dibuat
 *   karena sizes bergantung pada packaging (circular dependency dihindari
 *   dengan menambahkan FK terpisah di migration 08).
 *
 * CATATAN purchase_price vs average_cost:
 *   purchase_price = harga beli standar / list price dari supplier (referensi)
 *   average_cost   = WAC aktual setelah pembelian masuk (diupdate otomatis)
 *   Keduanya dipertahankan untuk perbandingan dan audit.
 */
return new class extends Migration
{
    public function up(): void
    {
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

        Schema::create('packaging_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('packaging_category_id');

            // FK → sizes ditambahkan di migration 08 setelah sizes dibuat
            $table->uuid('size_id')->nullable()
                  ->comment('Untuk packaging size-specific (botol, tutup); FK ditambah di migration 08');

            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('unit', 20)->default('pcs');
            $table->string('image', 500)->nullable();
            $table->text('description')->nullable();

            $table->boolean('is_available_as_addon')->default(true)
                  ->comment('Tampil di tab Kemasan POS sebagai pilihan add-on');

            $table->decimal('purchase_price', 15, 2)->default(0)
                  ->comment('Harga beli standar per unit (rupiah) — referensi, bukan WAC');
            $table->decimal('selling_price', 15, 2)->default(0)
                  ->comment('Harga jual saat dijual sebagai add-on; diabaikan jika is_free = true');

            $table->boolean('is_free')->default(false)
                  ->comment('true = gratis ke customer; average_cost tetap dihitung untuk COGS');
            $table->string('free_condition_note', 255)->nullable()
                  ->comment('Catatan kondisi gratis (informatif). Contoh: "Gratis untuk setiap pembelian"');

            $table->decimal('average_cost', 15, 4)->default(0)
                  ->comment('WAC per unit; tetap dihitung meski is_free = true');

            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('packaging_category_id')
                  ->references('id')->on('packaging_categories')->restrictOnDelete();

            $table->index('packaging_category_id');
            $table->index('size_id');                                              // FK ditambah di mig 08
            $table->index(['code', 'is_active'], 'idx_pkg_code_active');
            $table->index(['is_active', 'is_available_as_addon', 'sort_order'], 'idx_pkg_active_addon_sort');
            $table->index(['is_free', 'is_active'], 'idx_pkg_free_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packaging_materials');
        Schema::dropIfExists('packaging_categories');
    }
};
