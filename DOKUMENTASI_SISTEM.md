# Dokumentasi Sistem POS Harumnya

Dokumen ini menjelaskan sistem POS Harumnya secara menyeluruh berdasarkan struktur kode, route, controller, service, migration, dan menu frontend yang ada di project.

## 1. Ringkasan Sistem

POS Harumnya adalah aplikasi Point of Sales dan inventory untuk bisnis parfum. Sistem mendukung penjualan parfum reguler, custom order parfum, kemasan tambahan, promo/reward, shift kasir, pembelian stok, transfer stok, repack/produksi, penyesuaian stok, laporan penjualan, laporan keuangan, dan laporan mutasi bahan/kemasan.

Tujuan utama sistem:

- Mengelola katalog parfum: varian, intensitas, ukuran, resep, produk, dan harga.
- Mengelola bahan baku dan kemasan, termasuk stok gudang dan stok toko.
- Mencatat pembelian dari supplier sampai stok masuk.
- Memindahkan stok antar gudang/toko.
- Melakukan produksi/repack bahan.
- Melakukan transaksi POS dengan cart, hold/resume, multi-payment, diskon, reward, dan cetak invoice.
- Mencatat shift kasir serta kas masuk/keluar.
- Menyediakan laporan operasional, penjualan, keuangan, dan mutasi stok.
- Mengatur akses pengguna berbasis role dan permission.

## 2. Teknologi Yang Digunakan

Backend:

- Laravel 12.
- PHP 8.2 ke atas.
- Inertia Laravel 2.
- Laravel Sanctum.
- Spatie Laravel Permission.
- DomPDF.
- PhpSpreadsheet.

Frontend:

- React 18.
- Inertia React 2.
- Vite 5.
- Tailwind CSS 3.
- Headless UI.
- Tabler Icons.
- Chart.js dan Recharts.
- SweetAlert2.
- React Hot Toast.

Database dan infrastruktur:

- PostgreSQL 15 pada `docker-compose.yml`.
- Redis 7 untuk cache/queue.
- Nginx reverse proxy.
- ACME companion untuk SSL.
- Backup database harian via container `db-backup`.

## 3. Struktur Aplikasi

Struktur penting project:

- `app/Http/Controllers`: controller backend Laravel.
- `app/Http/Controllers/Apps`: controller modul aplikasi dashboard/POS.
- `app/Http/Controllers/Laporan`: laporan penjualan, keuangan, dan mutasi.
- `app/Services`: service bisnis untuk stok, produk, transfer, repack, diskon, pembayaran.
- `app/Models`: model Eloquent untuk semua tabel utama.
- `app/Http/Requests`: validasi form.
- `routes/web.php`: route utama Inertia/dashboard.
- `routes/auth.php`: route autentikasi Laravel Breeze.
- `routes/api.php`: saat ini kosong.
- `resources/js/Pages`: halaman React/Inertia.
- `resources/js/Components`: komponen UI umum, dashboard, POS, receipt.
- `resources/js/Layouts`: layout dashboard, POS, guest, authenticated.
- `resources/js/Utils/Menu.jsx`: definisi menu sidebar.
- `resources/js/Utils/Permission.jsx`: helper permission frontend.
- `database/migrations`: struktur database.
- `database/seeders`: data awal, role, permission, master data, sample transaksi.
- `docker-compose.yml`: konfigurasi deployment container.

## 4. Arsitektur Umum

Alur request utama:

1. User membuka aplikasi.
2. Route `/` mengarahkan ke login.
3. Setelah login, user masuk ke `/dashboard`.
4. Laravel memproses route di `routes/web.php`.
5. Controller mengirim data ke halaman React melalui Inertia.
6. React menampilkan halaman dan melakukan submit/filter melalui Inertia request.
7. Backend memvalidasi request, menjalankan transaksi database, lalu redirect/response.

Komponen penting:

- `HandleInertiaRequests` membagikan `auth`, role, permission, flag super admin, dan `activeCashDrawer` ke semua halaman.
- `Permission.jsx` memberi akses penuh bila `auth.super` true, selain itu mengecek permission dari props Inertia.
- `Menu.jsx` menampilkan menu sesuai permission user.
- Role `cashier` dibatasi ke menu POS tertentu dan diarahkan ke transaksi POS.

## 5. Autentikasi Dan Hak Akses

Autentikasi menggunakan Laravel Breeze dan session web.

Hak akses menggunakan Spatie Laravel Permission. Seeder utama berada di:

- `database/seeders/RolePermissionSeeder.php`

Role bawaan:

- `super-admin`: mendapat semua permission.
- `cashier`: mendapat akses POS, shift, katalog read-only, pelanggan, diskon read-only, dan stok toko read-only.

Contoh permission utama:

- Dashboard: `dashboard-access`.
- POS/transaksi: `transactions-access`, `transactions-create`, `transactions-all`, `transactions-void`, `transactions-refund`.
- Produk: `products-access`, `products-create`, `products-edit`, `products-delete`, `products-recalculate`.
- Varian: `variants-access`, `variants-create`, `variants-edit`, `variants-delete`.
- Resep: `recipes-access`, `recipes-create`, `recipes-edit`, `recipes-delete`, `recipes-import`.
- Bahan baku: `ingredients-access`, `ingredients-create`, `ingredients-edit`, `ingredients-delete`.
- Kemasan: `packaging-access`, `packaging-create`, `packaging-edit`, `packaging-delete`.
- Stok: `stock-access`, `stock-warehouse-access`, `stock-store-access`, `stock-transfer`, `stock-adjustment`, `stock-repack`.
- Pembelian: `purchases-access`, `purchases-create`, `purchases-edit`, `purchases-delete`, `purchases-submit`, `purchases-approve`, `purchases-receive`, `purchases-complete`, `purchases-cancel`.
- Promo: `discounts-access`, `discounts-create`, `discounts-edit`, `discounts-delete`.
- Shift kasir: `cash-drawers-access`, `cash-drawers-open`, `cash-drawers-close`, `cash-drawers-print`.
- Laporan: `reports-access`, `profits-access`.
- Pengguna: `users-access`, `users-create`, `users-update`, `users-delete`.
- Role dan permission: `roles-access`, `roles-create`, `roles-update`, `roles-delete`, `permissions-access`.

## 6. Menu Sistem

Menu berasal dari `resources/js/Utils/Menu.jsx`.

### 6.1 Overview

Dashboard:

- Route: `dashboard`.
- Permission: `dashboard-access`.
- Fungsi: menampilkan KPI, tren revenue, transaksi terbaru, performa toko, stok rendah, top variant, top customer, metode pembayaran, diskon, dan performa sales.

### 6.2 Master Data

Varian:

- Route: `variants.index`.
- Permission: `variants-access`.
- Fungsi: master varian parfum, termasuk kode, nama, gambar, gender, brand/family, dan status aktif.

Intensitas:

- Route: `intensities.index`.
- Permission: `intensities-access`.
- Fungsi: master konsentrasi parfum, seperti oil ratio dan alcohol ratio.

Size:

- Route: `sizes.index`.
- Permission: `sizes-access`.
- Fungsi: master ukuran/volume parfum.

Harga Intensitas:

- Route: `intensity-size-prices.index`.
- Permission: `products-edit`.
- Fungsi: mengatur harga berdasarkan kombinasi intensitas dan size.

Supplier:

- Route: `suppliers.index`.
- Permission: `suppliers-access`.
- Fungsi: master supplier bahan baku/kemasan.

### 6.3 Bahan Baku Dan Produk

Bahan Baku:

- Route: `ingredients.index`.
- Permission: `ingredients-access`.
- Fungsi: master bahan seperti oil, alcohol, bibit parfum, dan kategori bahan.

Kemasan:

- Route: `packaging.index`.
- Permission: `packaging-access`.
- Fungsi: master botol, tutup, dus, plastik, addon, harga beli, harga jual, WAC, status gratis, dan kategori kemasan.

Formula Dan Resep:

- Route: `recipes.index`.
- Permission: `recipes-access`.
- Fungsi: mengelola resep varian per intensitas, import resep, dan generate produk dari resep.

Produk Dan Harga:

- Route: `products.index`.
- Permission: `products-access`.
- Fungsi: produk siap jual hasil kombinasi varian, intensitas, size, resep, harga, dan biaya produksi.

### 6.4 Lokasi Dan Tempat

Gudang:

- Route: `warehouses.index`.
- Permission: `warehouses-access`.
- Fungsi: master lokasi gudang.

Toko/Cabang:

- Route: `stores.index`.
- Permission: `stores-access`.
- Fungsi: master toko/cabang.

Kategori Toko:

- Route: `store-categories.index`.
- Permission: `store-categories-access`.
- Fungsi: mengelompokkan toko dan mengatur varian yang tersedia per kategori toko.

### 6.5 Manajemen Stok

Stok Gudang:

- Route: `warehouse-stocks.index`.
- Permission: `stock-warehouse-access`.
- Fungsi: melihat dan mengelola stok bahan/kemasan di gudang.

Stok Toko:

- Route: `store-stocks.index`.
- Permission: `stock-store-access`.
- Fungsi: melihat dan mengelola stok bahan/kemasan di toko.

Produksi/Repack:

- Route: `repacks.index`.
- Permission: `repacks-access`.
- Fungsi: mengubah input ingredient menjadi output ingredient, mengurangi stok input, menambah stok output, dan mencatat pergerakan stok.

Transfer Stok:

- Route: `stock-transfers.index`.
- Permission: `stock-transfer`.
- Fungsi: transfer bahan/kemasan antar gudang dan toko.

Penyesuaian Stok:

- Route: `stock-adjustments.index`.
- Permission: `stock-adjustment`.
- Fungsi: stock opname, barang rusak, hilang, ditemukan, expired, mutasi harian, dan adjustment lain.

Log Pergerakan Stok:

- Route: `stock-movements.index`.
- Permission: `stock-access`.
- Fungsi: audit trail semua movement stok.

### 6.6 Pembelian

Purchase Order:

- Route: `purchases.index`.
- Permission: `purchases-access`.
- Fungsi: membuat PO ke supplier, approval, receive, complete, update stok, update WAC, dan catat stock movement.

### 6.7 Penjualan

Pelanggan:

- Route: `customers.index`.
- Permission: `customers-access`.
- Fungsi: data customer, poin, tier, histori transaksi, dan export.

Sales:

- Data Sales: `sales-people.index`.
- Ranking Produktivitas: `sales-people.productivity`.
- Permission: `sales-people-access`.
- Fungsi: master sales person, target, dan ranking produktivitas.

Promo Dan Diskon:

- Route: `discounts.index`.
- Permission: `discounts-access`.
- Fungsi: konfigurasi diskon, syarat, reward, store applicability, dan game/spin reward.

Hadiah/Reward:

- Route: `reward-items.index`.
- Permission: `discounts-access`.
- Fungsi: master hadiah non-parfum, stok hadiah, biaya hadiah, dan status aktif.

### 6.8 Transaksi

Riwayat Transaksi:

- Route: `transactions.history`.
- Permission: `transactions-access`.
- Fungsi: histori invoice, filter tanggal/status/store, ringkasan revenue, COGS, profit, dan cetak invoice.

Histori Shift:

- Route: `cash-drawers.index`.
- Permission: `transactions-access`.
- Fungsi: daftar shift kasir tertutup, ringkasan kas, pembayaran, item terjual, dan cetak rekap.

### 6.9 Laporan

Laporan Penjualan:

- Route: `laporan.penjualan`.
- Permission: `reports-access`.
- Fungsi: laporan detail penjualan dan export Excel.

Laporan Keuangan:

- Route: `laporan.keuangan`.
- Permission: `profits-access`.
- Fungsi: laporan revenue, COGS, gross profit, margin, pembayaran, diskon, dan export Excel.

Mutasi Bahan Dan Kemasan:

- Route: `laporan.mutasi`.
- Permission: `reports-access`.
- Fungsi: laporan mutasi stok ingredient dan packaging, termasuk export Excel.

### 6.10 Manajemen Pengguna

Hak Akses:

- Route: `permissions.index`.
- Permission: `permissions-access`.
- Fungsi: melihat daftar permission.

Akses Group:

- Route: `roles.index`.
- Permission: `roles-access`.
- Fungsi: CRUD role dan sinkronisasi permission.

Pengguna:

- Data Pengguna: `users.index`.
- Tambah Data Pengguna: `users.create`.
- Permission: `users-access`, `users-create`.
- Fungsi: mengelola user, role, default warehouse, dan default store.

### 6.11 Pengaturan

Metode Pembayaran:

- Route: `payment-methods.index`.
- Permission: `payment-methods-access`.
- Fungsi: mengatur metode pembayaran, tipe pembayaran, admin fee, bisa memberi kembalian, dan status aktif.

Pengaturan Umum:

- Route: `settings.app.index`.
- Permission: `payment-settings-access`.
- Fungsi: pengaturan aplikasi umum, termasuk threshold dan deskripsi loyalty reward.

Pengaturan Payment Gateway:

- Route: `settings.payments.edit`.
- Permission: `payment-settings-access`.
- Fungsi: konfigurasi payment gateway seperti Midtrans/Xendit.

### 6.12 Menu Khusus POS

POS stock:

- Route: `pos.stock`.
- Permission: `transactions-access`.
- Fungsi: kasir melihat stok toko saat ini.

POS transactions:

- Route: `pos.transactions`.
- Permission: `transactions-access`.
- Fungsi: kasir melihat histori transaksi toko/default store.

POS fulfillment:

- Route: `pos.fulfillment.index`, `pos.fulfillment.show`.
- Permission: `transactions-access`.
- Fungsi: toko menerima transfer stok yang ditujukan ke toko tersebut.

## 7. Alur Sistem Utama

### 7.1 Alur Login Dan Akses

1. User membuka aplikasi.
2. Sistem mengarah ke halaman login.
3. User login menggunakan email dan password.
4. Middleware Inertia membagikan data user, role, permission, dan shift aktif.
5. Jika user adalah kasir murni, dashboard mengarahkan ke halaman POS/transaksi.
6. Menu sidebar difilter berdasarkan permission.
7. Request ke setiap route tetap divalidasi backend dengan middleware permission.

### 7.2 Alur Setup Master Data Awal

Urutan setup yang disarankan:

1. Buat gudang.
2. Buat toko/cabang.
3. Buat user dan tentukan default store/default warehouse.
4. Buat supplier.
5. Buat kategori ingredient dan ingredient.
6. Buat kategori packaging dan packaging material.
7. Buat varian, intensitas, size.
8. Buat harga intensitas-size.
9. Buat resep varian per intensitas.
10. Generate produk dan hitung biaya produksi.
11. Buat metode pembayaran.
12. Buat promo/diskon bila diperlukan.

### 7.3 Alur Purchase Order

Controller: `PurchaseController`.

Status:

- `draft`.
- `pending`.
- `approved`.
- `received`.
- `completed`.
- `cancelled`.

Alur:

1. Admin membuat PO sebagai draft.
2. PO berisi supplier, tujuan stok (`warehouse` atau `store`), tanggal pembelian, item, pajak, diskon, ongkir, adjustment, dan catatan.
3. Draft diajukan menjadi `pending`.
4. User berwenang menyetujui menjadi `approved`.
5. Saat barang datang, quantity diterima dicatat dan status menjadi `received`.
6. Saat PO diselesaikan, sistem:
   - Menambahkan stok ke lokasi tujuan.
   - Menghitung landed cost per barang dengan cara:
     1. Biaya barang yang hilang/rusak (selisih qty dipesan - qty diterima) diserap ke HPP barang yang diterima.
     2. Menambahkan alokasi ongkir dan adjustment secara proporsional.
   - Menghitung Weighted Average Cost (WAC) baru yang lebih akurat.
   - Update `average_cost` dan `total_value` stok.
   - Sinkron average cost ke master ingredient/packaging.
   - Membuat `stock_movements` dengan movement type `purchase_in`.
   - Menandai PO sebagai `completed`.
7. PO bisa dibatalkan jika status masih memenuhi aturan cancel.
8. Draft bisa dihapus.

### 7.4 Alur Transfer Stok

Controller: `StockTransferController`.

Status:

- `draft`.
- `pending`.
- `approved`.
- `in_transit`.
- `completed`.
- `cancelled`.

Alur:

1. Admin membuat transfer dari lokasi asal ke lokasi tujuan.
2. Lokasi bisa `warehouse` atau `store`.
3. Sistem validasi lokasi asal dan tujuan tidak sama.
4. Sistem validasi stok sumber cukup.
5. Draft diajukan menjadi `pending`.
6. Transfer disetujui menjadi `approved`.
7. Saat dikirim:
   - Quantity sent dicatat.
   - Stok lokasi asal dikurangi.
   - `stock_movements` dibuat dengan `transfer_out`.
   - Status menjadi `in_transit`.
8. Saat diterima:
   - Quantity received dicatat.
   - Stok lokasi tujuan ditambah.
   - WAC tujuan dihitung ulang berdasarkan WAC sumber.
   - `stock_movements` dibuat dengan `transfer_in`.
   - Status menjadi `completed`.
9. Transfer ke toko juga bisa diterima dari menu POS Fulfillment oleh toko tujuan.

### 7.5 Alur Penyesuaian Stok

Controller: `StockAdjustmentController`.

Jenis adjustment:

- `stock_opname`.
- `damage`.
- `loss`.
- `found`.
- `expired`.
- `daily_mutation`.
- `other`.

Status:

- `draft`.
- `pending`.
- `approved`.
- `completed`.
- `cancelled`.

Alur:

1. User membuat adjustment untuk lokasi gudang atau toko.
2. Sistem membaca stok sistem saat ini.
3. User mengisi physical quantity atau delta quantity.
4. Sistem menghitung selisih dan value difference.
5. Draft diajukan menjadi `pending`.
6. Disetujui menjadi `approved`.
7. Saat complete:
   - Stok ditambah jika selisih positif.
   - Stok dikurangi jika selisih negatif.
   - WAC dihitung ulang hanya pada surplus.
   - `stock_movements` dibuat dengan:
     - `adjustment_in` untuk penambahan.
     - `adjustment_out` untuk pengurangan umum.
     - `waste` untuk damage/expired.
   - Status menjadi `completed`.

### 7.6 Alur Repack/Produksi

Controller: `RepackController`.

Status:

- `draft`.
- `pending`.
- `approved`.
- `completed`.
- `cancelled`.

Alur:

1. User memilih lokasi produksi (`warehouse` atau `store`).
2. User memilih output ingredient dan jumlah output.
3. User menambahkan ingredient input dan quantity.
4. Sistem menghitung total input cost dari WAC stok.
5. Sistem menghitung output cost per unit = total input cost / output quantity.
6. Saat complete:
   - Stok semua ingredient input dikurangi.
   - Movement `production_out` dibuat.
   - Stok output ingredient ditambah.
   - WAC output dihitung ulang.
   - Movement `production_in` dibuat.
   - Status menjadi `completed`.

### 7.7 Alur POS Reguler

Controller utama: `TransactionController`.

Alur:

1. Kasir membuka halaman transaksi.
2. Sistem mengambil default store dari user.
3. Sistem mengecek shift kasir aktif (`cash_drawers` status `open`).
4. Sistem memuat:
   - Cart aktif kasir.
   - Held carts.
   - Intensitas aktif.
   - Customer aktif.
   - Sales person toko.
   - Packaging addon aktif.
   - Payment method aktif.
   - Discount aktif untuk toko.
   - Custom pricing rules.
5. Kasir memilih varian, intensitas, size.
6. Sistem menghitung harga dari `intensity_size_prices`.
7. Kasir menambahkan item ke cart.
8. Kasir bisa menambahkan packaging addon.
9. Kasir bisa hold cart dan resume cart.
10. Saat checkout:
    - Sistem membuat invoice number.
    - Sistem membuat record `sales`.
    - Sistem membuat `sale_items`.
    - Sistem membuat `sale_item_packagings`.
    - Sistem membuat `sale_payments`.
    - Sistem menyimpan snapshot nama, harga, COGS, margin, customer, cashier, store.
    - Sistem menerapkan discount/reward jika ada.
    - Sistem mengurangi stok bahan dan kemasan lewat `StockDeductionService`.
    - Sistem menghapus cart aktif.
11. Invoice dapat dicetak dari route print.

### 7.8 Alur POS Custom Order

Alur:

1. Kasir memilih varian custom.
2. Kasir mengisi quantity oil dan alcohol.
3. Sistem validasi alcohol tidak boleh melebihi oil.
4. Sistem membaca pricing rule custom order.
5. Sistem mengambil selling price ingredient oil:
   - Prioritas dari ingredient oil yang terkait varian.
   - Fallback ke ingredient oil aktif manapun yang punya selling price.
6. Harga custom = oil quantity x selling price oil.
7. Alcohol dianggap gratis ke customer, tetapi HPP alcohol tetap dihitung untuk margin.
8. Custom order masuk cart dengan field custom:
   - `is_custom_order`.
   - `custom_oil_qty`.
   - `custom_alcohol_qty`.
   - `custom_total_volume`.
   - `oil_selling_price_snapshot`.
   - `alcohol_cost_snapshot`.
9. Saat checkout, stok oil dan alcohol dikurangi sesuai custom quantity.

### 7.9 Alur Diskon Dan Reward

Komponen:

- `discount_types`.
- `discount_requirements`.
- `discount_rewards`.
- `discount_reward_pools`.
- `discount_stores`.
- `discount_usages`.
- `reward_items`.

Tipe diskon yang didukung service:

- Percentage.
- Fixed amount.
- Buy X Get Y.
- Free product.
- Game/spin reward.
- Reward item.
- Points.

Alur:

1. Admin membuat discount type.
2. Admin mengatur periode aktif, prioritas, toko yang berlaku, syarat belanja, syarat item, dan reward.
3. Di POS, sistem mengambil discount aktif untuk store.
4. Saat cart berubah, endpoint eligibility mengecek syarat:
   - Minimal amount.
   - Minimal quantity.
   - Kombinasi varian/intensitas/size.
   - Group requirement untuk mekanisme OR antar grup dan AND dalam grup.
   - Poin customer untuk loyalty reward.
5. Reward bisa berupa parfum gratis, item reward, atau poin.
6. Reward yang dipilih dimasukkan ke cart dengan `is_free` dan `discount_type_id`.
7. Saat checkout, penggunaan diskon dicatat pada sale discount/usage sesuai flow.

### 7.10 Alur Shift Kasir

Controller: `CashDrawerController`.

Alur buka shift:

1. Kasir mengisi modal awal.
2. Sistem mengecek tidak ada shift aktif untuk kasir dan toko tersebut.
3. Sistem membuat `cash_drawers` status `open`.

Alur transaksi kas:

1. Kasir mencatat cash in atau cash out.
2. Sistem membuat `cash_drawer_transactions`.

Alur tutup shift:

1. Sistem menghitung cash sales dari sale payment bertipe cash.
2. Sistem menghitung non-cash sales.
3. Sistem menghitung total cash in dan cash out.
4. Expected ending cash = starting cash + cash sales + cash in - cash out.
5. Kasir mengisi actual ending cash.
6. Difference = actual - expected.
7. Shift ditandai `closed`.

Rekap shift menampilkan:

- Total transaksi.
- Total item terjual.
- Gross sales.
- Total COGS.
- Ringkasan kategori.
- Item terjual.
- Cash in/out.
- Ringkasan pembayaran.

### 7.11 Alur Dashboard

Controller: `DashboardController`.

Data yang ditampilkan:

- KPI revenue, profit, COGS, average order, total transaksi, diskon, poin.
- Trend revenue/profit/COGS per tanggal.
- Penjualan berdasarkan intensitas.
- Penjualan berdasarkan size.
- Top variants.
- Top customers.
- Performa sales people.
- Breakdown metode pembayaran.
- Penggunaan diskon.
- Top packaging.
- Store performance untuk super-admin/admin.
- Stok rendah toko/gudang.
- Transaksi terbaru.
- Shift aktif user.

Filter:

- Date range.
- Store, bila user super-admin/admin.

### 7.12 Alur Laporan

Laporan Penjualan:

- Controller: `LaporanPenjualanController`.
- Mendukung index dan export Excel.
- Fokus ke transaksi, item, customer, kasir, toko, diskon, pembayaran.

Laporan Keuangan:

- Controller: `LaporanKeuanganController`.
- Mendukung index dan export Excel.
- Fokus ke revenue, COGS, gross profit, margin, payment method, dan summary finansial.

Laporan Mutasi:

- Controller: `LaporanMutasiController`.
- Mendukung index dan export Excel.
- Fokus ke `stock_movements` untuk bahan dan kemasan.

## 8. Data Utama Dan Tabel Penting

Master lokasi dan user:

- `users`: user aplikasi dengan default warehouse/store.
- `warehouses`: gudang.
- `stores`: toko/cabang.
- `store_categories`: kategori toko.
- `store_category_variants`: mapping kategori toko ke varian.

Master bahan dan produk:

- `ingredient_categories`: kategori bahan, termasuk tipe ingredient.
- `ingredients`: bahan baku, oil, alcohol, dan bahan lain.
- `suppliers`: supplier.
- `variants`: varian parfum.
- `intensities`: intensitas parfum.
- `sizes`: ukuran/volume.
- `intensity_size_prices`: harga per intensitas dan size.
- `intensity_size_quantities`: quantity komposisi per intensitas dan size.
- `variant_recipes`: resep varian per intensitas.
- `products`: produk siap jual.
- `product_recipes`: resep produk.
- `custom_order_pricing_rules`: aturan custom order.

Master kemasan:

- `packaging_categories`: kategori kemasan.
- `packaging_materials`: bahan kemasan/addon.

Stok:

- `warehouse_ingredient_stocks`.
- `warehouse_packaging_stocks`.
- `store_ingredient_stocks`.
- `store_packaging_stocks`.
- `stock_movements`: audit trail seluruh pergerakan stok.

Pembelian dan transfer:

- `purchases`.
- `purchase_items`.
- `stock_transfers`.
- `stock_transfer_items`.

Adjustment dan produksi:

- `stock_adjustments`.
- `stock_adjustment_items`.
- `repack_transactions`.
- `repack_transaction_items`.

POS dan penjualan:

- `payment_methods`.
- `customers`.
- `customer_point_ledgers`.
- `carts`.
- `cart_packagings`.
- `cart_discounts`.
- `cart_payments`.
- `sales`.
- `sale_items`.
- `sale_item_packagings`.
- `sale_discounts`.
- `sale_payments`.
- `sale_returns`.
- `sale_return_items`.

Promo:

- `discount_types`.
- `discount_applicabilities`.
- `discount_stores`.
- `discount_requirements`.
- `discount_rewards`.
- `discount_reward_pools`.
- `discount_usages`.
- `reward_items`.

Shift:

- `cash_drawers`.
- `cash_drawer_transactions`.

Pengaturan:

- `app_settings`.
- `payment_settings`.

## 9. Konsep Stok Dan HPP

Sistem menggunakan stok per lokasi:

- Gudang ingredient.
- Gudang packaging.
- Toko ingredient.
- Toko packaging.

Setiap stok menyimpan:

- Quantity.
- Min stock.
- Max stock.
- Average cost (WAC).
- Total value.
- Last in/out metadata.

Weighted Average Cost digunakan saat:

- PO selesai dan stok masuk.
- Transfer diterima di lokasi tujuan.
- Repack menghasilkan output.
- Adjustment surplus.

COGS transaksi POS berasal dari:

- `product.production_cost` untuk produk reguler.
- WAC oil dan alcohol untuk custom order.
- `packaging_materials.average_cost` untuk packaging.
- `reward_items.cost_price` untuk reward item.

Stock movement mencatat:

- Lokasi.
- Movement type.
- Item type.
- Quantity change.
- Quantity before/after.
- Unit cost.
- Total cost.
- Average cost before/after.
- Reference type/id/number.
- Movement date.
- Creator.
- Notes.

Movement type yang muncul dalam sistem:

- `purchase_in`.
- `transfer_out`.
- `transfer_in`.
- `adjustment_in`.
- `adjustment_out`.
- `waste`.
- `production_out`.
- `production_in`.
- `sale_deduction`.

## 10. Payment Dan Invoice

Metode pembayaran disimpan di `payment_methods`.

Field penting:

- Name.
- Code.
- Type.
- Admin fee percent.
- Can give change.
- Sort order.
- Active status.

Saat checkout:

- Sistem dapat menyimpan satu atau beberapa `sale_payments`.
- Snapshot nama dan tipe payment disimpan agar histori tetap konsisten walau master berubah.
- Invoice number dibuat dengan format `INV-YYYYMMDD-xxxxx`.
- Invoice dapat dicetak dari halaman print transaksi.

Payment gateway:

- `PaymentGatewayManager`.
- `MidtransGateway`.
- `XenditGateway`.
- Konfigurasi disimpan pada `payment_settings`.

Catatan: route payment gateway aktif tidak terlihat di `routes/api.php` saat dokumentasi ini dibuat, sehingga integrasi gateway tampak tersedia sebagai service tetapi belum terlihat sebagai API publik dari file route saat ini.

## 11. API

File `routes/api.php` saat ini kosong.

Ada middleware `PosStoreMiddleware` yang sudah disiapkan untuk API POS berbasis Sanctum:

- Membaca `X-Store-ID`.
- Fallback ke `users.default_store_id`.
- Menyisipkan `active_store` ke request.

Namun penggunaan middleware tersebut belum terlihat aktif di route API saat ini.

## 12. Deployment

Deployment container pada `docker-compose.yml`:

- `db`: PostgreSQL 15.
- `redis`: Redis 7.
- `app`: Laravel PHP-FPM image.
- `nginx`: web server untuk Laravel public assets.
- `nginx-proxy`: reverse proxy publik.
- `acme-companion`: SSL certificate otomatis.
- `db-backup`: backup PostgreSQL harian jam 02:00, retain 7 hari.

Domain pada compose:

- `harumnya.cloud`.

Volume penting:

- `pgdata`: data PostgreSQL.
- `redisdata`: data Redis.
- `./storage`: file upload/log Laravel.
- `./bootstrap/cache`: cache Laravel.
- `./backups`: backup database.
- `./logs/nginx`: log Nginx.

Perintah development umum:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev
php artisan serve
```

Build frontend:

```bash
npm run build
```

Catatan pemeriksaan saat dokumen dibuat:

- `vendor/autoload.php` belum ada, sehingga `php artisan route:list` belum bisa dijalankan sebelum `composer install`.

## 13. Testing

Folder test tersedia:

- `tests/Feature/Auth`.
- `tests/Feature/ProfileTest.php`.
- `tests/Feature/Transactions/TransactionFlowTest.php`.
- `tests/Unit/ExampleTest.php`.

Command test Laravel:

```bash
php artisan test
```

Karena dependency Composer belum terinstall saat dokumentasi ini dibuat, test belum dapat dijalankan.

## 14. Catatan Operasional Penting

Default store sangat penting:

- POS, shift, transaksi kasir, stok toko, dan fulfillment memakai `users.default_store_id`.
- User kasir tanpa default store akan gagal memproses transaksi.

Shift wajib dibuka:

- Add to cart dan custom order memvalidasi shift aktif.
- Kasir harus membuka shift sebelum memproses pesanan.

Stok dapat negatif pada beberapa proses:

- Migration stok memakai signed integer.
- `StockDeductionService` mencatat warning bila stok menjadi negatif setelah penjualan.
- Transfer dan repack lebih ketat memvalidasi stok cukup.

Snapshot transaksi penting:

- Sale dan sale item menyimpan snapshot nama, harga, COGS, customer, cashier, store, variant, intensity, size, dan payment.
- Ini menjaga laporan historis tetap benar walau master data berubah.

WAC adalah pusat HPP:

- Pembelian, transfer, repack, adjustment, dan penjualan saling bergantung pada average cost.
- Perubahan manual stok sebaiknya tetap melalui modul adjustment agar audit trail utuh.

Urutan route diperhatikan:

- Beberapa route statis harus diletakkan sebelum route parameter/resource agar tidak tertangkap sebagai `{id}`.
- Contoh: route transaction history/print/get endpoint, reward toggle/api-list, sales target/productivity, dan stock adjustment current-stock.

## 15. Ringkasan Alur Bisnis End-To-End

Setup awal:

1. Admin membuat master lokasi, supplier, bahan, kemasan, varian, intensitas, size, resep, produk, harga, metode pembayaran, user, dan permission.

Stok masuk:

1. Admin membuat PO.
2. PO disetujui.
3. Barang diterima.
4. PO completed.
5. Stok bertambah, WAC dihitung, movement tercatat.

Distribusi stok:

1. Admin membuat transfer stok.
2. Transfer disetujui.
3. Stok asal dikurangi saat dikirim.
4. Toko/gudang tujuan menerima.
5. Stok tujuan bertambah dan movement tercatat.

Produksi/repack:

1. Admin memilih bahan input dan bahan output.
2. Sistem menghitung biaya output.
3. Saat complete, input berkurang dan output bertambah.

Penjualan:

1. Kasir buka shift.
2. Kasir memilih produk/custom order dan packaging.
3. Kasir memilih customer/sales/payment/diskon.
4. Checkout membuat invoice.
5. Stok berkurang.
6. Revenue, COGS, profit, poin, dan diskon tersimpan.

Tutup hari:

1. Kasir menutup shift.
2. Sistem menghitung expected cash.
3. Admin melihat histori shift dan laporan.

Audit:

1. Semua pergerakan stok dilihat pada stock movement.
2. Laporan mutasi mengambil data dari movement.
3. Laporan penjualan dan keuangan mengambil data dari sales dan turunannya.

## 16. File Kunci Untuk Maintenance

Route:

- `routes/web.php`.
- `routes/auth.php`.
- `routes/api.php`.

Menu dan permission frontend:

- `resources/js/Utils/Menu.jsx`.
- `resources/js/Utils/Permission.jsx`.

Shared Inertia props:

- `app/Http/Middleware/HandleInertiaRequests.php`.

Controller utama:

- `app/Http/Controllers/DashboardController.php`.
- `app/Http/Controllers/Apps/TransactionController.php`.
- `app/Http/Controllers/Apps/CashDrawerController.php`.
- `app/Http/Controllers/Apps/PurchaseController.php`.
- `app/Http/Controllers/Apps/StockTransferController.php`.
- `app/Http/Controllers/Apps/StockAdjustmentController.php`.
- `app/Http/Controllers/Apps/RepackController.php`.
- `app/Http/Controllers/Apps/ProductController.php`.
- `app/Http/Controllers/Apps/RecipeController.php`.
- `app/Http/Controllers/Apps/DiscountController.php`.
- `app/Http/Controllers/Apps/POS/POSFeatureController.php`.
- `app/Http/Controllers/Laporan/LaporanPenjualanController.php`.
- `app/Http/Controllers/Laporan/LaporanKeuanganController.php`.
- `app/Http/Controllers/Laporan/LaporanMutasiController.php`.

Service utama:

- `app/Services/StockDeductionService.php`.
- `app/Services/StockTransferService.php`.
- `app/Services/StockAdjustmentService.php`.
- `app/Services/StockMovementService.php`.
- `app/Services/RepackService.php`.
- `app/Services/ProductService.php`.
- `app/Services/PerfumeService.php`.
- `app/Services/DiscountService.php`.
- `app/Services/Payments/PaymentGatewayManager.php`.

Seeder penting:

- `database/seeders/DatabaseSeeder.php`.
- `database/seeders/RolePermissionSeeder.php`.
- `database/seeders/UserSeeder.php`.
- `database/seeders/WarehouseStoreSeeder.php`.
- `database/seeders/ProductSeeder.php`.
- `database/seeders/VariantSeeder.php`.
- `database/seeders/VariantRecipeSeeder.php`.
- `database/seeders/StockSeeder.php`.
- `database/seeders/PaymentMethodSeeder.php`.
- `database/seeders/PromoSeeder.php`.

## 17. Rekomendasi Pengembangan Lanjutan

Rekomendasi teknis:

- Install dependency Composer agar route list, test, dan static check bisa dijalankan.
- Tambahkan dokumentasi ERD visual untuk relasi database.
- Tambahkan test untuk alur PO, transfer, adjustment, repack, dan checkout POS.
- Aktifkan atau bersihkan service lama yang belum terhubung route, misalnya beberapa payment gateway/API POS.
- Tambahkan guard validasi stok negatif untuk POS bila bisnis tidak mengizinkan stok minus.
- Tambahkan audit trail user action untuk proses kritis jika trait `TracksUserAction` belum dipakai merata.

Rekomendasi operasional:

- Pastikan setiap kasir memiliki default store.
- Pastikan setiap item master punya kode unik.
- Pastikan WAC tidak kosong sebelum penjualan besar.
- Gunakan PO/transfer/adjustment/repack untuk semua perubahan stok, jangan ubah langsung di database.
- Lakukan backup rutin dan tes restore backup.

