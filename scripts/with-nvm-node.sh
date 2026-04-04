#!/usr/bin/env bash
# Prepends nvm's Node (from .nvmrc) to PATH so Vite / Rolldown / One use a supported
# Node version. System Node 21 (and other unsupported versions) can crash with
# util.styleText / styleText errors during migrate:build and dev.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -f .nvmrc ]]; then
  VERSION="$(tr -d '[:space:]' < .nvmrc)"
  NVM_NODE_BIN="${NVM_DIR:-$HOME/.nvm}/versions/node/v${VERSION}/bin"
  if [[ -x "${NVM_NODE_BIN}/node" ]]; then
    export PATH="${NVM_NODE_BIN}:$PATH"
  fi
fi
exec "$@"
