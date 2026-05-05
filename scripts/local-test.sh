#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATABASE_URL_DEFAULT="postgresql://vinotheque:vinotheque@localhost:5433/vinotheque_dev?schema=public"
export DATABASE_URL="${DATABASE_URL:-$DATABASE_URL_DEFAULT}"
export PORT="${PORT:-3000}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:$PORT}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:$PORT}"

echo "Running web/core unit tests..."
npm test

echo "Building Web/PWA bundle..."
npm run build

echo "Type-checking API..."
npm run build -w @vinotheque/api

echo "Type-checking mobile app..."
npx tsc --noEmit -p apps/mobile/tsconfig.json

echo "Local checks finished."
