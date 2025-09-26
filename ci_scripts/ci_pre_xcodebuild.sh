#!/bin/bash
set -euo pipefail

# Xcode Cloud pre-xcodebuild fallback.
# If for some reason the post-clone step didn't run or failed,
# this ensures Pods Target Support Files exist before xcodebuild archive.

ROOT_DIR="${CI_WORKSPACE:-$(cd "$(dirname "$0")"/.. && pwd)}"
cd "$ROOT_DIR"

# Reuse the main bootstrap script; it's safe to run multiple times.
bash ci_scripts/ci_post_clone.sh
