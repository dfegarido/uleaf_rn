#!/bin/bash
set -euo pipefail

# Xcode Cloud pre-xcodebuild fallback.
# If for some reason the post-clone step didn't run or failed,
# this ensures Pods Target Support Files exist before xcodebuild archive.

if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
  cd "${CI_WORKSPACE}"
else
  # Scripts are now at repo root
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
  cd "${ROOT_DIR}"
fi

# Reuse the main bootstrap script; it's safe to run multiple times.
bash ci_scripts/ci_post_clone.sh
