#!/bin/bash
set -euo pipefail

# Xcode Cloud post-clone bootstrap for React Native iOS
# Ensures Node/npm deps and CocoaPods are installed so Pods support files
# (xcconfig and xcfilelist) exist during the archive step.

echo "[CI] Post-clone bootstrap starting..."

# 0) Move to repo root (Xcode Cloud checks out to /Volumes/workspace/repository)
cd "${CI_WORKSPACE:-$(pwd)}"

# 1) Node and npm deps
if [[ -f package-lock.json ]]; then
  echo "[CI] Installing JS deps with npm ci"
  npm ci
else
  echo "[CI] Installing JS deps with npm install"
  npm install --no-audit --no-fund
fi

# 2) Ruby and CocoaPods
# Use Bundler if a Gemfile is present to pin CocoaPods version
if [[ -f Gemfile ]]; then
  echo "[CI] Installing Ruby gems via Bundler"
  bundle install --path vendor/bundle
  POD_CMD="bundle exec pod"
else
  POD_CMD="pod"
fi

# 3) Install Pods (this creates Target Support Files and xcfilelists)
cd ios
if ! ${POD_CMD} install; then
  echo "[CI] Retrying pod install with --repo-update"
  ${POD_CMD} install --repo-update
fi

# 4) Sanity check: required support files must exist
SUPPORT_DIR="Pods/Target Support Files/Pods-iLeafU"
REQUIRED=(
  "${SUPPORT_DIR}/Pods-iLeafU.release.xcconfig"
  "${SUPPORT_DIR}/Pods-iLeafU-frameworks-Release-input-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-frameworks-Release-output-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-resources-Release-input-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-resources-Release-output-files.xcfilelist"
)

MISSING=0
for f in "${REQUIRED[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[CI][ERROR] Missing: $f"
    MISSING=1
  fi
done

if [[ "$MISSING" -ne 0 ]]; then
  echo "[CI][FATAL] CocoaPods support files not generated. Failing early."
  exit 1
fi

# 5) Print versions for diagnostics
cd ..
node -v || true
npm -v || true
ruby -v || true
pod --version || true

# 6) Optional: Generate RN codegen artifacts (pod install should handle this)
# Keep as a no-op fallback; do not fail the build if it errors.
set +e
NODE_BINARY=$(command -v node)
$NODE_BINARY node_modules/react-native/scripts/generate-codegen-artifacts.js ios >/dev/null 2>&1 || true
set -e

echo "[CI] Post-clone bootstrap finished."
