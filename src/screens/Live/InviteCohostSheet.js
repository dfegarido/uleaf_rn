import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import ChatAvatar from '../../components/ChatAvatar';
import Loading from '../../components/Loading';
import { getCohostInviteesApi } from '../../components/Api/liveApi';

const TABS = [
  { key: 'admin', label: 'Admin' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'seller', label: 'Seller' },
];
const SEARCH_DELAY_MS = 300;

/**
 * Co-hosted live: the seller picks who to invite — coshplantopia (Admin tab), or any buyer or
 * seller (suggestions + search). An in-screen overlay (not a Modal), like the viewers and cart
 * sheets, so it opens instantly and never fights another Modal on iOS. Render it after the rest
 * of the broadcast screen. Spec: docs/superpowers/specs/2026-11-10-cohost-invite-any-user-design.md
 */
const InviteCohostSheet = ({ isVisible, onClose, sessionId, onPick }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('buyer');
  const [query, setQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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

  const q = tab === 'admin' ? '' : query.trim();
  const searching = q.length >= 2;

  useEffect(() => {
    if (!isVisible || !sessionId) return undefined;
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await getCohostInviteesApi(sessionId, tab, searching ? q : '');
      if (!alive) return;
      setLoading(false);
      setError(!res.success);
      if (!res.success) setSections([]);
      else if (searching) setSections(res.people?.length ? [{ title: '', data: res.people }] : []);
      else setSections((res.groups || []).map((g) => ({ title: g.title, data: g.people })));
    }, searching ? SEARCH_DELAY_MS : 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [isVisible, sessionId, tab, q, searching, reloadKey]);

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  const dimOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const noun = tab === 'seller' ? 'seller' : 'buyer';
  const emptyText = error
    ? "Couldn't load people. Pull down to try again."
    : searching
      ? `No ${noun}s match "${q}". Try another name or username.`
      : tab === 'admin'
        ? 'The iLeafU admin is not available right now.'
        : `Search for a ${noun} by name or username`;

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
        <Text style={styles.sub}>They join your live on camera.</Text>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabOn]}
              onPress={() => {
                setTab(t.key);
                setQuery('');
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.key }}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab !== 'admin' && (
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${noun}s by name or username`}
            placeholderTextColor="#8A8A8A"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={`Search ${noun}s`}
          />
        )}

        <SectionList
          sections={sections}
          keyExtractor={(p) => p.uid}
          keyboardShouldPersistTaps="handled"
          refreshing={false}
          onRefresh={() => setReloadKey((k) => k + 1)}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            section.title ? <Text style={styles.group}>{section.title}</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onPick(item)}
              accessibilityRole="button"
              accessibilityLabel={`Invite ${item.name}`}>
              <ChatAvatar uri={item.photoUrl} name={item.name} style={styles.avatar} />
              <View style={styles.nameWrap}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                {!!item.subtitle && <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>}
              </View>
              <Text style={styles.invite}>Invite</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loading}><Loading visible /></View>
            ) : (
              <Text style={styles.empty}>{emptyText}</Text>
            )
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
    height: '72%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold', color: '#000' },
  closeButton: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  sub: { fontFamily: 'Inter', fontSize: 13, color: '#6B6B6B' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E6E6E6', marginTop: 8, marginBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn: { borderBottomColor: '#2E6B3E' },
  tabText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#6B6B6B' },
  tabTextOn: { color: '#2E6B3E' },
  search: {
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  group: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: '#8A8A8A', marginTop: 12, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  nameWrap: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  subtitle: { fontFamily: 'Inter', fontSize: 12, color: '#8A8A8A', marginTop: 1 },
  invite: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#2E6B3E' },
  loading: { alignItems: 'center', marginVertical: 24 },
  empty: { textAlign: 'center', color: '#6B6B6B', fontFamily: 'Inter', marginVertical: 24 },
});

export default InviteCohostSheet;
