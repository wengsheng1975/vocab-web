#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

SERVER_PID=""
CLIENT_PID=""

cleanup() {
  if [[ -n "${CLIENT_PID}" ]] && kill -0 "${CLIENT_PID}" 2>/dev/null; then
    kill "${CLIENT_PID}" 2>/dev/null || true
  fi
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo ">>> 检查依赖..."
if [[ ! -d "$SERVER_DIR/node_modules" ]]; then
  npm --prefix "$SERVER_DIR" install
fi
if [[ ! -d "$CLIENT_DIR/node_modules" ]]; then
  npm --prefix "$CLIENT_DIR" install
fi

echo ">>> 启动后端..."
(
  cd "$SERVER_DIR"
  npm start
) &
SERVER_PID=$!

echo ">>> 启动前端..."
(
  cd "$CLIENT_DIR"
  npm run dev -- --host 127.0.0.1 --port 5173
) &
CLIENT_PID=$!

echo ""
echo "应用已启动："
echo "前端: http://127.0.0.1:5173"
echo "后端: http://127.0.0.1:3000"
echo "按 Ctrl+C 可同时停止前后端。"
echo ""

wait "$SERVER_PID" "$CLIENT_PID"
