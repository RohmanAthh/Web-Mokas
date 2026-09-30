#!/usr/bin/env bash
# Update aplikasi di server (jalankan dari folder proyek):  bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▸ Backup dulu sebelum update"
npm run backup

echo "▸ Ambil kode terbaru"
git pull --ff-only

echo "▸ Install dependency & build"
npm ci
npm run build

echo "▸ Restart aplikasi"
pm2 reload ecosystem.config.cjs --update-env
pm2 save

sleep 3
curl -fsS http://127.0.0.1:3000/api/health && echo " ✓ aplikasi sehat"
