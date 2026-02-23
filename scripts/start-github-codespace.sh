#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR/client"
npm run build

cd "$ROOT_DIR/server"
export NODE_ENV=production
export PORT="${PORT:-3000}"
export DATA_DIR="${DATA_DIR:-$ROOT_DIR/server/data}"
mkdir -p "$DATA_DIR"

echo "Starting server on port $PORT ..."
npm start
