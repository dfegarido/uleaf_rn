# ULeaf React Native App

This is a React Native e-commerce application built with [**React Native**](https://reactnative.dev) 0.77.3, featuring buyer and seller interfaces for a plant marketplace.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Java JDK** (v17 or higher) - [Download here](https://adoptium.net/)
- **Android Studio** with Android SDK API Level 35
- **Git** for version control

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Environment Setup

1. **Install Android Studio**
   - Download from [Android Studio](https://developer.android.com/studio)
   - Install Android SDK API Level 34 (Android 14)
   - Set up an Android Virtual Device (AVD)

2. **Set Environment Variables**
   ```bash
   # Windows
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
   
   # Add to PATH:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %JAVA_HOME%\bin
   ```

3. **Verify Setup**
   ```bash
   node --version    # Should show v18+
   java --version    # Should show v17+
   npx react-native doctor  # Check RN environment
   ```

## 📱 Development Setup

### Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start
```

### Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

#### Android

```sh
# Using npm
npm run android
```

#### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

### Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## 🏗️ Building for Production

### Build Release APK

For a complete production build, follow these steps:

```bash
# 1. Clean previous builds
npm run clean

# 2. Install fresh dependencies
npm install

# 3. Clean Android build cache
cd android && ./gradlew clean && cd ..

# 4. Start Metro with cache reset (in one terminal)
npm start -- --reset-cache

# 5. Build release APK (in another terminal)
cd android && ./gradlew assembleRelease
```

### Build Output
Your APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Build for Google Play Store (AAB)
```bash
cd android && ./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 📋 Available Scripts

```bash
npm start              # Start Metro bundler
npm run android        # Run on Android
npm run clean          # Clean all caches and reinstall
npm run reset-cache    # Reset Metro cache
```

## 🛠️ Development

### Project Structure
```
src/
├── assets/           # Images, icons, SVGs
├── auth/            # Authentication providers
├── components/      # Reusable UI components
├── config/          # App configuration
├── screens/         # Screen components
│   ├── Buyer/       # Buyer-side screens
│   ├── Seller/      # Seller-side screens
│   └── Profile/     # Profile management
└── utils/           # Utility functions
```

### Key Features
- 🛒 **Buyer Interface**: Browse plants, manage cart, wishlist
- 🌱 **Seller Interface**: Manage products, orders, analytics
- 👤 **Profile Management**: User settings, password updates
- 🔐 **Authentication**: Firebase-based auth system
- 📱 **Responsive Design**: Optimized for mobile devices

## 🐛 Troubleshooting

### Common Issues

**Build Fails with Missing Dependencies:**
```bash
npm install react-native-file-viewer  # Install missing packages
```

**Metro Cache Issues:**
```bash
npm start -- --reset-cache
```

**Android Build Fails:**
```bash
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
```

**Memory Issues:**
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Getting Help
## Congratulations! :tada:

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Learn More

- Check [BUILD_DOCUMENTATION.md](./BUILD_DOCUMENTATION.md) for detailed build instructions
- Review [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- Check the [Issues](../../issues) section of this repository

## ✅ Development Checklist

Before starting development:
- [ ] Node.js v18+ installed
- [ ] Java JDK v17+ installed
- [ ] Android Studio with SDK 35 setup
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] App runs successfully (`npm run android`)

## 🎯 Next Steps

- **Add new features**: Extend buyer or seller functionality
- **Customize UI**: Modify components in `src/components/`
- **Test on device**: Use `npm run android` for testing
- **Build for production**: Use the build commands above
- **Deploy**: Upload APK/AAB to distribution platform

## 📚 Learn More

### Project Resources
- [BUILD_DOCUMENTATION.md](./BUILD_DOCUMENTATION.md) - Comprehensive build guide
- [React Native Documentation](https://reactnative.dev) - Official RN docs
- [Android Developer Guide](https://developer.android.com/guide) - Android-specific guidance

### Key Technologies
- **React Native** 0.77.3 - Cross-platform mobile framework
- **Firebase** - Authentication and backend services
- **React Navigation** - Navigation library
- **SVG Icons** - Custom vector graphics
- **AsyncStorage** - Local data persistence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using React Native**

*Last updated: July 2025*
