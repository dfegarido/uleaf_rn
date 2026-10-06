import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const ACCENT = '#539461';

/**
 * Add to Cart styling used on buyer live stream (overlay + LIVE Listing shop modal).
 *
 * `variant="glass"` gives the translucent-gray fill with a white label used on the
 * live-stream product card; the default keeps the original accent styling so the shop
 * modal is unaffected. `radius` overrides the corner radius where the surround is more
 * rounded than the default 12.
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
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isGlass && styles.buttonGlass,
        radius != null && { borderRadius: radius },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <Text style={[styles.label, isGlass && styles.labelGlass, textStyle]}>{label}</Text>
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
