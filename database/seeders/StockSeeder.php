<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Clear existing stock data to allow clean, idempotent re-seeding
        DB::table('warehouse_ingredient_stocks')->delete();
        DB::table('warehouse_packaging_stocks')->delete();
        DB::table('store_ingredient_stocks')->delete();
        DB::table('store_packaging_stocks')->delete();

        // ── Locations ──────────────────────────────────────────────────────────
        $warehouse = DB::table('warehouses')->where('code', 'WH-PUSAT')->first();
        $stores = DB::table('stores')->get();

        if (!$warehouse) {
            $this->command->error('Warehouse WH-PUSAT tidak ditemukan.');
            return;
        }

        // ── Ingredients & Packaging Materials ──────────────────────────────────
        $ingredients = DB::table('ingredients')->get();
        $packagings = DB::table('packaging_materials')->get();

        if ($ingredients->isEmpty() || $packagings->isEmpty()) {
            $this->command->error('Ingredients atau Packaging Materials kosong. Jalankan seeders sebelumnya dulu.');
            return;
        }

        // ── 1. SEED WAREHOUSE STOCK (WH-PUSAT) ───────────────────────────────
        $this->command->line('Seeding Warehouse Stock...');
        
        // Seeding ingredients in warehouse
        foreach ($ingredients as $ing) {
            $qty = 10000; // Default for oil variants
            if ($ing->code === 'ING-AL-001') {
                $qty = 100000; // Alkohol
            } elseif ($ing->code === 'ING-MET-001') {
                $qty = 50000; // Metanol
            }

            $cost = $ing->average_cost ?? 10.00;

            DB::table('warehouse_ingredient_stocks')->insert([
                'id'            => Str::uuid(),
                'warehouse_id'  => $warehouse->id,
                'ingredient_id' => $ing->id,
                'quantity'      => $qty,
                'min_stock'     => (int) ($qty * 0.1),
                'max_stock'     => (int) ($qty * 2.0),
                'average_cost'  => $cost,
                'total_value'   => round($qty * $cost, 2),
                'last_in_at'    => $now,
                'last_in_qty'   => $qty,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        // Seeding packaging in warehouse
        foreach ($packagings as $pkg) {
            $isBottle = in_array($pkg->code, ['ROLL', 'LD', 'PRI', 'GD', 'OR', 'HEX', 'PER']);
            $qty = $isBottle ? 1500 : 1000;
            $cost = $pkg->purchase_price ?? 5000.00;

            DB::table('warehouse_packaging_stocks')->insert([
                'id'                    => Str::uuid(),
                'warehouse_id'          => $warehouse->id,
                'packaging_material_id' => $pkg->id,
                'quantity'              => $qty,
                'min_stock'             => (int) ($qty * 0.1),
                'max_stock'             => (int) ($qty * 2.0),
                'average_cost'          => $cost,
                'total_value'           => round($qty * $cost, 2),
                'last_in_at'            => $now,
                'last_in_qty'           => $qty,
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);
        }

        // ── 2. SEED STORES STOCK (STR-JOMBANG1, STR-JOMBANG2, STR-JOMBANG3) ──────
        $this->command->line('Seeding Stores Stock...');

        foreach ($stores as $store) {
            $this->command->line("  Seeding stock untuk Toko: {$store->name} ({$store->code})");

            // Seeding ingredients in store
            foreach ($ingredients as $ing) {
                $qty = 1000; // Oil 1000mL/varian
                if ($ing->code === 'ING-AL-001') {
                    $qty = 10000; // Alkohol 10.000 mL
                } elseif ($ing->code === 'ING-MET-001') {
                    $qty = 5000; // Metanol 5000mL
                }

                $cost = $ing->average_cost ?? 10.00;

                DB::table('store_ingredient_stocks')->insert([
                    'id'            => Str::uuid(),
                    'store_id'      => $store->id,
                    'ingredient_id' => $ing->id,
                    'quantity'      => $qty,
                    'min_stock'     => (int) ($qty * 0.1),
                    'max_stock'     => (int) ($qty * 2.0),
                    'average_cost'  => $cost,
                    'total_value'   => round($qty * $cost, 2),
                    'last_in_at'    => $now,
                    'last_in_qty'   => $qty,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
            }

            // Seeding packaging in store
            foreach ($packagings as $pkg) {
                $isBottle = in_array($pkg->code, ['ROLL', 'LD', 'PRI', 'GD', 'OR', 'HEX', 'PER']);
                $qty = $isBottle ? 150 : 100; // botol masing-masing 150pcs, lainnya 100pcs
                $cost = $pkg->purchase_price ?? 5000.00;

                DB::table('store_packaging_stocks')->insert([
                    'id'                    => Str::uuid(),
                    'store_id'              => $store->id,
                    'packaging_material_id' => $pkg->id,
                    'quantity'              => $qty,
                    'min_stock'             => (int) ($qty * 0.1),
                    'max_stock'             => (int) ($qty * 2.0),
                    'average_cost'          => $cost,
                    'total_value'           => round($qty * $cost, 2),
                    'last_in_at'            => $now,
                    'last_in_qty'           => $qty,
                    'created_at'            => $now,
                    'updated_at'            => $now,
                ]);
            }
        }

        $this->command->info('✓ StockSeeder selesai — stok gudang & toko berhasil diset.');
    }
}
