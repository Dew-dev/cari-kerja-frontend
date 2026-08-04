#!/usr/bin/env bash
# Remote staging deploy for cari-kerja-frontend only (fe-stage).
# Invoked on the VPS by GitHub Actions after merge to develop.
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/cari-kerja}"
FRONTEND_DIR="${FRONTEND_DIR:-fe-stage-cari-kerja}"
BRANCH="${BRANCH:-develop}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-fe-stage}"
HEALTH_URL="${HEALTH_URL:-https://fe-stage.cari-kerja.co.id/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_SLEEP_SEC="${HEALTH_SLEEP_SEC:-5}"

echo "========================================="
echo "  Cari Kerja FE staging deploy"
echo "========================================="

cd "$PROJECT_DIR"

echo ""
echo "[1/4] Updating frontend repository ($BRANCH)..."
git -C "$FRONTEND_DIR" fetch origin
git -C "$FRONTEND_DIR" checkout "$BRANCH"
git -C "$FRONTEND_DIR" pull --ff-only origin "$BRANCH"
echo "Revision: $(git -C "$FRONTEND_DIR" rev-parse --short HEAD)"

echo ""
echo "[2/4] Building & restarting Docker service: $COMPOSE_SERVICE"
# Rebuild only fe-stage — do not touch be-stage / super-admin-stage / be-prod.
docker compose up -d --build "$COMPOSE_SERVICE"

echo ""
echo "[3/4] Soft prune dangling images (safe on shared VPS)..."
docker image prune -f

echo ""
echo "[4/4] Health check: $HEALTH_URL"
ok=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Health OK (attempt $i)"
    ok=1
    break
  fi
  echo "Waiting for health... ($i/$HEALTH_RETRIES)"
  sleep "$HEALTH_SLEEP_SEC"
done

if [[ "$ok" -ne 1 ]]; then
  echo "ERROR: health check failed after $HEALTH_RETRIES attempts"
  docker compose ps "$COMPOSE_SERVICE" || true
  docker compose logs --tail=80 "$COMPOSE_SERVICE" || true
  exit 1
fi

echo ""
echo "========================================="
echo "  Staging frontend deploy succeeded"
echo "========================================="
