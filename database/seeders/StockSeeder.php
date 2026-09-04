<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * STOCK SEEDER — Data awal persediaan dari Excel PERSEDIAAN HARUMNYA.xlsx
 *
 * Warehouse (WH-PUSAT): qty & HPP langsung dari Excel.
 * Store: alokasi proporsional kecil untuk kebutuhan operasional demo.
 */
class StockSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('warehouse_ingredient_stocks')->delete();
        DB::table('warehouse_packaging_stocks')->delete();
        DB::table('store_ingredient_stocks')->delete();
        DB::table('store_packaging_stocks')->delete();

        $warehouse = DB::table('warehouses')->where('code', 'WH-PUSAT')->first();
        $stores    = DB::table('stores')->get();

        if (!$warehouse) {
            $this->command->error('Warehouse WH-PUSAT tidak ditemukan.');
            return;
        }

        $ingredients = DB::table('materials')->where('material_type', 'bahan_baku')->get()->keyBy('code');
        $packagings  = DB::table('materials')->where('material_type', 'bahan_kemasan')->get()->keyBy('code');

        // ══════════════════════════════════════════════════════════════════════
        // DATA DARI EXCEL PERSEDIAAN HARUMNYA
        // Format: [ingredient_code, qty, hpp (average_cost)]
        // ══════════════════════════════════════════════════════════════════════

        $ingredientStockData = [
            // ── Pembelian ─────────────────────────────────────────────────────
            ['ING-ADD-DPG',  80000,    40.6250],   // DPG
            ['ING-FO-W059',   2000,   934.2000],   // Oil Blanche - Byredo (La Verne)
            ['ING-FO-W060',   5000,   642.2617],   // Oil Laras Hati
            ['ING-FO-W057',   5000,   461.5256],   // Oil Orchid Flower
            ['ING-FO-W058',   5000,   582.1286],   // Oil Roman Wish
            ['ING-FO-W061',   5000,   451.4192],   // Oil Shining Star
            ['ING-FO-W043',   2000,  1385.8000],   // Oil Flora Gucci
            ['ING-FO-W053',   2000,   806.3000],   // Oil Pink Ciffon
            ['ING-FO-M023',   2000,   655.1000],   // Oil Black Leather
            ['ING-FO-M024',   2000,   833.1000],   // Oil Creed Aventus
            ['ING-FO-W054',   2000,   833.1000],   // Oil Viva La Juicy

            // ── Mutasi (stok transfer, 2250 ML per varian) ───────────────────
            ['ING-FO-W062',   2250,   896.8300],   // OIL ABE
            ['ING-FO-W017',   2250,   783.1900],   // OIL BATH (Bubble Bath)
            ['ING-FO-W004',   2250,  1407.3100],   // OIL BIR (Born in Roma)
            ['ING-FO-M003',   2250,  1172.0400],   // OIL BLEU (Bleu De Chanel)
            ['ING-FO-W021',   2250,   707.4800],   // OIL BLOOM
            ['ING-FO-W009',   2250,   924.0600],   // OIL BOA (Omnia)
            ['ING-FO-W063',   2250,   816.4900],   // OIL BOM
            ['ING-FO-W025',   2250,   693.7400],   // OIL BOP (Black Opium)
            ['ING-FO-W003',   2250,  1414.1700],   // OIL BOPR (Black Opium Red)
            ['ING-FO-W033',   2250,   569.5900],   // OIL BOUQ (Blooming Bouquet)
            ['ING-FO-W022',   2250,   677.2600],   // OIL BREAK (Coffee Break)
            ['ING-FO-W012',   2250,   887.2200],   // OIL BRO (Baccarat 540)
            ['ING-FO-M002',   2250,  1151.4700],   // OIL BS (Blue Seduction)
            ['ING-FO-W026',   2250,   620.0900],   // OIL CLOUD (Cloud Pink)
            ['ING-FO-M014',   2250,   648.0300],   // OIL DDB (Desire Blue)
            ['ING-FO-W064',   2250,   604.6500],   // OIL DES
            ['ING-FO-W013',   2250,   874.9300],   // OIL EDEN (Eden Sparkling)
            ['ING-FO-M009',   2250,   833.5900],   // OIL EROS
            ['ING-FO-W024',   2250,   617.7700],   // OIL EROSF (Eros Flame)
            ['ING-FO-W010',   2250,   923.2000],   // OIL FAME
            ['ING-FO-W027',   2250,   621.2100],   // OIL GG (Good Girl)
            ['ING-FO-W035',   2250,   539.5100],   // OIL GGB (Good Girl Blush)
            ['ING-FO-W034',   2250,   586.4900],   // OIL HER
            ['ING-FO-M013',   2250,   695.7000],   // OIL HERO
            ['ING-FO-W006',   2250,  1251.1500],   // OIL HERU (Her Intense)
            ['ING-FO-W036',   2250,   488.6500],   // OIL IDOL (Idole Nectar)
            ['ING-FO-M016',   2250,   660.7100],   // OIL JMW (Wood Sage Sea Salt)
            ['ING-FO-W016',   2250,   592.9700],   // OIL JPM (Perfect)
            ['ING-FO-W031',   2250,   551.0400],   // OIL JPS (Scandal)
            ['ING-FO-W007',   2250,  1026.2900],   // OIL LIB (Libre)
            ['ING-FO-M004',   2250,   812.9600],   // OIL MANX (Man X)
            ['ING-FO-W032',   2250,   561.0300],   // OIL MISS (Miss Dior)
            ['ING-FO-W065',   2250,   776.4500],   // OIL MJ
            ['ING-FO-M008',   2250,   902.6500],   // OIL MSF (My Self)
            ['ING-FO-W008',   2250,  1053.9100],   // OIL MUSK (White Musk)
            ['ING-FO-W029',   2250,   567.7900],   // OIL MVR (Vanilla Rose)
            ['ING-FO-W030',   2250,  1124.2600],   // OIL NECT (My Way Nectar)
            ['ING-FO-W019',   2250,   596.4100],   // OIL NOBLE
            ['ING-FO-M001',   2250,   863.7600],   // OIL ONE (One Million Lucky)
            ['ING-FO-M015',   2250,   666.8000],   // OIL ONER (One Million Royal)
            ['ING-FO-W018',   2250,   750.1300],   // OIL POPY (Scarlet Poppy)
            ['ING-FO-W023',   2250,   613.5700],   // OIL RIA (Euphoria)
            ['ING-FO-W066',   2250,  1416.2200],   // OIL ROCK
            ['ING-FO-M010',   2250,   741.2500],   // OIL SANT (Santal 33)
            ['ING-FO-W011',   2250,   909.2800],   // OIL SCN (Scandalous)
            ['ING-FO-W001',   2250,  1357.1500],   // OIL SIF (Si Fiori)
            ['ING-FO-M005',   2250,  1032.0400],   // OIL SVG (Sauvage)
            ['ING-FO-W015',   2250,   714.5200],   // OIL VB (Bombshell)
            ['ING-FO-W005',   2250,  1298.2800],   // OIL VBS (Bombshell Escape)
            ['ING-FO-W007',   2250,   936.7100],   // OIL VIE (La Vie Est Belle) — shares code with Libre
            ['ING-FO-W014',   2250,   762.8600],   // OIL VSC (Coconut Passion)
            ['ING-FO-M012',   2250,   750.0400],   // OIL WANT (The Most Wanted)
            ['ING-FO-W020',   2250,   678.4500],   // OIL WAY (My Way)
            ['ING-FO-M011',   2250,   682.6300],   // OIL Y
        ];

        // Packaging stock dari Excel
        // Format: [packaging_code, qty, hpp (average_cost)]
        $packagingStockData = [
            ['PKG-PRADA30',     2160,  5250.0000],   // Botol Prada Paradox 30ml
            ['PKG-DELINA25',    4800,  4433.3333],   // Botol Delina Doff 25ml
            ['PKG-P10',         1000,  1419.0000],   // Botol P10
            ['PKG-ROGL-BOT',    1000,   767.3333],   // Botol Roll On 10ml Gold List
            ['PKG-ROGL-TTP',    1000,   767.3333],   // Tutup Roll On 10ml Gold List
            ['PKG-ROGL-BALL',   1000,   767.3333],   // Roll On 10ml Gold List
            ['PKG-JADORE-BOT',  5000,  3155.9718],   // Botol J'Adore 30ml
            ['PKG-JADORE-TTP',  5000,  2610.2208],   // Tutup J'Adore 30ml
            ['PKG-JADORE-RS',   5000,  2437.1778],   // Ringspray J'Adore 30ml
            ['PKG-GUER-BOT',    5000,  5665.5349],   // Botol Geurlain 100ml
            ['PKG-GUER-RS',     5000,  3987.2149],   // Ringspray Geurlain 100ml
            ['PKG-GUER-TTP',    5000,  4274.9269],   // Tutup Geurlain 100ml
            ['PKG-GUCCI-BOT',   5000,  4232.7471],   // Botol Gucci Floral 50ml
            ['PKG-GUCCI-RS',    5000,  3075.9651],   // Ringspray Gucci Floral 50ml
            ['PKG-GUCCI-TTP',   5000,  3517.6455],   // Tutup Gucci Floral 50ml
            ['PKG-XERJ-BOT',    5000,  4123.5647],   // Botol Xerjoff 50ml
            ['PKG-XERJ-RS',     5000,  2620.1663],   // Ringspray Xerjoff 50ml
            ['PKG-XERJ-TTP',    5000,  3591.1111],   // Tutup Xerjoff 50ml
        ];

        // ── 1. SEED WAREHOUSE INGREDIENT STOCK ──────────────────────────────
        $this->command->line('Seeding Warehouse Ingredient Stock (dari Excel)...');

        $ingCount = 0;
        $ingSkipped = [];

        // Kumpulkan stok per ingredient code (beberapa baris Excel bisa punya code sama)
        $aggregated = [];
        foreach ($ingredientStockData as [$code, $qty, $hpp]) {
            if (!isset($aggregated[$code])) {
                $aggregated[$code] = ['qty' => 0, 'total_value' => 0];
            }
            $aggregated[$code]['qty'] += $qty;
            $aggregated[$code]['total_value'] += round($qty * $hpp, 2);
        }

        foreach ($aggregated as $code => $data) {
            $ing = $ingredients[$code] ?? null;
            if (!$ing) {
                $ingSkipped[] = $code;
                continue;
            }

            $avgCost = $data['qty'] > 0 ? round($data['total_value'] / $data['qty'], 4) : 0;

            DB::table('warehouse_ingredient_stocks')->insert([
                'id'            => Str::uuid(),
                'warehouse_id'  => $warehouse->id,
                'ingredient_id' => $ing->id,
                'quantity'      => $data['qty'],
                'min_stock'     => (int) ($data['qty'] * 0.1),
                'max_stock'     => (int) ($data['qty'] * 2.0),
                'average_cost'  => $avgCost,
                'total_value'   => $data['total_value'],
                'last_in_at'    => $now,
                'last_in_qty'   => $data['qty'],
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
            $ingCount++;
        }

        // Seed ingredients yang TIDAK ada di Excel dengan qty 0
        foreach ($ingredients as $ing) {
            if (isset($aggregated[$ing->code])) continue;

            DB::table('warehouse_ingredient_stocks')->insert([
                'id'            => Str::uuid(),
                'warehouse_id'  => $warehouse->id,
                'ingredient_id' => $ing->id,
                'quantity'      => 0,
                'min_stock'     => 0,
                'max_stock'     => 0,
                'average_cost'  => $ing->average_cost ?? 0,
                'total_value'   => 0,
                'last_in_at'    => null,
                'last_in_qty'   => null,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        // ── 2. SEED WAREHOUSE PACKAGING STOCK ───────────────────────────────
        $this->command->line('Seeding Warehouse Packaging Stock (dari Excel)...');

        $pkgCount = 0;
        $pkgSkipped = [];
        $seededPkgCodes = [];

        foreach ($packagingStockData as [$code, $qty, $hpp]) {
            $pkg = $packagings[$code] ?? null;
            if (!$pkg) {
                $pkgSkipped[] = $code;
                continue;
            }

            DB::table('warehouse_packaging_stocks')->insert([
                'id'                    => Str::uuid(),
                'warehouse_id'          => $warehouse->id,
                'packaging_material_id' => $pkg->id,
                'quantity'              => $qty,
                'min_stock'             => (int) ($qty * 0.1),
                'max_stock'             => (int) ($qty * 2.0),
                'average_cost'          => $hpp,
                'total_value'           => round($qty * $hpp, 2),
                'last_in_at'            => $now,
                'last_in_qty'           => $qty,
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
            $seededPkgCodes[] = $code;
            $pkgCount++;
        }

        // Seed packaging yang TIDAK ada di Excel dengan qty 0
        foreach ($packagings as $pkg) {
            if (in_array($pkg->code, $seededPkgCodes)) continue;

            DB::table('warehouse_packaging_stocks')->insert([
                'id'                    => Str::uuid(),
                'warehouse_id'          => $warehouse->id,
                'packaging_material_id' => $pkg->id,
                'quantity'              => 0,
                'min_stock'             => 0,
                'max_stock'             => 0,
                'average_cost'          => $pkg->purchase_price ?? 0,
                'total_value'           => 0,
                'last_in_at'            => null,
                'last_in_qty'           => null,
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        // ── 3. SEED STORE STOCK ─────────────────────────────────────────────
        $this->command->line('Seeding Store Stock...');

        foreach ($stores as $store) {
            $this->command->line("  → Toko: {$store->name} ({$store->code})");

            foreach ($ingredients as $ing) {
                $whStock = $aggregated[$ing->code] ?? null;
                $qty = 0;
                $cost = $ing->average_cost ?? 0;

                if ($whStock && $whStock['qty'] > 0) {
                    $qty = (int) round($whStock['qty'] * 0.05);
                    $cost = round($whStock['total_value'] / $whStock['qty'], 4);
                }

                DB::table('store_ingredient_stocks')->insert([
                    'id'            => Str::uuid(),
                    'store_id'      => $store->id,
                    'ingredient_id' => $ing->id,
                    'quantity'      => $qty,
                    'min_stock'     => max(1, (int) ($qty * 0.1)),
                    'max_stock'     => max(1, (int) ($qty * 3.0)),
                    'average_cost'  => $cost,
                    'total_value'   => round($qty * $cost, 2),
                    'last_in_at'    => $qty > 0 ? $now : null,
                    'last_in_qty'   => $qty > 0 ? $qty : null,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
            }

            foreach ($packagings as $pkg) {
                $inExcel = in_array($pkg->code, $seededPkgCodes);
                $qty = $inExcel ? 50 : 0;
                $cost = $pkg->purchase_price ?? 0;

                DB::table('store_packaging_stocks')->insert([
                    'id'                    => Str::uuid(),
                    'store_id'              => $store->id,
                    'packaging_material_id' => $pkg->id,
                    'quantity'              => $qty,
                    'min_stock'             => max(1, (int) ($qty * 0.1)),
                    'max_stock'             => max(1, (int) ($qty * 3.0)),
                    'average_cost'          => $cost,
                    'total_value'           => round($qty * $cost, 2),
                    'last_in_at'            => $qty > 0 ? $now : null,
                    'last_in_qty'           => $qty > 0 ? $qty : null,
                    'created_at'            => $now,
                    'updated_at'            => $now,
                ]);
            }
        }

        // ── 4. SINKRON HPP MASTER = WAC STOK GLOBAL ─────────────────────────
        // Master ingredients/packaging_materials.average_cost harus SAMA dengan
        // rata-rata tertimbang (WAC) seluruh stok (warehouse + store) — invariant
        // yang sama dengan runtime PurchaseController::syncMasterAverageCost().
        // Tanpa ini, "bahan baku tercatat" ≠ "stok global tercatat".
        $this->command->line('Sinkron HPP master = WAC stok global...');

        $syncMaster = function (string $materialType, string $fk, array $stockTables) {
            $rows = DB::table('materials')->where('material_type', $materialType)->select('id')->get();
            foreach ($rows as $row) {
                $totalQty = 0;
                $totalValue = 0.0;
                foreach ($stockTables as $stockTable) {
                    $stocks = DB::table($stockTable)->where($fk, $row->id)
                        ->select('quantity', 'average_cost')->get();
                    foreach ($stocks as $s) {
                        $qty = (int) $s->quantity;
                        if ($qty > 0) {
                            $totalQty   += $qty;
                            $totalValue += $qty * (float) $s->average_cost;
                        }
                    }
                }
                if ($totalQty > 0) {
                    DB::table('materials')->where('id', $row->id)->update([
                        'average_cost' => round($totalValue / $totalQty, 4),
                    ]);
                }
            }
        };

        $syncMaster('bahan_baku', 'ingredient_id', ['warehouse_ingredient_stocks', 'store_ingredient_stocks']);
        $syncMaster('bahan_kemasan', 'packaging_material_id', ['warehouse_packaging_stocks', 'store_packaging_stocks']);

        // ── Summary ─────────────────────────────────────────────────────────
        $this->command->info("✓ StockSeeder selesai — {$ingCount} ingredient + {$pkgCount} packaging (warehouse).");

        if (!empty($ingSkipped)) {
            $this->command->warn('Ingredient code tidak ditemukan: ' . implode(', ', $ingSkipped));
        }
        if (!empty($pkgSkipped)) {
            $this->command->warn('Packaging code tidak ditemukan: ' . implode(', ', $pkgSkipped));
        }
    }
}
