<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PACKAGING BOM (Bill of Materials)
     *
     * Kemasan rakitan (mis. "Botol A") tersusun dari beberapa komponen
     * (ring spray, tutup, botol) yang masing-masing adalah PackagingMaterial
     * dengan stok sendiri.
     *
     * Rakitan bersifat VIRTUAL: tidak punya stok sendiri. Saat rakitan keluar
     * (terjual), stok tiap komponen dikurangi sesuai quantity di BOM.
     */
    public function up(): void
    {
        // Penanda: material ini adalah rakitan (punya BOM), bukan komponen tunggal.
        Schema::table('packaging_materials', function (Blueprint $table) {
            $table->boolean('is_assembly')->default(false)->after('is_available_as_addon')
                  ->comment('true = kemasan rakitan (stok dihitung dari komponen BOM)');
            $table->index('is_assembly');
        });

        Schema::create('packaging_recipes', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Kemasan rakitan (parent)
            $table->uuid('parent_packaging_id');
            // Komponen penyusun (child) — juga PackagingMaterial
            $table->uuid('component_packaging_id');

            $table->unsignedInteger('quantity')->default(1)
                  ->comment('Jumlah komponen per 1 unit rakitan');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('parent_packaging_id')
                  ->references('id')->on('packaging_materials')->cascadeOnDelete();
            $table->foreign('component_packaging_id')
                  ->references('id')->on('packaging_materials')->restrictOnDelete();

            $table->unique(
                ['parent_packaging_id', 'component_packaging_id'],
                'uq_packaging_recipe_item'
            );
            $table->index('parent_packaging_id');
            $table->index('component_packaging_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packaging_recipes');

        Schema::table('packaging_materials', function (Blueprint $table) {
            $table->dropIndex(['is_assembly']);
            $table->dropColumn('is_assembly');
        });
    }
};
