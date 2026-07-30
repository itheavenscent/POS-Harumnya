<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->call([
            // ── 00. Infrastruktur Laravel ─────────────────────────────────────
            // (cache, jobs, personal_access_tokens sudah di-handle migration)

            // ── 01. Lokasi (root — tidak ada dependency) ──────────────────────
            WarehouseStoreSeeder::class,

            // ── 02. Roles & Permissions ───────────────────────────────────────
            RolePermissionSeeder::class,

            // ── 03. Users (butuh warehouses & stores) ─────────────────────────
            UserSeeder::class,

            // ── 04. Master Dimensi Produk ─────────────────────────────────────
            IntensitySeeder::class,          // sizes + intensities + isp + isq (size, intensitas, harga intensitas)
            // IngredientSupplierSeeder::class, // DINONAKTIFKAN — ingredient + supplier + kategori tak di-seed
            PackagingSeeder::class,          // packaging_materials — dipertahankan (dibutuhkan promo SPINWHEEL)
            // VariantSeeder::class,            // DINONAKTIFKAN — varian tak di-seed

            // ── 05. Store Categories ──────────────────────────────────────────
            // Kategori tetap di-seed; link kategori↔varian otomatis di-skip karena varian tak ada.
            StoreCategorySeeder::class,

            // ── 06. Sales People & Payment Methods ───────────────────────────
            SalesPeopleSeeder::class,
            PaymentMethodSeeder::class,

            // ── 07. Resep & Produk ────────────────────────────────────────────
            // DINONAKTIFKAN — resep butuh ingredients (yang tak lagi di-seed).
            // VariantSeeder sudah membersihkan variant_recipes & product_recipes.
            // VariantRecipeSeeder::class,      // variant_recipes (butuh variants + intensities + ingredients)
            // ProductSeeder::class,            // products + product_recipes (butuh variants + intensities + sizes + ingredients)

            // ── 08. Pembelian & Stok Awal ─────────────────────────────────────
            // PurchaseSeeder::class,           // purchases + purchase_items + stock_movements
            // DINONAKTIFKAN — stok awal tak di-seed
            // StockSeeder::class,              // warehouse/store stock snapshots

            // ── 09. Promo & Diskon ────────────────────────────────────────────
            DiscountSeeder::class,

            // ── 10. Data Penjualan Demo ───────────────────────────────────────
            // SalesSeeder::class,              // sales + sale_items + payments + dll
        ]);
    }
}
