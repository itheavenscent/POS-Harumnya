<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan packaging_material_id (botol/kemasan) ke:
 *   - discount_requirements  → syarat promo bisa mensyaratkan botol (mis. Spin Wheel
 *     "3 parfum + botol 30 mL"). Baris dengan packaging_material_id menghitung qty botol.
 *   - discount_applicabilities → cakupan diskon bisa menyertakan botol.
 *
 * discount_rewards & discount_reward_pools sudah punya kolom ini
 * (migration 2026_07_26_000000).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_requirements', function (Blueprint $table) {
            $table->uuid('packaging_material_id')->nullable()->after('size_id');
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->cascadeOnDelete();
            $table->index('packaging_material_id');
        });

        Schema::table('discount_applicabilities', function (Blueprint $table) {
            $table->uuid('packaging_material_id')->nullable()->after('size_id');
            $table->foreign('packaging_material_id')
                  ->references('id')->on('packaging_materials')->cascadeOnDelete();
            $table->index('packaging_material_id');
        });
    }

    public function down(): void
    {
        Schema::table('discount_requirements', function (Blueprint $table) {
            $table->dropForeign(['packaging_material_id']);
            $table->dropColumn('packaging_material_id');
        });

        Schema::table('discount_applicabilities', function (Blueprint $table) {
            $table->dropForeign(['packaging_material_id']);
            $table->dropColumn('packaging_material_id');
        });
    }
};
