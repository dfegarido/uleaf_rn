import React from 'react';
import { View } from 'react-native';
import {
  BlurView,
  GLASS_BLUR_AMOUNT,
  GLASS_BLUR_ROUNDS,
  GLASS_SHADOW,
  GLASS_VARIANTS,
  glassClip,
  isGlassBlurAvailable,
  resolveBlurType,
} from './glassTokens';

/**
 * Frosted-glass surface: a real native BlurView with a translucent tint, hairline
 * white border, large corner radius and a subtle shadow.
 *
 * When the blur module is not present in the running binary this renders the tint
 * alone (still translucent, never invisible) so the layout and legibility survive a
 * JS-only reload without a native rebuild.
 */
const GlassView = ({
  variant = 'dark',
  radius,
  blurAmount = GLASS_BLUR_AMOUNT,
  style,
  contentStyle,
  children,
  ...rest
}) => {
  const token = GLASS_VARIANTS[variant] || GLASS_VARIANTS.dark;
  const surface = {
    borderRadius: radius != null ? radius : token.radius,
    borderWidth: 1,
    borderColor: token.border,
    backgroundColor: token.fill,
    ...GLASS_SHADOW,
  };
  const content = contentStyle ? <View style={contentStyle}>{children}</View> : children;

  if (!isGlassBlurAvailable()) {
    return (
      <View style={[glassClip, surface, style]} {...rest}>
        {content}
      </View>
    );
  }

  return (
    <BlurView
      blurType={resolveBlurType(token.blurType)}
      blurAmount={blurAmount}
      blurRounds={GLASS_BLUR_ROUNDS}
      style={[glassClip, surface, style]}
      {...rest}>
      {content}
    </BlurView>
  );
};

export default GlassView;
