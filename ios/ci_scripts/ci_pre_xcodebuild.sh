#!/bin/bash
set -euo pipefail

# Xcode Cloud pre-xcodebuild fallback.
# If for some reason the post-clone step didn't run or failed,
# this ensures Pods Target Support Files exist before xcodebuild archive.

if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
  cd "${CI_WORKSPACE}"
else
  # Detect if we're in ios/ci_scripts and navigate to repo root
  SCRIPT_SOURCE="${BASH_SOURCE[0]:-$0}"
  SCRIPT_DIR="$(cd "$(dirname "${SCRIPT_SOURCE}")" && pwd)"
  
  if [[ "$(basename "$SCRIPT_DIR")" == "ci_scripts" ]]; then
    PARENT_DIR="$(dirname "$SCRIPT_DIR")"
    if [[ "$(basename "$PARENT_DIR")" == "ios" ]]; then
      # We're in ios/ci_scripts, go up two levels to repo root
      ROOT_DIR="$(dirname "$PARENT_DIR")"
    else
      # We're in ci_scripts at repo root, go up one level
      ROOT_DIR="$PARENT_DIR"
    fi
  else
    # Fallback
    ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
  fi
  
  cd "${ROOT_DIR}"
fi

# Reuse the main bootstrap script; it's safe to run multiple times.
bash ios/ci_scripts/ci_post_clone.sh
