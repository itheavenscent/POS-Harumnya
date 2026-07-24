<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── PERMISSIONS ────────────────────────────────────────────────────────

        $permissions = [

            // ── Dashboard ────────────────────────────────────────────────────
            'dashboard-access',
            'view-all-stores',   // sinyal scope: lihat data semua toko (bukan hanya toko default)

            // ── Transactions / POS ───────────────────────────────────────────
            'transactions-access',
            'transactions-create',
            'transactions-void',
            'transactions-refund',
            'transactions-cancel',
            'transactions-print',
            'transactions-all',

            // ── Products & Catalog ───────────────────────────────────────────
            'products-access',
            'products-create',
            'products-edit',
            'products-delete',
            'products-recalculate',

            // ── Variants ─────────────────────────────────────────────────────
            'variants-access',
            'variants-create',
            'variants-edit',
            'variants-delete',

            // ── Intensities ──────────────────────────────────────────────────
            'intensities-access',
            'intensities-create',
            'intensities-edit',
            'intensities-delete',

            // ── Sizes ────────────────────────────────────────────────────────
            'sizes-access',
            'sizes-create',
            'sizes-edit',
            'sizes-delete',

            // ── Categories ───────────────────────────────────────────────────
            'categories-access',
            'categories-create',
            'categories-edit',
            'categories-delete',

            // ── Recipes ──────────────────────────────────────────────────────
            'recipes-access',
            'recipes-create',
            'recipes-edit',
            'recipes-delete',
            'recipes-import',

            // ── Ingredients (Bahan Baku) ──────────────────────────────────────
            'ingredients-access',
            'ingredients-create',
            'ingredients-edit',
            'ingredients-delete',

            // ── Packaging (Kemasan) ──────────────────────────────────────────
            'packaging-access',
            'packaging-create',
            'packaging-edit',
            'packaging-delete',

            // ── Suppliers ────────────────────────────────────────────────────
            'suppliers-access',
            'suppliers-create',
            'suppliers-edit',
            'suppliers-delete',

            // ── Warehouses ───────────────────────────────────────────────────
            'warehouses-access',
            'warehouses-create',
            'warehouses-edit',
            'warehouses-delete',

            // ── Stores ───────────────────────────────────────────────────────
            'stores-access',
            'stores-create',
            'stores-edit',
            'stores-delete',

            // ── Store Categories ─────────────────────────────────────────────
            'store-categories-access',
            'store-categories-create',
            'store-categories-edit',
            'store-categories-delete',

            // ── Purchases (Purchase Order) ───────────────────────────────────
            'purchases-access',
            'purchases-create',
            'purchases-edit',
            'purchases-delete',
            'purchases-submit',
            'purchases-approve',
            'purchases-receive',
            'purchases-complete',
            'purchases-cancel',

            // ── Stock Management ─────────────────────────────────────────────
            'stock-access',
            'stock-warehouse-access',
            'stock-store-access',
            'stock-transfer',
            'stock-adjustment',
            'stock-repack',

            // ── Repacks (Produksi) ───────────────────────────────────────────
            'repacks-access',
            'repacks-create',
            'repacks-edit',
            'repacks-delete',
            'repacks-complete',
            'repacks-cancel',

            // ── Customers ────────────────────────────────────────────────────
            'customers-access',
            'customers-create',
            'customers-edit',
            'customers-delete',
            'customers-export',

            // ── Sales People ─────────────────────────────────────────────────
            'sales-people-access',
            'sales-people-create',
            'sales-people-edit',
            'sales-people-delete',

            // ── Discounts (Promo) ─────────────────────────────────────────────
            'discounts-access',
            'discounts-create',
            'discounts-edit',
            'discounts-delete',

            // ── Cash Drawers (Shift) ─────────────────────────────────────────
            'cash-drawers-access',
            'cash-drawers-open',
            'cash-drawers-close',
            'cash-drawers-print',

            // ── Payment Methods ───────────────────────────────────────────────
            'payment-methods-access',
            'payment-methods-create',
            'payment-methods-edit',
            'payment-methods-delete',

            // ── Payment Settings ─────────────────────────────────────────────
            'payment-settings-access',

            // ── Reports ───────────────────────────────────────────────────────
            'reports-access',
            'reports-sales',
            'reports-stock',
            'reports-finance',
            'profits-access',

            // ── Users ─────────────────────────────────────────────────────────
            'users-access',
            'users-create',
            'users-update',
            'users-delete',

            // ── Roles ─────────────────────────────────────────────────────────
            'roles-access',
            'roles-create',
            'roles-update',
            'roles-delete',

            // ── Permissions ───────────────────────────────────────────────────
            'permissions-access',

            // ── Settings (general) ────────────────────────────────────────────
            'settings-access',
            'settings-stores',
            'settings-warehouses',
            'settings-users',
            'settings-roles',
            'settings-payment-methods',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ── GRUP PERMISSION (reusable) ─────────────────────────────────────────

        $reportsSales   = ['reports-access', 'reports-sales'];
        $reportsFinance = ['reports-finance', 'profits-access'];
        $reportsStock   = ['reports-stock'];

        $transaksiView  = ['transactions-access', 'transactions-all', 'transactions-print'];
        $shiftView      = ['cash-drawers-access', 'cash-drawers-print'];

        // Lokasi (lihat semua)
        $locationAll = [
            'stores-access', 'warehouses-access',
            'store-categories-access', 'categories-access',
        ];
        // Lokasi & tempat (kelola toko + kategori toko)
        $locationManage = [
            'stores-access', 'stores-create', 'stores-edit', 'stores-delete',
            'store-categories-access', 'store-categories-create', 'store-categories-edit', 'store-categories-delete',
        ];

        // Manajemen stok penuh
        $stockAll = [
            'stock-access', 'stock-warehouse-access', 'stock-store-access',
            'stock-transfer', 'stock-adjustment', 'stock-repack',
            'repacks-access', 'repacks-create', 'repacks-edit', 'repacks-delete', 'repacks-complete', 'repacks-cancel',
        ];
        // Manajemen stok tanpa produksi (repack) & tanpa transfer
        $stockNoProdNoTransfer = [
            'stock-access', 'stock-warehouse-access', 'stock-store-access', 'stock-adjustment',
        ];

        // Bahan baku & produk (penuh)
        $bahanProduk = [
            'ingredients-access', 'ingredients-create', 'ingredients-edit', 'ingredients-delete',
            'packaging-access', 'packaging-create', 'packaging-edit', 'packaging-delete',
            'products-access', 'products-create', 'products-edit', 'products-delete', 'products-recalculate',
        ];

        // Master data varian
        $masterVarian = [
            'variants-access', 'variants-create', 'variants-edit', 'variants-delete',
            'intensities-access', 'intensities-create', 'intensities-edit', 'intensities-delete',
            'sizes-access', 'sizes-create', 'sizes-edit', 'sizes-delete',
            'categories-access', 'categories-create', 'categories-edit', 'categories-delete',
            'recipes-access', 'recipes-create', 'recipes-edit', 'recipes-delete', 'recipes-import',
        ];

        // Purchase order penuh + supplier
        $purchaseAll = [
            'purchases-access', 'purchases-create', 'purchases-edit', 'purchases-delete',
            'purchases-submit', 'purchases-approve', 'purchases-receive', 'purchases-complete', 'purchases-cancel',
            'suppliers-access', 'suppliers-create', 'suppliers-edit', 'suppliers-delete',
        ];

        $paymentMethods = [
            'payment-methods-access', 'payment-methods-create', 'payment-methods-edit', 'payment-methods-delete',
            'payment-settings-access',
        ];

        $discountsAll = ['discounts-access', 'discounts-create', 'discounts-edit', 'discounts-delete'];
        $customersAll = ['customers-access', 'customers-create', 'customers-edit', 'customers-delete', 'customers-export'];
        $salesPeopleAll = ['sales-people-access', 'sales-people-create', 'sales-people-edit', 'sales-people-delete'];

        $merge = fn (...$groups) => array_values(array_unique(array_merge(...$groups)));

        // ── ROLES ──────────────────────────────────────────────────────────────

        $roleMatrix = [

            // Accounting (Reporting)
            'accounting' => $merge(
                ['dashboard-access'],
                $reportsSales, $reportsFinance, $reportsStock,   // + Laporan Mutasi Bahan & Kemasan
                $transaksiView, $shiftView,
                $locationManage, $locationAll,
                ['transactions-cancel'],
            ),

            // Finance
            'finance' => $merge(
                ['dashboard-access'],
                $reportsSales, $reportsFinance, $reportsStock,
                $transaksiView, $shiftView,
                ['transactions-cancel'],
                $paymentMethods,
                $locationAll,
            ),

            // Logistik (Gudang)
            'logistik' => $merge(
                ['dashboard-access'],
                $stockAll,
                $reportsSales, $reportsStock,
                $locationAll,
                $bahanProduk,
                $masterVarian,
            ),

            // Purchasing
            'purchasing' => $merge(
                ['dashboard-access'],
                $purchaseAll,
                $stockAll,
                $reportsSales, $reportsStock,
                $locationAll,
                $bahanProduk,
                $masterVarian,
            ),

            // OCSC — stok semua kecuali produksi & transfer
            'ocsc' => $merge(
                ['dashboard-access'],
                $stockNoProdNoTransfer,
                $bahanProduk,
                $locationAll,
                $reportsSales, $reportsStock,
            ),

            // OC
            'oc' => $merge(
                ['dashboard-access'],
                $reportsSales,
                $transaksiView,
                $locationAll,
            ),

            // Marketing
            'marketing' => $merge(
                ['dashboard-access'],
                $discountsAll,                    // Promo & diskon + Hadiah/Reward (reward pakai discounts-*)
                $customersAll,
                $transaksiView,
                $reportsSales,
                $locationAll,
            ),

            // HR
            'hr' => $merge(
                ['dashboard-access'],
                $salesPeopleAll,
                $locationAll,
            ),
        ];

        // Bersihkan role lama yang tidak terpakai (kecuali yang dikelola di sini + super-admin + cashier)
        $managedRoles = array_merge(array_keys($roleMatrix), ['super-admin', 'cashier']);
        Role::whereNotIn('name', $managedRoles)->delete();

        // ── Super Admin — akses semua ─────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // ── Cashier / Sales — POS di tokonya + laporan penjualan + fulfillment + sales ranking
        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashier->syncPermissions($merge(
            ['dashboard-access'],
            // POS / Transaksi (fulfillment pakai transactions-*) — scoped ke toko sendiri
            ['transactions-access', 'transactions-create', 'transactions-print'],
            // Shift Kasir
            ['cash-drawers-access', 'cash-drawers-open', 'cash-drawers-close', 'cash-drawers-print'],
            // Laporan penjualan
            $reportsSales,
            // Katalog (read only)
            ['products-access', 'variants-access', 'intensities-access', 'sizes-access', 'packaging-access'],
            // Pelanggan
            ['customers-access', 'customers-create'],
            // Diskon (lihat)
            ['discounts-access'],
            // Stok toko (lihat)
            ['stock-access', 'stock-store-access'],
            // Sales (ranking produktivitas)
            ['sales-people-access'],
        ));

        // ── Buat/sinkronkan role bermatriks ───────────────────────────────────
        $summaryRows = [
            ['super-admin', $superAdmin->permissions()->count()],
            ['cashier',     $cashier->permissions()->count()],
        ];

        foreach ($roleMatrix as $roleName => $perms) {
            // Semua role back-office boleh lihat data semua toko.
            $perms = $merge($perms, ['view-all-stores']);
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($perms);
            $summaryRows[] = [$roleName, $role->permissions()->count()];
        }

        $this->command->info('✓ Roles & Permissions seeded successfully.');
        $this->command->table(['Role', 'Jumlah Permission'], $summaryRows);
    }
}
