<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 06 — INGREDIENTS & SUPPLIERS
 * Membutuhkan: — (tidak ada dependency bisnis)
 *
 * CATATAN ingredient_type:
 *   Digunakan untuk mapping scaling ke intensity_size_quantities:
 *     oil     → oil_quantity      (fragrance oil / bibit parfum)
 *     alcohol → alcohol_quantity  (ethanol / isopropyl)
 *     other   → other_quantity    (air suling, fixative, dll)
 *
 * CATATAN selling_price:
 *   Harga jual global per unit ingredient — basis kalkulasi harga custom order.
 *   Override per-toko ada di store_ingredient_prices (migration 16).
 *   Nullable: tidak semua ingredient dijual langsung ke customer.
 *
 * CATATAN average_cost:
 *   Weighted Average Cost per unit; diperbarui otomatis setiap pembelian masuk.
 *   DECIMAL(15,4): presisi hingga Rp 0,0001 per ml — cukup untuk WAC minyak mahal.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── INGREDIENT CATEGORIES ─────────────────────────────────────────────
        Schema::create('ingredient_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('ingredient_type', ['oil', 'alcohol', 'other'])
                  ->default('other')
                  ->comment('Mapping scaling: oil=fragrance oil, alcohol=ethanol/isopropyl, other=air suling/fixative');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('ingredient_type');
            $table->index(['is_active', 'sort_order'], 'idx_ingcat_active_sort');
        });

        // ── SUPPLIERS ─────────────────────────────────────────────────────────
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->string('contact_person', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->text('address')->nullable();
            $table->enum('payment_term', ['cash', 'credit_7', 'credit_14', 'credit_30', 'credit_60'])
                  ->default('cash');
            $table->decimal('credit_limit', 15, 2)->default(0)
                  ->comment('Batas kredit (rupiah)');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['code', 'is_active'], 'idx_sup_code_active');
            $table->index('is_active');
        });

        // ── INGREDIENTS ───────────────────────────────────────────────────────
        Schema::create('ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ingredient_category_id');
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('unit', 50)->default('ml')
                  ->comment('Satuan: ml, gr, kg, liter, pcs');
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();

            $table->decimal('average_cost', 15, 4)->default(0)
                  ->comment('WAC per unit; auto-update tiap pembelian masuk');
            $table->decimal('selling_price', 15, 2)->nullable()
                  ->comment('Harga jual per unit (rupiah). Basis kalkulasi custom order: oil_qty × selling_price. Null = tidak dijual langsung.');

            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('ingredient_category_id')
                  ->references('id')->on('ingredient_categories')
                  ->onDelete('restrict');

            $table->index('ingredient_category_id');
            $table->index(['code', 'is_active']);
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('ingredient_categories');
    }
};
