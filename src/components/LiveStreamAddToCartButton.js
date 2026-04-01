import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const ACCENT = '#539461';

/**
 * Add to Cart styling used on buyer live stream (overlay + LIVE Listing shop modal).
 */
const LiveStreamAddToCartButton = ({ onPress, disabled, style, textStyle, label = 'Add to Cart' }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}>
    <Text style={[styles.label, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 12,
  },
  label: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: ACCENT,
  },
});

export default LiveStreamAddToCartButton;
