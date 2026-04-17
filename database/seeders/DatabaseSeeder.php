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
            IntensitySeeder::class,          // sizes + intensities + isp + isq
            IngredientSupplierSeeder::class, // ingredient_categories + suppliers + ingredients
            PackagingSeeder::class,          // packaging_categories + packaging_materials
            VariantSeeder::class,            // variants

            // ── 05. Store Categories (butuh variants) ─────────────────────────
            StoreCategorySeeder::class,

            // ── 06. Sales People & Payment Methods ───────────────────────────
            SalesPeopleSeeder::class,
            PaymentMethodSeeder::class,

            // ── 07. Resep & Produk ────────────────────────────────────────────
            VariantRecipeSeeder::class,      // variant_recipes (butuh variants + intensities + ingredients)
            ProductSeeder::class,            // products + product_recipes (butuh variants + intensities + sizes + ingredients)

            // ── 08. Pembelian & Stok Awal ─────────────────────────────────────
            // PurchaseSeeder::class,           // purchases + purchase_items + stock_movements
            // StockSeeder::class,              // warehouse/store stock snapshots

            // ── 09. Promo & Diskon ────────────────────────────────────────────
            DiscountSeeder::class,

            // ── 10. Data Penjualan Demo ───────────────────────────────────────
            // SalesSeeder::class,              // sales + sale_items + payments + dll
        ]);
    }
}
