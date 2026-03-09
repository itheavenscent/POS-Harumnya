<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WarehouseStoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        // Clear existing data to prevent duplicates if running multiple times
        DB::table('warehouses')->truncate();
        DB::table('stores')->truncate();

        // Insert warehouses
        DB::table('warehouses')->insert([
            [
                'id' => Str::uuid(),
                'code' => 'WH001',
                'name' => 'Gudang Pusat',
                'address' => 'Jl. Merdeka No. 10, Jakarta',
                'phone' => '021-111222',
                'manager_name' => 'Budi Santoso',
                'email' => 'gudang.pusat@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'WH002',
                'name' => 'Gudang Jawa Timur',
                'address' => 'Jl. Raya Surabaya No. 123, Surabaya',
                'phone' => '031-333444',
                'manager_name' => 'Siti Aminah',
                'email' => 'gudang.jatim@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'WH003',
                'name' => 'Gudang Jawa Tengah',
                'address' => 'Jl. Pahlawan No. 45, Semarang',
                'phone' => '024-555666',
                'manager_name' => 'Ahmad Fauzi',
                'email' => 'gudang.jateng@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Insert stores
        DB::table('stores')->insert([
            [
                'id' => Str::uuid(),
                'code' => 'STR001',
                'name' => 'Toko Lamongan',
                'address' => 'Jl. Raya Lamongan No. 1, Lamongan',
                'phone' => '0322-112233',
                'manager_name' => 'Dewi Lestari',
                'email' => 'toko.lamongan@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'STR002',
                'name' => 'Toko Gresik',
                'address' => 'Jl. Sudirman No. 50, Gresik',
                'phone' => '031-9876543',
                'manager_name' => 'Rudi Hartono',
                'email' => 'toko.gresik@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid(),
                'code' => 'STR003',
                'name' => 'Toko Jombang',
                'address' => 'Jl. Teuku Umar No. 25, Jombang',
                'phone' => '0321-778899',
                'manager_name' => 'Maya Sari',
                'email' => 'toko.jombang@example.com',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
