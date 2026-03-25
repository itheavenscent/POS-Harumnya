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
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Cek Role tersedia ─────────────────────────────────────────────────
        $superAdminRole = Role::where('name', 'super-admin')->first();
        $cashierRole    = Role::where('name', 'cashier')->first();

        if (! $superAdminRole || ! $cashierRole) {
            $this->command->error('❌ Role tidak ditemukan. Pastikan RolePermissionSeeder sudah jalan.');
            return;
        }

        // ── Ambil Gudang Pusat ────────────────────────────────────────────────
        $warehousePusat = DB::table('warehouses')->where('code', 'WH001')->first();

        if (! $warehousePusat) {
            $this->command->error('❌ Gudang Pusat (WH001) tidak ditemukan. Pastikan WarehouseStoreSeeder sudah jalan.');
            return;
        }

        $userRows = [];

        // ── Admin Pusat (1 user, akses semua) ────────────────────────────────
        $storeJatim = DB::table('stores')->where('code', 'STR-JATIM')->first();

        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'                 => 'Admin Pusat',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $warehousePusat->id,
                'default_store_id'     => $storeJatim?->id,
            ]
        );

        if (! $admin->wasRecentlyCreated) {
            $admin->update([
                'default_warehouse_id' => $warehousePusat->id,
                'default_store_id'     => $storeJatim?->id,
            ]);
        }

        $admin->syncRoles([$superAdminRole]);
        $admin->syncPermissions(Permission::all());

        $userRows[] = ['Admin Pusat', 'admin@gmail.com', 'super-admin', 'Gudang Pusat', '-'];

        // ── Kasir per Toko ────────────────────────────────────────────────────
        // [store_code, nama_kasir, email_kasir, warehouse_code]
        $cashierMap = [
            ['STR-JATIM',  'Kasir Jawa Timur',  'kasir.jatim@gmail.com',  'WH002'],
            ['STR-JATENG', 'Kasir Jawa Tengah', 'kasir.jateng@gmail.com', 'WH003'],
            ['STR-JABAR',  'Kasir Jawa Barat',  'kasir.jabar@gmail.com',  'WH004'],
        ];

        foreach ($cashierMap as [$storeCode, $nama, $email, $whCode]) {
            $store     = DB::table('stores')->where('code', $storeCode)->first();
            $warehouse = DB::table('warehouses')->where('code', $whCode)->first();

            if (! $store || ! $warehouse) {
                $this->command->warn("⚠️  Store {$storeCode} atau Warehouse {$whCode} tidak ditemukan, skip.");
                continue;
            }

            $cashier = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'                 => $nama,
                    'password'             => bcrypt('password'),
                    'default_warehouse_id' => $warehouse->id,
                    'default_store_id'     => $store->id,
                ]
            );

            if (! $cashier->wasRecentlyCreated) {
                $cashier->update([
                    'default_warehouse_id' => $warehouse->id,
                    'default_store_id'     => $store->id,
                ]);
            }

            $cashier->syncRoles([$cashierRole]);
            $cashier->syncPermissions([
                'dashboard-access',
                'transactions-access',
                'transactions-create',
            ]);

            $userRows[] = [$nama, $email, 'cashier', $warehouse->name, $store->name];
        }

        // ── Output ────────────────────────────────────────────────────────────
        $this->command->info('✓ Users seeded successfully.');
        $this->command->table(
            ['Name', 'Email', 'Role', 'Warehouse', 'Store'],
            $userRows
        );
        $this->command->newLine();
        $this->command->info('💡 Default password semua user: password');
    }
}
