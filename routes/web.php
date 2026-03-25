<?php

use App\Http\Controllers\Apps\CategoryController;
use App\Http\Controllers\Apps\CustomerController;
use App\Http\Controllers\Apps\DiscountController;
use App\Http\Controllers\Apps\IngredientController;
use App\Http\Controllers\Apps\IntensityController;
use App\Http\Controllers\Apps\IntensitySizePriceController;
use App\Http\Controllers\Apps\PackagingController;
use App\Http\Controllers\Apps\PaymentSettingController;
use App\Http\Controllers\Apps\ProductController;
use App\Http\Controllers\Apps\PurchaseController;
use App\Http\Controllers\Apps\RepackController;
use App\Http\Controllers\Apps\RecipeController;
use App\Http\Controllers\Apps\SalesPersonController;
use App\Http\Controllers\Apps\SizeController;
use App\Http\Controllers\Apps\StockAdjustmentController;
use App\Http\Controllers\Apps\StockMovementController;
use App\Http\Controllers\Apps\StockTransferController;
use App\Http\Controllers\Apps\PaymentMethodController;
use App\Http\Controllers\Apps\StoreController;
use App\Http\Controllers\Apps\StoreCategoryController;
use App\Http\Controllers\Apps\StoreStockController;
use App\Http\Controllers\Apps\SupplierController;
use App\Http\Controllers\Apps\TransactionController;
use App\Http\Controllers\Apps\VariantController;
use App\Http\Controllers\Apps\WarehouseController;
use App\Http\Controllers\Apps\WarehouseStockController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Laporan\LaporanKeuanganController;
use App\Http\Controllers\Laporan\LaporanPenjualanController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ═════════════════════════════════════════════════════════════════════════════
// Root Redirect
// ═════════════════════════════════════════════════════════════════════════════

Route::get('/', fn () => redirect()->route('login'));

// ═════════════════════════════════════════════════════════════════════════════
// Authenticated Routes
// ═════════════════════════════════════════════════════════════════════════════

Route::middleware(['auth'])->prefix('dashboard')->group(function () {

    // ─────────────────────────────────────────────────────────────────────────
    // Dashboard
    // ─────────────────────────────────────────────────────────────────────────

    Route::get('/', [DashboardController::class, 'index'])
        ->middleware(['verified', 'permission:dashboard-access'])
        ->name('dashboard');

    // ─────────────────────────────────────────────────────────────────────────
    // Manajemen Akses
    // ─────────────────────────────────────────────────────────────────────────

    Route::get('permissions', [PermissionController::class, 'index'])
        ->middleware('permission:permissions-access')
        ->name('permissions.index');

    Route::resource('roles', RoleController::class)
        ->except(['create', 'edit', 'show'])
        ->middleware([
            'index'   => 'permission:roles-access',
            'store'   => 'permission:roles-create',
            'update'  => 'permission:roles-update',
            'destroy' => 'permission:roles-delete',
        ]);

    Route::resource('users', UserController::class)
        ->except('show')
        ->middleware([
            'index'   => 'permission:users-access',
            'create'  => 'permission:users-create',
            'store'   => 'permission:users-create',
            'edit'    => 'permission:users-update',
            'update'  => 'permission:users-update',
            'destroy' => 'permission:users-delete',
        ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Master Data
    // ─────────────────────────────────────────────────────────────────────────

    Route::resource('categories', CategoryController::class)
        ->middleware([
            'index'   => 'permission:categories-access',
            'show'    => 'permission:categories-access',
            'create'  => 'permission:categories-create',
            'store'   => 'permission:categories-create',
            'edit'    => 'permission:categories-edit',
            'update'  => 'permission:categories-edit',
            'destroy' => 'permission:categories-delete',
        ]);

    Route::resource('sizes',                 SizeController::class);
    Route::resource('intensity-size-prices', IntensitySizePriceController::class);
    Route::resource('suppliers',             SupplierController::class)->except('show');

    // ── Variants ──────────────────────────────────────────────────────────────

    Route::prefix('variants')->name('variants.')->group(function () {
        Route::get('/',             [VariantController::class, 'index'])->name('index');
        Route::get('/create',       [VariantController::class, 'create'])->name('create');
        Route::post('/',            [VariantController::class, 'store'])->name('store');
        Route::post('/bulk-delete', [VariantController::class, 'bulkDelete'])->name('bulk-delete'); // ! sebelum /{variant}
        Route::get('/{variant}/edit', [VariantController::class, 'edit'])->name('edit');
        Route::put('/{variant}',      [VariantController::class, 'update'])->name('update');
        Route::delete('/{variant}',   [VariantController::class, 'destroy'])->name('destroy');
    });

    // ── Intensities ───────────────────────────────────────────────────────────

    Route::prefix('intensities')->name('intensities.')->group(function () {
        Route::get('/',               [IntensityController::class, 'index'])->name('index');
        Route::get('/create',         [IntensityController::class, 'create'])->name('create');
        Route::post('/',              [IntensityController::class, 'store'])->name('store');
        Route::post('/bulk-delete',   [IntensityController::class, 'bulkDelete'])->name('bulk-delete'); // ! sebelum /{intensity}
        Route::get('/{intensity}/edit', [IntensityController::class, 'edit'])->name('edit');
        Route::put('/{intensity}',      [IntensityController::class, 'update'])->name('update');
        Route::delete('/{intensity}',   [IntensityController::class, 'destroy'])->name('destroy');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Lokasi
    // ─────────────────────────────────────────────────────────────────────────

    // ── Warehouses ────────────────────────────────────────────────────────────

    Route::post('warehouses/bulk-delete', [WarehouseController::class, 'bulkDelete'])
        ->name('warehouses.bulk-delete');                                           // ! sebelum resource()
    Route::resource('warehouses', WarehouseController::class);

    // ── Stores ────────────────────────────────────────────────────────────────

    Route::post('stores/bulk-delete', [StoreController::class, 'bulkDelete'])
        ->name('stores.bulk-delete');                                               // ! sebelum resource()
    Route::resource('stores', StoreController::class);

    // ── Store Categories ──────────────────────────────────────────────────────

    Route::prefix('store-categories')->name('store-categories.')->group(function () {
        Route::get('/',       [StoreCategoryController::class, 'index'])->name('index');
        Route::get('/create', [StoreCategoryController::class, 'create'])->name('create');
        Route::post('/',      [StoreCategoryController::class, 'store'])->name('store');
        // ! sub-routes statis sebelum wildcard lain
        Route::get('/{storeCategory}/variants',       [StoreCategoryController::class, 'variants'])    ->name('variants');
        Route::post('/{storeCategory}/sync-variants', [StoreCategoryController::class, 'syncVariants'])->name('sync-variants');
        Route::patch('/{storeCategory}/toggle',       [StoreCategoryController::class, 'toggle'])      ->name('toggle');
        Route::get('/{storeCategory}/edit',           [StoreCategoryController::class, 'edit'])        ->name('edit');
        Route::put('/{storeCategory}',                [StoreCategoryController::class, 'update'])      ->name('update');
        Route::delete('/{storeCategory}',             [StoreCategoryController::class, 'destroy'])     ->name('destroy');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Produk & Formula
    // ─────────────────────────────────────────────────────────────────────────

    // ── Ingredients (Bahan Baku) ──────────────────────────────────────────────

    Route::prefix('ingredients')->name('ingredients.')->group(function () {
        Route::get('/',       [IngredientController::class, 'index'])->name('index');
        Route::get('/create', [IngredientController::class, 'create'])->name('create');
        Route::post('/',      [IngredientController::class, 'store'])->name('store');

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::post('/',             [IngredientController::class, 'storeCategory'])  ->name('store');
            Route::put('/{category}',    [IngredientController::class, 'updateCategory']) ->name('update');
            Route::delete('/{category}', [IngredientController::class, 'destroyCategory'])->name('destroy');
        });

        Route::get('/{ingredient}/edit', [IngredientController::class, 'edit'])->name('edit');
        Route::put('/{ingredient}',      [IngredientController::class, 'update'])->name('update');
        Route::delete('/{ingredient}',   [IngredientController::class, 'destroy'])->name('destroy');
    });

    // ── Packaging (Kemasan) ───────────────────────────────────────────────────

    Route::prefix('packaging')->name('packaging.')->group(function () {
        Route::get('/',       [PackagingController::class, 'index'])->name('index');
        Route::get('/create', [PackagingController::class, 'create'])->name('create');
        Route::post('/',      [PackagingController::class, 'store'])->name('store');

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::post('/',             [PackagingController::class, 'storeCategory'])  ->name('store');
            Route::put('/{category}',    [PackagingController::class, 'updateCategory']) ->name('update');
            Route::delete('/{category}', [PackagingController::class, 'destroyCategory'])->name('destroy');
        });

        Route::get('/{packaging}/edit', [PackagingController::class, 'edit'])->name('edit');
        Route::put('/{packaging}',      [PackagingController::class, 'update'])->name('update');
        Route::delete('/{packaging}',   [PackagingController::class, 'destroy'])->name('destroy');
    });

    // ── Recipes (Formula & Resep) ─────────────────────────────────────────────
    //
    // ! ATURAN URUTAN:
    //   1. /import/* (statis penuh)         — PERTAMA
    //   2. /create, POST /                  — setelah import
    //   3. /{variant}/{intensity}/* (wildcard ganda) — TERAKHIR
    //

    Route::prefix('recipes')->name('recipes.')->group(function () {

        // 1. Import
        Route::prefix('import')->name('import.')->group(function () {
            Route::get('/',          [RecipeController::class, 'importIndex'])   ->name('index');
            Route::get('/template',  [RecipeController::class, 'importTemplate'])->name('template');
            Route::post('/validate', [RecipeController::class, 'importValidate'])->name('validate');
            Route::post('/store',    [RecipeController::class, 'importStore'])   ->name('store');
        });

        // 2. CRUD non-wildcard
        Route::get('/',       [RecipeController::class, 'index'])->name('index');
        Route::get('/create', [RecipeController::class, 'create'])->name('create');
        Route::post('/',      [RecipeController::class, 'store'])->name('store');

        // 3. Wildcard ganda — HARUS paling bawah
        Route::get('/{variant}/{intensity}',                    [RecipeController::class, 'show'])            ->name('show');
        Route::get('/{variant}/{intensity}/edit',               [RecipeController::class, 'edit'])            ->name('edit');
        Route::put('/{variant}/{intensity}',                    [RecipeController::class, 'update'])          ->name('update');
        Route::delete('/{variant}/{intensity}',                 [RecipeController::class, 'destroy'])         ->name('destroy');
        Route::post('/{variant}/{intensity}/generate-products', [RecipeController::class, 'generateProducts'])->name('generate-products');
    });

    // ── Products ──────────────────────────────────────────────────────────────

    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/',                          [ProductController::class, 'index'])->name('index');
        Route::get('/{product}',                 [ProductController::class, 'show'])->name('show');
        Route::patch('/{product}/toggle-active', [ProductController::class, 'toggleActive'])->name('toggle-active');
        Route::post('/{product}/recalculate',    [ProductController::class, 'recalculate'])->name('recalculate');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Manajemen Stok
    // ─────────────────────────────────────────────────────────────────────────

    // ── Warehouse Stocks ──────────────────────────────────────────────────────

    Route::prefix('warehouse-stocks')->name('warehouse-stocks.')->group(function () {
        Route::get('/',          [WarehouseStockController::class, 'index'])->name('index');
        Route::get('/create',    [WarehouseStockController::class, 'create'])->name('create');
        Route::post('/',         [WarehouseStockController::class, 'store'])->name('store');
        Route::get('/{id}',      [WarehouseStockController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [WarehouseStockController::class, 'edit'])->name('edit');
        Route::put('/{id}',      [WarehouseStockController::class, 'update'])->name('update');
        Route::delete('/{id}',   [WarehouseStockController::class, 'destroy'])->name('destroy');
    });

    // ── Store Stocks ──────────────────────────────────────────────────────────

    Route::prefix('store-stocks')->name('store-stocks.')->group(function () {
        Route::get('/',          [StoreStockController::class, 'index'])->name('index');
        Route::get('/create',    [StoreStockController::class, 'create'])->name('create');
        Route::post('/',         [StoreStockController::class, 'store'])->name('store');
        Route::get('/{id}',      [StoreStockController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [StoreStockController::class, 'edit'])->name('edit');
        Route::put('/{id}',      [StoreStockController::class, 'update'])->name('update');
        Route::delete('/{id}',   [StoreStockController::class, 'destroy'])->name('destroy');
    });

    // ── Repacks (Produksi) ────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create & /available-stock SEBELUM /{id}
    //

    Route::prefix('repacks')->name('repacks.')->group(function () {
        Route::get('/',                [RepackController::class, 'index'])->name('index');
        Route::get('/create',          [RepackController::class, 'create'])->name('create');
        Route::post('/',               [RepackController::class, 'store'])->name('store');
        Route::post('/available-stock',[RepackController::class, 'getAvailableStock'])->name('available-stock'); // ! sebelum /{id}
        Route::get('/{id}',            [RepackController::class, 'show'])->name('show');
        Route::get('/{id}/edit',       [RepackController::class, 'edit'])->name('edit');
        Route::put('/{id}',            [RepackController::class, 'update'])->name('update');
        Route::post('/{id}/complete',  [RepackController::class, 'complete'])->name('complete');
        Route::post('/{id}/cancel',    [RepackController::class, 'cancel'])->name('cancel');
        Route::delete('/{id}',         [RepackController::class, 'destroy'])->name('destroy');
    });

    // ── Stock Transfers ───────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create SEBELUM /{id}
    //

    Route::prefix('stock-transfers')->name('stock-transfers.')->group(function () {
        Route::get('/',               [StockTransferController::class, 'index'])->name('index');
        Route::get('/create',         [StockTransferController::class, 'create'])->name('create');
        Route::post('/',              [StockTransferController::class, 'store'])->name('store');
        Route::get('/{id}',           [StockTransferController::class, 'show'])->name('show');
        Route::get('/{id}/edit',      [StockTransferController::class, 'edit'])->name('edit');
        Route::put('/{id}',           [StockTransferController::class, 'update'])->name('update');
        Route::post('/{id}/submit',   [StockTransferController::class, 'submit'])->name('submit');
        Route::post('/{id}/approve',  [StockTransferController::class, 'approve'])->name('approve');
        Route::post('/{id}/send',     [StockTransferController::class, 'send'])->name('send');
        Route::post('/{id}/receive',  [StockTransferController::class, 'receive'])->name('receive');
        Route::post('/{id}/cancel',   [StockTransferController::class, 'cancel'])->name('cancel');
        Route::delete('/{id}',        [StockTransferController::class, 'destroy'])->name('destroy');
    });

    // ── Stock Adjustments ─────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create & /current-stock SEBELUM /{id}
    //
    // BUG LAMA: route POST '/api/current-stock' didaftarkan SETELAH /{id}
    // sehingga tertangkap sebagai show(id='api') → HTTP 404.
    // PERBAIKAN: pindah ke atas /{id} dan hilangkan prefix /api/.
    //

    Route::prefix('stock-adjustments')->name('stock-adjustments.')->group(function () {
        Route::get('/',                [StockAdjustmentController::class, 'index'])->name('index');
        Route::get('/create',          [StockAdjustmentController::class, 'create'])->name('create');
        Route::post('/',               [StockAdjustmentController::class, 'store'])->name('store');
        Route::post('/current-stock',  [StockAdjustmentController::class, 'getCurrentStock'])->name('current-stock'); // ! sebelum /{id}
        Route::get('/{id}',            [StockAdjustmentController::class, 'show'])->name('show');
        Route::get('/{id}/edit',       [StockAdjustmentController::class, 'edit'])->name('edit');
        Route::put('/{id}',            [StockAdjustmentController::class, 'update'])->name('update');
        Route::delete('/{id}',         [StockAdjustmentController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/submit',    [StockAdjustmentController::class, 'submit'])->name('submit');
        Route::post('/{id}/approve',   [StockAdjustmentController::class, 'approve'])->name('approve');
        Route::post('/{id}/complete',  [StockAdjustmentController::class, 'complete'])->name('complete');
        Route::post('/{id}/cancel',    [StockAdjustmentController::class, 'cancel'])->name('cancel');
    });

    // ── Stock Movements (Log — Baca Saja) ─────────────────────────────────────
    //
    // ! ATURAN URUTAN: /available-stock SEBELUM /{id}
    //

    Route::prefix('stock-movements')->name('stock-movements.')->group(function () {
        Route::get('/',                [StockMovementController::class, 'index'])->name('index');
        Route::post('/available-stock',[StockMovementController::class, 'getAvailableStock'])->name('available-stock'); // ! sebelum /{id}
        Route::get('/{id}',            [StockMovementController::class, 'show'])->name('show');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pembelian
    // ─────────────────────────────────────────────────────────────────────────

    // ── Purchases (Purchase Order) ────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create SEBELUM /{id}
    //

    Route::prefix('purchases')->name('purchases.')->group(function () {
        Route::get('/',               [PurchaseController::class, 'index'])->name('index');
        Route::get('/create',         [PurchaseController::class, 'create'])->name('create');
        Route::post('/',              [PurchaseController::class, 'store'])->name('store');
        Route::get('/{id}',           [PurchaseController::class, 'show'])->name('show');
        Route::get('/{id}/edit',      [PurchaseController::class, 'edit'])->name('edit');
        Route::put('/{id}',           [PurchaseController::class, 'update'])->name('update');
        Route::delete('/{id}',        [PurchaseController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/submit',   [PurchaseController::class, 'submit'])->name('submit');
        Route::post('/{id}/approve',  [PurchaseController::class, 'approve'])->name('approve');
        Route::post('/{id}/receive',  [PurchaseController::class, 'receive'])->name('receive');
        Route::post('/{id}/complete', [PurchaseController::class, 'complete'])->name('complete');
        Route::post('/{id}/cancel',   [PurchaseController::class, 'cancel'])->name('cancel');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Penjualan & CRM
    // ─────────────────────────────────────────────────────────────────────────

    // ── Customers ─────────────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /export & /store-ajax (statis) SEBELUM resource()
    //   karena resource() mendaftarkan /{customer} yang menangkap semua string.
    //

    Route::get('customers/export',             [CustomerController::class, 'export'])
        ->middleware('permission:customers-access')
        ->name('customers.export');                                                 // ! sebelum resource()

    Route::post('customers/store-ajax',        [CustomerController::class, 'storeAjax'])
        ->middleware('permission:customers-create')
        ->name('customers.store-ajax');                                             // ! sebelum resource()

    Route::get('customers/{customer}/history', [CustomerController::class, 'getHistory'])
        ->middleware('permission:transactions-access')
        ->name('customers.history');

    Route::resource('customers', CustomerController::class);

    // ── Sales People ──────────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /{salesPerson}/targets SEBELUM resource()
    //

    Route::get('sales-people/{salesPerson}/targets',  [SalesPersonController::class, 'targets'])
        ->name('sales-people.targets');                                             // ! sebelum resource()

    Route::post('sales-people/{salesPerson}/targets', [SalesPersonController::class, 'storeTarget'])
        ->name('sales-people.targets.store');                                       // ! sebelum resource()

    Route::resource('sales-people', SalesPersonController::class);

    // ── Discounts (Promo) ─────────────────────────────────────────────────────

    Route::resource('discounts', DiscountController::class);

    // ── Transactions ──────────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN:
    //   1. GET statis tanpa parameter (/history, /print/*, /get-*)  — PERTAMA
    //   2. POST AJAX tanpa parameter (/get-perfume-price, /add-to-cart, dll)
    //   3. Route dengan parameter (/cart/{id}, /resume/{holdId}, dll)
    //   4. POST /store — TERAKHIR (kata "store" bisa bentrok jika ada /{id})
    //
Route::prefix('transactions')->name('transactions.')->group(function () {

    // 1. Halaman
    Route::get('/',                   [TransactionController::class, 'index'])->name('index');
    Route::get('/history',            [TransactionController::class, 'history'])->name('history');
    Route::get('/print/{saleNumber}', [TransactionController::class, 'print'])
        ->where('saleNumber', '[A-Za-z0-9\-]+')
        ->name('print');

    // 2. API — Product Selection (flow: Intensity → Variant → Size)
    Route::get('/get-variants',        [TransactionController::class, 'getVariantsForIntensity'])->name('get-variants');
    Route::get('/get-sizes',           [TransactionController::class, 'getAvailableSizes'])->name('get-sizes');
    Route::post('/get-perfume-price',  [TransactionController::class, 'getPerfumePrice'])->name('get-perfume-price');

    // 2b. API — Custom Order
    Route::get('/get-variants-custom', [TransactionController::class, 'getVariantsForCustom'])->name('get-variants-custom');
    Route::get('/get-custom-price',    [TransactionController::class, 'getCustomPrice'])->name('get-custom-price');

    // 3. Cart
    Route::post('/add-to-cart',        [TransactionController::class, 'addToCart'])->name('add-to-cart');
    Route::post('/add-custom-to-cart', [TransactionController::class, 'addCustomToCart'])->name('add-custom-to-cart');
    Route::patch('/cart/{id}',         [TransactionController::class, 'updateCart'])->name('update-cart');
    Route::delete('/cart/{id}',        [TransactionController::class, 'destroyCart'])->name('destroy-cart');

    // 4. Hold / Resume
    Route::post('/hold',              [TransactionController::class, 'holdCart'])->name('hold');
    Route::post('/resume/{holdId}',   [TransactionController::class, 'resumeHeldCart'])->name('resume');
    Route::delete('/held/{holdId}',   [TransactionController::class, 'deleteHeldCart'])->name('delete-held');

    // 5. Checkout — paling bawah
    Route::post('/store',             [TransactionController::class, 'store'])->name('store');
});

    // ─────────────────────────────────────────────────────────────────────────
    // Pembayaran
    // ─────────────────────────────────────────────────────────────────────────

    // ! ATURAN URUTAN: /toggle SEBELUM resource()

    Route::patch('payment-methods/{paymentMethod}/toggle', [PaymentMethodController::class, 'toggle'])
        ->name('payment-methods.toggle');                                           // ! sebelum resource()

    Route::resource('payment-methods', PaymentMethodController::class);

    // ─────────────────────────────────────────────────────────────────────────
    // Laporan
    // ─────────────────────────────────────────────────────────────────────────

    Route::prefix('laporan')->name('laporan.')->group(function () {

        Route::get('penjualan', [LaporanPenjualanController::class, 'index'])
            ->middleware('permission:reports-access')
            ->name('penjualan');

        Route::get('keuangan', [LaporanKeuanganController::class, 'index'])
            ->middleware('permission:profits-access')
            ->name('keuangan');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pengaturan
    // ─────────────────────────────────────────────────────────────────────────

    Route::prefix('settings')->name('settings.')->group(function () {

        Route::get('payments',  [PaymentSettingController::class, 'edit'])
            ->middleware('permission:payment-settings-access')
            ->name('payments.edit');

        Route::put('payments',  [PaymentSettingController::class, 'update'])
            ->middleware('permission:payment-settings-access')
            ->name('payments.update');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Profil
    // ─────────────────────────────────────────────────────────────────────────

    Route::get('profile',    [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile',  [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

});

require __DIR__ . '/auth.php';
