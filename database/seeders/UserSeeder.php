<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * User accounts yang dibuat:
 *   admin@harumnya.com       → super-admin  (WH-PUSAT)
 *   kasir.jatim@harumnya.com → cashier      (STR-JATIM / WH-JATIM)
 *   kasir.jateng@harumnya.com → cashier     (STR-JATENG / WH-JATENG)
 *   kasir.jabar@harumnya.com → cashier      (STR-JABAR / WH-JABAR)
 *
 * Default password semua user: password
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminRole = Role::where('name', 'super-admin')->first();
        $cashierRole    = Role::where('name', 'cashier')->first();

        if (! $superAdminRole || ! $cashierRole) {
            $this->command->error('❌ Roles tidak ditemukan. Jalankan RolePermissionSeeder terlebih dahulu.');
            return;
        }

        $whPusat = DB::table('warehouses')->where('code', 'WH-PUSAT')->first();
        if (! $whPusat) {
            $this->command->error('❌ Gudang Pusat (WH-PUSAT) tidak ditemukan. Jalankan WarehouseStoreSeeder terlebih dahulu.');
            return;
        }

        $rows = [];

        // ── Admin Pusat ───────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@harumnya.com'],
            [
                'name'                 => 'Admin Pusat',
                'password'             => bcrypt('password'),
                'default_warehouse_id' => $whPusat->id,
                'default_store_id'     => null,
            ]
        );
        if (! $admin->wasRecentlyCreated) {
            $admin->update(['default_warehouse_id' => $whPusat->id]);
        }
        $admin->syncRoles([$superAdminRole]);
        $admin->syncPermissions(Permission::all());
        $rows[] = ['Admin Pusat', 'admin@gmail.com', 'super-admin', 'WH-PUSAT', '-'];

        // ── Kasir per Toko ────────────────────────────────────────────────────
        $cashierMap = [
            ['STR-JATIM',  'WH-JATIM',  'Kasir Jawa Timur',  'kasir.jatim@harumnya.com'],
            ['STR-JATENG', 'WH-JATENG', 'Kasir Jawa Tengah', 'kasir.jateng@harumnya.com'],
            ['STR-JABAR',  'WH-JABAR',  'Kasir Jawa Barat',  'kasir.jabar@harumnya.com'],
        ];

        foreach ($cashierMap as [$storeCode, $whCode, $nama, $email]) {
            $store = DB::table('stores')->where('code', $storeCode)->first();
            $wh    = DB::table('warehouses')->where('code', $whCode)->first();

            if (! $store || ! $wh) {
                $this->command->warn("⚠ Store {$storeCode} atau Warehouse {$whCode} tidak ditemukan, skip.");
                continue;
            }

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'                 => $nama,
                    'password'             => bcrypt('password'),
                    'default_warehouse_id' => $wh->id,
                    'default_store_id'     => $store->id,

                ]
            );
            if (! $user->wasRecentlyCreated) {
                $user->update([
                    'default_warehouse_id' => $wh->id,
                    'default_store_id'     => $store->id,
                ]);
            }
            $user->syncRoles([$cashierRole]);
            
            // ── Contoh Direct Permission ──────────────────────────────────────
            // Kasir Jatim diberi akses refund (spesifik untuk user ini saja)
            if ($email === 'kasir.jatim@harumnya.com') {
                $user->syncPermissions(['transactions-refund']);
            }

            $rows[] = [$nama, $email, 'cashier', $whCode, $storeCode];
        }

        $this->command->info('✓ Users seeded.');
        $this->command->table(['Name', 'Email', 'Role', 'Warehouse', 'Store'], $rows);
        $this->command->info('💡 Default password: password');
    }
}
