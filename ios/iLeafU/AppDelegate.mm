#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <Foundation/Foundation.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

// #region agent log – uncaught exception handler to identify crashing selector
static void debugUncaughtExceptionHandler(NSException *exception) {
  NSString *reason = exception.reason ?: @"(no reason)";
  NSString *name = exception.name ?: @"(no name)";
  NSString *logPath = @"/Users/macm2/projects/olla/.cursor/debug-14300f.log";
  NSArray *stack = exception.callStackSymbols;
  NSMutableString *stackStr = [NSMutableString string];
  for (int i = 0; i < MIN((int)stack.count, 12); i++) {
    NSString *frame = [stack[i] stringByReplacingOccurrencesOfString:@"\"" withString:@"'"];
    [stackStr appendFormat:@"%@|", frame];
  }
  NSString *entry = [NSString stringWithFormat:
    @"{\"sessionId\":\"14300f\",\"location\":\"AppDelegate.mm:exceptionHandler\","
    "\"message\":\"UNCAUGHT EXCEPTION\",\"data\":{\"name\":\"%@\",\"reason\":\"%@\",\"stack\":\"%@\"},"
    "\"timestamp\":%lld}\n",
    name,
    [reason stringByReplacingOccurrencesOfString:@"\"" withString:@"\\\""],
    stackStr,
    (long long)([[NSDate date] timeIntervalSince1970] * 1000)
  ];
  NSFileHandle *fh = [NSFileHandle fileHandleForWritingAtPath:logPath];
  if (fh) {
    [fh seekToEndOfFile];
    [fh writeData:[entry dataUsingEncoding:NSUTF8StringEncoding]];
    [fh closeFile];
  } else {
    [entry writeToFile:logPath atomically:NO encoding:NSUTF8StringEncoding error:nil];
  }
}
// #endregion

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // #region agent log
  NSSetUncaughtExceptionHandler(&debugUncaughtExceptionHandler);
  // #endregion
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
