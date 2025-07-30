# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# React Native
-keep class com.facebook.react.** { *; }

# Keep ReactNative-SvgTransformer
-keep class com.horcrux.svg.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Preserve annotation attributes
-keepattributes *Annotation*

# Additional ProGuard rules for React Native
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Keep all classes in the main dex file
-keep class androidx.multidex.** { *; }

# R8 optimization rules
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep PayPal SDK if used
-keep class com.paypal.** { *; }
-dontwarn com.paypal.**

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
