<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 10 — MULTI-LOCATION STOCK
 * Membutuhkan: warehouses, stores (01), users (02), ingredients (06), packaging_materials (07)
 *
 * Empat tabel stok snapshot per lokasi:
 *   warehouse_ingredient_stocks   — stok ingredient per gudang
 *   warehouse_packaging_stocks    — stok packaging per gudang
 *   store_ingredient_stocks       — stok ingredient per toko
 *   store_packaging_stocks        — stok packaging per toko
 *
 * DESAIN KUANTITAS:
 *   bigInteger SIGNED (bukan unsigned) → stok boleh negatif (pengambilan darurat).
 *   Negatif adalah kondisi valid yang perlu dilaporkan, bukan dicegah di DB.
 *
 * DESAIN NILAI:
 *   average_cost  DECIMAL(15,4) → presisi WAC Rp 0,0001 per unit
 *   total_value   DECIMAL(15,2) → nilai rupiah support Rp 1.234.567.890,99
 *
 * CATATAN last_in / last_out:
 *   Denormalisasi untuk tampilan cepat di UI tanpa JOIN ke stock_movements.
 *   Sumber kebenaran tetap stock_movements (migration 12).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── WAREHOUSE INGREDIENT STOCKS ───────────────────────────────────────
        Schema::create('warehouse_ingredient_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('warehouse_id');
            $table->uuid('ingredient_id');

            $table->bigInteger('quantity')->default(0)
                  ->comment('Stok saat ini; SIGNED: bisa negatif');
            $table->bigInteger('min_stock')->nullable()
                  ->comment('Ambang batas reorder alert');
            $table->bigInteger('max_stock')->nullable()
                  ->comment('Kapasitas maksimum');

            $table->decimal('average_cost', 15, 4)->default(0)
                  ->comment('WAC per unit');
            $table->decimal('total_value', 15, 2)->default(0)
                  ->comment('quantity × average_cost');

            $table->timestamp('last_in_at')->nullable();
            $table->unsignedBigInteger('last_in_by')->nullable();
            $table->bigInteger('last_in_qty')->nullable();

            $table->timestamp('last_out_at')->nullable();
            $table->unsignedBigInteger('last_out_by')->nullable();
            $table->bigInteger('last_out_qty')->nullable();

            $table->timestamps();

            $table->foreign('warehouse_id')
                  ->references('id')->on('warehouses')->cascadeOnDelete();
            $table->foreign('ingredient_id')
                  ->references('id')->on('ingredients')->restrictOnDelete();
            $table->foreign('last_in_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_out_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->unique(['warehouse_id', 'ingredient_id'], 'uq_wis_wh_ing');
            $table->index(['warehouse_id', 'quantity'],   'idx_wis_qty');
            $table->index(['quantity', 'min_stock'],      'idx_wis_low_stock');
            $table->index('ingredient_id');
        });

        // ── WAREHOUSE PACKAGING STOCKS ────────────────────────────────────────
        Schema::create('warehouse_packaging_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('warehouse_id');
            $table->uuid('packaging_material_id');

            $table->bigInteger('quantity')->default(0);
            $table->bigInteger('min_stock')->nullable();
            $table->bigInteger('max_stock')->nullable();
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);

            $table->timestamp('last_in_at')->nullable();
            $table->unsignedBigInteger('last_in_by')->nullable();
            $table->bigInteger('last_in_qty')->nullable();

            $table->timestamp('last_out_at')->nullable();
            $table->unsignedBigInteger('last_out_by')->nullable();
            $table->bigInteger('last_out_qty')->nullable();

            $table->timestamps();

            $table->foreign('warehouse_id')
                  ->references('id')->on('warehouses')->cascadeOnDelete();
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->restrictOnDelete();
            $table->foreign('last_in_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_out_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->unique(['warehouse_id', 'packaging_material_id'], 'uq_wps_wh_pkg');
            $table->index(['warehouse_id', 'quantity'], 'idx_wps_qty');
            $table->index(['quantity', 'min_stock'],    'idx_wps_low_stock');
        });

        // ── STORE INGREDIENT STOCKS ───────────────────────────────────────────
        Schema::create('store_ingredient_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id');
            $table->uuid('ingredient_id');

            $table->bigInteger('quantity')->default(0);
            $table->bigInteger('min_stock')->nullable();
            $table->bigInteger('max_stock')->nullable();
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);

            $table->timestamp('last_in_at')->nullable();
            $table->unsignedBigInteger('last_in_by')->nullable();
            $table->bigInteger('last_in_qty')->nullable();

            $table->timestamp('last_out_at')->nullable();
            $table->unsignedBigInteger('last_out_by')->nullable();
            $table->bigInteger('last_out_qty')->nullable();

            $table->timestamps();

            $table->foreign('store_id')
                  ->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('ingredient_id')
                  ->references('id')->on('ingredients')->restrictOnDelete();
            $table->foreign('last_in_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_out_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->unique(['store_id', 'ingredient_id'], 'uq_sis_store_ing');
            $table->index(['store_id', 'quantity'],   'idx_sis_qty');
            $table->index(['quantity', 'min_stock'],  'idx_sis_low_stock');
            $table->index('ingredient_id');
        });

        // ── STORE PACKAGING STOCKS ────────────────────────────────────────────
        Schema::create('store_packaging_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id');
            $table->uuid('packaging_material_id');

            $table->bigInteger('quantity')->default(0);
            $table->bigInteger('min_stock')->nullable();
            $table->bigInteger('max_stock')->nullable();
            $table->decimal('average_cost', 15, 4)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);

            $table->timestamp('last_in_at')->nullable();
            $table->unsignedBigInteger('last_in_by')->nullable();
            $table->bigInteger('last_in_qty')->nullable();

            $table->timestamp('last_out_at')->nullable();
            $table->unsignedBigInteger('last_out_by')->nullable();
            $table->bigInteger('last_out_qty')->nullable();

            $table->timestamps();

            $table->foreign('store_id')
                  ->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->restrictOnDelete();
            $table->foreign('last_in_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_out_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->unique(['store_id', 'packaging_material_id'], 'uq_sps_store_pkg');
            $table->index(['store_id', 'quantity'],  'idx_sps_qty');
            $table->index(['quantity', 'min_stock'], 'idx_sps_low_stock');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_packaging_stocks');
        Schema::dropIfExists('store_ingredient_stocks');
        Schema::dropIfExists('warehouse_packaging_stocks');
        Schema::dropIfExists('warehouse_ingredient_stocks');
    }
};
