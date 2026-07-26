<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION — Add packaging_material_id to discount_rewards & discount_reward_pools
 *
 * Menghubungkan hadiah parfum (reward_type = variant) dengan botol yang
 * otomatis ikut masuk keranjang saat reward diklaim. Contoh:
 *   - Hadiah P30 EDT → Botol Prisma 30 ml
 *   - Hadiah P10 EDT → Botol Roll 10 ml (spray)
 *
 * Jika null: TransactionController akan mencoba resolve botol default
 * berdasarkan size_id reward (kategori "Botol" + size cocok).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_rewards', function (Blueprint $table) {
            $table->uuid('packaging_material_id')->nullable()
                  ->after('size_id')
                  ->comment('Botol yang otomatis ikut saat reward parfum diklaim');

            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')
                  ->nullOnDelete();
        });

        Schema::table('discount_reward_pools', function (Blueprint $table) {
            $table->uuid('packaging_material_id')->nullable()
                  ->after('size_id')
                  ->comment('Botol yang otomatis ikut saat pool item parfum menang');

            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discount_reward_pools', function (Blueprint $table) {
            $table->dropForeign(['packaging_material_id']);
            $table->dropColumn('packaging_material_id');
        });

        Schema::table('discount_rewards', function (Blueprint $table) {
            $table->dropForeign(['packaging_material_id']);
            $table->dropColumn('packaging_material_id');
        });
    }
};
