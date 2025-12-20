#import "RNPipModule.h"
#import <AVKit/AVKit.h>

@interface RNPipModule ()
@property (nonatomic, assign) BOOL isInPiPMode;
@end

@implementation RNPipModule

RCT_EXPORT_MODULE(PipModule);

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onPipModeChanged"];
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _isInPiPMode = NO;
    NSLog(@"[RNPipModule] Initialized");
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

RCT_EXPORT_METHOD(enterPip:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"[RNPipModule] enterPip called - PiP mode not supported on iOS (background audio removed)");

    // Background audio has been removed per App Store requirements
    // This method is kept for compatibility but does not enable background audio
    
    self.isInPiPMode = NO;
    [self sendEventWithName:@"onPipModeChanged" body:@(NO)];

    resolve(@{
      @"status": @"success",
      @"platform": @"ios",
      @"mode": @"not_supported",
      @"message": @"Background audio is not supported on iOS"
    });
  });
}

RCT_EXPORT_METHOD(startPip:(nonnull NSNumber *)remoteUid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // For iOS, startPip is the same as enterPip (background audio mode)
  [self enterPip:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(stopPip:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"[RNPipModule] stopPip called");

    self.isInPiPMode = NO;
    [self sendEventWithName:@"onPipModeChanged" body:@(NO)];

    resolve(@{ @"status": @"stopped", @"platform": @"ios" });
  });
}

RCT_EXPORT_METHOD(isPipSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Background audio has been removed per App Store requirements
  resolve(@{
    @"supported": @(NO),
    @"platform": @"ios",
    @"mode": @"not_supported",
    @"note": @"Background audio is not supported on iOS"
  });
}

// Not used for iOS live streaming, but kept for compatibility
RCT_EXPORT_METHOD(initNativeEngine:(NSString *)appId)
{
  NSLog(@"[RNPipModule] initNativeEngine called with appId: %@ (not used on iOS)", appId);
}

#pragma mark - RCTEventEmitter

- (void)startObserving {
  // Called when first listener is added
}

- (void)stopObserving {
  // Called when last listener is removed
}

- (void)dealloc {
  // Cleanup
}

@end
