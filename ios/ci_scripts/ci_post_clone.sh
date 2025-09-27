#!/bin/bash
set -euo pipefail

# Xcode Cloud post-clone bootstrap for React Native iOS
# Ensures Node/npm deps and CocoaPods are installed so Pods support files
# (xcconfig and xcfilelist) exist during the archive step.

echo "[CI] Post-clone bootstrap starting..."
echo "[CI] Environment debug:"
echo "  CI_WORKSPACE: ${CI_WORKSPACE:-not set}"
echo "  PWD: $(pwd)"
echo "  SCRIPT_SOURCE: ${BASH_SOURCE[0]:-$0}"
echo "  HOME: ${HOME:-not set}"
echo "  PATH: ${PATH}"

# 0) Ensure we're in the repository root
if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
  cd "${CI_WORKSPACE}"
  echo "[CI] Using CI_WORKSPACE: $(pwd)"
else
  # Detect if we're in ios/ci_scripts (old location) or ci_scripts (new location)
  CURRENT_DIR="$(pwd)"
  echo "[CI] Current working directory: $CURRENT_DIR"
  
  if [[ "$(basename "$CURRENT_DIR")" == "ci_scripts" ]]; then
    PARENT_DIR="$(dirname "$CURRENT_DIR")"
    echo "[CI] Parent directory: $PARENT_DIR"
    
    if [[ "$(basename "$PARENT_DIR")" == "ios" ]]; then
      # We're in ios/ci_scripts, go up two levels to repo root
      REPO_ROOT="$(dirname "$PARENT_DIR")"
      cd "$REPO_ROOT"
      echo "[CI] Detected ios/ci_scripts location, moved to repo root: $(pwd)"
    else
      # We're in ci_scripts at repo root, go up one level
      cd "$PARENT_DIR"
      echo "[CI] Detected ci_scripts at root, moved to repo root: $(pwd)"
    fi
  elif [[ "$(basename "$CURRENT_DIR")" == "ios" ]]; then
    # We're in the ios directory, go up one level to repo root
    REPO_ROOT="$(dirname "$CURRENT_DIR")"
    cd "$REPO_ROOT"
    echo "[CI] Detected ios directory, moved to repo root: $(pwd)"
  else
    # Fallback - assume we're already at repo root
    echo "[CI] Using current directory as repo root: $(pwd)"
  fi
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
# Add user gem bin directory to PATH for --user-install gems
USER_GEM_DIR=$(ruby -e "puts Gem.user_dir" 2>/dev/null || echo "$HOME/.gem/ruby/2.6.0")
export PATH="$USER_GEM_DIR/bin:$PATH"
echo "[CI] Added user gem bin to PATH: $USER_GEM_DIR/bin"

POD_CMD="pod"
if [[ -f Gemfile ]]; then
  echo "[CI] Using Bundler to manage CocoaPods"
  
  # Check if specific bundler version is required
  if [[ -f Gemfile.lock ]]; then
    REQUIRED_BUNDLER=$(grep -A1 "BUNDLED WITH" Gemfile.lock | tail -1 | tr -d '[:space:]' || echo "")
    if [[ -n "$REQUIRED_BUNDLER" ]]; then
      echo "[CI] Gemfile.lock requires bundler version: $REQUIRED_BUNDLER"
      
      # Check Ruby version compatibility for bundler
      RUBY_VERSION=$(ruby -e "puts RUBY_VERSION" 2>/dev/null)
      echo "[CI] Current Ruby version: $RUBY_VERSION"
      
      if [[ "$RUBY_VERSION" =~ ^2\.6\. ]]; then
        echo "[CI] Ruby 2.6 detected - using compatible bundler 2.4.22 instead of $REQUIRED_BUNDLER"
        gem install bundler:2.4.22 --user-install -N || gem install bundler --user-install -N
      else
        echo "[CI] Installing specific bundler version to user directory"
        gem install bundler:$REQUIRED_BUNDLER --user-install -N || gem install bundler --user-install -N
      fi
    else
      echo "[CI] Installing latest compatible bundler to user directory"
      gem install bundler --user-install -N
    fi
  else
    echo "[CI] Installing bundler to user directory (no Gemfile.lock found)"
    gem install bundler --user-install -N
  fi
  
  # Configure bundle and install gems
  if command -v bundle >/dev/null 2>&1; then
    bundle config set path 'vendor/bundle'
    if ! bundle install --jobs=4 --retry=3; then
      echo "[CI][WARN] Bundle install failed, trying with bundler update"
      bundle update --bundler || true
      bundle install --jobs=4 --retry=3
    fi
    
    # Test if bundle exec pod works (Ruby 2.6 has compatibility issues with newer gems)
    if bundle exec pod --version >/dev/null 2>&1; then
      POD_CMD="bundle exec pod"
      echo "[CI] Using bundle exec pod successfully"
    else
      echo "[CI][WARN] Bundle exec pod failed (Ruby/gem compatibility), falling back to system CocoaPods"
      if ! command -v pod >/dev/null 2>&1; then
        echo "[CI] Installing system CocoaPods gem"
        gem install cocoapods --user-install -N
      fi
      POD_CMD="pod"
    fi
  else
    echo "[CI][ERROR] Bundler installation failed, falling back to system CocoaPods"
    if ! command -v pod >/dev/null 2>&1; then
      echo "[CI] Installing CocoaPods gem to user directory"
      gem install cocoapods --user-install -N
    fi
    POD_CMD="pod"
  fi
else
  if ! command -v pod >/dev/null 2>&1; then
    echo "[CI] Installing CocoaPods gem to user directory"
    gem install cocoapods --user-install -N
  fi
fi

# 4) Clean CocoaPods cache and deintegrate for fresh install (fixes -G flag issues on Apple Silicon)
echo "[CI] Cleaning CocoaPods cache and performing deintegration..."
cd ios

# Clean CocoaPods caches
rm -rf ~/Library/Caches/CocoaPods || true
rm -rf ~/Library/Developer/Xcode/DerivedData/* || true

# Remove existing Pods and workspace
if [[ -d "Pods" ]]; then
  echo "[CI] Removing existing Pods directory"
  rm -rf Pods || true
fi
if [[ -f "*.xcworkspace" ]]; then
  echo "[CI] Removing existing workspace"
  rm -rf *.xcworkspace || true
fi

# Deintegrate CocoaPods (this cleans up project file references)
echo "[CI] Deintegrating CocoaPods from project"
${POD_CMD} deintegrate || echo "[CI][WARN] Pod deintegrate failed (may not be needed)"

# Setup CocoaPods specs repo
echo "[CI] Setting up CocoaPods specs repo"
${POD_CMD} setup || echo "[CI][WARN] Pod setup failed (may not be critical)"

# 5) Install Pods (this creates Target Support Files and xcfilelists)
echo "[CI] Attempting fresh pod install with: $POD_CMD"
if ! ${POD_CMD} install; then
  if [[ "$POD_CMD" == "bundle exec pod" ]]; then
    echo "[CI][WARN] Bundle exec pod install failed, falling back to system CocoaPods"
    # Install system CocoaPods if not available
    if ! command -v pod >/dev/null 2>&1; then
      echo "[CI] Installing system CocoaPods gem"
      gem install cocoapods --user-install -N
    fi
    POD_CMD="pod"
    echo "[CI] Retrying with system CocoaPods: $POD_CMD"
    if ! ${POD_CMD} install; then
      echo "[CI] Retrying pod install with --repo-update"
      ${POD_CMD} repo update || true
      ${POD_CMD} install --repo-update
    fi
  else
    echo "[CI] Retrying pod install with --repo-update"
    ${POD_CMD} repo update || true
    ${POD_CMD} install --repo-update
  fi
fi

# 6) Sanity check: required support files must exist (Release config for Archive)
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

# 7) Print versions for diagnostics
cd ..
echo "[CI] Versions:"
node -v || true
npm -v || true
ruby -v || true
pod --version || true

# 8) Optional: Generate RN codegen artifacts (pod install should handle this)
set +e
NODE_BINARY=$(command -v node)
$NODE_BINARY node_modules/react-native/scripts/generate-codegen-artifacts.js ios >/dev/null 2>&1 || true
set -e

echo "[CI] Post-clone bootstrap finished."
