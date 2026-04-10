# POS Harumnya - ERP & Point of Sales Parfum

> Sistem kasir cerdas dan Enterprise Resource Planning (ERP) mini yang dirancang khusus untuk bisnis ritel dan produksi parfum. Aplikasi ini mencakup manajemen inventori dari tingkat bahan mentah (*raw materials*) hingga barang jadi, formulasi resep, produksi (*repacking*), dan modul kasir dengan dukungan *Custom Order*.

![Dashboard Preview](public/media/revamp-pos.png "Point of Sales Dashboard Preview")
<sub>_Cuplikan antarmuka kasir revamp. Screenshot tambahan ada di bagian di bawah._</sub>

## ✨ Kemampuan Utama

-   **Manajemen Formulasi & Kustomisasi Produk** – Atur produk berdasarkan kombinasi *Variant* (jenis aroma), *Intensity* (EDP, Extrait, dll), dan *Size*. Sistem mendukung resep standar maupun takaran bebas (*Custom Order*).
-   **Alur Produksi (*Repacking*)** – Fitur untuk meracik/memproduksi barang jadi dari bahan mentah (Bibit/Oil & Pelarut/Alcohol). HPP/WAC (*Weighted Average Cost*) dikalkulasi secara otomatis dari nilai bahan baku.
-   **Pengurangan Stok Cerdas (*Auto-Deduction*)** – Ketika kasir melakukan *checkout*, stok yang dipotong sistem otomatis berjalan mundur ke tingkat per *Ingredient* (dalam satuan ml) dan memotong botol kemasan, sesuai dengan *scaling* dari resep varian atau sesuai input kustom pesanan.
-   **Modul Kasir (POS) Multi-Fungsi** – Antarmuka penjualan berkecepatan tinggi dengan fitur keranjang, *Hold Transaction* (simpan keranjang sementara), *Customer History*, integrasi *Custom Order Pricing*, kalkulasi kembalian, diskon, hingga bayar kas dan transfer.
-   **Distribusi Stok Real-time** – Kelola persediaan antara Gudang Utama (*Warehouse*) dan berbagai Toko (*Stores*). Lengkap dengan modul pergerakan inventori: *Purchase Orders*, *Stock Transfers*, *Adjustments*.
-   **Akses Berbasis Role & Laporan** – Manajemen *Role* yang granular via Spatie Permissions. Dilengkapi dengan ringkasan keuangan, laporan profit (GPM), dan historik staf/penjualan.

## 🔧 Teknologi Inti

-   **Backend:** [Laravel 12](https://laravel.com)
-   **Frontend:** [Inertia.js](https://inertiajs.com) + [React](https://react.dev)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com) & Komponen UI modern (Dark Mode Ready)
-   **Akses:** [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)
-   **Ikon:** [Tabler Icons](https://tabler-icons.io)

## 🚀 Cara Menjalankan

```bash
git clone https://github.com/aryadwiputra/point-of-sales.git
cd point-of-sales
cp .env.example .env
composer install && npm install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run dev
php artisan serve
```

### Log in (Contoh Berdasarkan Seeder):
-   **Admin**: `arya@gmail.com` / `password`
-   **Kasir**: `cashier@gmail.com` / `password`

## 📊 Fitur Lengkap

### 1. Manajemen Bahan Baku & Formula
- **Ingredients & Packaging**: Menginventarisir ketersediaan bahan pembuat parfum dan kemasannya.
- **Recipes**: Buat resep pasti per aroma, dengan hitung biaya satuan berdasar fluktuasi harga modal *ingredient*.

### 2. Inventori Lanjut (ERP)
- **Warehouse vs Store**: Lokalisasi aset, sehingga stok toko kasir terpisah dari stok pusat/gudang.
- **Stock Movement Log**: Audit mutasi persediaan masuk-keluar terlengkap seperti kartu stok.

### 3. POS Kasir Interaktif
- **Standar & Custom**: Jual parfum reguler atau pelanggan menentukan rasio ml (bibit) vs ml (pelarut). Validasi minimum pemesanan dan rasio ditangani *real-time*.
- **Customer CRM**: Daftarkan pelanggan dari POS langsung, pantau riwayat *checkout* pelanggan, kelola staf *Sales Person* untuk skema performa/insentif.
- **Thermal Receipt Ready**: Sempurna untuk cetak bon ukuran 58mm atau 80mm pada laci kas.
- **Shortcut Keyboard Cepat**:  
  - `/` atau `F5` : Fokus pencarian  
  - `Escape` : Clear / Tutup  
  - `F1` : Buka numpad pembayaran  

## 📷 Cuplikan Layar

### Versi Revamp POS Harumnya

| Modul     | Preview                                                |
| --------- | ------------------------------------------------------ |
| Dashboard | ![Dashboard Revamp](public/media/revamp-dashboard.png) |
| Kasir/POS | ![POS Revamp](public/media/revamp-pos.png)             |

## 🤝 Kontribusi

1. Fork repo ini
2. Buat branch fitur: `git checkout -b feature/namamu`
3. Commit perubahanmu: `git commit -m "Tambah fitur X"`
4. Push branch: `git push origin feature/namamu`
5. Buka Pull Request

Ada *bug* laporan stok cacat atau ide sinkronisasi yang lebih mutakhir? Buat *issue* agar bisa didiskusikan proses hulu-ke-hilirnya.

## Authors

-   [Arya Dwi Putra](https://www.github.com/aryadwiputra) (Developer Original POS Base)
-   *Basis awal sistem ini dikembangkan menggunakan [RILT-Starter](https://github.com/Raf-Taufiqurrahman/RILT-Starter), kemudian didesain ulang total dari arsitektur datanya menjadi ERP + POS khusus manufaktur parfum skala ritel.*

---

Made with ❤️ menggunakan Laravel + React oleh komunitas Point of Sales.
