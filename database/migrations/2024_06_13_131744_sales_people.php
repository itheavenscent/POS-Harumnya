<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 14 — SALES PEOPLE & TARGETS
 * Membutuhkan: stores (01)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_people', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id');
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->date('join_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('store_id')
                  ->references('id')->on('stores')->cascadeOnDelete();

            $table->index(['store_id', 'is_active'], 'idx_sp_store_active');
        });

        Schema::create('sales_targets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sales_person_id');
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('target_amount', 15, 2)->nullable()
                  ->comment('Target omzet (rupiah)');
            $table->unsignedInteger('target_quantity')->nullable()
                  ->comment('Target unit terjual');
            $table->timestamps();

            $table->foreign('sales_person_id')
                  ->references('id')->on('sales_people')->cascadeOnDelete();

            $table->unique(['sales_person_id', 'year', 'month'], 'uq_st_sp_year_month');
            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_targets');
        Schema::dropIfExists('sales_people');
    }
};
