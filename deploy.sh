#!/bin/bash
set -e

echo "=== Starting NPC_SMARTFLOW Deployment ==="
cd /var/www/npc_smartflow

echo "=== Git Pull & Reset from Public GitHub ==="
git config --global --add safe.directory /var/www/npc_smartflow || true
git fetch https://github.com/basketballsiit-rgb/npc_smartflow.git main
git reset --hard FETCH_HEAD
git clean -fd public/build || true
git checkout HEAD -- public/build || true

echo "=== Composer & Artisan Migrate ==="
/usr/bin/php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || true
/usr/bin/php82 artisan migrate --force || php82 artisan migrate --force || true

echo "=== Save Deploy Info ==="
git log -1 --format='{"commit":"%H","date":"%cd","subject":"%s"}' > public/build/deploy_info.json || true
chmod 644 public/build/deploy_info.json || true
chmod -R 755 public/build || true

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
