<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WarehouseStoreSeeder extends Seeder
{
    public function run(): void
    {
        // ── Warehouses ───────────────────────────────────────────────────────
        $warehouses = [
            [
                'code'         => 'WH001',
                'name'         => 'Gudang Pusat',
                'address'      => 'Jl. Gatot Subroto No. 1, Jakarta Selatan',
                'phone'        => '021-1234567',
                'manager_name' => 'Budi Santoso',
                'email'        => 'gudang.pusat@example.com',
            ],
            [
                'code'         => 'WH002',
                'name'         => 'Gudang Jawa Timur',
                'address'      => 'Jl. Raya Waru No. 10, Sidoarjo',
                'phone'        => '031-2345678',
                'manager_name' => 'Agus Prasetyo',
                'email'        => 'gudang.jatim@example.com',
            ],
            [
                'code'         => 'WH003',
                'name'         => 'Gudang Jawa Tengah',
                'address'      => 'Jl. Industri No. 5, Semarang',
                'phone'        => '024-3456789',
                'manager_name' => 'Eko Widodo',
                'email'        => 'gudang.jateng@example.com',
            ],
            [
                'code'         => 'WH004',
                'name'         => 'Gudang Jawa Barat',
                'address'      => 'Jl. Soekarno-Hatta No. 8, Bandung',
                'phone'        => '022-4567890',
                'manager_name' => 'Dedi Kurniawan',
                'email'        => 'gudang.jabar@example.com',
            ],
        ];

        foreach ($warehouses as $warehouse) {
            if (! DB::table('warehouses')->where('code', $warehouse['code'])->exists()) {
                DB::table('warehouses')->insert(array_merge($warehouse, [
                    'id'         => Str::uuid(),
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // ── Stores (1 per provinsi) ──────────────────────────────────────────
        $stores = [
            [
                'code'         => 'STR-JATIM',
                'name'         => 'Toko Jawa Timur',
                'address'      => 'Jl. Tunjungan No. 1, Surabaya',
                'phone'        => '031-1111001',
                'manager_name' => 'Siti Aminah',
                'email'        => 'toko.jatim@example.com',
            ],
            [
                'code'         => 'STR-JATENG',
                'name'         => 'Toko Jawa Tengah',
                'address'      => 'Jl. Pemuda No. 10, Semarang',
                'phone'        => '024-2222001',
                'manager_name' => 'Hendra Wijaya',
                'email'        => 'toko.jateng@example.com',
            ],
            [
                'code'         => 'STR-JABAR',
                'name'         => 'Toko Jawa Barat',
                'address'      => 'Jl. Dago No. 20, Bandung',
                'phone'        => '022-3333001',
                'manager_name' => 'Fitri Handayani',
                'email'        => 'toko.jabar@example.com',
            ],
        ];

        foreach ($stores as $store) {
            if (! DB::table('stores')->where('code', $store['code'])->exists()) {
                DB::table('stores')->insert(array_merge($store, [
                    'id'         => Str::uuid(),
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        $this->command->info('✓ Warehouses & Stores seeded successfully.');
        $this->command->table(
            ['Code', 'Name', 'Tipe'],
            [
                ['WH001',      'Gudang Pusat',       'Warehouse'],
                ['WH002',      'Gudang Jawa Timur',  'Warehouse'],
                ['WH003',      'Gudang Jawa Tengah', 'Warehouse'],
                ['WH004',      'Gudang Jawa Barat',  'Warehouse'],
                ['STR-JATIM',  'Toko Jawa Timur',    'Store'],
                ['STR-JATENG', 'Toko Jawa Tengah',   'Store'],
                ['STR-JABAR',  'Toko Jawa Barat',    'Store'],
            ]
        );
    }
}
