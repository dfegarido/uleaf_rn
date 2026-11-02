import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {searchBuyersApi} from './Api/searchBuyersApi';
import CloseIcon from '../assets/icons/greylight/x-regular.svg';
import SearchIcon from '../assets/icons/greylight/magnifying-glass-regular.svg';
import CheckIcon from '../assets/icons/white/check-regular.svg';

export const buyerName = buyer =>
  `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim();

const AVATAR_COLORS = ['#539461', '#3F7FBF', '#C27C2C', '#8A5CB8', '#C2546B', '#2F8F8A'];

const initialsOf = buyer => {
  const first = String(buyer?.firstName || '').trim();
  const last = String(buyer?.lastName || '').trim();
  const letters = `${first.charAt(0)}${last.charAt(0)}`.trim();
  return (letters || String(buyer?.username || '?').charAt(0)).toUpperCase();
};

const avatarColor = buyer => {
  const key = String(buyer?.username || buyer?.id || '');
  let sum = 0;
  for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const SKELETON_ROWS = 8;

const BuyerSkeleton = () => {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 650, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.45, duration: 650, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.list, {opacity: pulse}]}>
      {Array.from({length: SKELETON_ROWS}).map((_, index) => (
        <View key={index} style={styles.option}>
          <View style={[styles.avatar, styles.skeletonBlock]} />
          <View style={styles.optionText}>
            <View
              style={[
                styles.skeletonBlock,
                styles.skeletonName,
                {width: `${55 + ((index * 17) % 30)}%`},
              ]}
            />
            <View style={[styles.skeletonBlock, styles.skeletonSub]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

/**
 * Bottom sheet that lists every buyer (name, @username) with search.
 * `purpose` is passed to search-user so a seller may list buyers.
 * `busyText` covers the sheet while the caller is working (e.g. adding to cart).
 */
const BuyerPickerSheet = ({
  visible,
  title,
  purpose,
  selectedUsername,
  busyText,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setSearchText('');
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await searchBuyersApi({query: '', limit: 5000, purpose});
        if (cancelled) return;
        const rows = (res?.data?.buyers || []).filter(
          buyer => !buyer.userType || buyer.userType === 'buyer',
        );
        rows.sort((a, b) =>
          (buyerName(a) || a.username || '').localeCompare(
            buyerName(b) || b.username || '',
            undefined,
            {sensitivity: 'base'},
          ),
        );
        setBuyers(rows);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load buyers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, purpose]);

  const query = searchText.trim().toLowerCase();
  const shown = query
    ? buyers.filter(buyer => {
        const name = buyerName(buyer).toLowerCase();
        const username = String(buyer.username || '').toLowerCase();
        return name.includes(query) || username.includes(query);
      })
    : buyers;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12)}]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                  {loading
                    ? 'Loading buyers…'
                    : `${shown.length} buyer${shown.length === 1 ? '' : 's'}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                accessibilityLabel="Close">
                <CloseIcon width={18} height={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <SearchIcon width={18} height={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name or username"
                placeholderTextColor="#9AA3A6"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText ? (
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <CloseIcon width={14} height={14} />
                </TouchableOpacity>
              ) : null}
            </View>

            {loading ? (
              <BuyerSkeleton />
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Couldn’t load buyers</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={shown}
                keyExtractor={item => String(item.id || item.username)}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                contentContainerStyle={styles.listContent}
                initialNumToRender={20}
                windowSize={10}
                renderItem={({item}) => {
                  const name = buyerName(item);
                  const selected = !!selectedUsername && item.username === selectedUsername;
                  return (
                    <TouchableOpacity
                      style={[styles.option, selected && styles.optionOn]}
                      disabled={!item.username || !!busyText}
                      activeOpacity={0.7}
                      onPress={() => onSelect(item)}>
                      <View style={[styles.avatar, {backgroundColor: avatarColor(item)}]}>
                        <Text style={styles.avatarText}>{initialsOf(item)}</Text>
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.name} numberOfLines={1}>
                          {name || item.username || 'Buyer'}
                        </Text>
                        {!!item.username && (
                          <Text style={styles.sub} numberOfLines={1}>
                            @{item.username}
                          </Text>
                        )}
                      </View>
                      {selected ? (
                        <View style={styles.check}>
                          <CheckIcon width={14} height={14} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyTitle}>No buyers found</Text>
                    <Text style={styles.emptyText}>Try another name or username.</Text>
                  </View>
                }
              />
            )}

            {busyText ? (
              <View style={styles.busy}>
                <View style={styles.busyCard}>
                  <ActivityIndicator color="#539461" />
                  <Text style={styles.busyText}>{busyText}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 20, 0.5)',
  },
  sheet: {
    height: '78%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9DEDF',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerText: {flex: 1},
  title: {fontSize: 20, fontWeight: '700', color: '#202325'},
  subtitle: {fontSize: 13, color: '#647276', marginTop: 2},
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F7F6',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#202325',
    paddingVertical: 0,
  },
  list: {flex: 1},
  listContent: {paddingBottom: 12},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  optionOn: {
    backgroundColor: '#EDF6EF',
    borderWidth: 1,
    borderColor: '#BFDDC6',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  optionText: {flex: 1},
  name: {fontSize: 15, color: '#202325', fontWeight: '700'},
  sub: {fontSize: 13, color: '#647276', marginTop: 2},
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  skeletonBlock: {backgroundColor: '#E6EAEA'},
  skeletonName: {height: 14, borderRadius: 7},
  skeletonSub: {height: 11, borderRadius: 6, width: '35%', marginTop: 7},
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {fontSize: 15, fontWeight: '700', color: '#202325'},
  emptyText: {fontSize: 13, color: '#647276', marginTop: 4, textAlign: 'center'},
  busy: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  busyText: {fontSize: 14, fontWeight: '600', color: '#202325'},
});

export default BuyerPickerSheet;
