import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Image} from 'react-native';

export const PLANT_IMAGE_SLOW_LOAD_MS = 6000;
export const PLANT_IMAGE_RETRY_MS = 3000;

/**
 * Ceiling for the retry backoff. A failing/undecodable image settles into one
 * attempt per ceiling rather than a tight loop (keeps the earlier overheating
 * fix intact while still retrying indefinitely).
 */
export const PLANT_IMAGE_BACKOFF_MAX_MS = 15000;

const prefetchRemoteImage = async (uri) => {
  if (!uri) {
    return false;
  }

  try {
    return await Image.prefetch(uri);
  } catch {
    return false;
  }
};

export const usePlantListingImageLoad = (
  imageUri,
  {
    slowLoadMs = PLANT_IMAGE_SLOW_LOAD_MS,
    retryMs = PLANT_IMAGE_RETRY_MS,
    enableSlowFallback = true,
  } = {},
) => {
  const uri = imageUri && String(imageUri).trim() ? String(imageUri).trim() : '';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSlowFallback, setShowSlowFallback] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const imageLoadedRef = useRef(false);
  const showSlowFallbackRef = useRef(false);

  useLayoutEffect(() => {
    imageLoadedRef.current = false;
    showSlowFallbackRef.current = false;
    setImageLoaded(false);
    setShowSlowFallback(false);
    setRetryKey(0);
  }, [uri]);

  useEffect(() => {
    showSlowFallbackRef.current = showSlowFallback;
  }, [showSlowFallback]);

  useEffect(() => {
    if (!uri || !enableSlowFallback) {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (!imageLoadedRef.current) {
        setShowSlowFallback(true);
      }
    }, slowLoadMs);

    return () => clearTimeout(timer);
  }, [uri, slowLoadMs, enableSlowFallback]);

  // Continuously prefetch + remount the remote image until it is displayed.
  //
  // Retries are capped in RATE, not in total attempts. Previously this stopped
  // after MAX_RETRIES=5 and gave up permanently, which left genuinely-slow large
  // originals (e.g. legacy Firebase-hosted listings at 5712x4284 -> ~93MB decoded)
  // as blank cards with a stuck spinner for the life of the mount. Backing off to
  // one attempt per PLANT_IMAGE_BACKOFF_MAX_MS keeps the JS thread calm while
  // still letting a slow decode eventually land.
  useEffect(() => {
    if (!uri) {
      return undefined;
    }

    let cancelled = false;
    let attempt = 0;

    const keepFetchingOriginal = async () => {
      while (!cancelled && !imageLoadedRef.current) {
        attempt += 1;
        await prefetchRemoteImage(uri);

        if (cancelled || imageLoadedRef.current) {
          break;
        }

        setRetryKey(key => key + 1);

        const base = showSlowFallbackRef.current ? retryMs : retryMs * 2;
        const waitMs = Math.min(base * attempt, PLANT_IMAGE_BACKOFF_MAX_MS);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    };

    keepFetchingOriginal();

    return () => {
      cancelled = true;
    };
  }, [uri, retryMs]);

  const handleLoad = useCallback(() => {
    imageLoadedRef.current = true;
    setImageLoaded(true);
    setShowSlowFallback(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    handleLoad();
  }, [handleLoad]);

  const handleError = useCallback(() => {
    if (imageLoadedRef.current) {
      return;
    }

    if (enableSlowFallback) {
      setShowSlowFallback(true);
    }
    setRetryKey(key => key + 1);
  }, [enableSlowFallback]);

  return {
    uri,
    hasRemoteUri: Boolean(uri),
    imageLoaded,
    showSlowFallback:
      enableSlowFallback && Boolean(uri) && showSlowFallback && !imageLoaded,
    showLoadingSpinner: Boolean(uri) && !imageLoaded && !showSlowFallback,
    retryKey,
    handleLoad,
    handleLoadEnd,
    handleError,
  };
};
