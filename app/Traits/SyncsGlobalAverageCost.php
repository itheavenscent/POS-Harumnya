<?php

namespace App\Traits;

use App\Models\Material;
use Illuminate\Support\Facades\DB;

/**
 * HPP (average_cost) bersifat GLOBAL — satu nilai per material, dihitung dari
 * gabungan stok SEMUA lokasi (gudang + toko), bukan per-lokasi.
 *
 * Setiap kali sebuah mutasi mengubah biaya (pembelian, penyesuaian, transfer,
 * repack, produksi), panggil syncGlobalAverageCost(). Method ini:
 *   1. Menghitung Weighted Average Cost global = Σ(qty × avg) / Σ(qty) di semua
 *      tabel stok lokasi.
 *   2. Menulis nilai itu ke master (Material.average_cost) DAN ke SETIAP baris
 *      stok per-lokasi — sehingga tidak ada menu manapun yang bisa menampilkan
 *      HPP per-lokasi yang berbeda. Semua HPP mengikuti & sama (global).
 *
 * Catatan: baris per-lokasi memakai average_cost hanya sebagai cermin nilai
 * global; kuantitas tetap per-lokasi. Karena stok keluar tidak mengubah WAC,
 * nilai global hanya berubah saat ada stok masuk berbiaya baru.
 */
trait SyncsGlobalAverageCost
{
    /**
     * Recompute WAC global lalu mirror ke master + semua baris stok per-lokasi.
     *
     * @param  string      $itemType  'ingredient' | 'packaging_material'
     *                                 | FQCN 'App\Models\Ingredient' | 'App\Models\PackagingMaterial'
     * @param  string      $itemId    id material (= ingredient_id / packaging_material_id)
     * @param  float|null  $fallback  dipakai bila total qty global = 0 (semua stok habis);
     *                                bila null → pertahankan average_cost master saat ini.
     * @return float  WAC global yang baru diterapkan.
     */
    protected function syncGlobalAverageCost(string $itemType, string $itemId, ?float $fallback = null): float
    {
        $isIngredient = in_array($itemType, ['ingredient', 'App\\Models\\Ingredient'], true);

        [$whTable, $stTable, $fk] = $isIngredient
            ? ['warehouse_ingredient_stocks', 'store_ingredient_stocks', 'ingredient_id']
            : ['warehouse_packaging_stocks', 'store_packaging_stocks', 'packaging_material_id'];

        $rows = DB::table($whTable)->where($fk, $itemId)->select('quantity', 'average_cost')->get()
            ->concat(DB::table($stTable)->where($fk, $itemId)->select('quantity', 'average_cost')->get());

        $totalQty   = 0;
        $totalValue = 0.0;
        foreach ($rows as $r) {
            $qty = (int) $r->quantity;
            if ($qty > 0) {
                $totalQty   += $qty;
                $totalValue += $qty * (float) $r->average_cost;
            }
        }

        if ($totalQty > 0) {
            $globalWac = round($totalValue / $totalQty, 4);
        } else {
            // Stok global 0 → tak ada dasar WAC baru. Pertahankan HPP terakhir
            // (fallback dari pemanggil, atau nilai master saat ini) agar tidak reset ke 0.
            $globalWac = $fallback ?? (float) Material::where('id', $itemId)->value('average_cost');
            $globalWac = round((float) $globalWac, 4);
        }

        // Master (dipakai menu Material, PO, dan sumber HPP tanpa JOIN).
        Material::where('id', $itemId)->update(['average_cost' => $globalWac]);

        // Mirror ke setiap baris per-lokasi: average_cost = global, total_value = qty × global.
        // Numerik terkontrol (round 4) → aman diinterpolasi ke ekspresi SQL.
        $wacExpr = number_format($globalWac, 4, '.', '');
        foreach ([$whTable, $stTable] as $table) {
            DB::table($table)->where($fk, $itemId)->update([
                'average_cost' => $globalWac,
                'total_value'  => DB::raw("ROUND(quantity * {$wacExpr}, 2)"),
            ]);
        }

        // Bahan baku (oil/alcohol/other) → recost produk parfum yang memakainya,
        // supaya production_cost (HPP produk) selalu ikut WAC terkini dan COGS di
        // transaksi/laporan tidak 0. Kemasan tidak perlu: HPP-nya dibaca live saat POS.
        if ($isIngredient) {
            $this->recostProductsUsingIngredient($itemId);
        }

        return $globalWac;
    }

    /**
     * Recompute production_cost semua produk yang resepnya memakai bahan ini.
     */
    protected function recostProductsUsingIngredient(string $ingredientId): void
    {
        $productIds = \App\Models\ProductRecipe::where('ingredient_id', $ingredientId)
            ->distinct()
            ->pluck('product_id');

        if ($productIds->isEmpty()) {
            return;
        }

        \App\Models\Product::with('recipes.ingredient')
            ->whereIn('id', $productIds)
            ->get()
            ->each(fn ($p) => $p->recalculateCosts());
    }
}
