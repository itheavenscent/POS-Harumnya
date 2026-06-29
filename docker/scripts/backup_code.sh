#!/bin/bash
# Skrip untuk backup file source code dan file uploads (assets) POS Harumnya

PROJECT_DIR="/var/www/POS-Harumnya"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

echo "Memulai backup file source code dan uploads..."

# Mengompresi seluruh isi proyek, mengecualikan folder besar & backup itu sendiri
tar --exclude="backups" \
    --exclude="node_modules" \
    --exclude="vendor" \
    --exclude=".git" \
    -czf "$BACKUP_DIR/code_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" .

echo "Backup selesai: $BACKUP_DIR/code_$TIMESTAMP.tar.gz"

# Hapus backup file yang lebih lama dari 7 hari agar disk tidak penuh
find "$BACKUP_DIR" -type f -name "code_*.tar.gz" -mtime +7 -delete
echo "Pembersihan file backup lama selesai."
