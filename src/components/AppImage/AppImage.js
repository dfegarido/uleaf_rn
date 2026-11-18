import React from 'react';
import {Image} from 'react-native';
import {toResizedSupabaseUri} from '../../utils/plantListingImage';

/**
 * App-wide Image wrapper.
 *
 * Applies the Supabase `/render/image` downsize transform to any remote
 * `source={{ uri }}` so large originals (multi-MB) are served as small,
 * decodable images — avoiding the stuck loading spinner on Android. Local
 * assets (`require`/static source) and non-image sources pass through.
 *
 * Props: passes through all `<Image>` props, plus `resizeWidth` /
 * `resizeHeight` to override the default transform size. Tall graphics
 * (e.g. Terms of Purchase) should pass a larger `resizeHeight` so the
 * square default does not letterbox/crop them.
 */
const AppImage = ({source, resizeWidth = 1000, resizeHeight, ...props}) => {
  let resolvedSource = source;

  if (source && typeof source === 'object' && source.uri) {
    resolvedSource = {
      uri: toResizedSupabaseUri(
        source.uri,
        resizeWidth,
        resizeHeight != null ? {height: resizeHeight} : undefined,
      ),
    };
  }

  return <Image source={resolvedSource} {...props} />;
};

export default AppImage;
