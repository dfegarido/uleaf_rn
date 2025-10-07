#!/bin/bash

# Script to generate Android app icons from iOS icon
# This will use your iOS 1024x1024 icon to create all Android sizes

SOURCE_ICON="ios/iLeafU/Images.xcassets/AppIcon.appiconset/1024x1024bb 2.png"
ANDROID_RES="android/app/src/main/res"

echo "🎨 Generating Android app icons from iOS icon..."
echo "📂 Source: $SOURCE_ICON"
echo ""

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create temporary working directory
TEMP_DIR=$(mktemp -d)
echo "📁 Working in temp directory: $TEMP_DIR"

# Function to generate icon
generate_icon() {
    local size=$1
    local output_dir=$2
    local filename=$3
    
    echo "  ✓ Generating ${size}x${size} → $output_dir/$filename"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Resize image using sips (macOS built-in tool)
    sips -z $size $size "$SOURCE_ICON" --out "$output_dir/$filename" > /dev/null 2>&1
}

# Generate ic_launcher.png for all densities
echo ""
echo "🔨 Generating ic_launcher.png (square icons)..."
generate_icon 48 "$ANDROID_RES/mipmap-mdpi" "ic_launcher.png"
generate_icon 72 "$ANDROID_RES/mipmap-hdpi" "ic_launcher.png"
generate_icon 96 "$ANDROID_RES/mipmap-xhdpi" "ic_launcher.png"
generate_icon 144 "$ANDROID_RES/mipmap-xxhdpi" "ic_launcher.png"
generate_icon 192 "$ANDROID_RES/mipmap-xxxhdpi" "ic_launcher.png"

echo ""
echo "🔨 Generating ic_launcher_round.png (round icons)..."
# For round icons, we'll use the same images (you may want to create proper round versions later)
generate_icon 48 "$ANDROID_RES/mipmap-mdpi" "ic_launcher_round.png"
generate_icon 72 "$ANDROID_RES/mipmap-hdpi" "ic_launcher_round.png"
generate_icon 96 "$ANDROID_RES/mipmap-xhdpi" "ic_launcher_round.png"
generate_icon 144 "$ANDROID_RES/mipmap-xxhdpi" "ic_launcher_round.png"
generate_icon 192 "$ANDROID_RES/mipmap-xxxhdpi" "ic_launcher_round.png"

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Android icons generated successfully!"
echo ""
echo "📱 Generated icons in:"
echo "   - mipmap-mdpi (48x48)"
echo "   - mipmap-hdpi (72x72)"
echo "   - mipmap-xhdpi (96x96)"
echo "   - mipmap-xxhdpi (144x144)"
echo "   - mipmap-xxxhdpi (192x192)"
echo ""
echo "🔄 Next steps:"
echo "   1. Clean build: cd android && ./gradlew clean && cd .."
echo "   2. Rebuild app: npx react-native run-android"
echo ""
echo "🎉 Your Android app will now use the same icon as iOS!"
