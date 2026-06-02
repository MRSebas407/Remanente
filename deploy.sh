#!/usr/bin/env bash
# ──────────────────────────────────────────────
# deploy.sh — Deploy script for production
# Run on the server after git pull
# ──────────────────────────────────────────────
set -euo pipefail

echo "▶️  Pulling latest code from deployment branch..."
git pull origin deployment

echo "▶️  Copying .env.production (kept outside repo)..."
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "   Create it from .env.example and adjust for production."
    exit 1
fi
cp .env.production .env

echo "▶️  Building Docker images (no cache)..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "▶️  Stopping old containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans

echo "▶️  Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "▶️  Cleaning old images..."
docker image prune -f

echo "▶️  Checking health..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅  Deploy complete!"
echo "    Run 'docker compose -f docker-compose.prod.yml logs -f' to watch logs."
