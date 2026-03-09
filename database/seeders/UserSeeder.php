<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = DB::table('warehouses')->where('code', 'WH001')->first();
        $store1    = DB::table('stores')->where('code', 'STR001')->first(); // Lamongan
        $store2    = DB::table('stores')->where('code', 'STR002')->first(); // Gresik
        $store3    = DB::table('stores')->where('code', 'STR003')->first(); // Jombang

        $whId = $warehouse?->id;
        $s1Id = $store1?->id;
        $s2Id = $store2?->id;
        $s3Id = $store3?->id;

        $users = [
            // ── Super Admin ───────────────────────────────────────────────
            [
                'name'                 => 'Super Admin',
                'email'                => 'superadmin@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $whId,
                'default_store_id'     => null,
                'role'                 => 'super-admin',
            ],

            // ── Admin ─────────────────────────────────────────────────────
            [
                'name'                 => 'Admin',
                'email'                => 'admin@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $whId,
                'default_store_id'     => null,
                'role'                 => 'admin',
            ],

            // ── Store Manager ─────────────────────────────────────────────
            [
                'name'                 => 'Manager Lamongan',
                'email'                => 'manager.lamongan@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s1Id,
                'role'                 => 'store-manager',
            ],
            [
                'name'                 => 'Manager Gresik',
                'email'                => 'manager.gresik@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s2Id,
                'role'                 => 'store-manager',
            ],
            [
                'name'                 => 'Manager Jombang',
                'email'                => 'manager.jombang@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s3Id,
                'role'                 => 'store-manager',
            ],

            // ── Cashier ───────────────────────────────────────────────────
            [
                'name'                 => 'Kasir Lamongan',
                'email'                => 'kasir.lamongan@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s1Id,
                'role'                 => 'cashier',
            ],
            [
                'name'                 => 'Kasir Gresik',
                'email'                => 'kasir.gresik@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s2Id,
                'role'                 => 'cashier',
            ],
            [
                'name'                 => 'Kasir Jombang',
                'email'                => 'kasir.jombang@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => null,
                'default_store_id'     => $s3Id,
                'role'                 => 'cashier',
            ],

            // ── Warehouse Staff ───────────────────────────────────────────
            [
                'name'                 => 'Staff Gudang',
                'email'                => 'gudang@gmail.com',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $whId,
                'default_store_id'     => null,
                'role'                 => 'warehouse-staff',
            ],
        ];

        foreach ($users as $u) {
            $user = User::firstOrCreate(
                ['email' => $u['email']],
                [
                    'name'                 => $u['name'],
                    'password'             => $u['password'],
                    'default_warehouse_id' => $u['default_warehouse_id'],
                    'default_store_id'     => $u['default_store_id'],
                    'email_verified_at'    => now(),
                ]
            );

            $role = Role::where('name', $u['role'])->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        $this->command->info('✅ Users seeded (' . count($users) . ' users).');
        $this->command->table(
            ['Name', 'Email', 'Role', 'Store/Warehouse'],
            collect($users)->map(fn($u) => [
                $u['name'],
                $u['email'],
                $u['role'],
                $u['default_store_id']
                    ? 'Store: ' . $u['default_store_id']
                    : 'Warehouse: ' . ($u['default_warehouse_id'] ?? '-'),
            ])->toArray()
        );
    }
}
