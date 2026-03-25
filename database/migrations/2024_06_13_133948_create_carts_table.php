<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 17 — POS SYSTEM
 * Membutuhkan: semua migration sebelumnya (01–16)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ALUR POS:
 *   [1] Kasir login → pilih Variant
 *   [2] Pilih Intensity → load ukuran dari intensity_size_prices
 *   [3] Pilih Size → harga otomatis tampil
 *   [4] Pilih mode: Regular (intensity baku) atau Custom Order
 *   [5] Add to cart → carts (+ cart_packagings opsional)
 *   [6] Input customer & sales person (opsional)
 *   [7] Terapkan diskon → cart_discounts
 *   [8] Input pembayaran → cart_payments (split payment OK)
 *   [9] Checkout → buat sale + sale_items + sale_payments
 *              → deduct stok via stock_movements
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CUSTOM ORDER:
 *   Customer bisa memesan komposisi custom (di luar intensity baku).
 *   Contoh: 27ml oil + 3ml alkohol dalam botol 30ml.
 *
 *   Aturan bisnis custom order:
 *     1. Minimum rasio oil:alkohol = 1:1 → custom_oil_qty >= custom_alcohol_qty
 *        (validasi di app layer, BUKAN constraint DB)
 *     2. Alkohol GRATIS ke customer; HPP alkohol tetap dihitung untuk COGS
 *     3. Harga = custom_oil_qty × selling_price (dari store_ingredient_prices
 *        atau fallback ke ingredients.selling_price)
 *     4. Kasir bisa override harga manual via custom_unit_price
 *     5. intensity_id & size_id NULLABLE untuk custom order
 *
 * CATATAN KONSISTENSI FK:
 *   users.id = bigIncrements (integer) → kolom FK ke users = unsignedBigInteger
 *   Semua entity lain (warehouses, stores, customers, dll) = UUID
 *   Ini konsisten di seluruh codebase.
 *
 * FK TERTUNDA DISCOUNT USAGES:
 *   Ditambahkan di bagian akhir up() secara eksplisit menggunakan Schema::table
 *   (bukan DB query helper yang fragile).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── PAYMENT METHODS ───────────────────────────────────────────────────
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->enum('type', ['cash', 'card', 'transfer', 'qris', 'ewallet', 'other'])
                  ->default('cash');
            $table->boolean('has_admin_fee')->default(false);
            $table->decimal('admin_fee_pct', 5, 2)->default(0)
                  ->comment('% MDR. Contoh: 0.70 untuk QRIS MDR 0.7%');
            $table->boolean('can_give_change')->default(false)
                  ->comment('true hanya untuk cash; false untuk QRIS/transfer');
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order'], 'idx_pm_active_sort');
            $table->index('type');
        });

        // ── CUSTOMERS ─────────────────────────────────────────────────────────
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->string('phone', 20)->nullable()->unique()
                  ->comment('Lookup member cepat di POS');
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();

            // Loyalty — denormalized untuk tampilan cepat
            $table->unsignedInteger('points')->default(0)
                  ->comment('Saldo poin aktif saat ini');
            $table->unsignedBigInteger('lifetime_points_earned')->default(0)
                  ->comment('[Denorm] Total poin sepanjang masa');
            $table->decimal('lifetime_spending', 15, 2)->default(0)
                  ->comment('[Denorm] Total belanja (rupiah) sepanjang masa');
            $table->unsignedInteger('total_transactions')->default(0)
                  ->comment('[Denorm] Jumlah transaksi');

            $table->enum('tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->boolean('is_active')->default(true);
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['phone', 'is_active'], 'idx_cust_phone_active');
            $table->index(['name', 'is_active'],  'idx_cust_name_active');
            $table->index('tier');
            $table->index('is_active');
        });

        // ── CUSTOMER POINT LEDGERS ────────────────────────────────────────────
        Schema::create('customer_point_ledgers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->enum('type', ['earned', 'redeemed', 'expired', 'adjusted']);
            $table->integer('points')
                  ->comment('Positif = masuk, negatif = keluar');
            $table->unsignedInteger('balance_after')
                  ->comment('Saldo poin setelah transaksi ini (snapshot)');
            $table->string('reference_type', 100)->nullable()
                  ->comment('Polimorfik: App\\Models\\Sale, App\\Models\\Adjustment');
            $table->uuid('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')
                  ->references('id')->on('customers')->cascadeOnDelete();
            $table->foreign('created_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['customer_id', 'created_at'],        'idx_cpl_timeline');
            $table->index(['customer_id', 'type'],              'idx_cpl_type');
            $table->index(['reference_type', 'reference_id'],   'idx_cpl_ref');
            $table->index('expired_at');
        });

        // ── CARTS ─────────────────────────────────────────────────────────────
        Schema::create('carts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('cashier_id');       // FK → users (bigint)
            $table->uuid('store_id');
            $table->uuid('variant_id');

            // NULLABLE untuk custom order
            $table->uuid('intensity_id')->nullable()
                  ->comment('null jika is_custom_order=true');
            $table->uuid('size_id')->nullable()
                  ->comment('null jika volume custom tidak sesuai size baku');
            $table->uuid('product_id')->nullable()
                  ->comment('null jika kombinasi belum ada di products (made-to-order)');

            $table->decimal('unit_price', 15, 2)->default(0)
                  ->comment('Harga satuan parfum saat ditambah ke cart');
            $table->unsignedSmallInteger('qty')->default(1);

            // ── Custom Order ──────────────────────────────────────────────────
            $table->boolean('is_custom_order')->default(false)
                  ->comment('true = komposisi custom; false = intensity baku');
            $table->unsignedSmallInteger('custom_oil_qty')->nullable()
                  ->comment('Volume oil (ml); wajib jika is_custom_order=true');
            $table->unsignedSmallInteger('custom_alcohol_qty')->nullable()
                  ->comment('Volume alkohol (ml); gratis ke customer; app layer: <= custom_oil_qty');
            $table->unsignedSmallInteger('custom_other_qty')->nullable()
                  ->comment('Volume bahan lain (ml); opsional');
            $table->unsignedSmallInteger('custom_total_volume')->nullable()
                  ->comment('[Denorm] oil + alkohol + other');

            $table->decimal('custom_unit_price', 15, 2)->nullable()
                  ->comment('Override harga kasir; null = hitung dari selling_price ingredient');
            $table->decimal('alcohol_cost_snapshot', 15, 4)->nullable()
                  ->comment('Snapshot WAC alkohol saat add-to-cart; untuk konsistensi COGS saat checkout');

            // ── Customer, Sales person, Hold ──────────────────────────────────
            $table->uuid('customer_id')->nullable();
            $table->uuid('sales_person_id')->nullable();

            $table->char('hold_id', 36)->nullable()
                  ->comment('null = aktif; filled = diparkir (UUID sesi hold)');
            $table->string('hold_label', 100)->nullable()
                  ->comment('Label parkir. Contoh: "Antrian A"');
            $table->timestamp('held_at')->nullable();
            $table->timestamp('cart_expires_at')->nullable()
                  ->comment('Auto-expire: held_at + 2 jam; cleanup via scheduler');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('cashier_id')
                  ->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('store_id')
                  ->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('variant_id')
                  ->references('id')->on('variants')->cascadeOnDelete();
            $table->foreign('intensity_id')
                  ->references('id')->on('intensities')->cascadeOnDelete();
            $table->foreign('size_id')
                  ->references('id')->on('sizes')->cascadeOnDelete();
            $table->foreign('product_id')
                  ->references('id')->on('products')->nullOnDelete();
            $table->foreign('customer_id')
                  ->references('id')->on('customers')->nullOnDelete();
            $table->foreign('sales_person_id')
                  ->references('id')->on('sales_people')->nullOnDelete();

            $table->index(['cashier_id', 'store_id', 'hold_id'], 'idx_cart_session');
            $table->index(['store_id', 'hold_id'],               'idx_cart_hold');
            $table->index(['store_id', 'is_custom_order'],       'idx_cart_custom');
            $table->index('cart_expires_at');
        });

        // ── CART PACKAGINGS ───────────────────────────────────────────────────
        Schema::create('cart_packagings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cart_id');
            $table->uuid('packaging_material_id');
            $table->unsignedSmallInteger('qty')->default(1);
            $table->decimal('unit_price', 15, 2)->default(0)
                  ->comment('Snapshot harga saat ditambah ke cart');
            $table->timestamps();

            $table->foreign('cart_id')
                  ->references('id')->on('carts')->cascadeOnDelete();
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->restrictOnDelete();

            $table->unique(['cart_id', 'packaging_material_id'], 'uq_cart_packaging');
            $table->index('cart_id');
        });

        // ── CART DISCOUNTS ────────────────────────────────────────────────────
        Schema::create('cart_discounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cart_id');
            $table->uuid('discount_type_id');
            $table->decimal('applied_amount', 15, 2)->default(0)
                  ->comment('Nominal yang akan dipotong saat checkout');
            $table->timestamps();

            $table->foreign('cart_id')
                  ->references('id')->on('carts')->cascadeOnDelete();
            $table->foreign('discount_type_id')
                  ->references('id')->on('discount_types')->restrictOnDelete();

            $table->unique(['cart_id', 'discount_type_id'], 'uq_cart_discount');
            $table->index('cart_id');
        });

        // ── CART PAYMENTS (Buffer Split Payment) ──────────────────────────────
        Schema::create('cart_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cart_id');
            $table->uuid('payment_method_id');
            $table->decimal('amount', 15, 2);
            $table->decimal('admin_fee', 15, 2)->default(0);
            $table->string('reference_number', 100)->nullable();
            $table->timestamps();

            $table->foreign('cart_id')
                  ->references('id')->on('carts')->cascadeOnDelete();
            $table->foreign('payment_method_id')
                  ->references('id')->on('payment_methods')->restrictOnDelete();

            $table->index('cart_id');
        });

        // ── SALES (Header Transaksi Final) ────────────────────────────────────
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sale_number', 30)->unique()
                  ->comment('Format: INV/YYYYMMDD/XXXXX');

            $table->uuid('store_id');

            $table->unsignedBigInteger('cashier_id')->nullable();  // FK → users (bigint)
            $table->string('cashier_name', 255)->nullable()
                  ->comment('Snapshot nama kasir');

            $table->uuid('sales_person_id')->nullable();
            $table->string('sales_person_name', 255)->nullable()
                  ->comment('Snapshot nama sales person');

            $table->uuid('customer_id')->nullable();
            $table->string('customer_name', 255)->nullable()
                  ->comment('Snapshot nama customer');

            $table->timestamp('sold_at')
                  ->comment('Waktu checkout selesai');

            // Revenue
            $table->decimal('subtotal_perfume', 15, 2)->default(0);
            $table->decimal('subtotal_packaging', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0)
                  ->comment('subtotal_perfume + subtotal_packaging');
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0)
                  ->comment('subtotal - discount_amount + tax_amount');
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);

            // HPP — alkohol dipisah karena tidak menghasilkan revenue
            $table->decimal('cogs_perfume', 15, 2)->default(0)
                  ->comment('HPP oil + bahan lain (tidak termasuk alkohol)');
            $table->decimal('cogs_packaging', 15, 2)->default(0);
            $table->decimal('cogs_alcohol', 15, 2)->default(0)
                  ->comment('[Denorm] Total HPP alkohol custom order; dipisah karena tidak menghasilkan revenue');
            $table->decimal('cogs_total', 15, 2)->default(0)
                  ->comment('cogs_perfume + cogs_packaging + cogs_alcohol');

            // Margin — SIGNED: bisa negatif
            $table->decimal('gross_profit', 15, 2)->default(0)
                  ->comment('total - cogs_total; bisa negatif');
            $table->decimal('gross_margin_pct', 6, 2)->default(0);

            // Loyalty
            $table->unsignedInteger('points_earned')->default(0);
            $table->unsignedInteger('points_redeemed')->default(0);
            $table->decimal('points_redemption_value', 15, 2)->default(0);

            $table->enum('status', ['draft', 'completed', 'cancelled', 'refunded'])
                  ->default('completed');
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->unsignedBigInteger('cancelled_by')->nullable();  // FK → users (bigint)

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('store_id')
                  ->references('id')->on('stores')->restrictOnDelete();
            $table->foreign('cashier_id')
                  ->references('id')->on('users')->nullOnDelete();
            $table->foreign('customer_id')
                  ->references('id')->on('customers')->nullOnDelete();
            $table->foreign('sales_person_id')
                  ->references('id')->on('sales_people')->nullOnDelete();
            $table->foreign('cancelled_by')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['store_id', 'sold_at', 'status'],  'idx_sales_store_date_status');
            $table->index(['sold_at', 'status'],              'idx_sales_date_status');
            $table->index(['cashier_id', 'sold_at'],          'idx_sales_cashier_date');
            $table->index(['customer_id', 'sold_at'],         'idx_sales_customer_date');
            $table->index(['sales_person_id', 'sold_at'],     'idx_sales_sp_date');
            $table->index('sold_at');
            $table->index('status');
        });

        // ── SALE ITEMS ────────────────────────────────────────────────────────
        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');

            // NULLABLE: made-to-order; produk belum tentu di-generate
            $table->uuid('product_id')->nullable()
                  ->comment('null jika kombinasi belum ada di products table');

            // Snapshot historis — tidak berubah meski master di-update/hapus
            $table->string('product_name', 255);
            $table->string('product_sku', 100)->nullable();
            $table->string('variant_name', 255)->nullable();
            $table->string('intensity_code', 20)->nullable();
            $table->unsignedSmallInteger('size_ml')->nullable();

            $table->uuid('variant_id_snapshot')->nullable()
                  ->comment('Snapshot untuk laporan historis tanpa JOIN ke master');
            $table->uuid('intensity_id_snapshot')->nullable();
            $table->uuid('size_id_snapshot')->nullable();

            $table->unsignedSmallInteger('qty')->default(1);
            $table->decimal('unit_price', 15, 2)
                  ->comment('Harga jual satuan saat transaksi');
            $table->decimal('item_discount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2);

            // COGS regular — tidak termasuk alkohol custom order
            $table->decimal('cogs_per_unit', 15, 2)->default(0);
            $table->decimal('cogs_total', 15, 2)->default(0);

            // ── Custom Order Snapshot ─────────────────────────────────────────
            $table->boolean('is_custom_order')->default(false);
            $table->unsignedSmallInteger('custom_oil_qty')->nullable();
            $table->unsignedSmallInteger('custom_alcohol_qty')->nullable();
            $table->unsignedSmallInteger('custom_other_qty')->nullable();
            $table->unsignedSmallInteger('custom_total_volume')->nullable()
                  ->comment('[Denorm snapshot] total volume ml');

            $table->boolean('alcohol_is_free')->default(true)
                  ->comment('true = alkohol gratis ke customer');
            $table->decimal('alcohol_cogs_per_unit', 15, 4)->default(0)
                  ->comment('custom_alcohol_qty × WAC alkohol saat transaksi');
            $table->decimal('alcohol_cogs_total', 15, 2)->default(0)
                  ->comment('alcohol_cogs_per_unit × qty; masuk laporan COGS');

            // Margin — SIGNED
            $table->decimal('line_gross_profit', 15, 2)->default(0);
            $table->decimal('line_gross_margin_pct', 6, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('sale_id')
                  ->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('product_id')
                  ->references('id')->on('products')->nullOnDelete();

            $table->index('sale_id');
            $table->index(['product_id', 'created_at'],  'idx_si_product_date');
            $table->index(['sale_id', 'is_custom_order'], 'idx_si_custom');
            $table->index('variant_id_snapshot');
            $table->index('intensity_id_snapshot');
        });

        // ── SALE ITEM PACKAGINGS ──────────────────────────────────────────────
        Schema::create('sale_item_packagings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_item_id');
            $table->uuid('packaging_material_id')->nullable()
                  ->comment('Nullable: packaging boleh dihapus, history tetap ada');

            $table->string('packaging_name', 255);
            $table->string('packaging_code', 100)->nullable();

            $table->unsignedSmallInteger('qty')->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0)
                  ->comment('WAC packaging saat transaksi (snapshot)');
            $table->decimal('cogs_total', 15, 2)->default(0);
            $table->decimal('line_gross_profit', 15, 2)->default(0);
            $table->decimal('line_gross_margin_pct', 6, 2)->default(0);

            $table->timestamps();

            $table->foreign('sale_item_id')
                  ->references('id')->on('sale_items')->cascadeOnDelete();
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->nullOnDelete();

            $table->index('sale_item_id');
            $table->index('packaging_material_id');
        });

        // ── SALE DISCOUNTS ────────────────────────────────────────────────────
        Schema::create('sale_discounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->uuid('discount_type_id')->nullable()
                  ->comment('null = diskon manual kasir');

            $table->string('discount_code', 50)->nullable();
            $table->string('discount_name', 255)
                  ->comment('Snapshot nama diskon');
            $table->enum('discount_category', [
                'percentage', 'fixed_amount', 'buy_x_get_y',
                'free_product', 'game_reward', 'bundle', 'manual',
            ])->default('percentage');

            $table->decimal('discount_value', 15, 2)->default(0)
                  ->comment('Nilai rule saat transaksi (referensi historis)');
            $table->decimal('applied_amount', 15, 2)
                  ->comment('Nominal rupiah yang dipotong');
            $table->unsignedTinyInteger('sort_order')->default(0);

            $table->json('applied_to_items')->nullable();
            $table->json('reward_items')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('sale_id')
                  ->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('discount_type_id')
                  ->references('id')->on('discount_types')->nullOnDelete();

            $table->index('sale_id');
            $table->index('discount_type_id');
        });

        // ── SALE PAYMENTS ─────────────────────────────────────────────────────
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->uuid('payment_method_id')->nullable()
                  ->comment('Nullable: payment method boleh dihapus, history tetap ada');

            $table->decimal('amount', 15, 2);
            $table->decimal('admin_fee', 15, 2)->default(0);

            // Snapshot wajib diisi saat checkout — tidak bergantung pada master
            $table->string('payment_method_name', 100)
                  ->comment('Snapshot: "QRIS BCA", "Cash", "Transfer Mandiri"');
            $table->string('payment_method_type', 50)
                  ->comment('Snapshot: cash|card|transfer|qris|ewallet|other');

            $table->string('reference_number', 100)->nullable();
            $table->enum('payment_status', ['pending', 'completed', 'failed', 'voided'])
                  ->default('completed');
            $table->timestamp('settled_at')->nullable()
                  ->comment('Cash/QRIS = sold_at; Transfer manual = saat dikonfirmasi');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('sale_id')
                  ->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('payment_method_id')
                  ->references('id')->on('payment_methods')->nullOnDelete();

            $table->index('sale_id');
            $table->index(['payment_method_type', 'payment_status', 'settled_at'], 'idx_sp_type_status_date');
        });

        // ── SALE RETURNS ──────────────────────────────────────────────────────
        Schema::create('sale_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('return_number', 30)->unique();
            $table->uuid('sale_id');
            $table->uuid('store_id');
            $table->unsignedBigInteger('cashier_id')->nullable();  // FK → users (bigint)
            $table->timestamp('returned_at');
            $table->enum('return_type', ['refund', 'exchange'])->default('refund');
            $table->decimal('total_refund', 15, 2)->default(0);
            $table->enum('refund_method', ['cash', 'store_credit', 'original_payment'])
                  ->default('original_payment');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])
                  ->default('pending');
            $table->timestamps();

            $table->foreign('sale_id')
                  ->references('id')->on('sales')->restrictOnDelete();
            $table->foreign('store_id')
                  ->references('id')->on('stores')->restrictOnDelete();
            $table->foreign('cashier_id')
                  ->references('id')->on('users')->nullOnDelete();

            $table->index(['sale_id', 'status'], 'idx_sr_sale_status');
            $table->index('returned_at');
        });

        Schema::create('sale_return_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_return_id');
            $table->uuid('sale_item_id');
            $table->unsignedSmallInteger('qty_returned');
            $table->decimal('refund_amount', 15, 2);
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->foreign('sale_return_id')
                  ->references('id')->on('sale_returns')->cascadeOnDelete();
            $table->foreign('sale_item_id')
                  ->references('id')->on('sale_items')->restrictOnDelete();

            $table->index('sale_return_id');
            $table->index('sale_item_id');
        });

        // ── FK TERTUNDA — DISCOUNT USAGES ─────────────────────────────────────
        // customers dan sales sudah dibuat di atas, sekarang FK bisa ditambahkan.
        Schema::table('discount_usages', function (Blueprint $table) {
            $table->foreign('customer_id')
                  ->references('id')->on('customers')->nullOnDelete();
            $table->foreign('order_id')
                  ->references('id')->on('sales')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Lepas FK tertunda terlebih dahulu
        Schema::table('discount_usages', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['order_id']);
        });

        Schema::dropIfExists('sale_return_items');
        Schema::dropIfExists('sale_returns');
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_discounts');
        Schema::dropIfExists('sale_item_packagings');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('cart_payments');
        Schema::dropIfExists('cart_discounts');
        Schema::dropIfExists('cart_packagings');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('customer_point_ledgers');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('payment_methods');
    }
};
