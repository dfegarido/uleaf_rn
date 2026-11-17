import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AppImage from '../../../components/AppImage/AppImage';

// Shared look for the admin User Management list and the Buyer/Seller information screen.

export const GREEN = '#539461';
export const GREEN_DARK = '#2E6B3E';
export const INK = '#202325';
export const MUTED = '#647276';
export const PAGE_BG = '#F5F6F4';

export const STATUS_COLORS = {
  active: { fg: '#2E6B3E', bg: '#E8F3EA', dot: GREEN },
  pending: { fg: '#2F6FB5', bg: '#E8F1FB', dot: '#4094F7' },
  suspended: { fg: '#A2610F', bg: '#FFF3E0', dot: '#FBA94C' },
  inactive: { fg: '#B3261E', bg: '#FDECEA', dot: '#F75555' },
};

// Soft, brand-friendly avatar colours; picked from a stable seed so a user keeps theirs.
const AVATAR_COLORS = ['#E07A5F', '#3D7EA6', '#9B5DE5', '#2A9D8F', '#F4A261', '#D9488F', '#5E9C76', '#C9A227'];
export const avatarColor = seed => {
  let h = 0;
  for (const c of String(seed || '')) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
export const initialsOf = name =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('') || '?';

export const photoOf = user => user?.profileImage || user?.profileimage || user?.profilePhotoUrl || null;

/** Photo when there is a working one, otherwise coloured initials. */
export const UserAvatar = ({ user, title, size = 52 }) => {
  const photo = photoOf(user);
  // A dead photo link would leave a blank circle; fall back to initials instead.
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (photo && !failed) {
    return (
      <AppImage
        source={{ uri: photo }}
        resizeWidth={size * 4}
        style={[styles.avatar, box]}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[styles.avatar, box, { backgroundColor: avatarColor(user?.id || title) }]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{initialsOf(title)}</Text>
    </View>
  );
};

export const PencilGlyph = ({ size = 18, color = GREEN_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

export const TrashGlyph = ({ size = 20, color = '#C8341C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StatusPill = ({ status, label }) => {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  return (
    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: sc.dot }]} />
      <Text style={[styles.pillText, { color: sc.fg }]}>{label}</Text>
    </View>
  );
};

export const RolePill = ({ isSeller }) => (
  <View style={[styles.pill, isSeller ? styles.sellerPill : styles.buyerPill]}>
    <Text style={[styles.pillText, isSeller ? styles.sellerPillText : styles.buyerPillText]}>
      {isSeller ? 'Seller' : 'Buyer'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9ECE8',
  },
  initials: {
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  buyerPill: {
    backgroundColor: '#ECEEFB',
  },
  sellerPill: {
    backgroundColor: '#E8F3EA',
  },
  buyerPillText: {
    color: '#3949AB',
  },
  sellerPillText: {
    color: GREEN_DARK,
  },
});
