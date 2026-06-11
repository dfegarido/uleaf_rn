import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {usePlantListingImageLoad} from '../../hooks/usePlantListingImageLoad';
import {
  PLANT_LISTING_MISSING_IMAGE,
  PLANT_LISTING_SLOW_LOAD_FALLBACK,
} from '../../utils/plantListingImage';

const PlantListingImage = ({
  uri,
  style,
  resizeMode = 'cover',
  showLoading = true,
  loadingColor = '#7CBD58',
  staticSource = null,
  enableSlowFallback = true,
}) => {
  const {
    uri: resolvedUri,
    hasRemoteUri,
    imageLoaded,
    showSlowFallback,
    showLoadingSpinner,
    retryKey,
    handleLoad,
    handleLoadEnd,
    handleError,
  } = usePlantListingImageLoad(uri, {enableSlowFallback});

  if (staticSource && !hasRemoteUri) {
    return (
      <Image source={staticSource} style={style} resizeMode={resizeMode} />
    );
  }

  if (!hasRemoteUri) {
    return (
      <Image
        source={PLANT_LISTING_MISSING_IMAGE}
        style={style}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      {showSlowFallback && (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackdrop]}>
          <Image
            source={PLANT_LISTING_SLOW_LOAD_FALLBACK}
            style={styles.fallbackImage}
            resizeMode="contain"
          />
        </View>
      )}

      <Image
        key={`${resolvedUri}-${retryKey}`}
        source={{uri: resolvedUri}}
        style={[
          StyleSheet.absoluteFill,
          styles.remoteImage,
          !imageLoaded && showSlowFallback && styles.remoteImageBehindFallback,
        ]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />

      {showLoading && showLoadingSpinner && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={loadingColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallbackBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F4ED',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
  },
  remoteImage: {
    zIndex: 1,
  },
  remoteImageBehindFallback: {
    opacity: 0.01,
    zIndex: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});

export default PlantListingImage;
