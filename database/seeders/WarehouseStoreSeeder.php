<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WarehouseStoreSeeder extends Seeder
{
    public function run(): void
    {
        // ── Warehouse ────────────────────────────────────────────────────────
        $warehouseExists = DB::table('warehouses')->where('code', 'WH001')->exists();

        if (! $warehouseExists) {
            DB::table('warehouses')->insert([
                'id'           => Str::uuid(),
                'code'         => 'WH001',
                'name'         => 'Gudang Pusat Surabaya',
                'address'      => 'Jl. Contoh Alamat Gudang No. 123, Surabaya',
                'phone'        => '031-1234567',
                'manager_name' => 'Budi Santoso',
                'email'        => 'gudangpusat@example.com',
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        // ── Stores ───────────────────────────────────────────────────────────
        $storesToInsert = [
            [
                'id'           => Str::uuid(),
                'code'         => 'STR001',
                'name'         => 'Toko Lamongan',
                'address'      => 'Jl. Raya Lamongan No. 1, Lamongan',
                'phone'        => '0322-112233',
                'manager_name' => 'Siti Aminah',
                'email'        => 'toko.lamongan@example.com',
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'id'           => Str::uuid(),
                'code'         => 'STR002',
                'name'         => 'Toko Gresik',
                'address'      => 'Jl. Sudirman No. 50, Gresik',
                'phone'        => '031-9876543',
                'manager_name' => 'Ahmad Fauzi',
                'email'        => 'toko.gresik@example.com',
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
        ];

        foreach ($storesToInsert as $store) {
            $exists = DB::table('stores')->where('code', $store['code'])->exists();
            if (! $exists) {
                DB::table('stores')->insert($store);
            }
        }

        $this->command->info('✓ Warehouses & Stores seeded successfully.');
    }
}
