#!/bin/bash
set -e

echo "=== Starting NPC_SMARTFLOW Deployment ==="
cd /var/www/npc_smartflow

echo "=== Ensure Permissions for Deployment ==="
sudo chown -R $(whoami) /var/www/npc_smartflow || true

echo "=== Sync with Public GitHub Repository ==="
git config --global --add safe.directory /var/www/npc_smartflow || true
git remote set-url origin https://github.com/basketballsiit-rgb/npc_smartflow.git || git remote add origin https://github.com/basketballsiit-rgb/npc_smartflow.git || true
git fetch origin main --force
git reset --hard origin/main
rm -f public/version.json

echo "=== Composer & Artisan Migrate ==="
/usr/bin/php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || true
/usr/bin/php82 artisan migrate --force || php82 artisan migrate --force || true

echo "=== Save Deploy Info ==="
git log -1 --format='{"commit":"%H","date":"%cd","subject":"%s"}' > public/build/deploy_version.json || true
chmod 644 public/build/deploy_version.json || true
chmod -R 755 public/build || true
chmod -R 775 storage bootstrap/cache || true

echo "=== Clear Cache ==="
/usr/bin/php82 artisan optimize:clear || php82 artisan optimize:clear || true
/usr/bin/php82 artisan view:clear || true
/usr/bin/php82 artisan config:clear || true
/usr/bin/php82 artisan route:clear || true
/usr/bin/php82 artisan cache:clear || true

echo "=== Reload Web Services ==="
systemctl reload php82-php-fpm || systemctl reload php-fpm || true
systemctl reload nginx || true

echo "=== Deployment Completed Successfully ==="
