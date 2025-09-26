#!/bin/bash
set -euo pipefail

# Xcode Cloud post-clone bootstrap for React Native iOS
# Ensures Node/npm deps and CocoaPods are installed so Pods support files
# (xcconfig and xcfilelist) exist during the archive step.

echo "[CI] Post-clone bootstrap starting..."

# 0) Move to repo root robustly
if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
  cd "${CI_WORKSPACE}"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
  cd "${ROOT_DIR}"
fi
echo "[CI] Working directory: $(pwd)"

# 1) Ensure Node is available; install via Homebrew if missing
if ! command -v node >/dev/null 2>&1; then
  echo "[CI] Node not found. Attempting to install Node 18 via Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew update || true
    brew install node@18 || brew install node || true
    # Try to link node@18 if installed but not linked
    if brew list node@18 >/dev/null 2>&1; then
      brew link --overwrite --force node@18 || true
    fi
  else
    echo "[CI][ERROR] Homebrew not found; cannot install Node."
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[CI][FATAL] Node is still not available."
  exit 1
fi

# 2) JS dependencies
if [[ -f package-lock.json ]]; then
  echo "[CI] Installing JS deps with npm ci"
  if ! npm ci; then
    echo "[CI][WARN] npm ci failed, falling back to npm install"
    npm install --no-audit --no-fund
  fi
else
  echo "[CI] Installing JS deps with npm install"
  npm install --no-audit --no-fund
fi

# 3) Ruby and CocoaPods
POD_CMD="pod"
if [[ -f Gemfile ]]; then
  echo "[CI] Using Bundler to manage CocoaPods"
  if ! command -v bundle >/dev/null 2>&1; then
    echo "[CI] Installing bundler gem"
    gem install bundler -N
  fi
  bundle config set path 'vendor/bundle'
  bundle install --jobs=4 --retry=3
  POD_CMD="bundle exec pod"
else
  if ! command -v pod >/dev/null 2>&1; then
    echo "[CI] Installing CocoaPods gem"
    gem install cocoapods -N
  fi
fi

# 4) Install Pods (this creates Target Support Files and xcfilelists)
cd ios
if ! ${POD_CMD} install; then
  echo "[CI] Retrying pod install with --repo-update"
  ${POD_CMD} repo update || true
  ${POD_CMD} install --repo-update
fi

# 5) Sanity check: required support files must exist (Release config for Archive)
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

# 6) Print versions for diagnostics
cd ..
echo "[CI] Versions:"
node -v || true
npm -v || true
ruby -v || true
pod --version || true

# 7) Optional: Generate RN codegen artifacts (pod install should handle this)
set +e
NODE_BINARY=$(command -v node)
$NODE_BINARY node_modules/react-native/scripts/generate-codegen-artifacts.js ios >/dev/null 2>&1 || true
set -e

echo "[CI] Post-clone bootstrap finished."
