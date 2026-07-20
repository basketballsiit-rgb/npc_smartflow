#!/bin/bash
# ==============================================================================
# NPC SMART FLOW - Automated Server Update Script
# ==============================================================================
echo "🚀 Starting NPC SMART FLOW Update..."

# 1. Navigate to project directory
cd /var/www/npc_smartflow || exit

# 2. Pull latest changes from GitHub
echo "📥 Fetching latest code from GitHub..."
git pull origin main

# 3. Build frontend production assets
echo "⚡ Building frontend assets..."
npm run build

# 4. Clear Laravel caches
echo "🧹 Clearing application cache..."
php82 artisan config:clear
php82 artisan route:clear
php82 artisan view:clear

# 5. Fix storage & database permissions
echo "🔒 Ensuring folder permissions..."
chmod -R 777 storage bootstrap/cache database
chcon -R -t httpd_sys_rw_content_t storage bootstrap/cache database 2>/dev/null || true

echo "🎉 NPC SMART FLOW Updated Successfully!"
