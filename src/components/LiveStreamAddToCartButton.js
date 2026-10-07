import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
// react-native-svg already ships in this app and is proven on its New Architecture
// (Podfile :fabric_enabled), so a gradient fill costs no native rebuild.
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const ACCENT = '#539461';

/**
 * Add to Cart styling used on buyer live stream (overlay + LIVE Listing shop modal).
 *
 * `variant="glass"` gives the translucent-gray fill with a white label; `variant="gradientLight"`
 * paints a light -> light-green SVG gradient with a dark label, the secondary twin of the live
 * card's green Buy Now. The default keeps the original accent styling so the shop modal is
 * unaffected. `radius` overrides the corner radius where the surround is more rounded than the
 * default 12.
 */
const LiveStreamAddToCartButton = ({
  onPress,
  disabled,
  style,
  textStyle,
  radius,
  variant = 'default',
  label = 'Add to Cart',
}) => {
  const isGlass = variant === 'glass';
  const isGradient = variant === 'gradientLight';
  const cornerRadius = radius != null ? radius : 12;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isGlass && styles.buttonGlass,
        isGradient && styles.buttonGradient,
        { borderRadius: cornerRadius },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      {isGradient && (
        // Absolute fill: the gradient paints behind the label and adds no layout height.
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="addToCartLightGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F8FCF7" />
              <Stop offset="1" stopColor="#A9D9A9" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={cornerRadius} ry={cornerRadius} fill="url(#addToCartLightGradient)" />
        </Svg>
      )}
      <Text style={[styles.label, (isGlass || isGradient) && styles.labelGlass, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    minHeight: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 12,
  },
  buttonGlass: {
    // The secondary CTA on the live product card: a light frosted surface with dark text, so
    // the green Buy Now beside it stays the single primary action.
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    minHeight: 60,
  },
  buttonGradient: {
    // The live card's Add to Cart, on the same geometry as its Buy Now twin.
    // `padding: 0` is load-bearing, not tidying: Yoga insets absolutely-positioned children by
    // the parent's padding + border, so the base style's 12pt padding shrank the SVG viewport to
    // 48 - 2 - 24 = 22pt and the gradient painted only the top of the pill, leaving the white
    // fallback below it. Zeroing both makes the viewport the full 48pt. The label still centres
    // through the base `justifyContent`/`alignItems`.
    padding: 0,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: ACCENT,
  },
  labelGlass: {
    color: '#141414',
    fontWeight: '700',
  },
});

export default LiveStreamAddToCartButton;
