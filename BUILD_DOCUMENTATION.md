# React Native App Build Documentation

## Overview
This document provides comprehensive instructions for building the React Native app for both development and production environments.

## Prerequisites

### System Requirements
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Java Development Kit (JDK)**: Version 17 or higher
- **Android Studio**: Latest version with Android SDK
- **Android SDK**: API Level 34 (Android 14)

### Environment Setup
1. **Install Node.js**
   ```bash
   # Download from https://nodejs.org/
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

2. **Install Java JDK**
   ```bash
   # Download from https://adoptium.net/
   java --version  # Should be 17+
   ```

3. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK API Level 34
   - Set up Android Virtual Device (AVD) for testing

4. **Set Environment Variables**
   ```bash
   # Add to your system environment variables
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot
   
   # Add to PATH
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %JAVA_HOME%\bin
   ```

## Project Setup

### 1. Clone and Install Dependencies
```bash
# Navigate to project directory
cd d:/Project/uleaf_rn

# Install dependencies
npm install

# For iOS (if developing for iOS)
cd ios && pod install && cd ..
```

### 2. Verify Installation
```bash
# Check React Native environment
npx react-native doctor

# Check Android setup
npx react-native run-android --dry-run
```

## Development Build

### Android Development
```bash
# Start Metro bundler in one terminal
npm start
# or
npx react-native start

# In another terminal, run on Android
npm run android
# or
npx react-native run-android

# Run on specific device
npx react-native run-android --deviceId=DEVICE_ID
```

### Metro Commands
```bash
# Start with cache reset
npm start -- --reset-cache

# Start Metro only
npx react-native start

# Stop Metro
# Press Ctrl+C in the Metro terminal
```

## Production Build (APK/AAB)

### Prerequisites for Production Build
1. **Clean Environment**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   npm install

   # Clean Android build cache
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Start Metro with Cache Reset**
   ```bash
   npm start -- --reset-cache
   ```

### Build Release APK
```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# Alternative: Build with verbose output
./gradlew assembleRelease --info

# Alternative: Build with debug info
./gradlew assembleRelease --stacktrace
```

### Build Release AAB (Android App Bundle)
```bash
# Navigate to android directory
cd android

# Build release AAB for Google Play Store
./gradlew bundleRelease
```

### Output Locations
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## Build Troubleshooting

### Common Issues and Solutions

#### 1. Missing Dependencies
```bash
# If you encounter missing package errors
npm install <missing-package-name>

# Example from our build:
npm install react-native-file-viewer
```

#### 2. Cache Issues
```bash
# Clear all caches
npm start -- --reset-cache
rm -rf node_modules
npm install
cd android && ./gradlew clean && cd ..
```

#### 3. Memory Issues
```bash
# Increase Gradle memory
# Edit android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

#### 4. Build Fails
```bash
# Check for detailed error logs
cd android
./gradlew assembleRelease --stacktrace --info

# Clean and rebuild
./gradlew clean
./gradlew assembleRelease
```

### Error Resolution Steps
1. **Check Dependencies**: Ensure all packages in `package.json` are installed
2. **Clear Caches**: Remove caches and temporary files
3. **Check Environment**: Verify Java, Android SDK, and environment variables
4. **Review Logs**: Check build logs for specific error messages
5. **Update Dependencies**: Ensure compatible versions of all packages

## Build Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:android-bundle": "cd android && ./gradlew bundleRelease",
    "clean": "cd android && ./gradlew clean && cd .. && rm -rf node_modules && npm install",
    "clean:android": "cd android && ./gradlew clean",
    "reset-cache": "npx react-native start --reset-cache"
  }
}
```

### Using Build Scripts
```bash
# Clean build
npm run clean

# Build APK
npm run build:android

# Build AAB
npm run build:android-bundle

# Reset cache and start
npm run reset-cache
```

## Performance Optimization

### Build Performance Tips
1. **Use Gradle Daemon**: Enabled by default in modern versions
2. **Parallel Builds**: Add to `android/gradle.properties`
   ```properties
   org.gradle.parallel=true
   org.gradle.configureondemand=true
   ```
3. **Memory Settings**: Optimize JVM heap size
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
   ```

### App Performance
1. **Enable Proguard**: For code minification and obfuscation
2. **Split APKs**: Generate separate APKs for different architectures
3. **Bundle Analysis**: Use tools to analyze bundle size

## Deployment

### Google Play Store
1. Build AAB: `./gradlew bundleRelease`
2. Sign the bundle with your keystore
3. Upload to Google Play Console
4. Test with internal testing track

### Direct Distribution
1. Build APK: `./gradlew assembleRelease`
2. Sign the APK (for production)
3. Distribute through your preferred method

## Signing Configuration

### Development Signing
- Uses debug keystore automatically
- Located at `android/app/debug.keystore`

### Production Signing
1. Generate release keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'your-password'
               keyAlias 'my-key-alias'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

## Monitoring and Debugging

### Build Logs
```bash
# Verbose build logs
./gradlew assembleRelease --info --stacktrace

# Debug build issues
./gradlew assembleRelease --debug
```

### Performance Monitoring
```bash
# Build with profiling
./gradlew assembleRelease --profile

# Check build time
./gradlew assembleRelease --scan
```

## Automated Build (CI/CD)

### GitHub Actions Example
```yaml
name: Build Android APK
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Setup Java
      uses: actions/setup-java@v2
      with:
        distribution: 'temurin'
        java-version: '17'
    - name: Install dependencies
      run: npm install
    - name: Build APK
      run: cd android && ./gradlew assembleRelease
```

## Build Checklist

### Before Building
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set correctly
- [ ] Android SDK and tools updated
- [ ] Metro bundler not running (for production builds)

### During Build
- [ ] Monitor build logs for errors
- [ ] Ensure sufficient disk space
- [ ] Stable internet connection (for downloading dependencies)

### After Build
- [ ] Verify APK/AAB file exists in output directory
- [ ] Test installation on device
- [ ] Check app functionality
- [ ] Verify app size and performance

## Support and Resources

### Official Documentation
- [React Native Docs](https://reactnative.dev/)
- [Android Build Guide](https://reactnative.dev/docs/signed-apk-android)
- [Gradle Documentation](https://docs.gradle.org/)

### Community Resources
- React Native Community Discord
- Stack Overflow
- GitHub Issues

---

## Build Summary

Your app successfully builds with the following configuration:
- **React Native**: 0.75.4
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 23 (Android 6.0)
- **Build Time**: ~12 minutes (clean build)
- **Output**: APK (~50-100MB typical size)

Last successful build: Your APK was generated at:
`d:/Project/uleaf_rn/android/app/build/outputs/apk/release/app-release.apk`
