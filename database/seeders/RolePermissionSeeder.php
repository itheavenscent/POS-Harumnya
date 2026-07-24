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

        // Daftar semua role yang dikelola seeder ini. Role lain di luar daftar
        // (mis. sisa data lama) akan dihapus agar konsisten.
        $managedRoles = [
            'super-admin', 'cashier',
            'accounting', 'finance', 'logistik', 'purchasing',
            'ocsc', 'oc', 'marketing', 'hr',
        ];
        Role::whereNotIn('name', $managedRoles)->delete();

        // ── Kumpulan permission yang dipakai berulang ─────────────────────────

        // Lokasi & Tempat (semua)
        $lokasiAll = [
            'warehouses-access',
            'stores-access',
            'store-categories-access',
        ];

        // Bahan Baku & Produk (semua aksi)
        $bahanProdukAll = [
            'ingredients-access', 'ingredients-create', 'ingredients-edit', 'ingredients-delete',
            'packaging-access',   'packaging-create',   'packaging-edit',   'packaging-delete',
            'recipes-access',     'recipes-create',     'recipes-edit',     'recipes-delete', 'recipes-import',
            'products-access',    'products-edit',      'products-recalculate',
        ];

        // Master Data — Varian
        $masterVarian = [
            'variants-access', 'variants-create', 'variants-edit', 'variants-delete',
        ];

        // Manajemen Stok (semua)
        $stokAll = [
            'stock-access', 'stock-warehouse-access', 'stock-store-access',
            'stock-transfer', 'stock-adjustment', 'stock-repack',
            'repacks-access', 'repacks-create', 'repacks-edit', 'repacks-delete',
            'repacks-complete', 'repacks-cancel',
        ];

        // Manajemen Stok tanpa Produksi (repack) & Transfer Stok — untuk OCSC
        $stokNoProdTransfer = [
            'stock-access', 'stock-warehouse-access', 'stock-store-access',
            'stock-adjustment',
        ];

        // ── Super Admin — akses semua ─────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // ── Accounting (Reporting) ────────────────────────────────────────────
        // Dashboard, Laporan (penjualan+keuangan), Transaksi, Cancel order, Lokasi all
        $accounting = Role::firstOrCreate(['name' => 'accounting']);
        $accounting->syncPermissions(array_merge([
            'dashboard-access',
            'reports-access',            // Laporan Penjualan
            'profits-access',            // Laporan Keuangan
            'reports-stock',             // Laporan Mutasi Bahan & Kemasan
            'transactions-access',       // Riwayat Transaksi + Histori Shift
            'transactions-void',         // Cancel order
        ], $lokasiAll));

        // ── Finance ───────────────────────────────────────────────────────────
        // Dashboard, Laporan all, Transaksi all, Metode pembayaran, Lokasi all
        $finance = Role::firstOrCreate(['name' => 'finance']);
        $finance->syncPermissions(array_merge([
            'dashboard-access',
            'reports-access',            // Laporan Penjualan
            'profits-access',            // Laporan Keuangan
            'reports-stock',             // Laporan Mutasi
            'transactions-access',
            'transactions-void',
            'transactions-refund',
            'transactions-all',
            'payment-methods-access',
        ], $lokasiAll));

        // ── Logistik (Gudang) ─────────────────────────────────────────────────
        // Dashboard, Stok all, Laporan (penjualan+mutasi), Lokasi all,
        // Bahan Baku & Produk all, Master Varian
        $logistik = Role::firstOrCreate(['name' => 'logistik']);
        $logistik->syncPermissions(array_merge(
            [
                'dashboard-access',
                'reports-access',        // Laporan Penjualan
                'reports-stock',         // Laporan Mutasi
            ],
            $stokAll,
            $lokasiAll,
            $bahanProdukAll,
            $masterVarian,
        ));

        // ── Purchasing ────────────────────────────────────────────────────────
        // Sama seperti Logistik + Purchase Order (full)
        $purchasing = Role::firstOrCreate(['name' => 'purchasing']);
        $purchasing->syncPermissions(array_merge(
            [
                'dashboard-access',
                'reports-access',
                'reports-stock',
                'purchases-access', 'purchases-create', 'purchases-edit', 'purchases-delete',
                'purchases-submit', 'purchases-approve', 'purchases-receive',
                'purchases-complete', 'purchases-cancel',
            ],
            $stokAll,
            $lokasiAll,
            $bahanProdukAll,
            $masterVarian,
        ));

        // ── OCSC ──────────────────────────────────────────────────────────────
        // Stok (all kecuali produksi & transfer), Bahan & Produk all, Lokasi all,
        // Laporan (penjualan+mutasi)
        $ocsc = Role::firstOrCreate(['name' => 'ocsc']);
        $ocsc->syncPermissions(array_merge(
            [
                'dashboard-access',
                'reports-access',
                'reports-stock',
            ],
            $stokNoProdTransfer,
            $lokasiAll,
            $bahanProdukAll,
        ));

        // ── OC ────────────────────────────────────────────────────────────────
        // Dashboard, Laporan penjualan, Riwayat transaksi, Lokasi all
        $oc = Role::firstOrCreate(['name' => 'oc']);
        $oc->syncPermissions(array_merge([
            'dashboard-access',
            'reports-access',            // Laporan Penjualan
            'transactions-access',       // Riwayat Transaksi
        ], $lokasiAll));

        // ── Marketing ─────────────────────────────────────────────────────────
        // Promo & diskon, Hadiah/Reward, Pelanggan, Riwayat transaksi,
        // Laporan penjualan, Lokasi all
        $marketing = Role::firstOrCreate(['name' => 'marketing']);
        $marketing->syncPermissions(array_merge([
            'dashboard-access',
            'discounts-access', 'discounts-create', 'discounts-edit', 'discounts-delete', // Promo + Hadiah/Reward
            'customers-access', 'customers-create', 'customers-edit', 'customers-delete', 'customers-export',
            'transactions-access',       // Riwayat Transaksi
            'reports-access',            // Laporan Penjualan
        ], $lokasiAll));

        // ── HR ────────────────────────────────────────────────────────────────
        // Dashboard, Sales, Lokasi all
        $hr = Role::firstOrCreate(['name' => 'hr']);
        $hr->syncPermissions(array_merge([
            'dashboard-access',
            'sales-people-access', 'sales-people-create', 'sales-people-edit', 'sales-people-delete',
        ], $lokasiAll));

        // ── Kasir / Sales ─────────────────────────────────────────────────────
        // Dashboard (toko sendiri), Transaksi all, Laporan penjualan, Fulfillment,
        // Sales (ranking produktivitas). POS diakses via redirect ke transactions.
        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashier->syncPermissions([
            'dashboard-access',

            // POS / Transaksi (semua aksi transaksi)
            'transactions-access',       // POS, Riwayat, Fulfillment (pos.fulfillment.*)
            'transactions-create',
            'transactions-void',
            'transactions-refund',

            // Shift Kasir
            'cash-drawers-access',
            'cash-drawers-open',
            'cash-drawers-close',
            'cash-drawers-print',

            // Laporan Penjualan
            'reports-access',

            // Sales — Ranking Produktivitas
            'sales-people-access',

            // Pelanggan (dibutuhkan saat transaksi POS)
            'customers-access',
            'customers-create',
        ]);

        $this->command->info('✓ Roles & Permissions seeded successfully.');
        $this->command->table(
            ['Role', 'Jumlah Permission'],
            [
                ['super-admin', $superAdmin->permissions()->count()],
                ['accounting',  $accounting->permissions()->count()],
                ['finance',     $finance->permissions()->count()],
                ['logistik',    $logistik->permissions()->count()],
                ['purchasing',  $purchasing->permissions()->count()],
                ['ocsc',        $ocsc->permissions()->count()],
                ['oc',          $oc->permissions()->count()],
                ['marketing',   $marketing->permissions()->count()],
                ['hr',          $hr->permissions()->count()],
                ['cashier',     $cashier->permissions()->count()],
            ]
        );
    }
}
