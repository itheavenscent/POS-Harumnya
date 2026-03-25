<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 16 — CUSTOM ORDER PRICING
 * Membutuhkan: variants (08), ingredients (06), stores (01), users (02)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DUA TABEL DI MIGRATION INI:
 *
 * A. custom_order_pricing_rules
 *    Aturan OPERASIONAL custom order per variant:
 *      - min/max volume oil yang boleh dipesan
 *      - catatan aturan rasio untuk display di POS
 *      - validity period
 *    TIDAK menyimpan harga. Harga diambil dari store_ingredient_prices
 *    atau ingredients.selling_price (single source of truth).
 *
 * HIERARKI RESOLUSI HARGA CUSTOM ORDER (di app layer):
 *   1. store_ingredient_prices
 *      WHERE store_id = X AND ingredient_id = oil AND is_active = 1
 *   2. ingredients.selling_price (global default)
 *   3. NULL → kasir wajib input manual via carts.custom_unit_price
 * ═══════════════════════════════════════════════════════════════════════════
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── A. CUSTOM ORDER PRICING RULES ─────────────────────────────────────
        Schema::create('custom_order_pricing_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('variant_id')->nullable()
                  ->comment('null = berlaku semua variant; filled = variant spesifik');

            $table->unsignedSmallInteger('min_oil_ml')->default(5)
                  ->comment('Minimum volume oil yang boleh dipesan (ml)');
            $table->unsignedSmallInteger('max_oil_ml')->nullable()
                  ->comment('Maximum volume oil per botol; null = tidak ada batas');

            $table->string('min_ratio_note', 255)->nullable()
                  ->comment('Catatan aturan rasio untuk display di UI POS. Contoh: "Minimum 1:1 (oil:alkohol)"');

            $table->date('valid_from')->nullable()
                  ->comment('Tanggal mulai berlaku; null = berlaku sejak dibuat');
            $table->date('valid_until')->nullable()
                  ->comment('Tanggal berakhir; null = tidak ada kadaluarsa');

            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('variant_id')
                  ->references('id')->on('variants')->cascadeOnDelete();

            $table->index('variant_id');
            $table->index(['is_active', 'valid_from', 'valid_until'], 'idx_copr_active_period');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('store_ingredient_prices');
    }
};
