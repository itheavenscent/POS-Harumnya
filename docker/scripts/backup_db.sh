#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
# Load .env file if exists
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_NAME=${DB_DATABASE:-harumnya}
DB_USER=${DB_USERNAME:-postgres}
DB_PASS=${DB_PASSWORD:-postgre}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup for $DB_NAME..."

# Postgres backup
docker compose exec -T db sh -c "PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -d $DB_NAME" > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress the backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Optional: Delete backups older than 7 days
# find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
