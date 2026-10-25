import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { emit, on } from '../services/notifications/notificationEvents';
import { getPendingCohostInvite } from './CohostInviteGate';

/**
 * Admin home header bell. Red badge while a co-host invite is waiting (state comes from
 * CohostInviteGate's poll); tapping brings the invite card back with Accept / Decline.
 */
const CohostInviteBell = () => {
  const [pending, setPending] = useState(getPendingCohostInvite());

  useEffect(() => on('cohost_pending', setPending), []);

  const open = () => {
    if (pending) emit('cohost_open');
    else Alert.alert('Notifications', 'No new notifications.');
  };

  return (
    <TouchableOpacity
      onPress={open}
      style={styles.button}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={pending ? '1 new notification' : 'Notifications'}>
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
          stroke="#202325"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {pending ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#E5534B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default CohostInviteBell;
