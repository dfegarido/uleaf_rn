#!/bin/bash

# Script to verify that unwanted foreground service permissions are removed from the final manifest

echo "🔍 Verifying Android Manifest for Foreground Service Permissions..."
echo ""

# Find the merged manifest
MERGED_MANIFEST="app/build/intermediates/merged_manifests/release/AndroidManifest.xml"

if [ ! -f "$MERGED_MANIFEST" ]; then
    echo "❌ Merged manifest not found. Please build the release bundle first:"
    echo "   cd android && ./gradlew bundleRelease"
    exit 1
fi

echo "📄 Checking manifest: $MERGED_MANIFEST"
echo ""

# Check for FOREGROUND_SERVICE_CAMERA (should be present)
if grep -q "FOREGROUND_SERVICE_CAMERA" "$MERGED_MANIFEST"; then
    echo "✅ FOREGROUND_SERVICE_CAMERA: Found (CORRECT - This is needed)"
else
    echo "⚠️  FOREGROUND_SERVICE_CAMERA: Not found (Should be present)"
fi

# Check for unwanted permissions (should NOT be present)
UNWANTED_PERMS=(
    "FOREGROUND_SERVICE_MEDIA_PLAYBACK"
    "FOREGROUND_SERVICE_MEDIA_PROJECTION"
    "android.permission.FOREGROUND_SERVICE\""
)

FOUND_UNWANTED=false

for perm in "${UNWANTED_PERMS[@]}"; do
    if grep -q "$perm" "$MERGED_MANIFEST"; then
        echo "❌ $perm: Found (ERROR - Should be removed!)"
        FOUND_UNWANTED=true
    else
        echo "✅ $perm: Not found (CORRECT - Successfully removed)"
    fi
done

echo ""
if [ "$FOUND_UNWANTED" = true ]; then
    echo "❌ VERIFICATION FAILED: Unwanted permissions found in manifest!"
    echo "   Please check your AndroidManifest.xml and dependencies."
    exit 1
else
    echo "✅ VERIFICATION PASSED: All unwanted permissions successfully removed!"
    echo "   Your manifest is ready for Google Play submission."
    exit 0
fi

