#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/srv/apps/joscupcakes"
PM2_NAME="joscupcakes"
PORT=3030

echo "==> Pulling latest code"
cd "$APP_DIR"
git pull

echo "==> Installing dependencies"
npm install

echo "==> Building"
npm run build

echo "==> Restarting PM2 process"
pm2 delete "$PM2_NAME" 2>/dev/null || true
PORT=$PORT pm2 start npm --name "$PM2_NAME" -- start
pm2 save

echo "==> Verifying"
sleep 2
pm2 ls
ss -ltnp | grep "$PORT" || echo "WARNING: nothing listening on port $PORT"
curl -sf -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:$PORT" || echo "WARNING: app not responding on localhost"

echo "==> Done"
