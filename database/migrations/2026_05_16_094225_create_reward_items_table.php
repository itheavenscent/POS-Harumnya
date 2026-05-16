<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION — MASTER REWARD ITEMS
 * Tabel master untuk hadiah/reward selain parfum variant.
 * Setiap item memiliki cost_price (HPP) agar pengeluaran reward bisa dilacak.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reward_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();

            // Kategori hadiah: merchandise, voucher, food, cash, etc.
            $table->string('category', 100)->default('merchandise');

            // HPP / Harga pokok — WAJIB untuk perhitungan pengeluaran reward
            $table->decimal('cost_price', 15, 2)->default(0)
                  ->comment('HPP / biaya hadiah yang ditanggung toko');

            // Nilai ekuivalen (opsional) — untuk voucher cash, dll.
            $table->decimal('selling_value', 15, 2)->nullable()
                  ->comment('Nilai ekuivalen produk/voucher ini (opsional)');

            $table->string('image', 500)->nullable();

            // Stok hadiah — null = tidak terbatas
            $table->unsignedInteger('stock_qty')->nullable()
                  ->comment('Stok tersedia; null = unlimited');

            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order'], 'idx_ri_active_sort');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reward_items');
    }
};
