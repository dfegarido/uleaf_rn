#import "RNPipModule.h"
#import <AVKit/AVKit.h>
#import <AVFoundation/AVFoundation.h>
#import <MediaPlayer/MediaPlayer.h>

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

    // Configure audio session for background playback
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error = nil;

    // Use playback category to allow audio to continue in background
    [audioSession setCategory:AVAudioSessionCategoryPlayback
                         mode:AVAudioSessionModeVoiceChat  // Use voice chat mode for lower latency
                      options:AVAudioSessionCategoryOptionMixWithOthers | AVAudioSessionCategoryOptionAllowBluetooth | AVAudioSessionCategoryOptionAllowBluetoothA2DP
                        error:&error];
    if (error) {
      NSLog(@"[RNPipModule] Error setting audio session category: %@", error);
    }

    [audioSession setActive:YES error:&error];
    if (error) {
      NSLog(@"[RNPipModule] Error activating audio session: %@", error);
    }

    NSLog(@"[RNPipModule] Initialized with background audio support");
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
    NSLog(@"[RNPipModule] enterPip called - enabling background audio mode for iOS");

    // For iOS, we enable background audio mode
    // The audio will continue when the app is backgrounded
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error = nil;

    // Ensure audio session is active
    [audioSession setActive:YES error:&error];
    if (error) {
      NSLog(@"[RNPipModule] Error activating audio session: %@", error);
      reject(@"audio_session_error", error.localizedDescription, error);
      return;
    }

    // Configure Now Playing Info for lock screen and control center
    [self setupNowPlayingInfo];
    
    // Enable remote control events (headphone controls, control center)
    [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];

    // Mark that we're in "PiP mode" (background audio mode for iOS)
    self.isInPiPMode = YES;
    [self sendEventWithName:@"onPipModeChanged" body:@(YES)];

    NSLog(@"[RNPipModule] Background audio mode enabled with media controls");

    resolve(@{
      @"status": @"success",
      @"platform": @"ios",
      @"mode": @"background_audio",
      @"message": @"Audio will continue playing when you minimize or background the app"
    });
  });
}

// Setup Now Playing Info for lock screen and control center
- (void)setupNowPlayingInfo {
  NSMutableDictionary *nowPlayingInfo = [NSMutableDictionary dictionary];
  
  // Set basic info
  [nowPlayingInfo setObject:@"Live Stream" forKey:MPMediaItemPropertyTitle];
  [nowPlayingInfo setObject:@"iLeafU Live" forKey:MPMediaItemPropertyArtist];
  [nowPlayingInfo setObject:@"Plant Live Stream" forKey:MPMediaItemPropertyAlbumTitle];
  
  // Set playback info
  [nowPlayingInfo setObject:@(MPNowPlayingInfoMediaTypeVideo) forKey:MPNowPlayingInfoPropertyMediaType];
  [nowPlayingInfo setObject:@(1.0) forKey:MPNowPlayingInfoPropertyPlaybackRate];
  
  // Apply the metadata
  [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:nowPlayingInfo];
  
  NSLog(@"[RNPipModule] Now Playing info configured for lock screen");
}

RCT_EXPORT_METHOD(updateNowPlaying:(NSDictionary *)info)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableDictionary *nowPlayingInfo = [[[MPNowPlayingInfoCenter defaultCenter] nowPlayingInfo] mutableCopy];
    if (!nowPlayingInfo) {
      nowPlayingInfo = [NSMutableDictionary dictionary];
    }
    
    // Update title if provided
    if (info[@"title"]) {
      [nowPlayingInfo setObject:info[@"title"] forKey:MPMediaItemPropertyTitle];
    }
    
    // Update artist/broadcaster name if provided
    if (info[@"artist"]) {
      [nowPlayingInfo setObject:info[@"artist"] forKey:MPMediaItemPropertyArtist];
    }
    
    // Update viewer count or other info
    if (info[@"album"]) {
      [nowPlayingInfo setObject:info[@"album"] forKey:MPMediaItemPropertyAlbumTitle];
    }
    
    [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:nowPlayingInfo];
    NSLog(@"[RNPipModule] Now Playing info updated: %@", info);
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

    // Clean up media controls
    [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:nil];
    [[UIApplication sharedApplication] endReceivingRemoteControlEvents];
    
    self.isInPiPMode = NO;
    [self sendEventWithName:@"onPipModeChanged" body:@(NO)];

    resolve(@{ @"status": @"stopped", @"platform": @"ios" });
  });
}

RCT_EXPORT_METHOD(isPipSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // iOS supports background audio mode for live streaming
  resolve(@{
    @"supported": @(YES),
    @"platform": @"ios",
    @"mode": @"background_audio",
    @"note": @"iOS will continue audio playback when app is backgrounded"
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
  // Deactivate audio session when module is deallocated
  [[AVAudioSession sharedInstance] setActive:NO error:nil];
}

@end
