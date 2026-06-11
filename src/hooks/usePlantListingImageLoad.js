import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Image} from 'react-native';

export const PLANT_IMAGE_SLOW_LOAD_MS = 6000;
export const PLANT_IMAGE_RETRY_MS = 3000;

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
  useEffect(() => {
    if (!uri) {
      return undefined;
    }

    let cancelled = false;

    const keepFetchingOriginal = async () => {
      while (!cancelled && !imageLoadedRef.current) {
        await prefetchRemoteImage(uri);

        if (cancelled || imageLoadedRef.current) {
          break;
        }

        setRetryKey(key => key + 1);

        const waitMs = showSlowFallbackRef.current ? retryMs : retryMs * 2;
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
