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

            // ── Transactions / POS ───────────────────────────────────────────
            'transactions-access',
            'transactions-create',
            'transactions-void',
            'transactions-refund',
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

        // ── ROLES ──────────────────────────────────────────────────────────────

        // Bersihkan role lama yang tidak terpakai jika ada
        Role::whereNotIn('name', ['super-admin', 'cashier'])->delete();

        // ── Super Admin — akses semua ─────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // ── Kasir — hanya POS & pelanggan, tidak dapat akses dashboard default
        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashier->syncPermissions([
            'dashboard-access',

            // POS
            'transactions-access',
            'transactions-create',

            // Shift Kasir
            'cash-drawers-access',
            'cash-drawers-open',
            'cash-drawers-close',
            'cash-drawers-print',

            // Katalog (read only)
            'products-access',
            'variants-access',
            'intensities-access',
            'sizes-access',
            'packaging-access',

            // Pelanggan
            'customers-access',
            'customers-create',

            // Diskon (lihat saja)
            'discounts-access',

            // Stok (lihat saja)
            'stock-access',
            'stock-store-access',
        ]);

        $this->command->info('✓ Roles & Permissions seeded successfully.');
        $this->command->table(
            ['Role', 'Jumlah Permission'],
            [
                ['super-admin', $superAdmin->permissions()->count()],
                ['cashier',     $cashier->permissions()->count()],
            ]
        );
    }
}
