import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
// FALLBACK: Using simple progress bar instead of Slider to avoid RNCSlider issues
// import Slider from '@react-native-community/slider';
import SimpleProgressBar from './SimpleProgressBar';
import Svg, { Path } from 'react-native-svg';
import { formatDuration } from '../../utils/videoCompression';

/**
 * VideoPlayer Component
 * Full-featured video player with play/pause/seek/mute/fullscreen controls
 * Compatible with Android and iOS
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Play Icon SVG Component
const PlayIcon = ({ width = 80, height = 80, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32">
    <Path
      d="M5.92 24.096q0 1.088 0.928 1.728 0.512 0.288 1.088 0.288 0.448 0 0.896-0.224l16.16-8.064q0.48-0.256 0.8-0.736t0.288-1.088-0.288-1.056-0.8-0.736l-16.16-8.064q-0.448-0.224-0.896-0.224-0.544 0-1.088 0.288-0.928 0.608-0.928 1.728v16.16z"
      fill={color}
    />
  </Svg>
);

// Pause Icon SVG Component (two vertical bars)
const PauseIcon = ({ width = 80, height = 80, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 5V19M16 5V19"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Skip Backward Icon SVG Component
const SkipBackwardIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 52 52" fill={color}>
    <Path d="M26,7.9V2.6c0-0.5,0.6-0.8,1.1-0.5l10.3,8.5c0.4,0.3,0.4,0.9,0,1.2l-10.3,8.4c-0.4,0.4-1.1,0-1.1-0.4v-5.4 c-8,0-14.6,6.5-14.6,14.6S18,43.5,26,43.5c8,0,14.6-6.5,14.6-14.6c0-2.3-0.5-4.5-1.5-6.5c0,0,0-0.1-0.1-0.2 c-0.2-0.4-0.4-0.9-0.6-1.2c-0.3-0.5-0.6-1.3,0-1.8c0.6-0.5,3.1-2.6,3.3-2.7c0.2-0.1,0.9-0.8,1.6,0.2c0.4,0.6,0.9,1.5,1.3,2.2 c0,0.1,0.1,0.1,0.1,0.2c0.2,0.3,0.3,0.6,0.4,0.7l0,0c1.3,2.7,2,5.8,2,9.1c0,11.6-9.4,21-21,21S5,40.6,5,29S14.4,7.9,26,7.9z" />
  </Svg>
);

// Skip Forward Icon SVG Component
const SkipForwardIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 52 52" fill={color}>
    <Path d="M26,7.9V2.6c0-0.5-0.6-0.8-1.1-0.5l-10.3,8.5c-0.4,0.3-0.4,0.9,0,1.2l10.3,8.4c0.4,0.4,1.1,0,1.1-0.4v-5.4 c8,0,14.6,6.5,14.6,14.6S34,43.5,26,43.5c-8,0-14.6-6.5-14.6-14.6c0-2.3,0.5-4.5,1.5-6.5c0,0,0-0.1,0.1-0.2 c0.2-0.4,0.4-0.9,0.6-1.2c0.3-0.5,0.6-1.3,0-1.8c-0.6-0.5-3.1-2.6-3.3-2.7c-0.2-0.1-0.9-0.8-1.6,0.2c-0.4,0.6-0.9,1.5-1.3,2.2 c0,0.1-0.1,0.1-0.1,0.2c-0.2,0.3-0.3,0.6-0.4,0.7l0,0c-1.3,2.7-2,5.8-2,9.1c0,11.6,9.4,21,21,21s21-9.4,21-21S37.6,7.9,26,7.9z" />
  </Svg>
);

// Volume Icon SVG Component
const VolumeIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.0004 9.00009C16.6281 9.83575 17 10.8745 17 12.0001C17 13.1257 16.6281 14.1644 16.0004 15.0001M18 5.29177C19.8412 6.93973 21 9.33459 21 12.0001C21 14.6656 19.8412 17.0604 18 18.7084M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Muted Volume Icon SVG Component
const MutedVolumeIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 9.50009L21 14.5001M21 9.50009L16 14.5001M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Ensure Cloudinary video URLs have iOS-compatible transformations
 * Adds H.264/AAC codec parameters if missing
 * 
 * Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/video/upload/{transformations}/{public_id}.{format}
 * Transformations format: vc_h264,ac_aac,q_auto:good,f_mp4
 */
const ensureIOSCompatibleUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's a Cloudinary URL
  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    // Check if transformations are already in the URL
    // Cloudinary URLs with transformations: /video/upload/vc_h264,ac_aac/... or /video/upload/v123/...
    // Version-only URLs: /video/upload/v123/... (no codec transformations)
    const hasCodecTransformations = url.includes('vc_') || url.includes('ac_');
    
    if (!hasCodecTransformations) {
      // Add iOS-compatible transformations to the URL
      // Insert transformations after /video/upload/ and before version or public_id
      const uploadIndex = url.indexOf('/video/upload/');
      if (uploadIndex !== -1) {
        const insertIndex = uploadIndex + '/video/upload/'.length;
        // Add transformations: H.264 video codec, AAC audio codec, auto quality, MP4 format
        // Format: vc_h264,ac_aac,q_auto:good,f_mp4/
        const transformations = 'vc_h264,ac_aac,q_auto:good,f_mp4/';
        return url.slice(0, insertIndex) + transformations + url.slice(insertIndex);
      }
    }
  }
  
  return url;
};

const VideoPlayer = ({ 
  videoUrl, 
  visible, 
  onClose, 
  autoPlay = false,
  showControls: showControlsProp = true,
  style = {},
}) => {
  const videoRef = useRef(null);
  
  // Ensure video URL is iOS-compatible (for Cloudinary URLs)
  const compatibleVideoUrl = React.useMemo(() => {
    return ensureIOSCompatibleUrl(videoUrl);
  }, [videoUrl]);
  const controlsTimeout = useRef(null);
  const [paused, setPaused] = useState(!autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-hide controls after 3 seconds when playing
  const resetControlsTimer = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }
    if (!paused) {
      controlsTimeout.current = setTimeout(() => {
        console.log('🎬 resetControlsTimer: Auto-hiding controls');
        setShowControls(false);
        setShowControlsOverlay(false);
      }, 3000);
    }
  };

  const handlePlayPause = () => {
    console.log('🎬 Play/Pause pressed, current paused:', paused);
    const newPausedState = !paused;
    setPaused(newPausedState);
    
    // Clear any existing timer
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }
    
    if (!newPausedState) {
      // Video is now playing - show controls briefly then hide
      console.log('🎬 Video now playing, showing controls then auto-hide');
      setShowControls(true);
      setShowControlsOverlay(true);
      // Start timer to hide controls after 3 seconds
      controlsTimeout.current = setTimeout(() => {
        console.log('🎬 handlePlayPause: Auto-hiding controls');
        setShowControls(false);
        setShowControlsOverlay(false);
      }, 3000);
    } else {
      // Video is now paused - keep controls visible
      console.log('🎬 Video now paused, keeping controls visible');
      setShowControls(true);
      setShowControlsOverlay(true);
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleVideoPress = () => {
    console.log('🎬 Video pressed, current showControls:', showControls, 'paused:', paused);
    
    // Clear any existing timer first
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }
    
    // Toggle controls visibility
    const newShowControls = !showControls;
    setShowControls(newShowControls);
    setShowControlsOverlay(newShowControls);
    
    console.log('🎬 Setting showControls to:', newShowControls);
    
    // If showing controls and video is playing, auto-hide after 3 seconds
    if (newShowControls && !paused) {
      console.log('🎬 Setting auto-hide timer (3 seconds)');
      controlsTimeout.current = setTimeout(() => {
        console.log('🎬 Auto-hiding controls');
        setShowControls(false);
        setShowControlsOverlay(false);
      }, 3000);
    }
  };

  // Log video URL when component mounts or videoUrl changes
  useEffect(() => {
    if (visible && videoUrl) {
      console.log('🎥 VideoPlayer opened with URL:', videoUrl);
      console.log('URL type:', typeof videoUrl);
      console.log('URL starts with:', videoUrl.substring(0, 50));
      if (compatibleVideoUrl !== videoUrl) {
        console.log('🔧 Applied iOS-compatible transformations:', compatibleVideoUrl);
      }
    }
  }, [visible, videoUrl, compatibleVideoUrl]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    setCurrentTime(value);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    handleSeek(newTime);
  };

  const handleLoad = (data) => {
    console.log('✅ Video loaded successfully:', compatibleVideoUrl);
    console.log('Video duration:', data.duration, 'seconds');
    setDuration(data.duration);
    setIsLoading(false);
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleEnd = () => {
    setPaused(true);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  const handleError = (err) => {
    console.error('❌ Video playback error:', err);
    console.error('Video URL that failed:', compatibleVideoUrl);
    console.error('Original URL:', videoUrl);
    console.error('Error details:', JSON.stringify(err, null, 2));
    
    // Check for specific error codes
    let errorTitle = 'Video Playback Error';
    let errorMessage = 'Failed to load video';
    
    if (err?.error?.code === -11800) {
      // Error -11800 with -12746 typically means codec incompatibility on iOS
      if (Platform.OS === 'ios') {
        errorTitle = 'Video Format Not Supported';
        errorMessage = 'This video cannot play on iOS.\n\n' +
                      'The video was uploaded in a format that iOS doesn\'t support. ' +
                      'Please ask the sender to re-upload the video.';
      } else {
        errorMessage = 'Video not found or inaccessible';
      }
    } else if (err?.error?.localizedFailureReason) {
      errorMessage = err.error.localizedFailureReason;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    
    // Show alert for better user feedback
    Alert.alert(
      errorTitle,
      errorMessage,
      [{ text: 'OK' }]
    );
  };

  const handleBuffer = ({ isBuffering }) => {
    setIsLoading(isBuffering);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPaused(true);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      setError(null);
      setShowControls(true);
      setShowControlsOverlay(true);
      // Clear any existing timer
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = null;
      }
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
    }
  }, [visible]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = null;
      }
    };
  }, []);

  // Don't render anything if modal is not visible
  if (!visible || !compatibleVideoUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalContainer}>
        <StatusBar hidden={isFullscreen} />
        
        {/* Close Button (Top Right) */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Video Container */}
        <View
          style={[
            styles.videoContainer,
            isFullscreen && styles.videoContainerFullscreen,
          ]}>
          
          {/* Video Player */}
          <Video
            ref={videoRef}
            source={{ uri: compatibleVideoUrl }}
            style={[
              styles.video,
              isFullscreen && styles.videoFullscreen,
              style,
            ]}
            paused={paused}
            muted={isMuted}
            resizeMode="contain"
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onError={handleError}
            onBuffer={handleBuffer}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />
          
          {/* Transparent Touch Overlay - Captures touches for showing/hiding controls */}
          {!isLoading && !error && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleVideoPress}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'transparent',
                zIndex: 1,
              }}
              pointerEvents="auto"
            />
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Center Skip Controls - Only visible when paused or controls shown */}
          {(showControls || paused) && !isLoading && !error && (
            <View style={styles.centerControls} pointerEvents="box-none">
              {/* Skip Backward -10s */}
              <TouchableOpacity
                style={styles.centerControlButton}
                onPress={handleSkipBackward}
                activeOpacity={0.7}>
                <View style={styles.centerButtonContent}>
                  <SkipBackwardIcon width={28} height={28} color="#FFFFFF" />
                  <Text style={styles.centerButtonLabel}>-10s</Text>
                </View>
              </TouchableOpacity>

              {/* Play/Pause in center */}
              <TouchableOpacity
                style={[styles.centerControlButton, styles.centerPlayButton]}
                onPress={handlePlayPause}
                activeOpacity={0.8}>
                {paused ? (
                  <PlayIcon width={36} height={36} color="#FFFFFF" />
                ) : (
                  <PauseIcon width={36} height={36} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Skip Forward +10s */}
              <TouchableOpacity
                style={styles.centerControlButton}
                onPress={handleSkipForward}
                activeOpacity={0.7}>
                <View style={styles.centerButtonContent}>
                  <SkipForwardIcon width={28} height={28} color="#FFFFFF" />
                  <Text style={styles.centerButtonLabel}>+10s</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Controls Overlay */}
          {showControls && showControlsOverlay && !error && (
            <View style={styles.controlsOverlay}>
              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                {/* Timeline Progress Bar (Fallback without RNCSlider) */}
                <View style={styles.timelineContainer}>
                  <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
                  <SimpleProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                  />
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>

                {/* No bottom control buttons - all controls in center */}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT, // 100% full screen
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainerFullscreen: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    transform: [{ rotate: '90deg' }],
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoFullscreen: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: 'linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent)',
    zIndex: 5,
    elevation: 5, // Android elevation
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -40 }],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    zIndex: 5,
    elevation: 5, // Android elevation
  },
  centerControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  centerPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(83, 148, 97, 0.95)',
  },
  centerButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  bottomControls: {
    paddingHorizontal: 8,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(83, 148, 97, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  skipButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlButtonLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default VideoPlayer;
