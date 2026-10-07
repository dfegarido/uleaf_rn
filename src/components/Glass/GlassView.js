import React from 'react';
import { StyleSheet, View } from 'react-native';
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
 * The tint is drawn as an ABSOLUTE-FILL CHILD of the blur, never as the host's own
 * `backgroundColor`. The native view is `host -> BlurView -> children`, and a UIKit
 * material is drawn over whatever sits behind it, so a `backgroundColor` on the host
 * is buried under the material and no amount of alpha reaches the screen (measured:
 * a pure `rgba(0,0,255,1)` fill still rendered as neutral grey). Children mount
 * above the material, so the tint has to live there.
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
  const cornerRadius = radius != null ? radius : token.radius;
  // Shared by both paths: everything except the tint.
  const surface = {
    borderRadius: cornerRadius,
    borderWidth: 1,
    borderColor: token.border,
    ...GLASS_SHADOW,
  };
  const tint = {
    backgroundColor: token.fill,
    borderRadius: cornerRadius,
  };
  const content = contentStyle ? <View style={contentStyle}>{children}</View> : children;

  if (!isGlassBlurAvailable()) {
    return (
      <View style={[glassClip, surface, tint, style]} {...rest}>
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
      {/* Must come before `content`: it is the first child, so it lands directly on
          top of the material and below the text. Non-interactive either way. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, tint]} />
      {content}
    </BlurView>
  );
};

export default GlassView;
