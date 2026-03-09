<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = DB::table('warehouses')->where('code', 'WH001')->first();
        $store     = DB::table('stores')->where('code', 'STR001')->first();

        if (! $warehouse || ! $store) {
            $this->command->error('Warehouse/Store tidak ditemukan. Pastikan WarehouseStoreSeeder sudah jalan.');
            return;
        }

        // ── Super Admin ──────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'                 => 'Admin',
                'password'             => 'password', // cast 'hashed' di model yang akan hash
                'default_warehouse_id' => $warehouse->id,
                'default_store_id'     => $store->id,
            ]
        );

        $superAdminRole = Role::where('name', 'super-admin')->first();

        if (! $superAdminRole) {
            $this->command->error('Role super-admin tidak ditemukan. Pastikan RolePermissionSeeder sudah jalan.');
            return;
        }

        $admin->syncPermissions(Permission::all());
        $admin->assignRole($superAdminRole);

        // ── Cashier ──────────────────────────────────────────────────────────
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@gmail.com'],
            [
                'name'                 => 'Cashier',
                'password'             => 'password', // cast 'hashed' di model yang akan hash
                'default_warehouse_id' => $warehouse->id,
                'default_store_id'     => $store->id,
            ]
        );

        $cashierRole = Role::where('name', 'cashier')->first();

        if ($cashierRole) {
            $cashier->assignRole($cashierRole);
        }

        $transactionsPermission = Permission::where('name', 'transactions-access')->first();

        if ($transactionsPermission) {
            $cashier->syncPermissions($transactionsPermission);
        }

        $this->command->info('✓ Users seeded successfully.');
        $this->command->table(
            ['Name', 'Email', 'Role'],
            [
                ['Admin',   'admin@gmail.com',   'super-admin'],
                ['Cashier', 'cashier@gmail.com', 'cashier'],
            ]
        );
    }
}
