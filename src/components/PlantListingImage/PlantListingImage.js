import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {usePlantListingImageLoad} from '../../hooks/usePlantListingImageLoad';
import {
  PLANT_LISTING_MISSING_IMAGE,
  PLANT_LISTING_SLOW_LOAD_FALLBACK,
  toResizedSupabaseUri,
} from '../../utils/plantListingImage';

/**
 * Default resize width for listing images rendered through this component.
 * Kept lower for grid cards; screens can override via `resizeWidth`.
 */
const DEFAULT_IMAGE_WIDTH = 1000;

/** How long a replaced photo takes to fade in over the photo it replaced. */
const IMAGE_FADE_MS = 250;

const PlantListingImage = ({
  uri,
  style,
  resizeMode = 'cover',
  showLoading = true,
  loadingColor = '#7CBD58',
  staticSource = null,
  enableSlowFallback = true,
  resizeWidth = DEFAULT_IMAGE_WIDTH,
  // A photo already on the device (the seller's just-taken snapshot). Local-first: it wins
  // over `uri` while set, so it paints at once with no network or write dependency, and
  // clearing it hands the slot to the remote photo through the same cross-fade.
  localUri = null,
}) => {
  const sourceUri = localUri || uri;
  const resolvedUri = sourceUri
    ? toResizedSupabaseUri(sourceUri, resizeWidth)
    : null;

  const {
    hasRemoteUri,
    showSlowFallback,
    showLoadingSpinner,
    retryKey,
    handleLoad,
    handleLoadEnd,
    handleError,
  } = usePlantListingImageLoad(resolvedUri, {enableSlowFallback});

  // The photo already painted in this slot. Held in state — not just as the Image's
  // own source — so it can stay on screen while a REPLACEMENT decodes. That is what
  // makes a swap read as a cross-fade instead of a blank card behind a spinner, and
  // the live flow depends on it: the seller's snapshot rewrites
  // `listing.imageprimary` while the buyer's 10s poll swaps this component's `uri`.
  const [paintedUri, setPaintedUri] = useState(null);
  const paintedUriRef = useRef(null);
  const resolvedUriRef = useRef(resolvedUri);
  const fadeIn = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    resolvedUriRef.current = resolvedUri;
  }, [resolvedUri]);

  // An incoming photo always starts invisible, so when there IS one to fade over it
  // can only ever reveal it. Harmless on a first load, where the layer is opaque.
  useLayoutEffect(() => {
    fadeIn.setValue(0);
  }, [resolvedUri, retryKey, fadeIn]);

  useLayoutEffect(() => {
    if (resolvedUri) {
      return;
    }
    // No photo in this slot at all: drop the painted one rather than let one
    // listing's photo stand in for another that has no image.
    paintedUriRef.current = null;
    setPaintedUri(null);
  }, [resolvedUri]);

  const handlePhotoShown = useCallback(() => {
    const replacing =
      Boolean(paintedUriRef.current) && paintedUriRef.current !== resolvedUri;

    handleLoad();

    if (!replacing) {
      // Nothing painted underneath, so there is nothing to fade over: show the photo
      // the moment it decodes, exactly as before.
      paintedUriRef.current = resolvedUri;
      setPaintedUri(resolvedUri);
      return;
    }

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: IMAGE_FADE_MS,
      useNativeDriver: true,
    }).start(({finished}) => {
      // Release the outgoing photo only once the new one is fully opaque, and only
      // if it is still this slot's photo — a newer uri may have arrived mid-fade.
      if (!finished || resolvedUriRef.current !== resolvedUri) {
        return;
      }
      paintedUriRef.current = resolvedUri;
      setPaintedUri(resolvedUri);
    });
  }, [resolvedUri, fadeIn, handleLoad]);

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

  const showPaintedPhoto = Boolean(paintedUri) && paintedUri !== resolvedUri;

  // Kept out of JSX so the linter's no-inline-styles rule is satisfied, as with the
  // live screen's own animated styles. Opacity is animated ONLY while cross-fading:
  // with a photo behind it the layer is driven by `fadeIn`; on a first load it is
  // simply opaque, so no Animated node sits in the tree for the common path.
  const incomingLayerStyle = {opacity: showPaintedPhoto ? fadeIn : 1};

  return (
    <View style={[style, styles.container]}>
      {showPaintedPhoto && (
        <Image
          source={{uri: paintedUri}}
          style={[StyleSheet.absoluteFill, styles.paintedImage]}
          resizeMode={resizeMode}
        />
      )}

      {showSlowFallback && !showPaintedPhoto && (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackdrop]}>
          <Image
            source={PLANT_LISTING_SLOW_LOAD_FALLBACK}
            style={styles.fallbackImage}
            resizeMode="contain"
          />
        </View>
      )}

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.incomingLayer, incomingLayerStyle]}>
        <Image
          key={`${resolvedUri}-${retryKey}`}
          source={{uri: resolvedUri}}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={handlePhotoShown}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      </Animated.View>

      {showLoading && showLoadingSpinner && !showPaintedPhoto && (
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
  paintedImage: {
    zIndex: 0,
  },
  incomingLayer: {
    zIndex: 1,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 2,
  },
});

export default PlantListingImage;
