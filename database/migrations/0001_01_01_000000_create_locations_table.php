<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 01 — LOCATIONS
 * Root migration; tidak ada dependency.
 *
 * Dua tipe lokasi:
 *   warehouses  — gudang pusat / regional (stok masuk dari supplier)
 *   stores      — outlet / toko (stok diterima dari transfer gudang)
 *
 * store_category_id ditambahkan SETELAH store_categories dibuat
 * (lihat migration 08 — add_store_category_to_stores).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('manager_name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['code', 'is_active'], 'idx_wh_code_active');
            $table->index('is_active');
        });

        Schema::create('stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('manager_name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['code', 'is_active'], 'idx_store_code_active');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
        Schema::dropIfExists('warehouses');
    }
};
