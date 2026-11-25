import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const SEARCH_THRESHOLD = 6;

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6];

const LoadingSkeleton = ({fill}) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[styles.skeletonWrap, fill && styles.flex, {opacity: pulse}]}
      accessibilityLabel="Loading buyers">
      <View style={[styles.bone, styles.skeletonSearch]} />
      <View style={[styles.listCard, fill && styles.flex]}>
        <View style={[styles.row, styles.allRow]}>
          <View style={[styles.bone, styles.skeletonCheck]} />
          <View style={[styles.bone, styles.skeletonAll]} />
        </View>
        {SKELETON_ROWS.map(i => (
          <View key={i} style={styles.row}>
            <View style={[styles.bone, styles.skeletonCheck]} />
            <View style={[styles.bone, styles.skeletonAvatar]} />
            <View
              style={[
                styles.bone,
                styles.skeletonName,
                {width: `${40 + ((i * 17) % 30)}%`},
              ]}
            />
            <View style={[styles.bone, styles.skeletonPill]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const Checkbox = ({state}) => (
  <View style={[styles.checkbox, state !== 'off' && styles.checkboxOn]}>
    {state === 'on' ? <Text style={styles.checkMark}>✓</Text> : null}
    {state === 'partial' ? <View style={styles.checkDash} /> : null}
  </View>
);

/**
 * Multi-select "Reserved for" picker.
 * buyers: [{ key, name, count }] — only buyers with a reserved listing in scope.
 * selected: [{ key, name }] currently applied. onApply receives the new selection.
 * fullHeight: open at full height straight away, for callers that load buyers
 * after opening (otherwise the sheet grows once the list arrives).
 */
const ReservedForFilterSheet = ({
  visible,
  buyers,
  selected,
  scopeLabel,
  loading = false,
  fullHeight = false,
  onApply,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();
  const searchable = buyers.length > SEARCH_THRESHOLD;
  const pinned = fullHeight || searchable;
  const [draft, setDraft] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    const available = new Set(buyers.map(b => b.key));
    setDraft(selected.map(b => b.key).filter(key => available.has(key)));
    setQuery('');
  }, [visible, buyers, selected]);

  const draftSet = useMemo(() => new Set(draft), [draft]);
  const visibleBuyers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? buyers.filter(b => b.name.toLowerCase().includes(q)) : buyers;
  }, [buyers, query]);

  const matchCount = useMemo(
    () =>
      buyers.reduce((sum, b) => (draftSet.has(b.key) ? sum + b.count : sum), 0),
    [buyers, draftSet],
  );

  const visibleSelected = visibleBuyers.filter(b => draftSet.has(b.key)).length;
  const allState =
    visibleSelected === 0
      ? 'off'
      : visibleSelected === visibleBuyers.length
      ? 'on'
      : 'partial';

  const toggle = key =>
    setDraft(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );

  const toggleAllVisible = () => {
    const keys = visibleBuyers.map(b => b.key);
    if (allState === 'on') {
      setDraft(prev => prev.filter(k => !keys.includes(k)));
    } else {
      setDraft(prev => [...new Set([...prev, ...keys])]);
    }
  };

  const apply = () => {
    onApply(
      buyers
        .filter(b => draftSet.has(b.key))
        .map(({key, name}) => ({key, name})),
    );
  };

  const applyLabel = draft.length
    ? `Show ${matchCount} ${matchCount === 1 ? 'listing' : 'listings'}`
    : 'Show all listings';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Pinned from the top at a fixed height: the keyboard (which also resizes the modal
              window on Android) and shorter search results must not shrink the sheet. */}
        <Pressable
          style={[
            styles.sheet,
            {paddingBottom: Math.max(insets.bottom, 16) + 8},
            pinned && [
              styles.sheetPinned,
              {
                top: Math.round(windowHeight * 0.15),
                height: Math.round(windowHeight * 0.85),
              },
            ],
          ]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Reserved for</Text>
                {draft.length ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {draft.length} selected
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>
                Buyers with a reserved listing in {scopeLabel}
              </Text>
            </View>
            {draft.length ? (
              <TouchableOpacity
                onPress={() => setDraft([])}
                hitSlop={8}
                accessibilityRole="button">
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <LoadingSkeleton fill={pinned} />
          ) : buyers.length === 0 ? (
            <View style={[styles.empty, pinned && styles.emptyFill]}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>@</Text>
              </View>
              <Text style={styles.emptyTitle}>No reserved listings</Text>
              <Text style={styles.emptyText}>
                Listings you reserve for a buyer will show that buyer here.
              </Text>
            </View>
          ) : (
            <>
              {searchable ? (
                <TextInput
                  style={styles.search}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search buyer username"
                  placeholderTextColor="#9AA3A6"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
              ) : null}

              <View style={[styles.listCard, pinned && styles.flex]}>
                {visibleBuyers.length > 0 ? (
                  <TouchableOpacity
                    style={[styles.row, styles.allRow]}
                    onPress={toggleAllVisible}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked:
                        allState === 'on'
                          ? true
                          : allState === 'off'
                          ? false
                          : 'mixed',
                    }}>
                    <Checkbox state={allState} />
                    <Text style={styles.allText}>
                      {query.trim()
                        ? 'Select all results'
                        : 'Select all buyers'}
                    </Text>
                    <Text
                      style={[
                        styles.allCount,
                        visibleSelected > 0 && styles.allCountOn,
                      ]}>
                      {visibleSelected > 0
                        ? `${visibleSelected} of ${visibleBuyers.length}`
                        : visibleBuyers.length}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <ScrollView
                  style={pinned ? styles.flex : styles.list}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag">
                  {visibleBuyers.length === 0 ? (
                    <Text style={styles.noResults}>
                      No buyer matches "{query.trim()}"
                    </Text>
                  ) : (
                    visibleBuyers.map((buyer, index) => {
                      const checked = draftSet.has(buyer.key);
                      return (
                        <TouchableOpacity
                          key={buyer.key}
                          style={[
                            styles.row,
                            checked && styles.rowChecked,
                            index === visibleBuyers.length - 1 &&
                              styles.rowLast,
                          ]}
                          onPress={() => toggle(buyer.key)}
                          activeOpacity={0.7}
                          accessibilityRole="checkbox"
                          accessibilityState={{checked}}
                          accessibilityLabel={`${buyer.name}, ${buyer.count} reserved`}>
                          <Checkbox state={checked ? 'on' : 'off'} />
                          <View
                            style={[
                              styles.avatar,
                              checked && styles.avatarChecked,
                            ]}>
                            <Text
                              style={[
                                styles.avatarText,
                                checked && styles.avatarTextChecked,
                              ]}>
                              {buyer.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.name} numberOfLines={1}>
                            @{buyer.name}
                          </Text>
                          <View style={styles.countPill}>
                            <Text style={styles.countText}>
                              {buyer.count}{' '}
                              {buyer.count === 1 ? 'plant' : 'plants'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                (loading || (buyers.length === 0 && selected.length === 0)) &&
                  styles.applyDisabled,
              ]}
              onPress={apply}
              disabled={
                loading || (buyers.length === 0 && selected.length === 0)
              }
              accessibilityRole="button">
              <Text style={styles.applyText}>{applyLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,20,22,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F5F6F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetPinned: {position: 'absolute', left: 0, right: 0, maxHeight: undefined},
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CDD3D4',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {flex: 1},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  selectedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#539461',
  },
  selectedBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allCountOn: {color: '#23794A', fontWeight: '700'},
  title: {
    fontFamily: 'Inter',
    fontSize: 19,
    fontWeight: '700',
    color: '#202325',
  },
  subtitle: {fontFamily: 'Inter', fontSize: 13, color: '#647276', marginTop: 2},
  clearText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#C8342A',
    marginTop: 4,
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#202325',
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
    flexShrink: 1,
  },
  list: {flexGrow: 0},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
  },
  rowLast: {borderBottomWidth: 0},
  rowChecked: {backgroundColor: '#F3FAF5'},
  allRow: {backgroundColor: '#FAFBFB'},
  allText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#393D40',
  },
  allCount: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#647276',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9DA5A7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: {backgroundColor: '#539461', borderColor: '#539461'},
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  checkDash: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChecked: {backgroundColor: '#1F5C38'},
  avatarText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#393D40',
  },
  avatarTextChecked: {color: '#F3D48A'},
  name: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#202325',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5EB',
  },
  countText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#23794A',
  },
  noResults: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    paddingVertical: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  emptyFill: {flex: 1, justifyContent: 'center'},
  skeletonWrap: {overflow: 'hidden'},
  bone: {backgroundColor: '#E4E7E9'},
  skeletonSearch: {height: 46, borderRadius: 12, marginBottom: 12},
  skeletonCheck: {width: 22, height: 22, borderRadius: 6},
  skeletonAll: {height: 14, width: '45%', borderRadius: 7},
  skeletonAvatar: {width: 34, height: 34, borderRadius: 17},
  skeletonName: {height: 14, borderRadius: 7, marginRight: 'auto'},
  skeletonPill: {width: 64, height: 24, borderRadius: 12},
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyIconText: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#23794A',
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#647276',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {flexDirection: 'row', gap: 10, marginTop: 16},
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#393D40',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#539461',
    alignItems: 'center',
  },
  applyDisabled: {opacity: 0.5},
  applyText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ReservedForFilterSheet;
