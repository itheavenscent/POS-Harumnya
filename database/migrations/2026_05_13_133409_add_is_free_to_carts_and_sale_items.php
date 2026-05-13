<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->boolean('is_free')->default(false)->after('qty');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->boolean('is_free')->default(false)->after('qty');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('is_free');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('is_free');
        });
    }
};
