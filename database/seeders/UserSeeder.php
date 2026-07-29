<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * User accounts yang dibuat:
 *   itdevelopmenths@gmail.com                → super-admin  (WH-PUSAT)
 *   compliancesupplychain@gmail.com   → ocsc
 *   adoperasional17@gmail.com         → oc
 *   vg.heavenscent@gmail.com          → marketing
 *   recruitmentharumnya@gmail.com     → hr
 *   harumnya.financeku@gmail.com      → finance
 *   timaudiths@gmail.com              → audit
 *   acc.harumnya@gmail.com            → accounting
 *   logistikheavenscent@gmail.com     → logistik
 *   purchasing.heavenscent@gmail.com  → purchasing
 *   kasir.krian@harumnya.com          → cashier      (STR-KRIAN / WH-JATIM)
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
            ['email' => 'itdevelopmenths@gmail.com'],
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
        $rows[] = ['Admin Pusat', 'itdevelopmenths@gmail.com', 'super-admin', 'WH-PUSAT', '-'];

        // ── User back-office per Role ─────────────────────────────────────────
        $roleUsers = [
            ['OCSC',       'compliancesupplychain@gmail.com', 'ocsc'],
            ['OC',         'adoperasional17@gmail.com',       'oc'],
            ['Marketing',  'vg.heavenscent@gmail.com',        'marketing'],
            ['HR',         'recruitmentharumnya@gmail.com',   'hr'],
            ['Finance',    'harumnya.financeku@gmail.com',    'finance'],
            ['Audit',      'timaudiths@gmail.com',            'audit'],
            ['Accounting', 'acc.harumnya@gmail.com',          'accounting'],
            ['Logistik',   'logistikheavenscent@gmail.com',   'logistik'],
            ['Purchasing', 'purchasing.heavenscent@gmail.com','purchasing'],
        ];

        foreach ($roleUsers as [$nama, $email, $roleName]) {
            $role = Role::where('name', $roleName)->first();
            if (! $role) {
                $this->command->warn("⚠ Role {$roleName} tidak ditemukan, skip user {$email}.");
                continue;
            }

            $u = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'                 => $nama,
                    'password'             => bcrypt('password'),
                    'default_warehouse_id' => $whPusat->id,
                    'default_store_id'     => null,
                ]
            );
            if (! $u->wasRecentlyCreated) {
                $u->update(['default_warehouse_id' => $whPusat->id]);
            }
            $u->syncRoles([$role]);
            $rows[] = [$nama, $email, $roleName, 'WH-PUSAT', '-'];
        }

        // ── Kasir per Toko ────────────────────────────────────────────────────

        $cashierMap = [
            ['STR-KRIAN', 'WH-JATIM', 'Kasir Krian', 'harumnyaparfum@gmail.com'],
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
            // Kasir Krian diberi akses refund (spesifik untuk user ini saja)
            if ($email === 'harumnyaparfum@gmail.com') {
                $user->syncPermissions(['transactions-refund']);
            }

            $rows[] = [$nama, $email, 'cashier', $whCode, $storeCode];
        }

        $this->command->info('✓ Users seeded.');
        $this->command->table(['Name', 'Email', 'Role', 'Warehouse', 'Store'], $rows);
        $this->command->info('💡 Default password: password');
    }
}
