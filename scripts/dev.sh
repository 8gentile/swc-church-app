#!/usr/bin/env bash
# Delegates to with-nvm-node.sh so dev and migrate:build share the same PATH fix.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT/scripts/with-nvm-node.sh" bun run dev:one
