# Dokumentasi Teknis Per File

Dokumen ini melengkapi `DOKUMENTASI_SISTEM.md` dengan katalog teknis per controller, model, migration, dan view React/Inertia.

Catatan:

- "View" pada project ini mayoritas adalah halaman React di `resources/js/Pages` yang dirender melalui Inertia.
- `resources/views/app.blade.php` adalah root Blade template untuk Inertia.
- API route saat dokumen ini dibuat masih kosong, sehingga controller yang aktif terutama berasal dari `routes/web.php`.

## 1. Controller

### 1.1 Controller Inti

| File | Tanggung jawab | Method penting |
|---|---|---|
| `app/Http/Controllers/Controller.php` | Base controller Laravel. | - |
| `app/Http/Controllers/DashboardController.php` | Dashboard KPI, grafik, ranking, stok rendah, transaksi terbaru, performa toko. | `index` |
| `app/Http/Controllers/ProfileController.php` | Edit profil, update profil, hapus akun. | `edit`, `update`, `destroy` |
| `app/Http/Controllers/UserController.php` | Manajemen user, role, default warehouse, default store. | `index`, `create`, `store`, `edit`, `update`, `destroy` |
| `app/Http/Controllers/RoleController.php` | Manajemen role Spatie dan sinkronisasi permission. | `index`, `store`, `update`, `destroy` |
| `app/Http/Controllers/PermissionController.php` | Daftar permission dan skeleton CRUD permission. | `index`, `create`, `store`, `show`, `edit`, `update`, `destroy` |

### 1.2 Auth Controller

| File | Tanggung jawab | Method penting |
|---|---|---|
| `AuthenticatedSessionController.php` | Login, proses login, logout. | `create`, `store`, `destroy` |
| `ConfirmablePasswordController.php` | Konfirmasi password ulang. | `show`, `store` |
| `EmailVerificationNotificationController.php` | Kirim ulang email verifikasi. | `store` |
| `EmailVerificationPromptController.php` | Halaman prompt verifikasi email. | `__invoke` |
| `NewPasswordController.php` | Reset password dengan token. | `create`, `store` |
| `PasswordController.php` | Update password user login. | `update` |
| `PasswordResetLinkController.php` | Form dan pengiriman link reset password. | `create`, `store` |
| `RegisteredUserController.php` | Registrasi user baru. | `create`, `store` |
| `VerifyEmailController.php` | Verifikasi email. | `__invoke` |

### 1.3 Master Data Controller

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Apps/VariantController.php` | CRUD varian parfum, memakai `VariantService`. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/IntensityController.php` | CRUD intensitas dan komposisi volume per size. | `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/SizeController.php` | CRUD size/volume parfum. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/IntensitySizePriceController.php` | Harga kombinasi intensitas dan size. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/SupplierController.php` | CRUD supplier, restore, toggle status, generate kode. | `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, `restore`, `toggleStatus`, `generateCode` |
| `Apps/CategoryController.php` | CRUD kategori produk lama/umum. | `index`, `create`, `store`, `edit`, `update`, `destroy` |

### 1.4 Bahan, Kemasan, Produk, Resep

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Apps/IngredientController.php` | CRUD bahan baku dan kategori bahan. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `storeCategory`, `updateCategory`, `destroyCategory` |
| `Apps/PackagingController.php` | CRUD kemasan/material dan kategori kemasan. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `storeCategory`, `updateCategory`, `destroyCategory` |
| `Apps/ProductController.php` | Daftar produk hasil resep, detail, toggle aktif, recalculation biaya. | `index`, `show`, `toggleActive`, `recalculate` |
| `Apps/RecipeController.php` | CRUD resep varian-intensitas, generate produk, import resep. | `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, `generateProducts`, `importTemplate`, `importIndex`, `importValidate`, `importStore` |
| `Apps/RecipeImportController.php` | Import resep dari template terpisah. | `downloadTemplate`, `validate`, `import` |

### 1.5 Lokasi Dan Stok

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Apps/WarehouseController.php` | CRUD gudang. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/StoreController.php` | CRUD toko/cabang dan kategori toko. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `bulkDelete` |
| `Apps/StoreCategoryController.php` | CRUD kategori toko, toggle aktif, pengaturan varian per kategori. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `toggle`, `variants`, `syncVariants` |
| `Apps/WarehouseStockController.php` | Stok ingredient/packaging di gudang. | `index`, `create`, `store`, `edit`, `update`, `destroy` |
| `Apps/StoreStockController.php` | Stok ingredient/packaging di toko, detail movement. | `index`, `show`, `create`, `store`, `edit`, `update`, `destroy` |
| `Apps/StockMovementController.php` | Audit log movement stok. | `index`, `show` |
| `Apps/StockTransferController.php` | Workflow transfer stok antar lokasi. | `index`, `create`, `store`, `show`, `edit`, `update`, `submit`, `approve`, `send`, `receive`, `cancel`, `destroy` |
| `Apps/StockAdjustmentController.php` | Workflow stock opname/adjustment. | `index`, `create`, `createDelta`, `store`, `show`, `edit`, `update`, `submit`, `approve`, `complete`, `cancel`, `destroy`, `getCurrentStock` |
| `Apps/RepackController.php` | Workflow produksi/repack ingredient. | `index`, `create`, `store`, `show`, `edit`, `update`, `complete`, `cancel`, `destroy` |

### 1.6 Pembelian, Penjualan, POS, Shift

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Apps/PurchaseController.php` | Workflow PO dari draft sampai stok masuk dan WAC update. | `index`, `create`, `store`, `show`, `edit`, `update`, `submit`, `approve`, `receive`, `complete`, `cancel`, `destroy` |
| `Apps/TransactionController.php` | POS utama web: cart, custom order, price lookup, hold/resume, checkout, print, eligible discount. | `index`, `getCustomPrice`, `addCustomToCart`, `history`, `print`, `getVariantsForIntensity`, `getVariantsForPOS`, `getIntensitiesForVariant`, `getVariantsForCustom`, `getAvailableSizes`, `getPerfumePrice`, `addToCart`, `updateCart`, `destroyCart`, `holdCart`, `resumeHeldCart`, `deleteHeldCart`, `store`, `checkEligibleDiscounts`, `addRewardToCart` |
| `Apps/POSController.php` | POS controller versi lain/legacy dengan cart, checkout, customer, discount. | `index`, `getIntensities`, `getSizes`, `getPerfumePrice`, `addToCart`, `updateCart`, `destroyCart`, `addPackaging`, `removePackaging`, `holdCart`, `resumeCart`, `deleteHeld`, `store`, `storeCustomer`, `searchCustomers`, `checkDiscounts` |
| `Apps/POS/POSFeatureController.php` | Fitur kasir selain kasir utama: stok toko view-only, histori transaksi toko, fulfillment transfer. | `stock`, `transactions`, `fulfillmentIndex`, `fulfillmentShow`, `fulfillmentReceive` |
| `Apps/CashDrawerController.php` | Buka/tutup shift, cash in/out, histori shift, cetak rekap. | `current`, `open`, `close`, `storeTransaction`, `index`, `show`, `printRecap` |
| `Apps/SaleController.php` | Controller kosong/skeleton untuk sale. | - |

### 1.7 Customer, Sales, Promo, Payment, Settings

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Apps/CustomerController.php` | CRUD customer, export, tambah customer via AJAX. | `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, `export`, `storeAjax` |
| `Apps/SalesPersonController.php` | CRUD sales person, target sales, ranking produktivitas. | `index`, `create`, `store`, `edit`, `update`, `destroy`, `targets`, `storeTarget`, `productivity` |
| `Apps/DiscountController.php` | CRUD promo/diskon beserta syarat dan reward. | `index`, `create`, `store`, `edit`, `update`, `destroy` |
| `Apps/RewardItemController.php` | Master hadiah/reward item. | `index`, `store`, `update`, `destroy`, `toggle`, `apiList` |
| `Apps/PaymentMethodController.php` | CRUD metode pembayaran dan toggle aktif. | `index`, `create`, `store`, `edit`, `update`, `toggle`, `destroy` |
| `Apps/PaymentSettingController.php` | Pengaturan payment gateway. | `edit`, `update` |
| `Apps/AppSettingController.php` | Pengaturan aplikasi umum. | `index`, `update` |

### 1.8 Laporan

| File | Tanggung jawab | Method penting |
|---|---|---|
| `Laporan/LaporanPenjualanController.php` | Laporan penjualan lengkap dan export Excel. | `index`, `exportExcel` |
| `Laporan/LaporanKeuanganController.php` | Laporan revenue, COGS, profit, margin, payment, export Excel. | `index`, `exportExcel` |
| `Laporan/LaporanMutasiController.php` | Laporan mutasi stok bahan/kemasan dan export Excel. | `index`, `exportExcel` |
| `Reports/SalesReportController.php` | Laporan sales versi report lama/alternatif. | `index` |
| `Reports/ProfitReportController.php` | Laporan profit versi report lama/alternatif. | `index` |

## 2. Model

### 2.1 User, Lokasi, Supplier

| Model | Tabel/konsep | Fungsi utama |
|---|---|---|
| `User` | `users` | User aplikasi, relasi default store/warehouse, role permission, helper super admin. |
| `Warehouse` | `warehouses` | Master gudang, status, kontak, scope search/active/ordered. |
| `Store` | `stores` | Master toko, kategori toko, stok toko, sales people, allowed variants. |
| `StoreCategory` | `store_categories` | Kategori toko, mode all/specific variants, relasi stores dan variants. |
| `Supplier` | `suppliers` | Supplier bahan/kemasan, term pembayaran, limit kredit, status aktif. |

### 2.2 Master Produk, Bahan, Kemasan

| Model | Tabel/konsep | Fungsi utama |
|---|---|---|
| `Category` | `categories` | Kategori produk lama/umum. |
| `Variant` | `variants` | Varian parfum, image URL, gender, search, active scope. |
| `Intensity` | `intensities` | Intensitas parfum, rasio oil/alcohol, size quantities, concentration label. |
| `Size` | `sizes` | Ukuran parfum, volume label, kategori size, scope active/search. |
| `IntensitySizePrice` | `intensity_size_prices` | Harga per intensitas-size, formatted price, active/search/ordered scope. |
| `IntensitySizeQuantity` | `intensity_size_quantities` | Target volume oil/alcohol/other per intensitas-size dan scaling quantity. |
| `IngredientCategory` | `ingredient_categories` | Kategori bahan dengan tipe `oil`, `alcohol`, `other`. |
| `Ingredient` | `ingredients` | Master bahan baku, relasi kategori, resep varian/produk, image URL, WAC. |
| `IngredientRecipe` | ingredient compound | Relasi ingredient compound ke base ingredient. |
| `PackagingCategory` | `packaging_categories` | Kategori kemasan. |
| `PackagingMaterial` | `packaging_materials` | Material kemasan/addon, harga jual efektif, margin, profit per unit, stok gudang/toko. |
| `Product` | `products` | Produk siap jual per varian-intensitas-size, resep, production cost, availability. |
| `ProductRecipe` | `product_recipes` | Bahan penyusun produk, cost per bahan, formatted quantity/cost. |
| `VariantRecipe` | `variant_recipes` | Resep varian per intensitas, scaling terhadap size/volume. |
| `CustomOrderPricingRule` | `custom_order_pricing_rules` | Aturan minimum/maksimum oil custom order per varian/global. |

### 2.3 Stok Dan Movement

| Model | Tabel/konsep | Fungsi utama |
|---|---|---|
| `WarehouseIngredientStock` | `warehouse_ingredient_stocks` | Stok bahan di gudang, WAC, low/out/over stock, total value. |
| `WarehousePackagingStock` | `warehouse_packaging_stocks` | Stok kemasan di gudang, WAC, status stok. |
| `StoreIngredientStock` | `store_ingredient_stocks` | Stok bahan di toko, WAC, last in/out, status stok. |
| `StorePackagingStock` | `store_packaging_stocks` | Stok kemasan di toko, WAC, status stok. |
| `StockMovement` | `stock_movements` | Audit utama pergerakan stok, scope lokasi/item/reference, helper in/out. |
| `StockMovementItem` | stock movement detail lama | Detail item movement alternatif/legacy. |
| `StockTransfer` | `stock_transfers` | Header transfer stok, status workflow, creator/approver/sender/receiver. |
| `StockTransferItem` | `stock_transfer_items` | Detail item transfer, quantity requested/sent/received dan item name accessor. |
| `StockAdjustment` | `stock_adjustments` | Header adjustment, type/status label, surplus/shortage, workflow guard. |
| `StockAdjustmentItem` | `stock_adjustment_items` | Detail item adjustment, physical/system/difference, direction. |
| `RepackTransaction` | `repack_transactions` | Header repack/produksi, output ingredient, output cost, status. |
| `RepackTransactionItem` | `repack_transaction_items` | Ingredient input repack beserta qty dan cost. |

### 2.4 Pembelian, POS, Penjualan, Customer

| Model | Tabel/konsep | Fungsi utama |
|---|---|---|
| `Purchase` | `purchases` | Header PO, supplier, destination, status workflow, number generator. |
| `PurchaseItem` | `purchase_items` | Detail PO, received quantity, item name/code/unit accessor. |
| `Cart` | `carts` | Keranjang POS aktif/hold, item reguler/custom/reward, relasi packaging. |
| `CartPackaging` | `cart_packagings` | Packaging yang menempel pada cart, subtotal accessor. |
| `Customer` | `customers` | Customer, tier, points, sales, point ledger, sync after sale. |
| `CustomerPointLedger` | `customer_point_ledgers` | Ledger poin customer, earn/redeem/expired, polymorphic reference. |
| `Sale` | `sales` | Header invoice, store, cashier, customer, sales person, items, discounts, payments, cash drawer. |
| `SaleItem` | `sale_items` | Detail item invoice, snapshot product/variant/intensity/size/custom/reward. |
| `SaleItemPackaging` | `sale_item_packagings` | Packaging pada sale item, COGS dan margin packaging. |
| `SaleDiscount` | `sale_discounts` | Diskon yang diterapkan pada sale. |
| `SalePayment` | `sale_payments` | Pembayaran invoice, snapshot payment method. |
| `PaymentMethod` | `payment_methods` | Master metode pembayaran, type label, admin fee, helper cash. |
| `CashDrawer` | `cash_drawers` | Shift kasir, starting/ending cash, status, relasi sales. |
| `CashDrawerTransaction` | `cash_drawer_transactions` | Cash in/cash out dalam shift. |
| `SalesPerson` | `sales_people` | Sales person per toko, target, active scope. |
| `SalesTarget` | `sales_targets` | Target sales bulanan/periode. |

### 2.5 Promo, Reward, Settings, Legacy

| Model | Tabel/konsep | Fungsi utama |
|---|---|---|
| `DiscountType` | `discount_types` | Header promo, active/currently valid scope, type label, relasi requirements/rewards/stores. |
| `DiscountApplicability` | `discount_applicabilities` | Batas item yang bisa dikenai promo. |
| `DiscountRequirement` | `discount_requirements` | Syarat promo per varian/intensitas/size/quantity/group. |
| `DiscountReward` | `discount_rewards` | Reward promo berupa varian, poin, atau reward item. |
| `DiscountRewardPool` | `discount_reward_pools` | Pool reward untuk game/spin/reward acak. |
| `DiscountStore` | `discount_stores` | Mapping promo ke toko. |
| `DiscountUsage` | `discount_usages` | Riwayat penggunaan promo. |
| `RewardItem` | `reward_items` | Master hadiah non-parfum, stok hadiah, cost, image, category label. |
| `PaymentSetting` | `payment_settings` | Config Midtrans/Xendit, enabled gateway, readiness check. |
| `AppSetting` | `app_settings` | Key-value setting aplikasi umum. |
| `Transaction` | legacy `transactions` | Model transaksi lama/alternatif, relasi details/customer/cashier/profits. |
| `TransactionDetail` | legacy transaction detail | Detail transaksi lama/alternatif. |
| `Profit` | legacy profit | Profit terkait transaction legacy. |

## 3. Migration

| Migration | Tabel/perubahan | Fungsi |
|---|---|---|
| `0001_01_01_000000_create_locations_table.php` | `warehouses`, `stores` | Master lokasi gudang dan toko. |
| `0001_01_01_000000_create_users_table.php` | `users`, `password_reset_tokens`, `sessions` | User, session, reset password, default warehouse/store. |
| `0001_01_01_000001_create_cache_table.php` | `cache`, `cache_locks` | Cache Laravel. |
| `0001_01_01_000001_create_ingredients_table.php` | `ingredient_categories`, `suppliers`, `ingredients` | Master kategori bahan, supplier, bahan baku. |
| `0001_01_01_000001_create_packaging.php` | `packaging_categories`, `packaging_materials` | Master kategori dan material kemasan. |
| `0001_01_01_000002_create_jobs_table.php` | `jobs`, `job_batches`, `failed_jobs` | Queue Laravel. |
| `2024_01_01_000001_create_variants_table.php` | `variants`, `intensities`, `sizes`, `intensity_size_prices`, `intensity_size_quantities`, `variant_recipes`, `products`, `product_recipes` | Struktur katalog parfum, harga, resep, produk. |
| `2024_01_01_000010_create_location stock_table.php` | `warehouse_ingredient_stocks`, `warehouse_packaging_stocks`, `store_ingredient_stocks`, `store_packaging_stocks` | Stok per lokasi dan jenis item. |
| `2024_01_01_000012_create_discount_types_table.php` | `discount_types`, `discount_applicabilities`, `discount_stores`, `discount_requirements`, `discount_rewards`, `discount_reward_pools`, `discount_usages` | Struktur promo/diskon/reward. |
| `2024_01_01_000015_create_purchase_table.php` | `purchases`, `purchase_items` | Purchase order dan item pembelian. |
| `2024_01_01_000017_create_repack_batches_table.php` | `stock_transfers`, `stock_transfer_items`, `stock_adjustments`, `stock_adjustment_items`, `stock_movements`, `repack_transactions`, `repack_transaction_items` | Transfer stok, adjustment, movement, repack. |
| `2024_06_13_082620_create_permission_tables.php` | Spatie permission tables | Role, permission, pivot model/role/permission. |
| `2024_06_13_131744_sales_people.php` | `sales_people`, `sales_targets` | Sales person dan target sales. |
| `2024_06_13_133948_create_carts_table.php` | `payment_methods`, `customers`, `customer_point_ledgers`, `carts`, `cart_packagings`, `cart_discounts`, `cart_payments`, `sales`, `sale_items`, `sale_item_packagings`, `sale_discounts`, `sale_payments`, `sale_returns`, `sale_return_items` | Struktur POS, cart, customer, invoice, payment, return. |
| `2025_11_19_172334_create_payment_settings_table.php` | `payment_settings` | Konfigurasi payment gateway. |
| `2026_02_18_152144_create_store_categories_table.php` | `store_categories`, `store_category_variants` | Kategori toko dan filter varian per kategori. |
| `2026_03_04_024713_create_personal_access_tokens_table.php` | `personal_access_tokens` | Token Laravel Sanctum. |
| `2026_03_09_060515_alter_gross_margin_percentage_in_products_table.php` | Ubah kolom margin product | Penyesuaian presisi margin produk. |
| `2026_03_17_020227_add_custom_order_support.php` | Kolom custom order pada cart/sale item, `custom_order_pricing_rules` | Dukungan POS custom order oil/alcohol. |
| `2026_03_31_074740_create_cash_drawers_table.php` | `cash_drawers` | Shift kasir. |
| `2026_03_31_074745_add_cash_drawer_id_to_sales_table.php` | `sales.cash_drawer_id` | Menghubungkan invoice ke shift kasir. |
| `2026_04_06_084649_create_app_settings_table.php` | `app_settings` | Setting aplikasi key-value. |
| `2026_05_02_125307_create_cash_drawer_transactions_table.php` | `cash_drawer_transactions` | Cash in/out pada shift. |
| `2026_05_13_133409_add_is_free_to_carts_and_sale_items.php` | `carts.is_free`, `sale_items.is_free` | Penanda item gratis/reward. |
| `2026_05_16_094225_create_reward_items_table.php` | `reward_items` | Master hadiah/reward item. |
| `2026_05_16_094248_add_reward_type_to_discount_rewards_and_pools.php` | Tambah reward type, reward item, points pada reward/pool | Reward dapat berupa varian, poin, atau item hadiah. |
| `2026_05_16_100059_add_reward_fields_to_carts_table.php` | Reward fields pada `carts` dan `sale_items` | Cart/sale item mendukung reward item dan points. |
| `2026_05_19_082000_add_discount_type_id_to_carts_table.php` | `carts.discount_type_id` | Mengikat reward cart ke promo tertentu. |
| `2026_07_07_000000_add_adjustment_and_receiving_fields_to_purchases.php` | `purchases.adjustment`, `purchase_items.received_quantity`, `purchase_items.is_free` | Landed cost adjustment dan receiving PO parsial/free item. |

## 4. View React/Inertia

### 4.1 Root, Auth, Profile, Error

| View | Fungsi |
|---|---|
| `resources/views/app.blade.php` | Root Blade template Inertia. |
| `resources/js/Pages/Welcome.jsx` | Halaman welcome/landing bila digunakan. |
| `resources/js/Pages/Dashboard.jsx` | Wrapper/entry dashboard lama. |
| `resources/js/Pages/Dashboard/Index.jsx` | Dashboard KPI utama. |
| `resources/js/Pages/Error.jsx` dan `Pages/Errors/Error.jsx` | Halaman error. |
| `Pages/Auth/Login.jsx` | Login. |
| `Pages/Auth/Register.jsx` | Registrasi. |
| `Pages/Auth/ForgotPassword.jsx` | Minta reset password. |
| `Pages/Auth/ResetPassword.jsx` | Reset password. |
| `Pages/Auth/ConfirmPassword.jsx` | Konfirmasi password. |
| `Pages/Auth/VerifyEmail.jsx` | Verifikasi email. |
| `Pages/Profile/Edit.jsx` | Halaman profil. |
| `Pages/Profile/Partials/DeleteUserForm.jsx` | Form hapus akun. |
| `Pages/Profile/Partials/UpdatePasswordForm.jsx` | Form update password. |
| `Pages/Profile/Partials/UpdateProfileInformationForm.jsx` | Form update profil. |

### 4.2 Master Data Views

| Modul | Views |
|---|---|
| Varian | `Dashboard/Variants/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Intensitas | `Dashboard/Intensities/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Size | `Dashboard/Sizes/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Harga Intensitas | `Dashboard/IntensitySizePrices/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Supplier | `Dashboard/Suppliers/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Gudang | `Dashboard/Warehouses/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Toko | `Dashboard/Stores/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Kategori Toko | `Dashboard/StoreCategories/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Variants.jsx` |

### 4.3 Bahan, Kemasan, Produk, Resep Views

| Modul | Views |
|---|---|
| Bahan baku | `Dashboard/Ingredients/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Kemasan | `Dashboard/Packaging/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Produk | `Dashboard/Products/Index.jsx`, `Show.jsx` |
| Resep | `Dashboard/Recipes/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx`, `Import.jsx` |

### 4.4 Stok, Pembelian, Produksi Views

| Modul | Views |
|---|---|
| Stok gudang | `Dashboard/WarehouseStocks/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Stok toko | `Dashboard/StoreStocks/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx` |
| Valuasi stok | `Dashboard/StockValuation/Index.jsx`, `Show.jsx` |
| Transfer stok | `Dashboard/StockTransfers/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx` |
| Penyesuaian stok | `Dashboard/StockAdjustments/Index.jsx`, `Create.jsx`, `CreateDelta.jsx`, `Edit.jsx`, `Show.jsx` |
| Log movement | `Dashboard/StockMovements/Index.jsx` |
| Purchase order | `Dashboard/Purchases/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx` |
| Repack | `Dashboard/Repacks/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx` |

### 4.5 POS, Transaksi, Shift Views

| Modul | Views |
|---|---|
| POS utama | `Dashboard/Transactions/Index.jsx` |
| Histori transaksi | `Dashboard/Transactions/History.jsx` |
| Cetak invoice | `Dashboard/Transactions/Print.jsx` |
| Cetak rekap shift | `Dashboard/Transactions/PrintShift.jsx` |
| Shift | `Dashboard/Shifts/Index.jsx`, `Current.jsx`, `Show.jsx`, `NoActiveShift.jsx` |
| POS stok kasir | `Dashboard/POS/Stock.jsx` |
| POS histori kasir | `Dashboard/POS/Transactions.jsx` |
| POS fulfillment | `Dashboard/POS/Fulfillment/Index.jsx`, `Show.jsx` |

### 4.6 Customer, Sales, Promo, Payment, User Views

| Modul | Views |
|---|---|
| Customer | `Dashboard/Customers/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Show.jsx`, `Form.jsx` |
| Sales person | `Dashboard/SalesPeople/Index.jsx`, `Create.jsx`, `Edit.jsx`, `Targets.jsx`, `Productivity.jsx` |
| Diskon | `Dashboard/Discounts/Index.jsx`, `Create.jsx`, `Edit.jsx`, `DiscountFormSections.jsx` |
| Reward item | `Dashboard/RewardItems/Index.jsx` |
| Metode pembayaran | `Dashboard/PaymentMethods/Index.jsx`, `Create.jsx`, `Edit.jsx` |
| Settings | `Dashboard/Settings/Index.jsx`, `Payment.jsx` |
| Permission | `Dashboard/Permissions/Index.jsx` |
| Role | `Dashboard/Roles/Index.jsx` |
| User | `Dashboard/Users/Index.jsx`, `Create.jsx`, `Edit.jsx` |

### 4.7 Laporan Views

| View | Fungsi |
|---|---|
| `Dashboard/Laporan/Penjualan.jsx` | Laporan penjualan baru dengan chart, KPI, tabel, export. |
| `Dashboard/Laporan/Keuangan.jsx` | Laporan keuangan baru. |
| `Dashboard/Laporan/Mutasi.jsx` | Laporan mutasi stok baru. |
| `Dashboard/Reports/Sales.jsx` | Laporan sales versi lama/alternatif. |
| `Dashboard/Reports/Profit.jsx` | Laporan profit versi lama/alternatif. |

### 4.8 Layout Dan Komponen Pendukung

| File | Fungsi |
|---|---|
| `Layouts/DashboardLayout.jsx` | Layout dashboard dengan sidebar/navbar. |
| `Layouts/POSLayout.jsx` | Layout khusus POS. |
| `Layouts/AuthenticatedLayout.jsx` | Layout Breeze untuk halaman authenticated. |
| `Layouts/GuestLayout.jsx` | Layout auth/guest. |
| `Components/Dashboard/*` | Komponen UI dashboard: table, modal, sidebar, navbar, pagination, search, form input, card, widget, notification, shift modal. |
| `Components/POS/*` | Komponen POS: cart panel, product grid, payment panel, customer select/history, held transactions, cash transaction modal, numpad modal, sidebar, search bar. |
| `Components/Receipt/ThermalReceipt.jsx` | Tampilan receipt thermal 58mm/umum. |
| `Components/ApplicationLogo.jsx`, `PrimaryButton.jsx`, `SecondaryButton.jsx`, `DangerButton.jsx`, `Checkbox.jsx`, `TextInput.jsx`, `InputLabel.jsx`, `InputError.jsx`, `Modal.jsx`, `Dropdown.jsx`, `NavLink.jsx`, `ResponsiveNavLink.jsx` | Komponen UI dasar. |

## 5. Mapping Modul Ke File Utama

| Modul | Controller | Model utama | View utama |
|---|---|---|---|
| Dashboard | `DashboardController` | `Sale`, `StockMovement`, stok, customer | `Dashboard/Index.jsx` |
| POS | `TransactionController` | `Cart`, `Sale`, `SaleItem`, `SalePayment`, `CashDrawer` | `Transactions/Index.jsx` |
| Shift kasir | `CashDrawerController` | `CashDrawer`, `CashDrawerTransaction` | `Shifts/*`, `Transactions/PrintShift.jsx` |
| Purchase order | `PurchaseController` | `Purchase`, `PurchaseItem`, stok, `StockMovement` | `Purchases/*` |
| Transfer stok | `StockTransferController` | `StockTransfer`, `StockTransferItem`, stok, `StockMovement` | `StockTransfers/*` |
| Adjustment | `StockAdjustmentController` | `StockAdjustment`, `StockAdjustmentItem`, stok, `StockMovement` | `StockAdjustments/*` |
| Repack | `RepackController` | `RepackTransaction`, `RepackTransactionItem`, stok, `StockMovement` | `Repacks/*` |
| Produk/resep | `ProductController`, `RecipeController` | `Product`, `ProductRecipe`, `VariantRecipe` | `Products/*`, `Recipes/*` |
| Promo/reward | `DiscountController`, `RewardItemController` | `DiscountType`, `DiscountReward`, `RewardItem` | `Discounts/*`, `RewardItems/Index.jsx` |
| Laporan | `Laporan*Controller` | `Sale`, `SaleItem`, `SalePayment`, `StockMovement` | `Laporan/*` |
| User/akses | `UserController`, `RoleController`, `PermissionController` | `User`, Spatie role/permission | `Users/*`, `Roles/Index.jsx`, `Permissions/Index.jsx` |

