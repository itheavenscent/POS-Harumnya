# Panduan Dev Workflow, Hosting, dan Backup "Harumnya"

Dokumen ini menjelaskan alur kerja pengembangan (workflow), setup server (VPS), SSL (ACME), dan sistem backup database untuk aplikasi **POS Harumnya**.

## 1. Arsitektur & Alur Kerja (Workflow)

### Alur Kerja Pengembangan (Dev Workflow)
1. **Lokal**: Developer membuat fitur atau perbaikan di branch lokal.
2. **GitHub**: Developer melakukan push ke branch `main` di GitHub.
3. **CI/CD (GitHub Actions)**:
   - Menjalankan tes (opsional).
   - Menghubungkan ke VPS via SSH.
   - Menarik (pull) kode terbaru.
   - Membangun (build) image Docker untuk aplikasi.
   - Menjalankan container baru.

### Arsitektur Server (VPS)
Kita menggunakan Docker Compose untuk menjalankan layanan berikut:
- **nginx-proxy**: Sebagai reverse proxy otomatis berbasis Docker.
- **acme-companion**: Untuk otomatisasi SSL (Let's Encrypt).
- **App (Laravel)**: Container PHP-FPM untuk menjalankan logika aplikasi.
- **Nginx**: Web server untuk melayani file statis dan meneruskan request ke PHP-FPM.
- **DB (PostgreSQL)**: Database untuk menyimpan data aplikasi.
- **Redis**: Untuk caching dan session.

---

## 2. Setup Server (Provisioning)

Langkah-langkah untuk menyiapkan VPS baru:

### 1. Install Docker & Docker Compose
Pastikan Docker dan Docker Compose plugin sudah terinstal di VPS (asumsi OS Ubuntu):
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl enable --now docker
```

### 2. Setup Firewall (UFW)
Buka port yang diperlukan:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Clone Repository
Clone project ke direktori `/var/www/` (sesuaikan dengan config GitHub Action):
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <URL_REPO_GITHUB> POS-Harumnya
```

---

## 3. SSL Otomatis (ACME / Let's Encrypt)

Kita menggunakan **nginx-proxy** dan **acme-companion** untuk mengelola SSL secara otomatis. Konfigurasi sudah ada di `docker-compose.yml`.

### Cara Kerja:
1. `nginx-proxy` mendengarkan port 80 dan 443 dan memindai container yang memiliki environment variable `VIRTUAL_HOST`.
2. `acme-companion` mendeteksi environment variable `LETSENCRYPT_HOST` dan otomatis meminta sertifikat SSL ke Let's Encrypt.
3. Sertifikat disimpan di volume Docker `certs`.
4. `nginx-proxy` otomatis me-redirect traffic HTTP ke HTTPS.

> [!IMPORTANT]
> Pastikan DNS domain `harumnya.cloud` sudah diarahkan ke IP Publik VPS Anda sebelum menjalankan Docker Compose.

---

## 4. Zero Downtime Deployment

Untuk mencapai *near-zero downtime* pada single VPS menggunakan Docker Compose:

### Strategi:
Saat menjalankan `docker compose up -d`, Docker akan:
1. Menghentikan container lama sebentar.
2. Menjalankan container baru.

Untuk meminimalkan downtime:
- Kita bisa menggunakan **Docker Swarm** (single node) untuk rolling updates sejati.
- Atau menggunakan script deployment yang menjalankan container baru sebelum mematikan container lama (Blue-Green).

Dalam setup dasar ini, kita menggunakan `docker compose up -d` yang hanya memakan waktu beberapa detik downtime. Jika ingin benar-benar zero downtime, disarankan migrasi ke **Docker Swarm** dengan perintah:
```bash
docker swarm init
docker stack deploy -c docker-compose.yml harumnya
```

---

## 5. Backup Database (Zero Downtime)

Sistem backup menggunakan `pg_dump` yang secara inheren mendukung backup tanpa mengunci database (zero downtime).
- Membuat snapshot database yang konsisten.
- Aplikasi tetap bisa membaca dan menulis data saat backup berjalan.

### Menjalankan Backup
Gunakan script yang sudah disediakan:
```bash
chmod +x docker/scripts/backup_db.sh
./docker/scripts/backup_db.sh
```

### Otomatisasi dengan Cron Job
Untuk menjalankan backup otomatis setiap hari jam 2 pagi:
1. Jalankan `crontab -e`.
2. Tambahkan baris berikut:
```bash
0 2 * * * /var/www/POS-Harumnya/docker/scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

---

## 6. Konfigurasi GitHub Actions

Pastikan Anda menambahkan **Secrets** berikut di repository GitHub Anda (`Settings > Secrets and variables > Actions`):
- `VPS_HOST`: IP Publik VPS Anda.
- `VPS_USERNAME`: Username SSH (misal: `root` atau `ubuntu`).
- `VPS_SSH_KEY`: Private key SSH untuk login ke VPS.

File workflow sudah tersedia di `.github/workflows/deploy.yml`.
