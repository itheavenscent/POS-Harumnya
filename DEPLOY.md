# Deploy: Staging → Production

Alur: **push `main` → auto-deploy STAGING** → kamu testing di `staging.harumnya.cloud`
→ **promote MANUAL ke production** (image SHA yang sama, tanpa build ulang).

Staging & production jalan di **VPS yang sama**, terisolasi (DB, redis, assets, domain
sendiri). `nginx-proxy` + `acme-companion` dipakai bersama, routing by domain.

```
push main ──► [staging.yml] build image (:<sha>) ──► deploy STAGING (staging.harumnya.cloud)
                                                          │
                                        (kamu test manual di browser)
                                                          │
                                                          ▼
Actions ─► "Deploy to Production" ─► paste <sha> ─► [production.yml] deploy PROD (harumnya.cloud)
```

Production **tidak pernah** ke-update otomatis dari push. Hanya lewat tombol manual.

---

## Setup satu kali (di VPS + GitHub)

### 1. DNS
Tambah A record: `staging.harumnya.cloud` → **IP VPS yang sama** dgn production.
Cek: `dig +short staging.harumnya.cloud` harus mengembalikan IP VPS.

### 2. Clone repo untuk staging di VPS
```bash
ssh <user>@<vps>
sudo mkdir -p /var/www/POS-Harumnya-staging
sudo chown $USER:$USER /var/www/POS-Harumnya-staging
git clone https://github.com/itheavenscent/POS-Harumnya.git /var/www/POS-Harumnya-staging
```

### 3. Buat `.env` staging
```bash
cd /var/www/POS-Harumnya-staging
cp .env.staging.example .env
# edit .env: isi DB_PASSWORD (bebas, khusus staging). APP_KEY biar kosong —
# workflow akan generate otomatis saat deploy pertama.
nano .env
```

### 4. Pastikan production sudah jalan
Network + `nginx-proxy` milik production dipakai bersama. Cek:
```bash
docker ps --filter name=nginx-proxy      # harus ada & running
```
Workflow staging auto-deteksi nama network dari container `nginx-proxy`.
(Kalau container proxy namanya bukan `nginx-proxy`, sesuaikan di `staging.yml`.)

### 5. GitHub Secrets
Reuse secret yang sudah ada — **tidak perlu tambah baru** (staging & prod 1 VPS):
`VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`. `GITHUB_TOKEN` otomatis.

### 6. (Opsional) Gate approval production
GitHub → Settings → Environments → **production** → **Required reviewers** (tambah dirimu).
Efek: tombol promote production butuh approval manual sebelum jalan.

---

## Pemakaian sehari-hari

### Deploy ke staging
Cukup `git push origin main`. Workflow **Deploy to Staging** jalan otomatis.
Setelah selesai, buka ringkasan job → ada **commit SHA** untuk promote.
Test di: **https://staging.harumnya.cloud**

### Promote ke production
1. GitHub → tab **Actions** → **Deploy to Production** → **Run workflow**.
2. Paste **full 40-char SHA** (dari ringkasan job staging).
3. Run. Prod deploy pakai image SHA itu (identik dgn yg ditest).

---

## Catatan

- **DB staging terpisah & mulai kosong.** Isi lewat migrate (otomatis) + seeder manual bila perlu:
  ```bash
  cd /var/www/POS-Harumnya-staging
  docker compose -p pos-staging -f docker-compose.staging.yml exec staging-app php artisan db:seed --force
  ```
- **Data prod tidak tersentuh** oleh staging — volume & DB container beda.
- **Cek/kelola stack staging** manual:
  ```bash
  cd /var/www/POS-Harumnya-staging
  docker compose -p pos-staging -f docker-compose.staging.yml ps
  docker compose -p pos-staging -f docker-compose.staging.yml logs -f staging-app
  ```
- **Stop staging** (hemat resource kalau tak dipakai):
  ```bash
  docker compose -p pos-staging -f docker-compose.staging.yml down
  ```
- Cert HTTPS staging di-issue otomatis oleh `acme-companion` production begitu DNS
  resolve + container staging naik (butuh port 80 reachable — sudah lewat nginx-proxy).
- `APP_DEBUG=true` & `APP_ENV=staging` sengaja di `.env` staging biar error kelihatan saat test.
