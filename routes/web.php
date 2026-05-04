<?php

use App\Http\Controllers\Apps\AppSettingController;
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
use App\Http\Controllers\Apps\CashDrawerController;
use App\Http\Controllers\Apps\POS\POSFeatureController;
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

Route::get('/', fn() => redirect()->route('login'));

// ═════════════════════════════════════════════════════════════════════════════
// Authenticated Routes
// ═════════════════════════════════════════════════════════════════════════════

Route::middleware(['auth'])->prefix('dashboard')->group(function () {

    // ─────────────────────────────────────────────────────────────────────────
    // Dashboard
    // ─────────────────────────────────────────────────────────────────────────

    Route::get('/', function () {
        $user = auth()->user();
        // Cashiers cannot access the dashboard — redirect them to POS immediately
        if ($user && $user->hasRole('cashier') && !$user->hasRole('super-admin') && !$user->hasRole('admin')) {
            return redirect()->route('transactions.index');
        }
        // Non-cashiers without dashboard access get 403 normally
        if ($user && !$user->hasPermissionTo('dashboard-access')) {
            abort(403);
        }
        return app(DashboardController::class)->index(request());
    })
        ->middleware('verified')
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
            'index' => 'permission:roles-access',
            'store' => 'permission:roles-create',
            'update' => 'permission:roles-update',
            'destroy' => 'permission:roles-delete',
        ]);

    Route::resource('users', UserController::class)
        ->except('show')
        ->middleware([
            'index' => 'permission:users-access',
            'create' => 'permission:users-create',
            'store' => 'permission:users-create',
            'edit' => 'permission:users-update',
            'update' => 'permission:users-update',
            'destroy' => 'permission:users-delete',
        ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Master Data
    // ─────────────────────────────────────────────────────────────────────────

    Route::resource('categories', CategoryController::class)
        ->middleware([
            'index' => 'permission:categories-access',
            'show' => 'permission:categories-access',
            'create' => 'permission:categories-create',
            'store' => 'permission:categories-create',
            'edit' => 'permission:categories-edit',
            'update' => 'permission:categories-edit',
            'destroy' => 'permission:categories-delete',
        ]);

    Route::resource('sizes', SizeController::class)
        ->middleware([
            'index' => 'permission:sizes-access',
            'create' => 'permission:sizes-create',
            'store' => 'permission:sizes-create',
            'edit' => 'permission:sizes-edit',
            'update' => 'permission:sizes-edit',
            'destroy' => 'permission:sizes-delete',
        ]);

    Route::resource('intensity-size-prices', IntensitySizePriceController::class)
        ->middleware('permission:products-edit');

    Route::resource('suppliers', SupplierController::class)
        ->except('show')
        ->middleware([
            'index' => 'permission:suppliers-access',
            'create' => 'permission:suppliers-create',
            'store' => 'permission:suppliers-create',
            'edit' => 'permission:suppliers-edit',
            'update' => 'permission:suppliers-edit',
            'destroy' => 'permission:suppliers-delete',
        ]);

    // ── Variants ──────────────────────────────────────────────────────────────

    Route::prefix('variants')->name('variants.')->group(function () {
        Route::get('/', [VariantController::class, 'index'])->name('index')->middleware('permission:variants-access');
        Route::get('/create', [VariantController::class, 'create'])->name('create')->middleware('permission:variants-create');
        Route::post('/', [VariantController::class, 'store'])->name('store')->middleware('permission:variants-create');
        Route::post('/bulk-delete', [VariantController::class, 'bulkDelete'])->name('bulk-delete')->middleware('permission:variants-delete');
        Route::get('/{variant}/edit', [VariantController::class, 'edit'])->name('edit')->middleware('permission:variants-edit');
        Route::put('/{variant}', [VariantController::class, 'update'])->name('update')->middleware('permission:variants-edit');
        Route::delete('/{variant}', [VariantController::class, 'destroy'])->name('destroy')->middleware('permission:variants-delete');
    });

    // ── Intensities ───────────────────────────────────────────────────────────

    Route::prefix('intensities')->name('intensities.')->group(function () {
        Route::get('/', [IntensityController::class, 'index'])->name('index')->middleware('permission:intensities-access');
        Route::get('/create', [IntensityController::class, 'create'])->name('create')->middleware('permission:intensities-create');
        Route::post('/', [IntensityController::class, 'store'])->name('store')->middleware('permission:intensities-create');
        Route::post('/bulk-delete', [IntensityController::class, 'bulkDelete'])->name('bulk-delete')->middleware('permission:intensities-delete');
        Route::get('/{intensity}/edit', [IntensityController::class, 'edit'])->name('edit')->middleware('permission:intensities-edit');
        Route::put('/{intensity}', [IntensityController::class, 'update'])->name('update')->middleware('permission:intensities-edit');
        Route::delete('/{intensity}', [IntensityController::class, 'destroy'])->name('destroy')->middleware('permission:intensities-delete');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Lokasi
    // ─────────────────────────────────────────────────────────────────────────

    Route::post('warehouses/bulk-delete', [WarehouseController::class, 'bulkDelete'])
        ->middleware('permission:warehouses-delete')
        ->name('warehouses.bulk-delete');

    Route::resource('warehouses', WarehouseController::class)
        ->middleware([
            'index' => 'permission:warehouses-access',
            'show' => 'permission:warehouses-access',
            'create' => 'permission:warehouses-create',
            'store' => 'permission:warehouses-create',
            'edit' => 'permission:warehouses-edit',
            'update' => 'permission:warehouses-edit',
            'destroy' => 'permission:warehouses-delete',
        ]);

    // ── Stores ────────────────────────────────────────────────────────────────

    Route::post('stores/bulk-delete', [StoreController::class, 'bulkDelete'])
        ->middleware('permission:stores-delete')
        ->name('stores.bulk-delete');

    Route::resource('stores', StoreController::class)
        ->middleware([
            'index' => 'permission:stores-access',
            'show' => 'permission:stores-access',
            'create' => 'permission:stores-create',
            'store' => 'permission:stores-create',
            'edit' => 'permission:stores-edit',
            'update' => 'permission:stores-edit',
            'destroy' => 'permission:stores-delete',
        ]);

    // ── Store Categories ──────────────────────────────────────────────────────

    Route::prefix('store-categories')->name('store-categories.')->group(function () {
        Route::get('/', [StoreCategoryController::class, 'index'])->name('index')->middleware('permission:store-categories-access');
        Route::get('/create', [StoreCategoryController::class, 'create'])->name('create')->middleware('permission:store-categories-create');
        Route::post('/', [StoreCategoryController::class, 'store'])->name('store')->middleware('permission:store-categories-create');
        Route::get('/{storeCategory}/variants', [StoreCategoryController::class, 'variants'])->name('variants')->middleware('permission:store-categories-edit');
        Route::post('/{storeCategory}/sync-variants', [StoreCategoryController::class, 'syncVariants'])->name('sync-variants')->middleware('permission:store-categories-edit');
        Route::patch('/{storeCategory}/toggle', [StoreCategoryController::class, 'toggle'])->name('toggle')->middleware('permission:store-categories-edit');
        Route::get('/{storeCategory}/edit', [StoreCategoryController::class, 'edit'])->name('edit')->middleware('permission:store-categories-edit');
        Route::put('/{storeCategory}', [StoreCategoryController::class, 'update'])->name('update')->middleware('permission:store-categories-edit');
        Route::delete('/{storeCategory}', [StoreCategoryController::class, 'destroy'])->name('destroy')->middleware('permission:store-categories-delete');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Produk & Formula
    // ─────────────────────────────────────────────────────────────────────────

    // ── Ingredients (Bahan Baku) ──────────────────────────────────────────────

    Route::prefix('ingredients')->name('ingredients.')->group(function () {
        Route::get('/', [IngredientController::class, 'index'])->name('index')->middleware('permission:ingredients-access');
        Route::get('/create', [IngredientController::class, 'create'])->name('create')->middleware('permission:ingredients-create');
        Route::post('/', [IngredientController::class, 'store'])->name('store')->middleware('permission:ingredients-create');

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::post('/', [IngredientController::class, 'storeCategory'])->name('store')->middleware('permission:ingredients-create');
            Route::put('/{category}', [IngredientController::class, 'updateCategory'])->name('update')->middleware('permission:ingredients-edit');
            Route::delete('/{category}', [IngredientController::class, 'destroyCategory'])->name('destroy')->middleware('permission:ingredients-delete');
        });

        Route::get('/{ingredient}/edit', [IngredientController::class, 'edit'])->name('edit')->middleware('permission:ingredients-edit');
        Route::put('/{ingredient}', [IngredientController::class, 'update'])->name('update')->middleware('permission:ingredients-edit');
        Route::delete('/{ingredient}', [IngredientController::class, 'destroy'])->name('destroy')->middleware('permission:ingredients-delete');
    });

    // ── Packaging (Kemasan) ───────────────────────────────────────────────────

    Route::prefix('packaging')->name('packaging.')->group(function () {
        Route::get('/', [PackagingController::class, 'index'])->name('index')->middleware('permission:packaging-access');
        Route::get('/create', [PackagingController::class, 'create'])->name('create')->middleware('permission:packaging-create');
        Route::post('/', [PackagingController::class, 'store'])->name('store')->middleware('permission:packaging-create');

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::post('/', [PackagingController::class, 'storeCategory'])->name('store')->middleware('permission:packaging-create');
            Route::put('/{category}', [PackagingController::class, 'updateCategory'])->name('update')->middleware('permission:packaging-edit');
            Route::delete('/{category}', [PackagingController::class, 'destroyCategory'])->name('destroy')->middleware('permission:packaging-delete');
        });

        Route::get('/{packaging}/edit', [PackagingController::class, 'edit'])->name('edit')->middleware('permission:packaging-edit');
        Route::put('/{packaging}', [PackagingController::class, 'update'])->name('update')->middleware('permission:packaging-edit');
        Route::delete('/{packaging}', [PackagingController::class, 'destroy'])->name('destroy')->middleware('permission:packaging-delete');
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
            Route::get('/', [RecipeController::class, 'importIndex'])->name('index')->middleware('permission:recipes-import');
            Route::get('/template', [RecipeController::class, 'importTemplate'])->name('template')->middleware('permission:recipes-import');
            Route::post('/validate', [RecipeController::class, 'importValidate'])->name('validate')->middleware('permission:recipes-import');
            Route::post('/store', [RecipeController::class, 'importStore'])->name('store')->middleware('permission:recipes-import');
        });

        // 2. CRUD
        Route::get('/', [RecipeController::class, 'index'])->name('index')->middleware('permission:recipes-access');
        Route::get('/create', [RecipeController::class, 'create'])->name('create')->middleware('permission:recipes-create');
        Route::post('/', [RecipeController::class, 'store'])->name('store')->middleware('permission:recipes-create');

        // 3. Wildcard
        Route::get('/{variant}/{intensity}', [RecipeController::class, 'show'])->name('show')->middleware('permission:recipes-access');
        Route::get('/{variant}/{intensity}/edit', [RecipeController::class, 'edit'])->name('edit')->middleware('permission:recipes-edit');
        Route::put('/{variant}/{intensity}', [RecipeController::class, 'update'])->name('update')->middleware('permission:recipes-edit');
        Route::delete('/{variant}/{intensity}', [RecipeController::class, 'destroy'])->name('destroy')->middleware('permission:recipes-delete');
        Route::post('/{variant}/{intensity}/generate-products', [RecipeController::class, 'generateProducts'])->name('generate-products')->middleware('permission:recipes-create');
    });

    // ── Products ──────────────────────────────────────────────────────────────

    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index')->middleware('permission:products-access');
        Route::get('/{product}', [ProductController::class, 'show'])->name('show')->middleware('permission:products-access');
        Route::patch('/{product}/toggle-active', [ProductController::class, 'toggleActive'])->name('toggle-active')->middleware('permission:products-edit');
        Route::post('/{product}/recalculate', [ProductController::class, 'recalculate'])->name('recalculate')->middleware('permission:products-recalculate');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Manajemen Stok
    // ─────────────────────────────────────────────────────────────────────────

    // ── Warehouse Stocks ──────────────────────────────────────────────────────

    Route::prefix('warehouse-stocks')->name('warehouse-stocks.')->group(function () {
        Route::get('/', [WarehouseStockController::class, 'index'])->name('index')->middleware('permission:stock-warehouse-access');
        Route::get('/create', [WarehouseStockController::class, 'create'])->name('create')->middleware('permission:stock-adjustment');
        Route::post('/', [WarehouseStockController::class, 'store'])->name('store')->middleware('permission:stock-adjustment');
        Route::get('/{id}', [WarehouseStockController::class, 'show'])->name('show')->middleware('permission:stock-warehouse-access');
        Route::get('/{id}/edit', [WarehouseStockController::class, 'edit'])->name('edit')->middleware('permission:stock-adjustment');
        Route::put('/{id}', [WarehouseStockController::class, 'update'])->name('update')->middleware('permission:stock-adjustment');
        Route::delete('/{id}', [WarehouseStockController::class, 'destroy'])->name('destroy')->middleware('permission:stock-adjustment');
    });

    // ── Store Stocks ──────────────────────────────────────────────────────────

    Route::prefix('store-stocks')->name('store-stocks.')->group(function () {
        Route::get('/', [StoreStockController::class, 'index'])->name('index')->middleware('permission:stock-store-access');
        Route::get('/create', [StoreStockController::class, 'create'])->name('create')->middleware('permission:stock-adjustment');
        Route::post('/', [StoreStockController::class, 'store'])->name('store')->middleware('permission:stock-adjustment');
        Route::get('/{id}', [StoreStockController::class, 'show'])->name('show')->middleware('permission:stock-store-access');
        Route::get('/{id}/edit', [StoreStockController::class, 'edit'])->name('edit')->middleware('permission:stock-adjustment');
        Route::put('/{id}', [StoreStockController::class, 'update'])->name('update')->middleware('permission:stock-adjustment');
        Route::delete('/{id}', [StoreStockController::class, 'destroy'])->name('destroy')->middleware('permission:stock-adjustment');
    });

    // ── Repacks (Produksi) ────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create & /available-stock SEBELUM /{id}
    //

    Route::prefix('repacks')->name('repacks.')->group(function () {
        Route::get('/', [RepackController::class, 'index'])->name('index')->middleware('permission:repacks-access');
        Route::get('/create', [RepackController::class, 'create'])->name('create')->middleware('permission:repacks-create');
        Route::post('/', [RepackController::class, 'store'])->name('store')->middleware('permission:repacks-create');
        Route::post('/available-stock', [RepackController::class, 'getAvailableStock'])->name('available-stock')->middleware('permission:repacks-access');
        Route::get('/{id}', [RepackController::class, 'show'])->name('show')->middleware('permission:repacks-access');
        Route::get('/{id}/edit', [RepackController::class, 'edit'])->name('edit')->middleware('permission:repacks-edit');
        Route::put('/{id}', [RepackController::class, 'update'])->name('update')->middleware('permission:repacks-edit');
        Route::post('/{id}/complete', [RepackController::class, 'complete'])->name('complete')->middleware('permission:repacks-complete');
        Route::post('/{id}/cancel', [RepackController::class, 'cancel'])->name('cancel')->middleware('permission:repacks-cancel');
        Route::delete('/{id}', [RepackController::class, 'destroy'])->name('destroy')->middleware('permission:repacks-delete');
    });

    // ── Stock Transfers ───────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create SEBELUM /{id}
    //

    Route::prefix('stock-transfers')->name('stock-transfers.')->group(function () {
        Route::get('/', [StockTransferController::class, 'index'])->name('index')->middleware('permission:stock-transfer');
        Route::get('/create', [StockTransferController::class, 'create'])->name('create')->middleware('permission:stock-transfer');
        Route::post('/', [StockTransferController::class, 'store'])->name('store')->middleware('permission:stock-transfer');
        Route::get('/{id}', [StockTransferController::class, 'show'])->name('show')->middleware('permission:stock-transfer');
        Route::get('/{id}/edit', [StockTransferController::class, 'edit'])->name('edit')->middleware('permission:stock-transfer');
        Route::put('/{id}', [StockTransferController::class, 'update'])->name('update')->middleware('permission:stock-transfer');
        Route::post('/{id}/submit', [StockTransferController::class, 'submit'])->name('submit')->middleware('permission:stock-transfer');
        Route::post('/{id}/approve', [StockTransferController::class, 'approve'])->name('approve')->middleware('permission:stock-transfer');
        Route::post('/{id}/send', [StockTransferController::class, 'send'])->name('send')->middleware('permission:stock-transfer');
        Route::post('/{id}/receive', [StockTransferController::class, 'receive'])->name('receive')->middleware('permission:stock-transfer');
        Route::post('/{id}/cancel', [StockTransferController::class, 'cancel'])->name('cancel')->middleware('permission:stock-transfer');
        Route::delete('/{id}', [StockTransferController::class, 'destroy'])->name('destroy')->middleware('permission:stock-transfer');
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
        Route::get('/', [StockAdjustmentController::class, 'index'])->name('index')->middleware('permission:stock-adjustment');
        Route::get('/create', [StockAdjustmentController::class, 'create'])->name('create')->middleware('permission:stock-adjustment');
        Route::post('/', [StockAdjustmentController::class, 'store'])->name('store')->middleware('permission:stock-adjustment');
        Route::post('/current-stock', [StockAdjustmentController::class, 'getCurrentStock'])->name('current-stock')->middleware('permission:stock-adjustment');
        Route::get('/{id}', [StockAdjustmentController::class, 'show'])->name('show')->middleware('permission:stock-adjustment');
        Route::get('/{id}/edit', [StockAdjustmentController::class, 'edit'])->name('edit')->middleware('permission:stock-adjustment');
        Route::put('/{id}', [StockAdjustmentController::class, 'update'])->name('update')->middleware('permission:stock-adjustment');
        Route::delete('/{id}', [StockAdjustmentController::class, 'destroy'])->name('destroy')->middleware('permission:stock-adjustment');
        Route::post('/{id}/submit', [StockAdjustmentController::class, 'submit'])->name('submit')->middleware('permission:stock-adjustment');
        Route::post('/{id}/approve', [StockAdjustmentController::class, 'approve'])->name('approve')->middleware('permission:stock-adjustment');
        Route::post('/{id}/complete', [StockAdjustmentController::class, 'complete'])->name('complete')->middleware('permission:stock-adjustment');
        Route::post('/{id}/cancel', [StockAdjustmentController::class, 'cancel'])->name('cancel')->middleware('permission:stock-adjustment');
    });

    // ── Stock Movements (Log — Baca Saja) ─────────────────────────────────────
    //
    // ! ATURAN URUTAN: /available-stock SEBELUM /{id}
    //

    Route::prefix('stock-movements')->name('stock-movements.')->group(function () {
        Route::get('/', [StockMovementController::class, 'index'])->name('index')->middleware('permission:stock-access');
        Route::post('/available-stock', [StockMovementController::class, 'getAvailableStock'])->name('available-stock')->middleware('permission:stock-access');
        Route::get('/{id}', [StockMovementController::class, 'show'])->name('show')->middleware('permission:stock-access');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pembelian
    // ─────────────────────────────────────────────────────────────────────────

    // ── Purchases (Purchase Order) ────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /create SEBELUM /{id}
    //

    Route::prefix('purchases')->name('purchases.')->group(function () {
        Route::get('/', [PurchaseController::class, 'index'])->name('index')->middleware('permission:purchases-access');
        Route::get('/create', [PurchaseController::class, 'create'])->name('create')->middleware('permission:purchases-create');
        Route::post('/', [PurchaseController::class, 'store'])->name('store')->middleware('permission:purchases-create');
        Route::get('/{id}', [PurchaseController::class, 'show'])->name('show')->middleware('permission:purchases-access');
        Route::get('/{id}/edit', [PurchaseController::class, 'edit'])->name('edit')->middleware('permission:purchases-edit');
        Route::put('/{id}', [PurchaseController::class, 'update'])->name('update')->middleware('permission:purchases-edit');
        Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('destroy')->middleware('permission:purchases-delete');
        Route::post('/{id}/submit', [PurchaseController::class, 'submit'])->name('submit')->middleware('permission:purchases-submit');
        Route::post('/{id}/approve', [PurchaseController::class, 'approve'])->name('approve')->middleware('permission:purchases-approve');
        Route::post('/{id}/receive', [PurchaseController::class, 'receive'])->name('receive')->middleware('permission:purchases-receive');
        Route::post('/{id}/complete', [PurchaseController::class, 'complete'])->name('complete')->middleware('permission:purchases-complete');
        Route::post('/{id}/cancel', [PurchaseController::class, 'cancel'])->name('cancel')->middleware('permission:purchases-cancel');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Penjualan & CRM
    // ─────────────────────────────────────────────────────────────────────────

    // ── Customers ─────────────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /export & /store-ajax (statis) SEBELUM resource()
    //   karena resource() mendaftarkan /{customer} yang menangkap semua string.
    //

    Route::get('customers/export', [CustomerController::class, 'export'])
        ->middleware('permission:customers-export')
        ->name('customers.export');

    Route::post('customers/store-ajax', [CustomerController::class, 'storeAjax'])
        ->middleware('permission:customers-create')
        ->name('customers.store-ajax');

    Route::get('customers/{customer}/history', [CustomerController::class, 'getHistory'])
        ->middleware('permission:transactions-access')
        ->name('customers.history');

    Route::resource('customers', CustomerController::class)
        ->middleware([
            'index' => 'permission:customers-access',
            'show' => 'permission:customers-access',
            'create' => 'permission:customers-create',
            'store' => 'permission:customers-create',
            'edit' => 'permission:customers-edit',
            'update' => 'permission:customers-edit',
            'destroy' => 'permission:customers-delete',
        ]);

    // ── Sales People ──────────────────────────────────────────────────────────
    //
    // ! ATURAN URUTAN: /{salesPerson}/targets SEBELUM resource()
    //

    Route::get('sales-people/{salesPerson}/targets', [SalesPersonController::class, 'targets'])
        ->middleware('permission:sales-people-access')
        ->name('sales-people.targets');

    Route::post('sales-people/{salesPerson}/targets', [SalesPersonController::class, 'storeTarget'])
        ->middleware('permission:sales-people-edit')
        ->name('sales-people.targets.store');

    Route::resource('sales-people', SalesPersonController::class)
        ->middleware([
            'index' => 'permission:sales-people-access',
            'show' => 'permission:sales-people-access',
            'create' => 'permission:sales-people-create',
            'store' => 'permission:sales-people-create',
            'edit' => 'permission:sales-people-edit',
            'update' => 'permission:sales-people-edit',
            'destroy' => 'permission:sales-people-delete',
        ]);

    // ── Discounts (Promo) ─────────────────────────────────────────────────────

    Route::resource('discounts', DiscountController::class)
        ->middleware([
            'index' => 'permission:discounts-access',
            'show' => 'permission:discounts-access',
            'create' => 'permission:discounts-create',
            'store' => 'permission:discounts-create',
            'edit' => 'permission:discounts-edit',
            'update' => 'permission:discounts-edit',
            'destroy' => 'permission:discounts-delete',
        ]);

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
        Route::get('/', [TransactionController::class, 'index'])->name('index')->middleware('permission:transactions-access');
        Route::get('/history', [TransactionController::class, 'history'])->name('history')->middleware('permission:transactions-access');
        Route::get('/print/{saleNumber}', [TransactionController::class, 'print'])
            ->where('saleNumber', '.*')
            ->name('print')
            ->middleware('permission:transactions-access');

        // 2. API
        Route::get('/get-variants-pos', [TransactionController::class, 'getVariantsForPOS'])->name('get-variants-pos')->middleware('permission:transactions-access');
        Route::get('/get-intensities', [TransactionController::class, 'getIntensitiesForVariant'])->name('get-intensities')->middleware('permission:transactions-access');
        Route::get('/get-variants', [TransactionController::class, 'getVariantsForIntensity'])->name('get-variants')->middleware('permission:transactions-access');
        Route::get('/get-sizes', [TransactionController::class, 'getAvailableSizes'])->name('get-sizes')->middleware('permission:transactions-access');
        Route::post('/get-perfume-price', [TransactionController::class, 'getPerfumePrice'])->name('get-perfume-price')->middleware('permission:transactions-access');
        Route::get('/get-variants-custom', [TransactionController::class, 'getVariantsForCustom'])->name('get-variants-custom')->middleware('permission:transactions-access');
        Route::get('/get-custom-price', [TransactionController::class, 'getCustomPrice'])->name('get-custom-price')->middleware('permission:transactions-access');

        // 3. Cart
        Route::post('/add-to-cart', [TransactionController::class, 'addToCart'])->name('add-to-cart')->middleware('permission:transactions-create');
        Route::post('/add-custom-to-cart', [TransactionController::class, 'addCustomToCart'])->name('add-custom-to-cart')->middleware('permission:transactions-create');
        Route::patch('/cart/{id}', [TransactionController::class, 'updateCart'])->name('update-cart')->middleware('permission:transactions-create');
        Route::delete('/cart/{id}', [TransactionController::class, 'destroyCart'])->name('destroy-cart')->middleware('permission:transactions-create');

        // 4. Hold / Resume
        Route::post('/hold', [TransactionController::class, 'holdCart'])->name('hold')->middleware('permission:transactions-create');
        Route::post('/resume/{holdId}', [TransactionController::class, 'resumeHeldCart'])->name('resume')->middleware('permission:transactions-create');
        Route::delete('/held/{holdId}', [TransactionController::class, 'deleteHeldCart'])->name('delete-held')->middleware('permission:transactions-create');

        // 5. Checkout
        Route::post('/store', [TransactionController::class, 'store'])->name('store')->middleware('permission:transactions-create');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Shift Kasir (Cash Drawer)
    // ─────────────────────────────────────────────────────────────────────────

    Route::prefix('cash-drawers')->name('cash-drawers.')->group(function () {
        Route::get('/current', [CashDrawerController::class, 'current'])->name('current')->middleware('permission:cash-drawers-access');
        Route::get('/', [CashDrawerController::class, 'index'])->name('index')->middleware('permission:cash-drawers-access');
        Route::post('/open', [CashDrawerController::class, 'open'])->name('open')->middleware('permission:cash-drawers-open');
        Route::get('/{id}', [CashDrawerController::class, 'show'])->name('show')->middleware('permission:cash-drawers-access');
        Route::put('/close/{id}', [CashDrawerController::class, 'close'])->name('close')->middleware('permission:cash-drawers-close');
        Route::post('/transaction', [CashDrawerController::class, 'storeTransaction'])->name('store-transaction')->middleware('permission:cash-drawers-access');
        Route::get('/print/{id}', [CashDrawerController::class, 'printRecap'])->name('print')->middleware('permission:cash-drawers-print');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pembayaran
    // ─────────────────────────────────────────────────────────────────────────

    // ! ATURAN URUTAN: /toggle SEBELUM resource()

    Route::patch('payment-methods/{paymentMethod}/toggle', [PaymentMethodController::class, 'toggle'])
        ->middleware('permission:payment-methods-edit')
        ->name('payment-methods.toggle');

    Route::resource('payment-methods', PaymentMethodController::class)
        ->middleware([
            'index' => 'permission:payment-methods-access',
            'show' => 'permission:payment-methods-access',
            'create' => 'permission:payment-methods-create',
            'store' => 'permission:payment-methods-create',
            'edit' => 'permission:payment-methods-edit',
            'update' => 'permission:payment-methods-edit',
            'destroy' => 'permission:payment-methods-delete',
        ]);

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

        Route::get('app', [AppSettingController::class, 'index'])
            ->middleware('permission:payment-settings-access')
            ->name('app.index');

        Route::put('app', [AppSettingController::class, 'update'])
            ->middleware('permission:payment-settings-access')
            ->name('app.update');

        Route::get('payments', [PaymentSettingController::class, 'edit'])
            ->middleware('permission:payment-settings-access')
            ->name('payments.edit');

        Route::put('payments', [PaymentSettingController::class, 'update'])
            ->middleware('permission:payment-settings-access')
            ->name('payments.update');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Profil
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // POS Specific Features (View Only for Cashiers)
    // ─────────────────────────────────────────────────────────────────────────
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('stock', [POSFeatureController::class, 'stock'])->name('stock')->middleware('permission:transactions-access');
        Route::get('transactions', [POSFeatureController::class, 'transactions'])->name('transactions')->middleware('permission:transactions-access');
    });

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

});

require __DIR__ . '/auth.php';
