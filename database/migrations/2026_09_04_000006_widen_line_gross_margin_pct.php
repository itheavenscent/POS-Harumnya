<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Perlebar line_gross_margin_pct dari decimal(6,2) → decimal(9,2).
 *
 * decimal(6,2) hanya menampung ±9999.99. Bila COGS jauh melebihi harga jual
 * (mis. HPP kemasan rakitan abnormal), margin bisa < -9999.99% dan insert
 * sale_items/sale_item_packagings gagal dengan SQLSTATE 22003 (numeric overflow),
 * membatalkan seluruh checkout. decimal(9,2) menampung ±9.999.999,99%.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('gross_margin_pct', 9, 2)->default(0)->change();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('line_gross_margin_pct', 9, 2)->default(0)->change();
        });

        Schema::table('sale_item_packagings', function (Blueprint $table) {
            $table->decimal('line_gross_margin_pct', 9, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('gross_margin_pct', 6, 2)->default(0)->change();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('line_gross_margin_pct', 6, 2)->default(0)->change();
        });

        Schema::table('sale_item_packagings', function (Blueprint $table) {
            $table->decimal('line_gross_margin_pct', 6, 2)->default(0)->change();
        });
    }
};
