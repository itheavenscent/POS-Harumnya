<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Formula (kombinasi variant+intensity) belum bisa dinonaktifkan bila
     * sedang tidak dipakai — semua baris variant_recipes untuk satu formula
     * di-flag bersamaan lewat kolom ini (lihat VariantRecipe::scopeForVariantIntensity).
     */
    public function up(): void
    {
        Schema::table('variant_recipes', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('notes');
            $table->index(['variant_id', 'intensity_id', 'is_active'], 'idx_vr_variant_intensity_active');
        });
    }

    public function down(): void
    {
        Schema::table('variant_recipes', function (Blueprint $table) {
            $table->dropIndex('idx_vr_variant_intensity_active');
            $table->dropColumn('is_active');
        });
    }
};
