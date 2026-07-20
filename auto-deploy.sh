#!/bin/bash
# ==============================================================
# NPC SMART FLOW - Auto Deploy Script
# รูปแบบเดียวกับ /var/www/npcgo/auto-deploy.sh
# ==============================================================

PROJECT_DIR="/var/www/npc_smartflow"
cd $PROJECT_DIR

# ตรวจสอบการเชื่อมต่อกับ Remote ก่อนทำงาน
git fetch origin main > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "$(date): [Error] Cannot fetch from origin. Check network or Git configuration." >> deploy.log
    exit 1
fi

# ดึงสถานะปัจจุบันเทียบ
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# หากพบว่าโค้ดบน GitHub มีการแก้ไข (Local ไม่ตรงกับ Remote)
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): [Update Found] Starting automated deployment..." >> deploy.log

    # 1. ดึงโค้ดล่าสุดลงมา
    git pull origin main >> deploy.log 2>&1

    # 2. Build หน้าเว็บ (Vite + React)
    echo "$(date): [Build] Running npm run build..." >> deploy.log
    npm run build >> deploy.log 2>&1

    if [ $? -eq 0 ]; then
        echo "$(date): [Build Success] Clearing Laravel caches..." >> deploy.log

        # 3. ล้าง Laravel Cache
        php82 artisan config:clear >> deploy.log 2>&1
        php82 artisan route:clear >> deploy.log 2>&1
        php82 artisan view:clear >> deploy.log 2>&1

        # 4. ปรับสิทธิ์โฟลเดอร์
        chmod -R 777 storage bootstrap/cache database >> deploy.log 2>&1
        chcon -R -t httpd_sys_rw_content_t storage bootstrap/cache database >> deploy.log 2>/dev/null

        echo "$(date): [Finished] Application is up to date and online!" >> deploy.log
    else
        echo "$(date): [Error] Build failed! Rollback/Fix may be needed." >> deploy.log
    fi
else
    echo "$(date): [No Change] Already up to date." >> deploy.log
fi
