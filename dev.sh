#!/usr/bin/env bash
# Run the Arc mainnet app and provider locally. No deployment, minting, or automatic transactions.
set -euo pipefail
cd "$(dirname "$0")"
export LIVESTREAK_APP_ORIGIN="${LIVESTREAK_APP_ORIGIN:-http://localhost:3001}"
export LIVESTREAK_HOST_BIND_PORT="${LIVESTREAK_HOST_BIND_PORT:-8788}"
children=()
cleanup() { for pid in "${children[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 130' INT TERM
npm run build:packages:ts
npm run dev --workspace=host &
children+=("$!")
npm run dev --workspace=app &
children+=("$!")
printf 'Arc mainnet app: http://localhost:3001\nHost: http://127.0.0.1:%s\n' "$LIVESTREAK_HOST_BIND_PORT"
wait
