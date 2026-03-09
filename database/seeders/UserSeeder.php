<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Clear existing users to prevent duplicates if running multiple times
        DB::table('model_has_roles')->truncate();
        DB::table('users')->truncate();

        // Ambil store & warehouse untuk default assignment
        // Menggunakan kode yang lebih spesifik untuk gudang yang baru
        $warehousePusat = DB::table('warehouses')->where('code', 'WH001')->first();
        $warehouseJatim = DB::table('warehouses')->where('code', 'WH002')->first();
        $warehouseJateng = DB::table('warehouses')->where('code', 'WH003')->first();

        // Menggunakan kode yang lebih spesifik untuk toko yang baru
        $storeLamongan = DB::table('stores')->where('code', 'STR001')->first();
        $storeGresik   = DB::table('stores')->where('code', 'STR002')->first();
        $storeJombang  = DB::table('stores')->where('code', 'STR003')->first();

        $whPusatId = $warehousePusat?->id;
        $whJatimId = $warehouseJatim?->id;
        $whJatengId = $warehouseJateng?->id;

        $sLamonganId = $storeLamongan?->id;
        $sGresikId   = $storeGresik?->id;
        $sJombangId  = $storeJombang?->id;

        $users = [
            [
                'name'                  => 'Super Admin',
                'email'                 => 'superadmin@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whPusatId, // Super Admin ke Gudang Pusat
                'default_store_id'      => null,
                'role'                  => 'super-admin',
            ],
            [
                'name'                  => 'Admin Pusat',
                'email'                 => 'admin.pusat@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whPusatId, // Admin ke Gudang Pusat
                'default_store_id'      => null,
                'role'                  => 'admin',
            ],
            [
                'name'                  => 'Admin Jatim',
                'email'                 => 'admin.jatim@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whJatimId, // Admin ke Gudang Jawa Timur
                'default_store_id'      => null,
                'role'                  => 'admin',
            ],
            [
                'name'                  => 'Admin Jateng',
                'email'                 => 'admin.jateng@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whJatengId, // Admin ke Gudang Jawa Tengah
                'default_store_id'      => null,
                'role'                  => 'admin',
            ],
            [
                'name'                  => 'Manager Lamongan',
                'email'                 => 'manager.lamongan@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sLamonganId,
                'role'                  => 'store-manager',
            ],
            [
                'name'                  => 'Manager Gresik',
                'email'                 => 'manager.gresik@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sGresikId,
                'role'                  => 'store-manager',
            ],
            [
                'name'                  => 'Manager Jombang',
                'email'                 => 'manager.jombang@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sJombangId,
                'role'                  => 'store-manager',
            ],
            [
                'name'                  => 'Kasir Lamongan',
                'email'                 => 'kasir.lamongan@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sLamonganId,
                'role'                  => 'cashier',
            ],
            [
                'name'                  => 'Kasir Gresik',
                'email'                 => 'kasir.gresik@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sGresikId,
                'role'                  => 'cashier',
            ],
            [
                'name'                  => 'Kasir Jombang',
                'email'                 => 'kasir.jombang@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => null,
                'default_store_id'      => $sJombangId,
                'role'                  => 'cashier',
            ],
            [
                'name'                  => 'Staff Gudang Pusat',
                'email'                 => 'gudang.pusat@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whPusatId,
                'default_store_id'      => null,
                'role'                  => 'warehouse-staff',
            ],
            [
                'name'                  => 'Staff Gudang Jatim',
                'email'                 => 'gudang.jatim@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whJatimId,
                'default_store_id'      => null,
                'role'                  => 'warehouse-staff',
            ],
            [
                'name'                  => 'Staff Gudang Jateng',
                'email'                 => 'gudang.jateng@gmail.com',
                'password'              => bcrypt('password'),
                'default_warehouse_id'  => $whJatengId,
                'default_store_id'      => null,
                'role'                  => 'warehouse-staff',
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
            } else {
                $this->command->error("Role '{$u['role']}' not found for user '{$u['name']}'. Please ensure RoleSeeder runs first.");
            }
        }

        $this->command->info('Users seeded (' . count($users) . ' users).');
    }
}
