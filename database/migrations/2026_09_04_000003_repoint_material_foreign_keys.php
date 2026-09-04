<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Alihkan semua FK yang tadinya menunjuk ke ingredients/ingredient_categories/
 * packaging_materials/packaging_categories agar menunjuk ke materials/
 * material_categories. Nama kolom TIDAK berubah (ingredient_id,
 * packaging_material_id, dst tetap seperti semula) — hanya target
 * constraint-nya yang dialihkan, karena id (uuid) baris lama dipertahankan
 * persis saat disalin ke materials (lihat migration sebelumnya).
 */
return new class extends Migration
{
    /** @var array<int, array{table: string, column: string, on: 'materials'|'material_categories', onDelete: string}> */
    private array $map = [
        ['table' => 'variant_recipes', 'column' => 'ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'product_recipes', 'column' => 'ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'packaging_recipes', 'column' => 'parent_packaging_id', 'on' => 'materials', 'onDelete' => 'cascade'],
        ['table' => 'packaging_recipes', 'column' => 'component_packaging_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'repack_transactions', 'column' => 'output_ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'repack_transaction_items', 'column' => 'ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'warehouse_ingredient_stocks', 'column' => 'ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'store_ingredient_stocks', 'column' => 'ingredient_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'warehouse_packaging_stocks', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'store_packaging_stocks', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'cart_packagings', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'restrict'],
        ['table' => 'sale_item_packagings', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'set null'],
        ['table' => 'discount_rewards', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'set null'],
        ['table' => 'discount_reward_pools', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'set null'],
        ['table' => 'discount_requirements', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'cascade'],
        ['table' => 'discount_applicabilities', 'column' => 'packaging_material_id', 'on' => 'materials', 'onDelete' => 'cascade'],
    ];

    /** Original target table for each (table, column) pair — used by down(). */
    private function originalTarget(string $column): string
    {
        return $column === 'ingredient_id' || $column === 'output_ingredient_id'
            ? 'ingredients'
            : 'packaging_materials';
    }

    public function up(): void
    {
        foreach ($this->map as $fk) {
            Schema::table($fk['table'], function (Blueprint $table) use ($fk) {
                $table->dropForeign([$fk['column']]);
                $table->foreign($fk['column'])
                      ->references('id')->on($fk['on'])
                      ->onDelete($fk['onDelete']);
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->map) as $fk) {
            Schema::table($fk['table'], function (Blueprint $table) use ($fk) {
                $table->dropForeign([$fk['column']]);
                $table->foreign($fk['column'])
                      ->references('id')->on($this->originalTarget($fk['column']))
                      ->onDelete($fk['onDelete']);
            });
        }
    }
};
