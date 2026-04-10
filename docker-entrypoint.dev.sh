#!/usr/bin/env bash
# Dev container entrypoint: install deps if node_modules is empty, then exec CMD.
set -euo pipefail

if [ ! -f node_modules/.package-lock.json ] && [ ! -f node_modules/.bun-tag ]; then
  echo "[docker-dev] node_modules volume is empty — running bun install..."
  bun install
  echo "[docker-dev] bun install complete."
fi

exec "$@"
