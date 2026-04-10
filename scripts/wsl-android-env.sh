#!/usr/bin/env bash
# shellcheck shell=bash
#
# Link WSL to the Android SDK on Windows (Android Studio). Exposes `adb` (via
# ~/bin/adb -> adb.exe) so Node/Expo can spawn `adb`.
#
# Usage (from anywhere inside the repo, or set SWC_CHURCH_APP_ROOT):
#   source scripts/wsl-android-env.sh
#
# One-time: cp .env.wsl.example .env.wsl.local  →  WSL_WINDOWS_USER=<Windows C:\Users\ name>
#
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
  echo "wsl-android-env.sh: not running under WSL; skipping." >&2
  return 0 2>/dev/null || exit 0
fi

_wsl_find_repo() {
  local d="${SWC_CHURCH_APP_ROOT:-$PWD}"
  if [[ -n "${SWC_CHURCH_APP_ROOT:-}" ]]; then
    echo "$d"
    return
  fi
  d="$PWD"
  while [[ "$d" != "/" ]]; do
    if [[ -f "$d/package.json" ]] && grep -q 'takeout-free' "$d/package.json" 2>/dev/null; then
      echo "$d"
      return
    fi
    d="$(dirname "$d")"
  done
  echo ""
}

_WSL_REPO_ROOT="$(_wsl_find_repo)"
if [[ -z "$_WSL_REPO_ROOT" ]]; then
  echo "wsl-android-env.sh: could not find repo (cd into swc-church-app or export SWC_CHURCH_APP_ROOT)." >&2
  return 0 2>/dev/null || exit 0
fi

if [[ -f "$_WSL_REPO_ROOT/.env.wsl.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$_WSL_REPO_ROOT/.env.wsl.local"
  set +a
fi

if [[ -z "${WSL_WINDOWS_USER:-}" ]]; then
  echo "wsl-android-env.sh: set WSL_WINDOWS_USER in ${_WSL_REPO_ROOT}/.env.wsl.local (see .env.wsl.example)." >&2
  echo "  Use your Windows user folder name: C:\\Users\\<name>\\AppData\\Local\\Android\\Sdk" >&2
  unset _wsl_find_repo _WSL_REPO_ROOT
  return 0 2>/dev/null || exit 0
fi

export ANDROID_HOME="/mnt/c/Users/${WSL_WINDOWS_USER}/AppData/Local/Android/Sdk"
_WSL_PT="$ANDROID_HOME/platform-tools"
_WSL_EMU="$ANDROID_HOME/emulator"

if [[ ! -d "$ANDROID_HOME" ]]; then
  echo "wsl-android-env.sh: SDK not found: $ANDROID_HOME" >&2
  echo "  Install Android Studio on Windows; fix WSL_WINDOWS_USER if needed." >&2
  unset _wsl_find_repo _WSL_REPO_ROOT _WSL_PT _WSL_EMU
  return 0 2>/dev/null || exit 0
fi

export PATH="${_WSL_PT}:${_WSL_EMU}:${PATH}"

mkdir -p "${HOME}/bin"
if [[ -x "${_WSL_PT}/adb.exe" ]]; then
  ln -sf "${_WSL_PT}/adb.exe" "${HOME}/bin/adb"
elif [[ -x "${_WSL_PT}/adb" ]]; then
  ln -sf "${_WSL_PT}/adb" "${HOME}/bin/adb"
fi
export PATH="${HOME}/bin:${PATH}"

unset _wsl_find_repo _WSL_REPO_ROOT _WSL_PT _WSL_EMU
