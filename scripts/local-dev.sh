#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATABASE_URL_DEFAULT="postgresql://vinotheque:vinotheque@localhost:5433/vinotheque_dev?schema=public"
export DATABASE_URL="${DATABASE_URL:-$DATABASE_URL_DEFAULT}"
export PORT="${PORT:-3000}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:$PORT}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:$PORT}"

WITH_MOBILE=0
WITH_IOS=0
SKIP_DOCKER=0
SKIP_DB=0

usage() {
  cat <<'USAGE'
Usage:
  npm run local:dev
  npm run local:dev -- --mobile
  npm run local:dev -- --ios
  npm run local:dev -- --no-docker
  npm run local:dev -- --no-db

Starts the local API and Web/PWA dev server.

Options:
  --mobile     Also start Expo in this terminal after API/Web are running.
  --ios        Build/open the iOS app via Expo after API/Web are running.
  --no-docker  Do not start the local Postgres container.
  --no-db      Do not start/push the database schema. Prisma client is still generated.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mobile) WITH_MOBILE=1 ;;
    --ios) WITH_IOS=1 ;;
    --no-docker) SKIP_DOCKER=1 ;;
    --no-db) SKIP_DB=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

has_command() {
  command -v "$1" >/dev/null 2>&1
}

if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies..."
  npm ci
fi

echo "Generating Prisma client..."
npm run db:generate

if [[ "$SKIP_DB" -eq 0 ]]; then
  if [[ "$SKIP_DOCKER" -eq 0 ]]; then
    if has_command docker; then
      echo "Starting local Postgres on localhost:5433..."
      docker compose -f docker-compose.local.yml up -d db
    else
      echo "Docker not found. Using DATABASE_URL=$DATABASE_URL"
      echo "Start Postgres yourself, or install Docker Desktop."
    fi
  fi

  echo "Preparing local schema..."
  npm run db:push
fi

PIDS=()
kill_tree() {
  local parent="$1"
  local children=""

  if command -v pgrep >/dev/null 2>&1; then
    children="$(pgrep -P "$parent" 2>/dev/null || true)"
    for child in $children; do
      kill_tree "$child"
    done
  fi

  if kill -0 "$parent" >/dev/null 2>&1; then
    kill "$parent" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill_tree "$pid"
  done
}
trap cleanup EXIT INT TERM

wait_for_services() {
  while true; do
    for pid in "${PIDS[@]}"; do
      if ! ps -p "$pid" >/dev/null 2>&1; then
        wait "$pid" || exit_code=$?
        echo "A local service stopped; shutting down remaining services."
        cleanup
        exit "${exit_code:-0}"
      fi
    done
    sleep 1
  done
}

echo "Starting API on http://localhost:$PORT ..."
npm run dev:api &
PIDS+=("$!")

echo "Starting Web/PWA dev server on http://localhost:8080 ..."
npm run dev:web &
PIDS+=("$!")

echo
echo "Local services:"
echo "  Web/PWA: http://localhost:8080"
echo "  API:     http://localhost:$PORT/health"
echo

if [[ "$WITH_IOS" -eq 1 ]]; then
  echo "Starting iOS app..."
  (cd apps/mobile && EXPO_PUBLIC_API_URL="$EXPO_PUBLIC_API_URL" npx expo run:ios)
elif [[ "$WITH_MOBILE" -eq 1 ]]; then
  echo "Starting Expo. Press i in Expo to open the iOS Simulator."
  (cd apps/mobile && EXPO_PUBLIC_API_URL="$EXPO_PUBLIC_API_URL" npx expo start --localhost)
else
  echo "Press Ctrl+C to stop API and Web."
  wait_for_services
fi
