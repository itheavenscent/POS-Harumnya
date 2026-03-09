<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 000 - Base: Warehouses & Stores
            WarehouseStoreSeeder::class,

            // 001 - Users & Roles
            RolePermissionSeeder::class,
            UserSeeder::class,

            // 002 - Master Data
            IntensitySeeder::class,        // ← hapus duplikat, tinggal satu
            IngredientSupplierSeeder::class,
            PackagingSeeder::class,
            VariantSeeder::class,
            StoreCategorySeeder::class,
            SalesPeopleSeeder::class,
            PaymentMethodSeeder::class,
            DiscountSeeder::class,
        ]);
    }
}
