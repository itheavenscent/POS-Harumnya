<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 13 — STOCK OPERATIONS
 * Membutuhkan: warehouses, stores (01), users (02), ingredients (06), packaging (07)
 *
 * Tabel-tabel:
 *   stock_transfers         — transfer antar lokasi (header)
 *   stock_transfer_items    — detail item yang ditransfer
 *   stock_adjustments       — penyesuaian stok (opname, kerusakan, dll)
 *   stock_adjustment_items
 *   stock_movements         — ledger audit trail SEMUA pergerakan stok
 *   repack_transactions     — repack bahan (header)
 *   repack_transaction_items
 *
 * CATATAN stock_movements:
 *   Ledger lengkap. Setiap perubahan stok (purchase, sale, transfer,
 *   adjustment, repack) wajib menghasilkan satu atau lebih record di sini.
 *   Digunakan untuk rekonstruksi kartu stok per item per lokasi.
 *
 * CATATAN shipping_cost di stock_transfers:
 *   Biaya pengiriman (misal pakai Aldo) dicatat di header transfer.
 *   Masuk ke HPP via WAC — bukan harga jual.
 *   Dialokasikan proporsional per item di app layer:
 *     allocated_shipping = shipping_cost × (item_qty / total_qty)
 *     landed_cost = (unit_cost × qty) + allocated_shipping
 *     new_avg = (existing_stock × old_avg + landed_cost) / (existing_stock + qty)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── STOCK TRANSFERS ───────────────────────────────────────────────────
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transfer_number', 100)->unique();

            $table->string('from_location_type', 20)->comment('warehouse | store');
            $table->uuid('from_location_id');
            $table->string('to_location_type', 20)->comment('warehouse | store');
            $table->uuid('to_location_id');

            $table->date('transfer_date');
            $table->date('expected_arrival_date')->nullable();
            $table->date('actual_arrival_date')->nullable();

            $table->enum('status', [
                'draft', 'pending', 'approved', 'in_transit', 'received', 'completed', 'cancelled',
            ])->default('draft');

            // Biaya pengiriman masuk ke HPP penerima via WAC; harga jual tidak berubah
            $table->decimal('shipping_cost', 15, 2)->nullable()->default(0)
                  ->comment('Ongkos kirim (rupiah). Masuk ke HPP penerima via WAC. Null/0 = gratis.');
            $table->string('shipping_note', 255)->nullable()
                  ->comment('Informasi kurir/resi. Contoh: "Aldo, JNE 12345". Opsional.');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('sent_by')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('received_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('sent_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('received_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['from_location_type', 'from_location_id'], 'idx_st_from');
            $table->index(['to_location_type', 'to_location_id'],     'idx_st_to');
            $table->index(['transfer_date', 'status'],                'idx_st_date_status');
            $table->index('status');
        });

        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_transfer_id');
            $table->string('item_type', 30)->comment('ingredient | packaging_material');
            $table->uuid('item_id');

            $table->bigInteger('quantity_requested')
                  ->comment('Qty diminta; SIGNED');
            $table->bigInteger('quantity_sent')->default(0)
                  ->comment('Qty dikirim; SIGNED');
            $table->bigInteger('quantity_received')->default(0)
                  ->comment('Qty diterima; SIGNED');
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC per unit dari lokasi sumber (sebelum alokasi shipping)');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('stock_transfer_id')
                  ->references('id')->on('stock_transfers')->cascadeOnDelete();

            $table->index('stock_transfer_id');
            $table->index(['item_type', 'item_id'], 'idx_sti_item');
        });

        // ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('adjustment_number', 100)->unique();

            $table->string('location_type', 20)->comment('warehouse | store');
            $table->uuid('location_id');

            $table->date('adjustment_date');
            $table->enum('type', ['stock_opname', 'damage', 'loss', 'found', 'expired', 'other']);
            $table->enum('status', ['draft', 'pending', 'approved', 'completed', 'cancelled'])
                  ->default('draft');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['location_type', 'location_id'], 'idx_sa_location');
            $table->index(['adjustment_date', 'status'],    'idx_sa_date_status');
            $table->index(['type', 'status'],               'idx_sa_type_status');
        });

        Schema::create('stock_adjustment_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_adjustment_id');
            $table->string('item_type', 30)->comment('ingredient | packaging_material');
            $table->uuid('item_id');

            $table->bigInteger('system_quantity')
                  ->comment('Stok di sistem saat adjustment');
            $table->bigInteger('physical_quantity')
                  ->comment('Stok hasil hitung fisik');
            $table->bigInteger('difference')
                  ->comment('physical - system; positif = surplus, negatif = kurang');

            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC per unit saat adjustment');
            $table->decimal('value_difference', 15, 2)->default(0)
                  ->comment('|difference| × unit_cost');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('stock_adjustment_id')
                  ->references('id')->on('stock_adjustments')->cascadeOnDelete();

            $table->index('stock_adjustment_id');
            $table->index(['item_type', 'item_id'], 'idx_sai_item');
        });

        // ── STOCK MOVEMENTS (Ledger — Audit Trail) ────────────────────────────
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->enum('location_type', ['warehouse', 'store']);
            $table->uuid('location_id')
                  ->comment('warehouse_id atau store_id');

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

            $table->enum('item_type', ['ingredient', 'packaging_material']);
            $table->uuid('item_id')
                  ->comment('ingredient_id atau packaging_material_id');

            // SIGNED: negatif = keluar, positif = masuk
            $table->bigInteger('qty_change')
                  ->comment('SIGNED: negatif=keluar, positif=masuk');
            $table->bigInteger('qty_before')->default(0)
                  ->comment('Snapshot stok sebelum gerakan');
            $table->bigInteger('qty_after')->default(0)
                  ->comment('Snapshot stok setelah gerakan');

            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC per unit saat gerakan');
            $table->decimal('total_cost', 15, 2)->default(0)
                  ->comment('|qty_change| × unit_cost');
            $table->decimal('avg_cost_before', 15, 4)->default(0)
                  ->comment('WAC sebelum gerakan (snapshot)');
            $table->decimal('avg_cost_after', 15, 4)->default(0)
                  ->comment('WAC setelah gerakan (snapshot)');

            $table->string('reference_type', 100)
                  ->comment('FQCN: App\\Models\\Sale, App\\Models\\Purchase, dll');
            $table->uuid('reference_id');
            $table->string('reference_number', 100)->nullable()
                  ->comment('Human-readable: INV-..., PO-..., TRF-..., ADJ-...');

            $table->date('movement_date')
                  ->comment('Tanggal efektif; bisa berbeda dari created_at (backdate PO)');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('created_by')
                  ->references('id')->on('users')->nullOnDelete();

            // 5 query pattern utama — semua dicover oleh index di bawah:
            $table->index(['reference_type', 'reference_id'],                          'idx_sm_reference');
            $table->index(['location_type', 'location_id', 'movement_date'],           'idx_sm_location_date');
            $table->index(['item_type', 'item_id', 'movement_date'],                   'idx_sm_item_date');
            $table->index(['movement_type', 'movement_date'],                          'idx_sm_type_date');
            $table->index(['location_type', 'location_id', 'item_type', 'item_id'],   'idx_sm_loc_item');
        });

        // ── REPACK TRANSACTIONS ───────────────────────────────────────────────
        Schema::create('repack_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('repack_number', 100)->unique();

            $table->string('location_type', 20)->comment('warehouse | store');
            $table->uuid('location_id');

            $table->uuid('output_ingredient_id')
                  ->comment('Ingredient yang dihasilkan dari proses repack');
            $table->bigInteger('output_quantity')
                  ->comment('Qty output yang dihasilkan');
            $table->decimal('output_cost', 15, 4)->default(0)
                  ->comment('WAC per unit output (total_input_cost / output_quantity)');

            $table->date('repack_date');
            $table->enum('status', ['draft', 'pending', 'approved', 'completed', 'cancelled'])
                  ->default('draft');

            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('output_ingredient_id')
                  ->references('id')->on('ingredients')->restrictOnDelete();
            $table->foreign('created_by')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['location_type', 'location_id'], 'idx_rt_location');
            $table->index('output_ingredient_id');
            $table->index(['repack_date', 'status'], 'idx_rt_date_status');
        });

        Schema::create('repack_transaction_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('repack_transaction_id');
            $table->uuid('ingredient_id');

            $table->bigInteger('quantity')
                  ->comment('Qty bahan yang dikonsumsi (positif)');
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC bahan saat digunakan (snapshot)');
            $table->decimal('total_cost', 15, 2)->default(0)
                  ->comment('quantity × unit_cost');

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
