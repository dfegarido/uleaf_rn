import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import ChatAvatar from '../../components/ChatAvatar';
import { getCohostAdminsApi } from '../../components/Api/liveApi';

/**
 * Co-hosted live: the seller picks an active admin to invite. An in-screen overlay (not a
 * Modal), like the viewers and cart sheets, so it opens instantly and never fights another
 * Modal on iOS. Render it after the rest of the broadcast screen.
 */
const InviteAdminSheet = ({ isVisible, onClose, sessionId, onPick }) => {
  const insets = useSafeAreaInsets();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(isVisible);
  const slide = useRef(new Animated.Value(isVisible ? 0 : 1)).current;

  useEffect(() => {
    if (isVisible) setMounted(true);
    Animated.timing(slide, {
      toValue: isVisible ? 0 : 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isVisible) setMounted(false);
    });
  }, [isVisible, slide]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isVisible, onClose]);

  useEffect(() => {
    if (!isVisible || !sessionId) return;
    let alive = true;
    setLoading(true);
    getCohostAdminsApi(sessionId).then((res) => {
      if (!alive) return;
      setLoading(false);
      setError(!res.success);
      setAdmins(res.success ? res.admins || [] : []);
    });
    return () => {
      alive = false;
    };
  }, [isVisible, sessionId]);

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  const dimOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.overlay} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: dimOpacity }]} />
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Close invite" />
      <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 12, transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite a co-host</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Close invite">
            <CloseIcon width={24} height={24} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>The admin joins your live on camera and can manage your listings.</Text>
        <FlatList
          data={admins}
          keyExtractor={(a) => a.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onPick(item)}
              accessibilityRole="button"
              accessibilityLabel={`Invite ${item.name}`}>
              <ChatAvatar uri={item.photoUrl} name={item.name} style={styles.avatar} />
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.invite}>Invite</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? 'Loading admins…' : error ? "Couldn't load admins right now." : 'No admins available'}
            </Text>
          }
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 50, elevation: 50, justifyContent: 'flex-end' },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold', color: '#000' },
  closeButton: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  sub: { fontFamily: 'Inter', fontSize: 13, color: '#6B6B6B', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { flex: 1, fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  invite: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#2E6B3E' },
  empty: { textAlign: 'center', color: '#6B6B6B', fontFamily: 'Inter', marginVertical: 24 },
});

export default InviteAdminSheet;
