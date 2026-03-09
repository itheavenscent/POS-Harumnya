<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WarehouseStoreSeeder extends Seeder
{
    public function run(): void
    {
        // =========================================================
        // 1. WAREHOUSE
        // =========================================================
        $warehouseId = Str::uuid()->toString();

        DB::table('warehouses')->insert([
            'id'           => $warehouseId,
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

        // =========================================================
        // 2. STORES
        // =========================================================
        $store1Id = Str::uuid()->toString();
        $store2Id = Str::uuid()->toString();

        DB::table('stores')->insert([
            [
                'id'           => $store1Id,
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
                'id'           => $store2Id,
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
        ]);

        $this->command->info('Warehouses & Stores seeded.');

        // =========================================================
        // 3. USERS  (ID warehouse/store langsung dari variabel atas)
        // =========================================================
        $users = [
            // ---------- Super Admin ----------
            [
                'name'                 => 'Super Admin',
                'email'                => 'superadmin@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $warehouseId,
                'default_store_id'     => null,
                'role'                 => 'super-admin',
            ],

            // ---------- Admin ----------
            [
                'name'                 => 'Admin',
                'email'                => 'admin@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $warehouseId,
                'default_store_id'     => null,
                'role'                 => 'admin',
            ],

            // ---------- Store Manager ----------
            [
                'name'                 => 'Manager Lamongan',
                'email'                => 'manager.lamongan@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $store1Id,
                'role'                 => 'store-manager',
            ],
            [
                'name'                 => 'Manager Gresik',
                'email'                => 'manager.gresik@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $store2Id,
                'role'                 => 'store-manager',
            ],

            // ---------- Cashier ----------
            [
                'name'                 => 'Kasir Lamongan',
                'email'                => 'kasir.lamongan@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $store1Id,
                'role'                 => 'cashier',
            ],
            [
                'name'                 => 'Kasir Gresik',
                'email'                => 'kasir.gresik@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $store2Id,
                'role'                 => 'cashier',
            ],

            // ---------- Warehouse Staff ----------
            [
                'name'                 => 'Staff Gudang',
                'email'                => 'gudang@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $warehouseId,
                'default_store_id'     => null,
                'role'                 => 'warehouse-staff',
            ],
        ];

        foreach ($users as $u) {
            $user = User::create([
                'name'                 => $u['name'],
                'email'                => $u['email'],
                'password'             => $u['password'],
                'default_warehouse_id' => $u['default_warehouse_id'],
                'default_store_id'     => $u['default_store_id'],
            ]);

            $role = Role::where('name', $u['role'])->first();
            if ($role) {
                $user->assignRole($role);
            }
        }

        $this->command->info('Users seeded (' . count($users) . ' users).');
    }
}
