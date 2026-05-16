<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->uuid('variant_id')->nullable()->change();
            $table->uuid('reward_item_id')->nullable()->after('product_id');
            $table->integer('points_amount')->nullable()->after('reward_item_id');

            $table->foreign('reward_item_id')->references('id')->on('reward_items')->nullOnDelete();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->uuid('reward_item_id')->nullable()->after('product_id');
            $table->foreign('reward_item_id')->references('id')->on('reward_items')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['reward_item_id']);
            $table->dropColumn('reward_item_id');
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['reward_item_id']);
            $table->dropColumn(['reward_item_id', 'points_amount']);
            $table->uuid('variant_id')->nullable(false)->change();
        });
    }
};
