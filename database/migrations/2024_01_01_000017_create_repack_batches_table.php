<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 007 — STOCK TRANSFERS · ADJUSTMENTS · MOVEMENTS · REPACK
 * Membutuhkan: warehouses (000), stores (000), ingredients (002), packaging (003)
 *
 * PERUBAHAN DARI VERSI LAMA:
 *   stock_transfer_items.quantity_*   : decimal(15,4) → bigInteger SIGNED
 *     (qty stok selalu integer; decimal(15,4) tidak perlu untuk ml/pcs)
 *   stock_adjustment_items.system_quantity / physical_quantity :
 *     unsignedBigInteger → bigInteger SIGNED (hitung fisik bisa 0 atau negatif)
 *   stock_adjustment_items.value_difference :
 *     unsignedBigInteger → decimal(15,2)
 *   stock_movements.unit_cost / total_cost :
 *     unsignedBigInteger → decimal(15,4) / decimal(15,2)
 *   repack_transaction_items.quantity / total_cost :
 *     unsignedBigInteger → bigInteger / decimal(15,2)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── STOCK TRANSFERS (Header) ───────────────────────────────────────────
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transfer_number', 100)->unique();

            // Polimorfik source & destination
            $table->string('from_location_type', 20)->comment('warehouse | store');
            $table->uuid('from_location_id');
            $table->string('to_location_type', 20)->comment('warehouse | store');
            $table->uuid('to_location_id');

            $table->date('transfer_date');
            $table->date('expected_arrival_date')->nullable();
            $table->date('actual_arrival_date')->nullable();

            $table->enum('status', [
                'draft', 'pending', 'approved',
                'in_transit', 'received', 'completed', 'cancelled',
            ])->default('draft');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            // FK ke users.id (bigint)
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('sent_by')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('received_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('sent_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['from_location_type', 'from_location_id'], 'idx_st_from');
            $table->index(['to_location_type', 'to_location_id'], 'idx_st_to');
            $table->index(['transfer_date', 'status'], 'idx_st_date_status');
            $table->index('status');
        });

        // ── STOCK TRANSFER ITEMS ──────────────────────────────────────────────
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_transfer_id');

            $table->string('item_type', 30)->comment('ingredient | packaging_material');
            $table->uuid('item_id');

            // ★ bigInteger SIGNED — koreksi bisa negatif
            $table->bigInteger('quantity_requested')
                  ->comment('Qty diminta');
            $table->bigInteger('quantity_sent')->default(0)
                  ->comment('Qty yang dikirim');
            $table->bigInteger('quantity_received')->default(0)
                  ->comment('Qty yang diterima di tujuan');

            // ★ decimal(15,4) → WAC presisi
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('Average cost per unit dari lokasi sumber');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('stock_transfer_id')
                  ->references('id')->on('stock_transfers')->cascadeOnDelete();

            $table->index('stock_transfer_id');
            $table->index(['item_type', 'item_id'], 'idx_sti_item');
        });

        // ── STOCK ADJUSTMENTS (Header) ────────────────────────────────────────
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('adjustment_number', 100)->unique();

            $table->string('location_type', 20)->comment('warehouse | store');
            $table->uuid('location_id');

            $table->date('adjustment_date');

            $table->enum('type', [
                'stock_opname', 'damage', 'loss',
                'found', 'expired', 'other',
            ]);

            $table->enum('status', [
                'draft', 'pending', 'approved', 'completed', 'cancelled',
            ])->default('draft');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['location_type', 'location_id'], 'idx_sa_location');
            $table->index(['adjustment_date', 'status'], 'idx_sa_date_status');
            $table->index(['type', 'status']);
        });

        // ── STOCK ADJUSTMENT ITEMS ────────────────────────────────────────────
        Schema::create('stock_adjustment_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_adjustment_id');

            $table->string('item_type', 30)->comment('ingredient | packaging_material');
            $table->uuid('item_id');

            // ★ bigInteger SIGNED — hitung fisik bisa 0 atau lebih dari sistem
            $table->bigInteger('system_quantity')
                  ->comment('Stok di sistem saat adjustment (dari DB)');
            $table->bigInteger('physical_quantity')
                  ->comment('Stok hasil hitung fisik (bisa 0 atau beda dari sistem)');
            // Selisih: bisa ± (surplus atau kurang)
            $table->bigInteger('difference')
                  ->comment('physical - system; positif = surplus, negatif = kurang');

            // ★ decimal(15,4) → WAC presisi
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('Average cost per unit saat adjustment');
            // ★ decimal(15,2) — nilai selisih dalam rupiah
            $table->decimal('value_difference', 15, 2)->default(0)
                  ->comment('|difference| × unit_cost (rupiah, 2 desimal)');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('stock_adjustment_id')
                  ->references('id')->on('stock_adjustments')->cascadeOnDelete();

            $table->index('stock_adjustment_id');
            $table->index(['item_type', 'item_id'], 'idx_sai_item');
        });

        // ── STOCK MOVEMENTS (Ledger — Audit Trail Lengkap) ────────────────────
        // Setiap pergerakan stok dicatat: pembelian, penjualan, transfer, adj, repack
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // ── Lokasi gerakan ────────────────────────────────────────────────
            $table->enum('location_type', ['warehouse', 'store']);
            $table->uuid('location_id')
                  ->comment('warehouse_id atau store_id');

            // ── Jenis gerakan ─────────────────────────────────────────────────
            $table->enum('movement_type', [
                'purchase_in',
                'transfer_in',
                'transfer_out',
                'adjustment_in',
                'adjustment_out',
                'waste',
                'sale_deduction',
                'return_in',
                'return_out',
                'production_in',
                'production_out',
            ]);

            // ── Item yang bergerak ────────────────────────────────────────────
            $table->enum('item_type', ['ingredient', 'packaging_material']);
            $table->uuid('item_id')
                  ->comment('ingredient_id atau packaging_material_id');

            // ── Kuantitas (SIGNED integer, konsisten dengan stock tables) ─────
            $table->bigInteger('qty_change')
                  ->comment('SIGNED: negatif=keluar, positif=masuk');
            $table->bigInteger('qty_before')->default(0)
                  ->comment('Stok sebelum gerakan (snapshot)');
            $table->bigInteger('qty_after')->default(0)
                  ->comment('Stok setelah gerakan (snapshot)');

            // ── HPP / Nilai ───────────────────────────────────────────────────
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC per unit saat gerakan — decimal(15,4) konsisten dengan stock tables');
            $table->decimal('total_cost', 15, 2)->default(0)
                  ->comment('|qty_change| × unit_cost — decimal(15,2)');
            $table->decimal('avg_cost_before', 15, 4)->default(0)
                  ->comment('WAC lokasi sebelum gerakan — snapshot');
            $table->decimal('avg_cost_after', 15, 4)->default(0)
                  ->comment('WAC lokasi setelah gerakan — snapshot');

            // ── Referensi dokumen asal ────────────────────────────────────────
            $table->string('reference_type', 100)
                  ->comment('FQCN: App\\Models\\Sale, App\\Models\\Purchase, dll');
            $table->uuid('reference_id');
            $table->string('reference_number', 50)->nullable()
                  ->comment('Human-readable: INV-..., PO-..., TRF-..., ADJ-...');

            // ── Metadata ──────────────────────────────────────────────────────
            $table->date('movement_date')
                  ->comment('Tanggal efektif (bisa berbeda dari created_at, misal backdate PO)');
            $table->foreignId('created_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();

            // ── Index untuk query umum ────────────────────────────────────────
            // 1. Cari semua movement dari 1 dokumen (Sale / PO / Transfer / Adj)
            $table->index(['reference_type', 'reference_id'],                        'idx_sm_reference');
            // 2. Laporan stok per lokasi berdasarkan tanggal
            $table->index(['location_type', 'location_id', 'movement_date'],         'idx_sm_location_date');
            // 3. Kartu stok per item (semua lokasi)
            $table->index(['item_type', 'item_id', 'movement_date'],                 'idx_sm_item_date');
            // 4. Filter by movement_type
            $table->index(['movement_type', 'movement_date'],                        'idx_sm_type_date');
            // 5. Kartu stok per item di 1 lokasi (query paling sering di detail stok)
            $table->index(['location_type', 'location_id', 'item_type', 'item_id'], 'idx_sm_loc_item');
        });

        // ── REPACK TRANSACTIONS (Header) ──────────────────────────────────────
        Schema::create('repack_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('repack_number', 100)->unique();

            $table->string('location_type', 20)->comment('warehouse | store');
            $table->uuid('location_id');

            $table->uuid('output_ingredient_id')
                  ->comment('Ingredient yang dihasilkan dari proses repack');

            // ★ bigInteger SIGNED
            $table->bigInteger('output_quantity')
                  ->comment('Qty output ingredient yang dihasilkan');

            // ★ decimal(15,4) → WAC hasil repack
            $table->decimal('output_cost', 15, 4)->default(0)
                  ->comment('Weighted avg cost per unit output hasil repack');

            $table->date('repack_date');

            $table->enum('status', [
                'draft', 'pending', 'approved', 'completed', 'cancelled',
            ])->default('draft');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('output_ingredient_id')
                  ->references('id')->on('ingredients')->restrictOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['location_type', 'location_id'], 'idx_rt_location');
            $table->index('output_ingredient_id');
            $table->index(['repack_date', 'status'], 'idx_rt_date_status');
        });

        // ── REPACK TRANSACTION ITEMS (Bahan yang Dikonsumsi) ──────────────────
        Schema::create('repack_transaction_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('repack_transaction_id');
            $table->uuid('ingredient_id');

            // ★ bigInteger SIGNED
            $table->bigInteger('quantity')
                  ->comment('Qty bahan yang dikonsumsi (positif)');

            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC bahan saat digunakan');
            // ★ decimal(15,2)
            $table->decimal('total_cost', 15, 2)->default(0)
                  ->comment('quantity × unit_cost (rupiah)');

            $table->timestamps();

            $table->foreign('repack_transaction_id')
                  ->references('id')->on('repack_transactions')->cascadeOnDelete();
            $table->foreign('ingredient_id')
                  ->references('id')->on('ingredients')->restrictOnDelete();

            $table->index('repack_transaction_id');
            $table->index('ingredient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repack_transaction_items');
        Schema::dropIfExists('repack_transactions');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_adjustment_items');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
    }
};
