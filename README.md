# POS Harumnya

POS Harumnya adalah sistem *Point of Sales* (POS) dan manajemen inventaris tingkat lanjut (advanced inventory management) yang dikembangkan khusus untuk bisnis parfum. Sistem ini memfasilitasi penjualan langsung secara reguler maupun pemesanan *custom* parfum (racikan mandiri). Selain itu, sistem ini mencakup manajemen pembelian bahan baku, manajemen *shift* kasir, transfer stok antar gudang/cabang, *repack* (produksi), penyesuaian (opname) stok, serta pelaporan keuangan yang komprehensif.

## Fitur Utama

### 🛒 Point of Sales (POS) & Transaksi
- **Transaksi Dinamis:** Dukungan penuh untuk *cart* (keranjang belanja), *hold/resume* keranjang, sistem multi-payment, dan diskon.
- **Custom Order:** Kasir dapat meracik parfum sesuai rasio campuran minyak (oil) dan alkohol yang diminta pelanggan secara *custom*, serta dapat memilih berbagai varian *packaging* secara on-the-fly.
- **Promo & Reward:** Terintegrasi dengan sistem promo otomatis (potongan harga, produk gratis) dan manajemen poin keanggotaan pelanggan.
- **Manajemen Kasir & Shift:** Transaksi kasir dilakukan secara *session-based* dengan pencatatan *cash drawer* yang mendetail saat buka maupun tutup shift.

### 📦 Manajemen Inventaris & Stok
- **Bahan Baku & Kemasan:** Pendataan terpisah untuk stok bahan cair (*ingredients*) dalam mililiter, dan kemasan (*packaging*) fisik.
- **Multi Gudang & Cabang:** Pemisahan stok gudang pusat dan stok toko/cabang. Mendukung alur *transfer* stok antar lokasi dengan *approval workflow* (submit, approve, send, receive).
- **Repack (Produksi Internal):** Sistem memiliki alur produksi untuk meracik/mengemas bahan baku (*ingredients*) dan kemasan (*packaging*) menjadi produk akhir siap jual berdasarkan resep yang tersimpan.
- **Stock Opname/Adjustment:** Proses *adjustment* inventaris dengan pelacakan pergerakan stok harian yang transparan.

### 📊 Master Data & Katalog
- **Varian Parfum:** Data master untuk berbagai macam merek atau varian wangi.
- **Intensitas & Konsentrasi:** Pengaturan perbandingan komposisi standar (contoh: Eau de Toilette, Eau de Parfum, Extrait, Pure 100% Oil).
- **Resep Otomatis:** Kombinasi ukuran (*size*), intensitas, dan varian secara sistematis menghasilkan "Produk" siap jual beserta estimasi biayanya berdasarkan resep (BOM).

### 📈 Pelaporan Keuangan & Analitik
- Dashboard analitik yang menampilkan omzet/pendapatan, laba/rugi, stok dengan kuantitas rendah, dan laporan performa pramuniaga (sales person).
- Cetak *invoice* (struk), laporan shift kasir, laporan penjualan, laporan pembelian, laporan keuangan komprehensif (profitabilitas), dan laporan mutasi barang (*inventory movement*).

## Stack Teknologi

Sistem dibangun dengan tumpukan teknologi modern:

**Backend:**
- [Laravel 12](https://laravel.com/) (Framework PHP)
- [Inertia.js](https://inertiajs.com/) (Menghubungkan Laravel & React)
- [Spatie Permission](https://spatie.be/docs/laravel-permission/v6/introduction) (Manajemen role dan hak akses)
- [DomPDF](https://github.com/dompdf/dompdf) & [PhpSpreadsheet](https://github.com/PHPOffice/PhpSpreadsheet) (Generate dokumen & ekspor laporan)

**Frontend:**
- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/) dengan skema monokrom eksklusif.
- [Tabler Icons](https://tabler-icons.io/)
- [Headless UI](https://headlessui.com/)
- [Chart.js](https://www.chartjs.org/) & [Recharts](https://recharts.org/) (Data Visualisasi)

**Database & Infrastruktur:**
- PostgreSQL 15
- Redis 7 (Cache, Queue, & Session)
- Docker & Docker Compose (Containerized deployment)

## Struktur Direktori Utama

- `app/Http/Controllers/Apps/`: Sentra dari logika kontroler untuk modul aplikasi POS dan inventaris.
- `app/Http/Controllers/Laporan/`: Sentra pengolahan data analitik, statistik, dan pelaporan keuangan.
- `app/Services/`: Lapisan logika bisnis (Business Logic) yang menyimpan skrip *Stock Service*, perhitungan harga, kalkulasi repack, dan promo.
- `app/Models/`: Kumpulan model Eloquent yang merepresentasikan seluruh relasi tabel database.
- `resources/js/Pages/`: Komponen React/Inertia yang memuat antarmuka pengguna dashboard dan halaman POS.
- `database/migrations/`: Skema relasional struktur PostgreSQL.
- `database/seeders/`: Data awal dummy untuk role, master data, dan sampel transaksi uji coba.

## Instalasi & Cara Menjalankan

1. **Persiapan Dependensi:**
   Pastikan PHP 8.2+, Composer, Node.js, dan Docker telah terpasang.

2. **Klon Repositori & Install Dependensi:**
   ```bash
   composer install
   npm install
   ```

3. **Konfigurasi Lingkungan:**
   Salin `.env.example` menjadi `.env`. Sesuaikan kredensial koneksi ke database PostgreSQL dan Redis jika menggunakan koneksi lokal/manual.
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Migrasi dan Seeder (Opsi Lokal):**
   ```bash
   php artisan migrate:fresh --seed
   ```

5. **Jalankan Aplikasi:**
   Terminal pertama (menjalankan peladen backend Laravel):
   ```bash
   php artisan serve
   ```
   Terminal kedua (menjalankan peladen vite frontend React):
   ```bash
   npm run dev
   ```

6. **Deployment dengan Docker:**
   Proyek ini menyertakan `docker-compose.yml` untuk lingkungan produksi.
   ```bash
   docker-compose up -d --build
   ```

## Otentikasi dan Role Akses (Default)

Setelah melakukan seeder, Anda dapat masuk melalui halaman otentikasi login:

- **Super Administrator:** Akses tak terbatas ke seluruh sistem (`super-admin`).
- **Cashier (Kasir):** Akses terbatas pada POS, pengelolaan pelanggan, melihat shift kasir, dan katalog (`cashier`).

## Dokumentasi Teknis

Detail lanjutan dari setiap modul kode, rute (routes), nama kontroler per-tabel, logika *service*, hingga rincian kolom database, tersedia di dalam fail terpisah di akar direktori:
- `DOKUMENTASI_SISTEM.md`
- `DOKUMENTASI_TEKNIS_PER_FILE.md`

## Lisensi

Proyek ini bersifat tertutup (proprietary) dan dikembangkan khusus untuk keperluan internal bisnis Harumnya. Dilarang mendistribusikan ulang, menjual, atau mereplikasi kode ini tanpa izin dari pemilik sistem.
