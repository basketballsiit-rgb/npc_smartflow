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
    /root/.nvm/versions/node/v20.20.2/bin/npm run build || {
        echo "⚠️ Node build in NVM path failed, restoring pre-built assets from git..."
        git checkout HEAD -- public/build || true
    }
else
    npm run build || {
        echo "⚠️ npm run build failed, restoring pre-built assets from git..."
        git checkout HEAD -- public/build || true
    }
fi

echo "=== Clear Cache ==="
/usr/bin/php82 artisan optimize:clear || php82 artisan optimize:clear || true
/usr/bin/php82 artisan view:clear || true
/usr/bin/php82 artisan config:clear || true
/usr/bin/php82 artisan route:clear || true
/usr/bin/php82 artisan cache:clear || true

echo "=== Deployment Completed Successfully ==="
