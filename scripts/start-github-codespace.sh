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

if [[ -z "${JWT_SECRET:-}" ]]; then
  export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
  echo "JWT_SECRET 未设置，已为当前会话生成临时密钥。"
fi

echo "Starting server on port $PORT ..."
npm start
