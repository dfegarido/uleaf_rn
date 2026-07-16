import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AVATAR_COLORS = [
  '#7F56D9', // purple
  '#12B76A', // green
  '#F79009', // orange
  '#2E90FA', // blue
  '#F04438', // red
];

/**
 * Initials avatar with a deterministic background color based on name.
 *
 * @param {{ name: string, size?: number }} props
 */
export default function Avatar({ name = '', size = 36 }) {
  const initials = useMemo(() => {
    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return parts
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
  }, [name]);

  const bg = useMemo(() => {
    const key = String(name).trim();
    if (!key) return AVATAR_COLORS[0];
    return AVATAR_COLORS[key.charCodeAt(0) % AVATAR_COLORS.length];
  }, [name]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
