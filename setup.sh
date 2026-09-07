#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

command -v node >/dev/null || { echo "Node.js غير مثبت. ثبّت Node.js 18 أو أحدث ثم أعد المحاولة."; exit 1; }
command -v npm >/dev/null || { echo "npm غير مثبت."; exit 1; }

if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  echo "تشغيل PostgreSQL عبر Docker..."
  docker compose -f "$ROOT_DIR/docker-compose.yml" up -d db
  echo "انتظار جاهزية PostgreSQL..."
  for i in {1..30}; do
    if docker exec cyberclub-postgres pg_isready -U postgres -d cyberclub >/dev/null 2>&1; then break; fi
    sleep 2
  done
else
  echo "لم يتم العثور على Docker. تأكد من تشغيل PostgreSQL محليًا على localhost:5432."
fi

cd "$SERVER_DIR"
npm install --no-audit --no-fund
npm run migrate
echo
echo "اكتمل الإعداد. شغّل المشروع عبر: cd server && npm start"
echo "ثم افتح: http://localhost:3000"
