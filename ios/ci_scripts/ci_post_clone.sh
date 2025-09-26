#!/bin/bash
set -euo pipefail

# Xcode Cloud post-clone bootstrap for React Native iOS
# Ensures Node/npm deps and CocoaPods are installed so Pods support files
# (xcconfig and xcfilelist) exist during the archive step.

echo "[CI] Post-clone bootstrap starting..."
echo "[CI] Environment debug:"
echo "  CI_WORKSPACE: ${CI_WORKSPACE:-not set}"
echo "  PWD: $(pwd)"
echo "  SCRIPT_SOURCE: ${BASH_SOURCE[0]:-not set}"
echo "  HOME: ${HOME:-not set}"
echo "  PATH: ${PATH}"

# 0) Ensure we're in the repository root
if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
  cd "${CI_WORKSPACE}"
  echo "[CI] Using CI_WORKSPACE: $(pwd)"
else
  # Scripts are now at repo root, so go up from ci_scripts/
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
  cd "${ROOT_DIR}"
  echo "[CI] Using calculated root: $(pwd)"
fi

echo "[CI] Repository contents:"
ls -la || true
echo "[CI] iOS directory check:"
ls -la ios/ || echo "No ios/ directory found"

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
    echo "[CI] PWD after npm install fallback: $(pwd)"
  fi
else
  echo "[CI] Installing JS deps with npm install"
  npm install --no-audit --no-fund
  echo "[CI] PWD after npm install: $(pwd)"
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
echo "[CI] Checking for CocoaPods support files in: $SUPPORT_DIR"
echo "[CI] Directory structure after pod install:"
ls -la Pods/ || echo "No Pods/ directory"
ls -la "Pods/Target Support Files/" || echo "No Target Support Files directory"
ls -la "$SUPPORT_DIR/" || echo "No Pods-iLeafU support directory"

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
  else
    echo "[CI][OK] Found: $f"
  fi
done

if [[ "$MISSING" -ne 0 ]]; then
  echo "[CI][FATAL] CocoaPods support files not generated. Contents of ios/:"
  ls -la || true
  echo "[CI][FATAL] Contents of ios/Pods/:"
  ls -la Pods/ || true
  echo "[CI][FATAL] Failing early."
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
