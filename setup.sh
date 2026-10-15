#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ElegAI one-command setup (Ubuntu / Debian)
# Installs MariaDB, creates the database + user, installs dependencies,
# and starts both the API and the frontend dev server.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "▸ Installing MariaDB server…"
if ! command -v mysql >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server
fi

echo "▸ Starting MariaDB…"
sudo service mariadb start >/dev/null 2>&1 || sudo systemctl start mariadb

echo "▸ Creating database & user…"
sudo mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS elegai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'elegai'@'localhost' IDENTIFIED BY 'elegai_pass';
CREATE USER IF NOT EXISTS 'elegai'@'127.0.0.1' IDENTIFIED BY 'elegai_pass';
GRANT ALL PRIVILEGES ON elegai.* TO 'elegai'@'localhost';
GRANT ALL PRIVILEGES ON elegai.* TO 'elegai'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo "▸ Backend dependencies…"
cd "$(dirname "$0")/backend"
[ -f .env ] || cp .env.example .env
npm install --no-audit --no-fund

echo "▸ Frontend dependencies…"
cd ../frontend
npm install --no-audit --no-fund

echo "▸ Starting ElegAI API on :5000 and storefront on :5173"
cd ../backend
node src/server.js &
BACKEND_PID=$!
cd ../frontend
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT
echo
echo "  Storefront:  http://localhost:5173"
echo "  API health:  http://localhost:5000/api/health"
echo "  Admin demo:  admin@elegai.com / Admin@12345"
echo "  Customer:    maria@example.com / Customer@123"
echo
wait
