import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppImage from './AppImage/AppImage';

// Saturated enough to carry a white initial on any video frame.
const COLORS = ['#E5534B', '#E0823D', '#C9A227', '#3FA34D', '#2E9C9C', '#3B82D6', '#7C5CD6', '#C94F9C'];

// The app stores Gravatar's "mystery person" when a user has no profile photo; treat it as none.
const hasPhoto = (uri) => !!uri && !uri.includes('gravatar.com/avatar/');

// Same name, same colour, every time, so a regular is recognisable at a glance.
const colorFor = (name) => {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
};

/**
 * Live chat avatar: the user's photo, or a coloured circle with their initial when they have no
 * photo or it fails to load. `style` sizes the circle (width/height/borderRadius/border).
 */
const ChatAvatar = ({ uri, name, style }) => {
  const [failed, setFailed] = useState(false);
  if (hasPhoto(uri) && !failed) {
    return <AppImage source={{ uri }} style={style} onError={() => setFailed(true)} />;
  }
  const label = String(name || '').trim();
  return (
    <View style={[style, styles.fallback, { backgroundColor: colorFor(label) }]}>
      <Text style={styles.initial}>{(label[0] || '?').toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 14,
  },
});

export default ChatAvatar;
