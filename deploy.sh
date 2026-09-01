#!/bin/bash
set -e

echo "=== Starting NPC_SMARTFLOW Deployment ==="
cd /var/www/npc_smartflow

echo "=== Git Pull & Reset ==="
git fetch origin main
git reset --hard origin/main

echo "=== Composer & Artisan Migrate ==="
/usr/bin/php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || php82 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction || true
/usr/bin/php82 artisan migrate --force || php82 artisan migrate --force || true

echo "=== Frontend Build ==="
if [ -d "/root/.nvm/versions/node/v20.20.2/bin" ]; then
    /root/.nvm/versions/node/v20.20.2/bin/npm install
    /root/.nvm/versions/node/v20.20.2/bin/npm run build
else
    npm install
    npm run build
fi

echo "=== Clear Cache ==="
/usr/bin/php82 artisan optimize:clear || php82 artisan optimize:clear || true

echo "=== Deployment Completed Successfully ==="
