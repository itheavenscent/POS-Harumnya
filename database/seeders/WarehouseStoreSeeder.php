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

        // Hanya 1 gudang (WH-PUSAT) — minimal untuk referensi default_warehouse_id user.
        $warehouses = [
            [
                'code'         => 'WH-PUSAT',
                'name'         => 'Gudang Pusat',
                'address'      => 'Jl. Industri Raya No. 1, Gresik',
                'phone'        => '031-3987000',
                'manager_name' => 'Budi Santoso',
                'email'        => 'gudang.pusat@harumnya.com',
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

        // Hanya Toko Krian.
        $stores = [
            [
                'code'         => 'STR-KRIAN',
                'name'         => 'Toko Krian',
                'address'      => 'Jl. Raya Krian No. 1, Sidoarjo',
                'phone'        => '031-8977000',
                'manager_name' => 'Kasir Krian',
                'email'        => 'toko.krian@harumnya.com',
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
                ['WH-PUSAT',  'Gudang Pusat',  'Warehouse'],
                ['STR-KRIAN', 'Toko Krian',    'Store'],
            ]
        );
    }
}
