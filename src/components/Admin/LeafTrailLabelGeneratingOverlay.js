import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Full-screen loading state while thermal labels are being generated.
 * Use `embedded` when the parent screen is already inside a Modal (Android).
 */
const LeafTrailLabelGeneratingOverlay = ({
  visible = false,
  message = 'Generating labels, please wait…',
  title = 'Generating labels',
  embedded = false,
}) => {
  if (!visible) return null;

  const body = (
    <View style={styles.scrim} pointerEvents="auto">
      <View style={styles.card}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Leaf Trail</Text>
        </View>
        <ActivityIndicator size="large" color="#2F8C4F" style={styles.spinner} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{body}</View>;
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
      {body}
    </Modal>
  );
};

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 20, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDEDE2',
    shadowColor: '#0F1D15',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF7EF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2F8C4F',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B7A43',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  spinner: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LeafTrailLabelGeneratingOverlay;
