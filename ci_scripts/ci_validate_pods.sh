#!/bin/bash
set -euo pipefail

# Alternative approach: Use Xcode Cloud's built-in CocoaPods support
# This script validates that pods were installed and provides diagnostics

echo "[CI][ALT] Validating CocoaPods installation..."

# Move to iOS directory
ROOT_DIR="${CI_WORKSPACE:-$(cd "$(dirname "$0")"/.. && pwd)}"
cd "$ROOT_DIR"
echo "[CI][ALT] Working from: $(pwd)"

if [[ ! -d "ios" ]]; then
  echo "[CI][ALT][ERROR] No ios directory found at $(pwd)/ios"
  exit 1
fi

cd ios

# Check if Pods directory exists
if [[ ! -d "Pods" ]]; then
  echo "[CI][ALT][ERROR] Pods directory not found. CocoaPods may not have run."
  echo "[CI][ALT] Contents of ios/:"
  ls -la || true
  exit 1
fi

# Check for the specific files we need
SUPPORT_DIR="Pods/Target Support Files/Pods-iLeafU"
REQUIRED=(
  "${SUPPORT_DIR}/Pods-iLeafU.release.xcconfig"
  "${SUPPORT_DIR}/Pods-iLeafU-frameworks-Release-input-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-frameworks-Release-output-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-resources-Release-input-files.xcfilelist"
  "${SUPPORT_DIR}/Pods-iLeafU-resources-Release-output-files.xcfilelist"
)

echo "[CI][ALT] Checking for required CocoaPods files..."
MISSING=0
for f in "${REQUIRED[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[CI][ALT][ERROR] Missing: $f"
    MISSING=1
  else
    echo "[CI][ALT][OK] Found: $f"
  fi
done

if [[ "$MISSING" -ne 0 ]]; then
  echo "[CI][ALT][ERROR] Some required files are missing."
  echo "[CI][ALT] Directory structure:"
  echo "Pods/:"
  ls -la Pods/ || true
  echo "Target Support Files/:"
  ls -la "Pods/Target Support Files/" || true
  echo "Pods-iLeafU/:"
  ls -la "$SUPPORT_DIR/" || true
  exit 1
fi

echo "[CI][ALT] All required CocoaPods files found. Ready for archive."