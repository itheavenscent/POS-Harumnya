<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Perbesar presisi kolom gross_margin_percentage pada tabel products.
     *
     * ROOT CAUSE:
     *   Kolom lama DECIMAL(5,2) hanya menampung nilai -999.99 s/d 999.99.
     *   Ketika production_cost jauh melebihi selling_price (misal HPP = 1.350.000
     *   vs harga jual = 120.000), hasil kalkulasi margin = -1025% → overflow.
     *
     * FIX:
     *   Ubah ke DECIMAL(10,2) sehingga rentang aman menjadi
     *   -99.999.999,99 s/d 99.999.999,99 — cukup untuk kasus ekstrem manapun.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('gross_margin_percentage', 10, 2)
                  ->default(0)
                  ->comment('(gross_profit / selling_price) × 100 — diperlebar dari DECIMAL(5,2)')
                  ->change();
        });
    }

    /**
     * Rollback: kembalikan ke definisi lama.
     * PERINGATAN: data yang sudah tersimpan di luar rentang ±999.99 akan error.
     * Pastikan tidak ada data seperti itu sebelum rollback.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('gross_margin_percentage', 5, 2)
                  ->default(0)
                  ->change();
        });
    }
};
