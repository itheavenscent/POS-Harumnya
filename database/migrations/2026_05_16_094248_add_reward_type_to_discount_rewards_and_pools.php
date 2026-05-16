<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION — Add reward_type to discount_rewards & discount_reward_pools
 *
 * reward_type enum:
 *   'variant'     — hadiah parfum (existing behavior)
 *   'points'      — tambah poin loyalty ke customer
 *   'reward_item' — hadiah dari master tabel reward_items (merchandise, voucher, dll)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── discount_rewards ──────────────────────────────────────────────────
        Schema::table('discount_rewards', function (Blueprint $table) {
            $table->enum('reward_type', ['variant', 'points', 'reward_item'])
                  ->default('variant')
                  ->after('discount_type_id')
                  ->comment('Jenis reward: variant parfum, poin member, atau hadiah lainnya');

            $table->uuid('reward_item_id')->nullable()
                  ->after('size_id')
                  ->comment('FK → reward_items; diisi jika reward_type = reward_item');

            $table->unsignedInteger('points_amount')->nullable()
                  ->after('reward_item_id')
                  ->comment('Jumlah poin yang diberikan; diisi jika reward_type = points');

            $table->foreign('reward_item_id')
                  ->references('id')->on('reward_items')
                  ->nullOnDelete();
        });

        // ── discount_reward_pools ─────────────────────────────────────────────
        Schema::table('discount_reward_pools', function (Blueprint $table) {
            $table->enum('reward_type', ['variant', 'points', 'reward_item'])
                  ->default('variant')
                  ->after('discount_reward_id')
                  ->comment('Jenis reward dalam pool');

            $table->uuid('reward_item_id')->nullable()
                  ->after('size_id')
                  ->comment('FK → reward_items; diisi jika reward_type = reward_item');

            $table->unsignedInteger('points_amount')->nullable()
                  ->after('reward_item_id')
                  ->comment('Jumlah poin; diisi jika reward_type = points');

            $table->foreign('reward_item_id')
                  ->references('id')->on('reward_items')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discount_reward_pools', function (Blueprint $table) {
            $table->dropForeign(['reward_item_id']);
            $table->dropColumn(['reward_type', 'reward_item_id', 'points_amount']);
        });

        Schema::table('discount_rewards', function (Blueprint $table) {
            $table->dropForeign(['reward_item_id']);
            $table->dropColumn(['reward_type', 'reward_item_id', 'points_amount']);
        });
    }
};
