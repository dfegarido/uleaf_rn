# ULeaf React Native App

This is a React Native e-commerce application built with [**React Native**](https://reactnative.dev) 0.87.1, featuring buyer and seller interfaces for a plant marketplace.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Java JDK** (v17 or higher) - [Download here](https://adoptium.net/)
- **Android Studio** with Android SDK API Level 34
- **Git** for version control

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

### 1. Install Dependencies
```bash
# Clone the repository (if needed)
git clone <repository-url>
cd uleaf_rn

# Install npm packages
npm install
```

### 2. Start Development Server
```bash
# Start Metro bundler
npm start
```

### 3. Run the App
Open a new terminal and run:

```bash
# For Android
npm run android

# Or run on specific device
npx react-native run-android --deviceId=YOUR_DEVICE_ID
```

**🎉 That's it!** Your app should now be running on your Android emulator or device.

## 🏗️ Building for Production

### Build Release APK

For a complete production build, follow these steps:

```bash
cd android && ./gradlew assembleRelease
```

To build a single ABI (roughly half the native compile time):

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

> ### ⚠️ Do not run `gradlew clean` before a build
>
> `npm run clean` and `npm run clean:android` both call `./gradlew clean`.
> On a New-Architecture project that deletes **every** library's generated
> C++ (`node_modules/<pkg>/android/build/generated/source/codegen/…`), and
> the next build then fails in libraries you never touched:
>
> ```
> CMake Error … Cannot find source file: …/ReactNativeBlurViewSpec-generated.cpp
> No SOURCES given to target: react_codegen_ReactNativeBlurViewSpec
> ninja: error: rebuilding 'build.ninja': subcommand failed
> -- GLOB mismatch!
> ```
>
> **If the build fails this way**, regenerate the codegen and rebuild:
>
> ```bash
> cd android
> ./gradlew generateCodegenArtifactsFromSchema   # regenerates it for every project
> ./gradlew assembleRelease
> ```
>
> "Clean and rebuild" is circular advice here — it wipes exactly what the
> build needs.

### Build Output
ABI splits are enabled, so there is one APK per ABI:
```
android/app/build/outputs/apk/release/app-arm64-v8a-release.apk     # any phone from ~2017
android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk   # older phones
```

### Signing
Release builds are signed with the upload key configured in
`android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=my-release-key.jks
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=…
MYAPP_UPLOAD_KEY_PASSWORD=…
```

The keystore lives at `android/app/my-release-key.jks`. **Keep a backup of it
and its password** — losing it means you can no longer ship updates under the
same package id. Do not commit it.

### Build for Google Play Store (AAB)
```bash
cd android && ./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 📋 Available Scripts

```bash
npm start                  # Start Metro bundler
npm run android            # Run on Android
npm run ios                # Run on iOS
npm run lint               # ESLint
npm test                   # Jest
npm run build:android-apk  # Release APK (NODE_ENV=production)
npm run build:android-aab  # Release AAB for Play
npm run reset-cache        # Reset Metro cache

# ⚠️ npm run clean / clean:android / clean:all call `gradlew clean`, which
#    breaks the New-Arch build. See "Building for Production" before using them.
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

## 💳 Venmo / PayPal payments

The app does **not** render a payment form. It opens a hosted page in a
browser (a Chrome Custom Tab on Android, `SFSafariViewController` on iOS)
and that page drives PayPal and hands the buyer back to the app.

```
app  ──open──▶  <payment page>?amount=<n>&ileafuOrderId=<TXN>
                     │  POST createPaypalOrder
                     │  buyer approves in the Venmo app
                     │  POST capturePaypalOrder
                     └──▶  ileafu://payment-success?…   (or payment-cancel)
```

### Which page the app opens

`config.js` (repo root):

```js
export const paymentPaypalVenmoUrl = 'https://payment.ileafu.com/';
```

Pointing this at a Firebase **preview channel** is how a new page is tested
from a real APK before it goes live. The page itself lives in a separate
repository — see `venmo-ileafu-payment-page/README.md`.

### The amount must match the order

The backend compares the `amount` the page sends against the order's stored
`finalTotal` and refuses a mismatch with `{"error":"Amount mismatch"}`. So
the amount the app sends has to be the **order's** total, including any
discount code — never an optimistic/placeholder value.

Discount codes are validated server-side against the **Firestore**
`discount` collection, while the catalogue is administered in **Supabase**.
A code that exists only in Supabase is rejected as "Invalid discount code",
the order keeps the undiscounted price, and the payment then fails with
"Amount mismatch". When a new code is created in Supabase, make sure it is
also present in Firestore.

### The sheet

On Android the payment page opens in a Chrome Custom Tab. It can be shown as
a partial (bottom-sheet) Custom Tab via `initialActivityHeightPx` and
`toolbarCornerRadiusDp`, but the browser only honours those when it can
identify the calling app — Chromium reads that from a Custom Tabs session or
from the `org.chromium.chrome.browser.calling_activity_package` extra, and
silently falls back to a full-screen tab otherwise.

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

**Android Build Fails with a CMake / codegen error**
(`Cannot find source file: …-generated.cpp`, `No SOURCES given to target`,
`GLOB mismatch!`):

`gradlew clean` deleted the New-Arch codegen of every library. Regenerate it
instead of cleaning again — see [Building for Production](#-building-for-production).

**Android Build Fails with a missing dependency:**
```bash
npm install react-native-file-viewer
```

**Memory Issues:**
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Getting Help
- Review [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- Check the [Issues](../../issues) section of this repository

## ✅ Development Checklist

Before starting development:
- [ ] Node.js v18+ installed
- [ ] Java JDK v17+ installed
- [ ] Android Studio with SDK 34 setup
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
- [React Native Documentation](https://reactnative.dev) - Official RN docs
- [Android Developer Guide](https://developer.android.com/guide) - Android-specific guidance

### Key Technologies
- **React Native** 0.87.1 - Cross-platform mobile framework (New Architecture)
- **Hermes** - JavaScript engine
- **Supabase** - Postgres (orders, discounts, listings) + Edge Functions
- **Firebase** - Authentication, Firestore (legacy order store) and Cloud Functions
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
