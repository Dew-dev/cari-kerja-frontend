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

# Baked into the Vite bundle at image build time (compose often omits these).
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://be-stage.cari-kerja.co.id/api/v1}"
VITE_FILE_STORAGE_URL="${VITE_FILE_STORAGE_URL:-https://be-stage.cari-kerja.co.id}"
VITE_SOCKET_URL="${VITE_SOCKET_URL:-https://be-stage.cari-kerja.co.id}"
VITE_APP_NAME="${VITE_APP_NAME:-cari-kerja.id}"
VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-}"

echo "========================================="
echo "  Cari Kerja FE staging deploy"
echo "========================================="

cd "$PROJECT_DIR"

echo ""
echo "[1/5] Updating frontend repository ($BRANCH)..."
# Staging checkout must match origin; discard local VPS edits (e.g. manual Dockerfile tweaks).
git -C "$FRONTEND_DIR" fetch origin
git -C "$FRONTEND_DIR" checkout "$BRANCH"
git -C "$FRONTEND_DIR" reset --hard "origin/$BRANCH"
echo "Revision: $(git -C "$FRONTEND_DIR" rev-parse --short HEAD)"

echo ""
echo "[2/5] Building Docker image with staging Vite env..."
docker compose build \
  --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
  --build-arg "VITE_FILE_STORAGE_URL=${VITE_FILE_STORAGE_URL}" \
  --build-arg "VITE_SOCKET_URL=${VITE_SOCKET_URL}" \
  --build-arg "VITE_APP_NAME=${VITE_APP_NAME}" \
  --build-arg "VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}" \
  "$COMPOSE_SERVICE"

echo ""
echo "[3/5] Restarting Docker service: $COMPOSE_SERVICE"
# Restart only fe-stage — do not touch be-stage / super-admin-stage / be-prod.
docker compose up -d --no-build "$COMPOSE_SERVICE"

echo ""
echo "[4/5] Soft prune dangling images (safe on shared VPS)..."
docker image prune -f

echo ""
echo "[5/5] Health check: $HEALTH_URL"
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
