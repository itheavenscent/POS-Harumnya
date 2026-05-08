<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Store codes yang dipakai konsisten di semua seeder:
 *   WH-PUSAT   → Gudang Pusat (Gresik)
 *   WH-JATIM   → Gudang Jawa Timur
 *   WH-JATENG  → Gudang Jawa Tengah
 *   WH-JABAR   → Gudang Jawa Barat
 *
 *   STR-JATIM  → Toko Jawa Timur (Surabaya)
 *   STR-JATENG → Toko Jawa Tengah (Semarang)
 *   STR-JABAR  → Toko Jawa Barat (Bandung)
 */
class WarehouseStoreSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $warehouses = [
            [
                'code'         => 'WH-PUSAT',
                'name'         => 'Gudang Pusat',
                'address'      => 'Jl. Industri Raya No. 1, Gresik',
                'phone'        => '031-3987000',
                'manager_name' => 'Budi Santoso',
                'email'        => 'gudang.pusat@harumnya.com',
            ],
            [
                'code'         => 'WH-JATIM',
                'name'         => 'Gudang Jawa Timur',
                'address'      => 'Jl. Raya Waru No. 10, Sidoarjo',
                'phone'        => '031-8912345',
                'manager_name' => 'Agus Prasetyo',
                'email'        => 'gudang.jatim@harumnya.com',
            ],
            [
                'code'         => 'WH-JATENG',
                'name'         => 'Gudang Jawa Tengah',
                'address'      => 'Jl. Industri No. 5, Semarang',
                'phone'        => '024-7601234',
                'manager_name' => 'Eko Widodo',
                'email'        => 'gudang.jateng@harumnya.com',
            ],
            [
                'code'         => 'WH-JABAR',
                'name'         => 'Gudang Jawa Barat',
                'address'      => 'Jl. Soekarno-Hatta No. 8, Bandung',
                'phone'        => '022-6031234',
                'manager_name' => 'Dedi Kurniawan',
                'email'        => 'gudang.jabar@harumnya.com',
            ],
        ];

        foreach ($warehouses as $wh) {
            if (! DB::table('warehouses')->where('code', $wh['code'])->exists()) {
                DB::table('warehouses')->insert(array_merge($wh, [
                    'id'         => Str::uuid(),
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            }
        }

        $stores = [
            [
                'code'         => 'STR-JOMBANG1',
                'name'         => 'Toko Jombang 1',
                'address'      => 'Jl. Wahid Hasyim No. 1, Jombang',
                'phone'        => '0321-111111',
                'manager_name' => 'Siti Aminah',
                'email'        => 'toko.jombang1@harumnya.com',
            ],
            [
                'code'         => 'STR-JOMBANG2',
                'name'         => 'Toko Jombang 2',
                'address'      => 'Jl. Merdeka No. 10, Jombang',
                'phone'        => '0321-222222',
                'manager_name' => 'Hendra Wijaya',
                'email'        => 'toko.jombang2@harumnya.com',
            ],
            [
                'code'         => 'STR-JOMBANG3',
                'name'         => 'Toko Jombang 3',
                'address'      => 'Jl. Ahmad Yani No. 20, Jombang',
                'phone'        => '0321-333333',
                'manager_name' => 'Fitri Handayani',
                'email'        => 'toko.jombang3@harumnya.com',
            ],
        ];

        foreach ($stores as $store) {
            if (! DB::table('stores')->where('code', $store['code'])->exists()) {
                DB::table('stores')->insert(array_merge($store, [
                    'id'         => Str::uuid(),
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            }
        }

        $this->command->info('✓ Warehouses & Stores seeded.');
        $this->command->table(
            ['Code', 'Name', 'Type'],
            [
                ['WH-PUSAT',  'Gudang Pusat',        'Warehouse'],
                ['WH-JATIM',  'Gudang Jawa Timur',   'Warehouse'],
                ['WH-JATENG', 'Gudang Jawa Tengah',  'Warehouse'],
                ['WH-JABAR',  'Gudang Jawa Barat',   'Warehouse'],
                ['STR-JOMBANG1', 'Toko Jombang 1',     'Store'],
                ['STR-JOMBANG2', 'Toko Jombang 2',     'Store'],
                ['STR-JOMBANG3', 'Toko Jombang 3',     'Store'],
            ]
        );
    }
}
