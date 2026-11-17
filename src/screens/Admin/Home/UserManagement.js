import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, StatusBar, Alert, RefreshControl, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAllUsersApi } from '../../../components/Api';
import Loading from '../../../components/Loading';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import UsFlag from '../../../assets/buyer-icons/usa-flag.svg';
import PhFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IdFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import UserCardSkeleton from './UserCardSkeleton';
import { GREEN, INK, MUTED, PAGE_BG, PencilGlyph, RolePill, StatusPill, UserAvatar } from './AdminUserUi';

const PAGE_SIZE = 20;
const CACHE_MS = 5 * 60 * 1000; // a cached filter is shown without reloading for 5 minutes

const US_STATES = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
  'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
  'wisconsin', 'wyoming', 'district of columbia',
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia',
  'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt',
  'va', 'wa', 'wv', 'wi', 'wy', 'dc',
]);

const countryCodeOf = country => {
  const value = String(country || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'us' || value === 'usa' || value.includes('united state')) return 'US';
  if (value === 'ph' || value.includes('philippine')) return 'PH';
  if (value === 'th' || value.includes('thai')) return 'TH';
  if (value === 'id' || value.includes('indonesia')) return 'ID';
  if (US_STATES.has(value)) return 'US';
  return '';
};

const countryCodeForUser = user =>
  countryCodeOf(user?.country || user?.countryCode) || countryCodeOf(user?.state);

const FLAGS = { US: UsFlag, PH: PhFlag, TH: ThFlag, ID: IdFlag };

// One row of chips: the role chips pick who is listed, the status chips narrow it further.
// Both go to the server, so paging and search stay correct.
const ROLE_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'supplier', label: 'Sellers' },
];
const STATUS_CHIPS = [
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'suspended', label: 'Suspended' },
];

const PlusGlyph = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d="M12 4.5v15M4.5 12h15" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Header = ({ insets, search, onSearchChange, onAdd, role, status, onRole, onStatus }) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          activeOpacity={0.8}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <SearchIcon width={18} height={18} />
          <TextInput
            style={styles.searchInput}
            value={search}
            placeholder="Search name, @user, garden"
            placeholderTextColor={MUTED}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add seller"
          style={styles.addButton}
          onPress={onAdd}
          activeOpacity={0.85}>
          <PlusGlyph />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chipRow}>
        {ROLE_CHIPS.map(c => (
          <Chip key={c.key} label={c.label} active={role === c.key} onPress={() => onRole(c.key)} />
        ))}
        <View style={styles.chipDivider} />
        {STATUS_CHIPS.map(c => (
          <Chip
            key={c.key}
            label={c.label}
            active={status === c.key}
            onPress={() => onStatus(status === c.key ? null : c.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const UserCard = React.memo(({ user, index, onEdit, animateIn }) => {
  const isSeller = user.role === 'supplier';
  const garden = String(user.gardenOrCompanyName || '').trim();
  // Sellers are known by their garden; the person's name moves to the line below.
  const title = isSeller && garden ? garden : user.name;
  const Flag = FLAGS[countryCodeForUser(user)];

  return (
    <Animated.View entering={animateIn ? FadeInUp.duration(260).delay(Math.min(index, 8) * 50) : undefined}>
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onEdit(user)}>
        <UserAvatar user={user} title={title} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            {Flag ? <Flag width={18} height={18} style={styles.flag} /> : null}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          {/* Sellers: the person behind the garden, then the handle. Buyers: just the handle. */}
          <Text style={styles.subline} numberOfLines={1}>
            {[isSeller && garden ? user.name : null, user.username ? `@${user.username}` : null]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
          <View style={styles.metaRow}>
            <StatusPill status={user.status} label={user.statusLabel} />
            <RolePill isSeller={isSeller} />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onEdit(user)}
          style={styles.editButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}>
          <PencilGlyph />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

const toCard = u => {
  const status = String(u.status || 'active').toLowerCase();
  const username = u.username || u.email?.split('@')[0] || '';
  // Collapse stray spaces in stored names; with no name at all, fall back to the email.
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.replace(/\s+/g, ' ').trim();
  return {
    ...u,
    id: u.id,
    name: fullName || u.email || username || 'Unnamed user',
    username,
    status,
    statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
    role: u.role,
  };
};

const UserManagement = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // The filter whose last load failed, so it shows the empty state instead of skeletons forever.
  const [failedKey, setFailedKey] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Drops responses from an older query (fast typing / chip taps) so they can't overwrite newer ones.
  const requestIdRef = useRef(0);
  // Results per filter (role | status | search). Switching back to a filter shows its list at
  // once instead of reloading it. ponytail: in-memory for this visit only; marked stale when
  // the screen regains focus so edits made on a user's page show up.
  const cacheRef = useRef(new Map());
  const cacheKey = `${role}|${status || ''}|${search.trim().toLowerCase()}`;

  const bottomPadding = 60 + Math.max(insets.bottom, 16) + 20; // admin tab bar + safe area

  const fetchUsers = useCallback(
    async (nextPage = 1) => {
      const requestId = ++requestIdRef.current;
      const append = nextPage > 1;
      if (append) setLoadingMore(true);
      try {
        const filters = { page: nextPage, limit: PAGE_SIZE, search: search.trim() };
        if (role !== 'all') filters.role = role;
        if (status) filters.status = status;
        const response = await getAllUsersApi(filters);
        if (requestId !== requestIdRef.current) return;
        if (!response?.success) throw new Error(response?.message || 'Failed to load users');

        const rows = (response.data?.users || []).map(toCard);
        const totalPages = response.data?.pagination?.totalPages;
        const more = totalPages ? nextPage < totalPages : rows.length === PAGE_SIZE;
        const next = append ? [...(cacheRef.current.get(cacheKey)?.users || []), ...rows] : rows;
        cacheRef.current.set(cacheKey, { users: next, page: nextPage, hasMore: more, at: Date.now() });
        setHasMore(more);
        setPage(nextPage);
        setUsers(next);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users. Please try again.');
        if (!append) {
          setUsers([]);
          setFailedKey(cacheKey);
        }
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [search, role, status, cacheKey],
  );

  // On a filter change: a fresh cached list is used as is (no request); otherwise load it.
  useEffect(() => {
    const hit = cacheRef.current.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      requestIdRef.current += 1; // a slower request for the previous filter must not land
      setLoadingMore(false);
      return;
    }
    const t = setTimeout(() => fetchUsers(1), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coming back from a user's page (or Enrol seller): mark every cached list stale and quietly
  // refresh the current one, so changes made there show without skeletons. Other filters
  // refresh the same way the next time they are opened.
  // Read through a ref so a filter change (new fetchUsers) doesn't re-run this as a "focus".
  const focusedOnceRef = useRef(false);
  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnceRef.current) {
        focusedOnceRef.current = true;
        return;
      }
      cacheRef.current.forEach(entry => { entry.at = 0; });
      fetchUsersRef.current(1);
    }, []),
  );

  // Read the cache during render, not in an effect, so the chip and its list change in the same
  // frame (an effect would paint one frame of the previous filter's list).
  const hit = cacheRef.current.get(cacheKey);
  // A stale entry is still shown while it refreshes. With nothing cached, a chip change shows
  // skeletons; typing keeps the current list until results arrive.
  const shown = hit || { users, page, hasMore };
  const showSkeleton = !hit && !search.trim() && failedKey !== cacheKey;
  // Cards fade in the first time a list appears; switching back to it is instant, not a replay.
  const seenKeysRef = useRef(new Set());
  const animateIn = !seenKeysRef.current.has(cacheKey);
  useEffect(() => {
    if (!showSkeleton) seenKeysRef.current.add(cacheKey);
  }, [cacheKey, showSkeleton]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(1);
  };

  const onEndReached = () => {
    if (!showSkeleton && !loadingMore && !refreshing && shown.hasMore) fetchUsers(shown.page + 1);
  };

  const handleEdit = useCallback(
    user => navigation.navigate('UserInformation', { user: { ...user, status: user.statusLabel, role: user.role === 'supplier' ? 'Supplier' : 'Buyer', rawStatus: user.status, rawRole: user.role } }),
    [navigation],
  );

  const header = (
    <Header
      insets={insets}
      search={search}
      onSearchChange={setSearch}
      onAdd={() => navigation.navigate('EnrollSeller')}
      role={role}
      status={status}
      onRole={setRole}
      onStatus={setStatus}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor="#F5F6F4" barStyle="dark-content" />
      {header}
      {showSkeleton ? (
        <View style={[styles.listContent, { paddingBottom: bottomPadding }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={shown.users}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => (
            <UserCard user={item} index={index} onEdit={handleEdit} animateIn={animateIn} />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{search ? 'No matches' : 'No users here yet'}</Text>
              <Text style={styles.emptyText}>
                {search
                  ? 'Try a first or last name, @username, email, phone or garden name.'
                  : 'Try another filter.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <Loading visible size={24} color={GREEN} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default UserManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    backgroundColor: PAGE_BG,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E9ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: INK,
    paddingVertical: 0,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipRow: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D5D9D4',
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2E6B3E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    marginRight: 6,
  },
  title: {
    flexShrink: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  subline: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: MUTED,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F1E5',
    borderWidth: 1,
    borderColor: '#C7E2CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
