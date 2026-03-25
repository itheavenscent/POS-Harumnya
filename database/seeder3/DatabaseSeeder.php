<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Clear Spatie permission cache sebelum seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->call([
            // 000 - Base: Warehouses & Stores
            WarehouseStoreSeeder::class,

            // 001 - Roles & Permissions
            RolePermissionSeeder::class,

            // 002 - Users
            UserSeeder::class,

            // 003 - Master Data
            IntensitySeeder::class,
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
