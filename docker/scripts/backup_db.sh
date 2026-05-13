#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
DB_NAME="point_of_sales"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Get password from docker-compose or .env
# For security, you should use a .my.cnf file or environment variable
# Here we use a standard docker compose exec approach

echo "Starting zero-downtime backup for $DB_NAME..."

# --single-transaction is the key for zero downtime on InnoDB tables
docker compose exec -T db mysqldump -u root -psecret --single-transaction $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress the backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Optional: Delete backups older than 7 days
# find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
