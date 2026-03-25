<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * FIX dari versi lama:
 *   - Store code STR001/STR002 → STR-JATIM/STR-JATENG
 *   - Warehouse code WH001 → WH-PUSAT
 */
class StockSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $warehouse = DB::table('warehouses')->where('code', 'WH-PUSAT')->first();
        $store1    = DB::table('stores')->where('code', 'STR-JATIM')->first();
        $store2    = DB::table('stores')->where('code', 'STR-JATENG')->first();
        $store3    = DB::table('stores')->where('code', 'STR-JABAR')->first();

        if (! $warehouse) {
            $this->command->error('Warehouse belum ada.');
            return;
        }

        $ingredients = DB::table('ingredients')->get()->keyBy('code');
        $packagings  = DB::table('packaging_materials')->get()->keyBy('code');

        // ── WAREHOUSE INGREDIENT STOCKS ───────────────────────────────────────
        $whIngStock = [
            ['code' => 'ING-EO-001',  'qty' => 5000,  'min' =>  500, 'max' =>  10000, 'cost' => 1500.0000],
            ['code' => 'ING-EO-002',  'qty' => 2000,  'min' =>  200, 'max' =>   5000, 'cost' => 5000.0000],
            ['code' => 'ING-EO-003',  'qty' => 2500,  'min' =>  250, 'max' =>   5000, 'cost' => 4500.0000],
            ['code' => 'ING-BO-001',  'qty' => 10000, 'min' => 2000, 'max' =>  20000, 'cost' =>  500.0000],
            ['code' => 'ING-BO-002',  'qty' => 10000, 'min' => 2000, 'max' =>  20000, 'cost' =>  400.0000],
            ['code' => 'ING-AL-001',  'qty' => 50000, 'min' =>10000, 'max' => 100000, 'cost' =>   50.0000],
            ['code' => 'ING-AL-002',  'qty' => 20000, 'min' => 5000, 'max' =>  40000, 'cost' =>  150.0000],
            ['code' => 'ING-ADD-001', 'qty' => 3000,  'min' =>  300, 'max' =>   8000, 'cost' => 2000.0000],
            ['code' => 'ING-ADD-002', 'qty' => 5000,  'min' =>  500, 'max' =>  10000, 'cost' =>  300.0000],
        ];

        foreach ($whIngStock as $s) {
            $ing = $ingredients[$s['code']] ?? null;
            if (! $ing) continue;

            DB::table('warehouse_ingredient_stocks')->insert([
                'id'            => Str::uuid(),
                'warehouse_id'  => $warehouse->id,
                'ingredient_id' => $ing->id,
                'quantity'      => $s['qty'],
                'min_stock'     => $s['min'],
                'max_stock'     => $s['max'],
                'average_cost'  => $s['cost'],
                'total_value'   => round($s['qty'] * $s['cost'], 2),
                'last_in_at'    => $now,
                'last_in_by'    => null,
                'last_in_qty'   => $s['qty'],
                'last_out_at'   => null,
                'last_out_by'   => null,
                'last_out_qty'  => null,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        // ── WAREHOUSE PACKAGING STOCKS ────────────────────────────────────────
        $whPkgStock = [
            ['code' => 'PKG-BOT-30',  'qty' => 500,  'min' =>  50, 'max' => 1000, 'cost' =>  8000.0000],
            ['code' => 'PKG-BOT-50',  'qty' => 800,  'min' => 100, 'max' => 1500, 'cost' => 10000.0000],
            ['code' => 'PKG-BOT-100', 'qty' => 300,  'min' =>  50, 'max' =>  600, 'cost' => 15000.0000],
            ['code' => 'PKG-TTP-30',  'qty' => 600,  'min' => 100, 'max' => 1200, 'cost' =>  2000.0000],
            ['code' => 'PKG-TTP-50',  'qty' => 900,  'min' => 150, 'max' => 1800, 'cost' =>  2500.0000],
            ['code' => 'PKG-PB-S',    'qty' => 400,  'min' =>  50, 'max' =>  800, 'cost' =>  3000.0000],
            ['code' => 'PKG-PB-M',    'qty' => 300,  'min' =>  50, 'max' =>  600, 'cost' =>  5000.0000],
            ['code' => 'PKG-GC-STD',  'qty' => 500,  'min' => 100, 'max' => 1000, 'cost' =>  2000.0000],
            ['code' => 'PKG-GC-PRM',  'qty' => 200,  'min' =>  30, 'max' =>  400, 'cost' =>  5000.0000],
        ];

        foreach ($whPkgStock as $s) {
            $pkg = $packagings[$s['code']] ?? null;
            if (! $pkg) continue;

            DB::table('warehouse_packaging_stocks')->insert([
                'id'                    => Str::uuid(),
                'warehouse_id'          => $warehouse->id,
                'packaging_material_id' => $pkg->id,
                'quantity'              => $s['qty'],
                'min_stock'             => $s['min'],
                'max_stock'             => $s['max'],
                'average_cost'          => $s['cost'],
                'total_value'           => round($s['qty'] * $s['cost'], 2),
                'last_in_at'            => $now,
                'last_in_by'            => null,
                'last_in_qty'           => $s['qty'],
                'last_out_at'           => null,
                'last_out_by'           => null,
                'last_out_qty'          => null,
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        // ── STORE INGREDIENT STOCKS ───────────────────────────────────────────
        $baseStoreIngStock = [
            ['code' => 'ING-EO-001',  'qty' => 1000, 'min' =>  100, 'max' =>  3000, 'cost' => 1500.0000],
            ['code' => 'ING-EO-002',  'qty' =>  500, 'min' =>   50, 'max' =>  1500, 'cost' => 5000.0000],
            ['code' => 'ING-EO-003',  'qty' =>  500, 'min' =>   50, 'max' =>  1500, 'cost' => 4500.0000],
            ['code' => 'ING-BO-001',  'qty' => 2000, 'min' =>  500, 'max' =>  6000, 'cost' =>  500.0000],
            ['code' => 'ING-BO-002',  'qty' => 2000, 'min' =>  500, 'max' =>  6000, 'cost' =>  400.0000],
            ['code' => 'ING-AL-001',  'qty' =>10000, 'min' => 2000, 'max' => 25000, 'cost' =>   50.0000],
            ['code' => 'ING-AL-002',  'qty' => 5000, 'min' => 1000, 'max' => 12000, 'cost' =>  150.0000],
            ['code' => 'ING-ADD-001', 'qty' =>  500, 'min' =>   50, 'max' =>  2000, 'cost' => 2000.0000],
            ['code' => 'ING-ADD-002', 'qty' => 1000, 'min' =>  100, 'max' =>  3000, 'cost' =>  300.0000],
        ];

        $baseStorePkgStock = [
            ['code' => 'PKG-BOT-30',  'qty' => 100, 'min' => 20, 'max' =>  300, 'cost' =>  8000.0000],
            ['code' => 'PKG-BOT-50',  'qty' => 150, 'min' => 30, 'max' =>  400, 'cost' => 10000.0000],
            ['code' => 'PKG-BOT-100', 'qty' =>  60, 'min' => 10, 'max' =>  150, 'cost' => 15000.0000],
            ['code' => 'PKG-TTP-30',  'qty' => 120, 'min' => 30, 'max' =>  300, 'cost' =>  2000.0000],
            ['code' => 'PKG-TTP-50',  'qty' => 180, 'min' => 40, 'max' =>  400, 'cost' =>  2500.0000],
            ['code' => 'PKG-PB-S',    'qty' =>  80, 'min' => 15, 'max' =>  200, 'cost' =>  3000.0000],
            ['code' => 'PKG-PB-M',    'qty' =>  60, 'min' => 10, 'max' =>  150, 'cost' =>  5000.0000],
            ['code' => 'PKG-GC-STD',  'qty' => 100, 'min' => 20, 'max' =>  250, 'cost' =>  2000.0000],
            ['code' => 'PKG-GC-PRM',  'qty' =>  40, 'min' =>  5, 'max' =>  100, 'cost' =>  5000.0000],
        ];

        $stores = array_filter([$store1, $store2, $store3]);
        foreach ($stores as $idx => $store) {
            // Store ke-2 dan ke-3: multiplier sedikit berbeda agar data lebih bervariasi
            $multiplier = match ($idx) {
                1 => 1.3,
                2 => 0.8,
                default => 1.0,
            };

            foreach ($baseStoreIngStock as $s) {
                $ing = $ingredients[$s['code']] ?? null;
                if (! $ing) continue;

                $qty = (int) round($s['qty'] * $multiplier);

                DB::table('store_ingredient_stocks')->insert([
                    'id'            => Str::uuid(),
                    'store_id'      => $store->id,
                    'ingredient_id' => $ing->id,
                    'quantity'      => $qty,
                    'min_stock'     => $s['min'],
                    'max_stock'     => $s['max'],
                    'average_cost'  => $s['cost'],
                    'total_value'   => round($qty * $s['cost'], 2),
                    'last_in_at'    => $now,
                    'last_in_by'    => null,
                    'last_in_qty'   => $qty,
                    'last_out_at'   => null,
                    'last_out_by'   => null,
                    'last_out_qty'  => null,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
            }

            foreach ($baseStorePkgStock as $s) {
                $pkg = $packagings[$s['code']] ?? null;
                if (! $pkg) continue;

                $qty = (int) round($s['qty'] * $multiplier);

                DB::table('store_packaging_stocks')->insert([
                    'id'                    => Str::uuid(),
                    'store_id'              => $store->id,
                    'packaging_material_id' => $pkg->id,
                    'quantity'              => $qty,
                    'min_stock'             => $s['min'],
                    'max_stock'             => $s['max'],
                    'average_cost'          => $s['cost'],
                    'total_value'           => round($qty * $s['cost'], 2),
                    'last_in_at'            => $now,
                    'last_in_by'            => null,
                    'last_in_qty'           => $qty,
                    'last_out_at'           => null,
                    'last_out_by'           => null,
                    'last_out_qty'          => null,
                    'created_at'            => $now,
                    'updated_at'            => $now,
                ]);
            }
        }

        $this->command->info('✓ Stock seeded (1 warehouse + 3 stores, ingredients + packaging).');
    }
}
