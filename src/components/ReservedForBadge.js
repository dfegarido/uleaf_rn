import React, {useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';

export const reservedForName = listing =>
  String(listing?.reservedForUsername || listing?.reserved_for_username || '').trim();

export const reservedForUid = listing =>
  String(listing?.reservedForUid || listing?.reserved_for_uid || '').trim();

export const isReservedForOther = (listing, uid) => {
  const owner = reservedForUid(listing);
  if (!owner) return false;
  return owner !== String(uid || '');
};

let gradientSeq = 0;

const TagIcon = ({size}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 12.2 12.2 3.5H20.5V11.8L11.8 20.5 3.5 12.2Z"
      stroke="#F3D48A"
      strokeWidth={1.9}
      strokeLinejoin="round"
    />
    <Circle cx={16.4} cy={7.6} r={1.5} fill="#F3D48A" />
  </Svg>
);

/**
 * "Reserved for {username}".
 * Default: a full-width strip pinned to the bottom of the parent photo
 * (`edge="top"` pins it to the top). Callers nudge it with `style`.
 * `inline`: a larger pill in normal layout flow, for detail screens.
 */
const ReservedForBadge = ({listing, inline = false, edge = 'bottom', style}) => {
  const name = reservedForName(listing);
  const gradId = useRef(`reservedForGrad${++gradientSeq}`).current;
  if (!name) return null;

  if (inline) {
    return (
      <View style={style} pointerEvents="none">
        <View style={styles.pill}>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#4E9A68" />
                <Stop offset="0.45" stopColor="#1F5C38" />
                <Stop offset="1" stopColor="#0E2E1C" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="18" fill={`url(#${gradId})`} />
          </Svg>
          <View style={styles.mark}>
            <TagIcon size={14} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.pillKicker} numberOfLines={1}>
              RESERVED FOR
            </Text>
            <Text style={styles.pillName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.strip, edge === 'top' ? styles.stripTop : styles.stripBottom, style]}
      pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#14402A" stopOpacity="0.96" />
            <Stop offset="1" stopColor="#2E7A4C" stopOpacity="0.96" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
      <View style={styles.stripKickerRow}>
        <TagIcon size={9} />
        <Text style={styles.stripKicker} numberOfLines={1}>
          RESERVED FOR
        </Text>
      </View>
      <Text style={styles.stripName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(243, 212, 138, 0.75)',
  },
  stripBottom: {bottom: 0, borderTopWidth: 1},
  stripTop: {top: 0, borderBottomWidth: 1},
  stripKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stripKicker: {
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.6,
    color: '#F3D48A',
    fontWeight: '700',
  },
  stripName: {
    maxWidth: '100%',
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(243, 212, 138, 0.85)',
    overflow: 'hidden',
    shadowColor: '#0E2E1C',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 212, 138, 0.16)',
  },
  copy: {flexShrink: 1},
  pillKicker: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.8,
    color: '#F3D48A',
    fontWeight: '700',
  },
  pillName: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ReservedForBadge;
