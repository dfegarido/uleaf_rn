import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CloseIcon from '../../assets/live-icon/close-x.svg';
import ChatAvatar from '../../components/ChatAvatar';
import { getLiveViewersApi } from '../../components/Api/liveApi';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 7;

// Grey placeholder rows that pulse while a page loads, shaped like the real rows.
const SkeletonRows = ({ count }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View style={{ opacity: pulse }} accessibilityLabel="Loading viewers">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.avatar, styles.skeleton]} />
          <View style={styles.rowText}>
            <View style={[styles.skeleton, styles.skeletonLine]} />
            <View style={[styles.skeleton, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

/**
 * The viewers watching the seller's live right now. Search, 20 per page, and the next page
 * starts loading half a screen before the end (onEndReachedThreshold 0.5). Picking a viewer
 * hands their username back so the broadcast screen can @mention them in the comment box.
 *
 * Opens instantly: it is an overlay inside the screen (an Android <Modal> took ~0.5s to present),
 * and page 1 is fetched in the background as soon as the live has a session, so the first open
 * already has the list. The list is kept between opens; pull down to refresh it. Render it after
 * the rest of the live screen so it sits on top.
 */
const LiveViewersSheet = ({ isVisible, onClose, sessionId, onSelectViewer }) => {
  const [query, setQuery] = useState('');
  const [viewers, setViewers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Refs, not state: onEndReached can fire again before a re-render, and a second request for
  // the same page would duplicate rows.
  const loadingRef = useRef(false);
  const offsetRef = useRef(0);
  const abortRef = useRef(null);
  // `${sessionId}|${search}` of the list on screen; opening again with the same key reuses it.
  const loadedKeyRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
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

  // Android back closes the sheet instead of leaving the live.
  useEffect(() => {
    if (!isVisible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isVisible, onClose]);

  const loadPage = useCallback(async (reset, q) => {
    if (!sessionId || (loadingRef.current && !reset)) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    const offset = reset ? 0 : offsetRef.current;
    const res = await getLiveViewersApi({ sessionId, q, limit: PAGE_SIZE, offset, signal: controller.signal });
    if (res.aborted) return;
    loadingRef.current = false;
    setLoading(false);
    setRefreshing(false);
    if (!res.success) {
      // The server's wording is for developers; the sheet shows its own message with a retry.
      setError(true);
      return;
    }
    if (reset) loadedKeyRef.current = `${sessionId}|${q}`;
    setError(null);
    offsetRef.current = offset + res.data.length;
    setViewers(prev => (reset ? res.data : [...prev, ...res.data]));
    setHasMore(res.hasMore);
  }, [sessionId]);

  // Page 1 in the background once the live has a session (so the first open is instant), then
  // again only when the search changes (debounced) or the live changes. Reopening with the same
  // live and search shows the kept list without a request.
  useEffect(() => {
    const q = query.trim();
    if (!isVisible && q) return undefined;
    if (loadedKeyRef.current === `${sessionId}|${q}`) return undefined;
    const t = setTimeout(() => {
      setViewers([]); // a new search shows skeleton rows, not the previous results
      loadPage(true, q);
    }, q ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [isVisible, query, sessionId, loadPage]);

  // Closing clears the search and goes back to the full list; a search request still running is
  // dropped (the full list was kept, so nothing reloads).
  useEffect(() => {
    if (isVisible || !query) return;
    abortRef.current?.abort();
    loadingRef.current = false;
    setLoading(false);
    setRefreshing(false);
    setQuery('');
    loadedKeyRef.current = null;
  }, [isVisible, query]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPage(true, query.trim());
  };

  const onEndReached = () => {
    if (hasMore && !loadingRef.current) loadPage(false, query.trim());
  };

  const renderItem = ({ item }) => {
    const canMention = !!item.username;
    return (
      <TouchableOpacity
        style={[styles.row, !canMention && styles.rowDisabled]}
        disabled={!canMention}
        onPress={() => onSelectViewer(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={canMention ? `Mention ${item.username}` : `${item.name || 'Viewer'}, no username`}>
        <ChatAvatar uri={item.photoUrl} name={item.username || item.name} style={styles.avatar} />
        <View style={styles.rowText}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username ? `@${item.username}` : item.name || 'Viewer'}
          </Text>
          {item.username && item.name ? (
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const empty = error ? (
    <View style={styles.errorBox}>
      <Text style={styles.empty}>Couldn't load viewers right now.</Text>
      <TouchableOpacity style={styles.retry} onPress={() => loadPage(true, query.trim())} accessibilityRole="button">
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={styles.empty}>
      {query.trim() ? `No viewers match "${query.trim()}"` : 'No one else is watching right now'}
    </Text>
  );

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  const dimOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.overlay} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: dimOpacity }]} />
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Close viewers" />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Viewers</Text>
            {/* 44pt touch area around the 24pt icon: taps that grazed the bare icon missed, which
                read as the close button lagging. */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close viewers">
              <CloseIcon width={24} height={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.search}
            placeholder="Search viewers"
            placeholderTextColor="#BDBDBD"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          <FlatList
            data={viewers}
            keyExtractor={item => item.uid}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={loading ? <SkeletonRows count={SKELETON_ROWS} /> : empty}
            ListFooterComponent={loading && viewers.length > 0 && !refreshing ? <SkeletonRows count={2} /> : null}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.listContent}
          />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
    justifyContent: 'flex-end',
  },
  dim: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    height: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  search: {
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter',
    color: '#000',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowText: {
    flex: 1,
  },
  username: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
  },
  skeleton: {
    backgroundColor: '#E6E6E6',
  },
  skeletonLine: {
    height: 14,
    width: '55%',
    borderRadius: 7,
  },
  skeletonLineShort: {
    height: 12,
    width: '35%',
    borderRadius: 6,
    marginTop: 6,
  },
  errorBox: {
    alignItems: 'center',
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#539461',
  },
  retryText: {
    color: '#539461',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#6B6B6B',
    fontFamily: 'Inter',
    marginTop: 32,
  },
});

export default LiveViewersSheet;
