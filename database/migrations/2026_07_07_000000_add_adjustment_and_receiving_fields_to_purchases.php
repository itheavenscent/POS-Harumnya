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
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('adjustment', 15, 2)->default(0)->after('shipping_cost');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->bigInteger('received_quantity')->default(0)->after('quantity');
            $table->boolean('is_free')->default(false)->after('subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn(['received_quantity', 'is_free']);
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('adjustment');
        });
    }
};
