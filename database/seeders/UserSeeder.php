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
        // Ambil warehouse & store yang sudah di-seed sebelumnya
        $warehouse = DB::table('warehouses')->where('code', 'WH001')->first();
        $store     = DB::table('stores')->where('code', 'STR001')->first();

        // ── Super Admin ──────────────────────────────────────────────────────
        $admin = User::create([
            'name'                 => 'Admin',
            'email'                => 'admin@gmail.com',
            'password'             => bcrypt('password'),
            'default_warehouse_id' => $warehouse?->id,
            'default_store_id'     => $store?->id,
        ]);

        $role        = Role::where('name', 'super-admin')->first();
        $permissions = Permission::all();

        $admin->syncPermissions($permissions);
        $admin->assignRole($role);

        // ── Cashier ──────────────────────────────────────────────────────────
        $cashier = User::create([
            'name'                 => 'Cashier',
            'email'                => 'cashier@gmail.com',
            'password'             => bcrypt('password'),
            'default_warehouse_id' => $warehouse?->id,
            'default_store_id'     => $store?->id,
        ]);

        $transactionsPermission = Permission::where('name', 'transactions-access')->first();

        if ($transactionsPermission) {
            $cashier->syncPermissions($transactionsPermission);
        }
    }
}
