#!/usr/bin/env bash
# Cleanup safety net (frontend). Run before the cleanup and after every step; all must pass.
#   scripts/cleanup/safety-net.sh          # jest + iOS/Android release bundles (~6 min)
#   scripts/cleanup/safety-net.sh --fast   # jest only
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "== 1/3 jest (unit + cleanup guards) =="
npx jest --silent

[[ "${1:-}" == "--fast" ]] && { echo "PASS (fast: bundles skipped)"; exit 0; }

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
for p in ios android; do
  echo "== bundle $p (release, same resolver as the store build) =="
  npx react-native bundle --platform "$p" --dev false --entry-file index.js \
    --bundle-output "$OUT/$p.jsbundle" --assets-dest "$OUT/assets-$p" >"$OUT/$p.log" 2>&1 \
    || { tail -30 "$OUT/$p.log"; echo "FAIL: $p bundle"; exit 1; }
done
echo "PASS: jest + iOS + Android bundles"
