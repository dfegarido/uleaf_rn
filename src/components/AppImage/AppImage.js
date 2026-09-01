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
 * Props: passes through all `<Image>` props, plus `resizeWidth` to override
 * the default transform width.
 */
const AppImage = ({source, resizeWidth = 1000, ...props}) => {
  let resolvedSource = source;

  if (source && typeof source === 'object' && source.uri) {
    resolvedSource = {uri: toResizedSupabaseUri(source.uri, resizeWidth)};
  }

  return <Image source={resolvedSource} {...props} />;
};

export default AppImage;
