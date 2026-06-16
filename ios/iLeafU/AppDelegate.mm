#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <Foundation/Foundation.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <FirebaseCore/FirebaseCore.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize the default Firebase app from GoogleService-Info.plist before any
  // @react-native-firebase/* JS call (e.g. messaging() in index.js) reaches the
  // bridge. Without this, NATIVE_FIREBASE_APPS is empty and the JS side throws
  // "No Firebase App '[DEFAULT]' has been created" at module load.
  [FIRApp configure];

  self.moduleName = @"iLeafU";

  // Required with New Architecture (Fabric): wires codegen third-party modules / Fabric components.
  self.dependencyProvider = [RCTAppDependencyProvider new];

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
