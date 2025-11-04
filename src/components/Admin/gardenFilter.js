import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GardenIcon from '../../assets/admin-icons/garden-avatar.svg';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';
import { getAdminLeafTrailFilters } from '../Api/getAdminLeafTrail';
import { ActivityIndicator } from 'react-native';

// Represents a single selectable garden in the list
const GardenItem = ({ name, onSelect, count, isActive }) => (
  <TouchableOpacity
    style={[styles.gardenItemContainer, isActive ? styles.gardenItemActive : null]}
    onPress={onSelect}
  >
    <View style={[styles.avatar, isActive ? styles.avatarActive : null]}>
      <GardenIcon />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
      <Text style={[styles.gardenName, isActive ? styles.gardenNameActive : null]}>{name}</Text>
      {typeof count === 'number' ? <Text style={[styles.gardenCount, isActive ? styles.gardenCountActive : null]}>({count})</Text> : null}
    </View>
  </TouchableOpacity>
);

const GardenFilter = ({ isVisible, onClose, onSelectGarden, gardens, gardenCounts = {}, fetchFullGardenList, currentGarden = null }) => {
  const insets = useSafeAreaInsets();
  // Mock data for the list of gardens
  const allGardens = gardens;

  // Local normalizer to match ListingsViewer.normalizeGardenName
  const normalizeGardenName = (s) => {
    if (!s && s !== 0) return null;
    try {
      const str = String(s).trim();
      return str.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'").replace(/\s+/g, ' ').normalize('NFC');
    } catch (e) {
      return String(s);
    }
  };

  const [loadingAll, setLoadingAll] = React.useState(false);

  // Refs to snapshot the pre-ViewMore state so Reset can restore it
  const prevOverrideGardensRef = React.useRef(undefined);
  const prevSearchQueryRef = React.useRef(undefined);

  const fetchAllGardens = async () => {
    setLoadingAll(true);
    // Snapshot the currently-displayed gardens & search so Reset can return here.
    // Only snapshot if we haven't already (we want the very last pre-ViewMore state).
    try {
      if (prevOverrideGardensRef.current === undefined && prevSearchQueryRef.current === undefined) {
        prevOverrideGardensRef.current = overrideGardens;
        prevSearchQueryRef.current = searchQuery;
      }
    } catch (e) {
      // ignore snapshot errors
    }
    try {
      // Use provided fetchFullGardenList (derived from current selectedFilters)
      // if available to ensure the fetched gardens match the Listings
      // Viewer table. Otherwise fall back to the legacy admin leaf-trail API.
      let payload = [];
      if (typeof fetchFullGardenList === 'function') {
        payload = await fetchFullGardenList();
      } else {
        try {
          const res = await getAdminLeafTrailFilters();
          payload = res?.garden || res?.data?.garden || res?.gardenList || [];
        } catch (apiError) {
          // If API fails (e.g. for Order Summary which uses different order types),
          // just use the current gardens list - no additional gardens to fetch
          console.warn('API call failed, using current gardens only:', apiError?.message || apiError);
          payload = [];
        }
      }
    const mapped = Array.isArray(payload) ? payload.map(g => (typeof g === 'string' ? g : (g.name || g.garden || String(g)))) : [];
    // Normalize, clean results: remove falsy values and placeholder 'N/A'
    const cleaned = mapped.map(m => normalizeGardenName(m)).filter(Boolean).filter(m => m !== 'N/A');
    // Deduplicate and sort for stable UI
  const uniqueSorted = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
  // store fetched list for debug panel
  try { lastFetchedRef.current = uniqueSorted; } catch (e) {}

  const current = Array.isArray(allGardens) ? allGardens.slice() : [];
  // normalize current listing-derived garden names for reliable comparison
  const normalizedCurrent = current.map(c => normalizeGardenName(c)).filter(Boolean);
      // Debug: log current listing-derived gardens and fetched payload for analysis
      try {
        console.debug('DEBUG fetchAllGardens: listingDerivedCount=', current.length, 'listingDerivedSample=', current.slice(0, 12));
        console.debug('DEBUG fetchAllGardens: fetchedCount=', uniqueSorted.length, 'fetchedSample=', uniqueSorted.slice(0, 12));
      } catch (e) { /* ignore */ }

      // Build merged: keep current order, then append fetched names that aren't present
    const extras = uniqueSorted.filter(g => !normalizedCurrent.includes(g));
  const merged = [...normalizedCurrent, ...extras];
  // store merged for debug panel and log
  try { lastMergedRef.current = merged; } catch (e) {}
  try { console.debug('DEBUG fetchAllGardens: mergedCount=', merged.length, 'mergedSample=', merged.slice(0, 20)); } catch (e) {}

      // Clear any active search so the newly-loaded list is visible
      setSearchQuery('');
      // If we have a merged list with items, use it; otherwise just use current gardens
      setOverrideGardens(merged.length > 0 ? merged : normalizedCurrent);
      // After the override list is set, wait a short moment for the list to render
      // then scroll to the end so the newly-loaded gardens are visible to the user.
      setTimeout(() => {
        try {
          if (scrollRef && scrollRef.current) {
            if (typeof scrollRef.current.scrollToEnd === 'function') {
              scrollRef.current.scrollToEnd({ animated: true });
            } else if (typeof scrollRef.current.scrollTo === 'function') {
              // fall back to a large y offset if scrollToEnd not available
              scrollRef.current.scrollTo({ y: 9999, animated: true });
            }
          }
        } catch (e) {
          // ignore scroll failures
        }
      }, 160);
    } catch (err) {
      console.warn('Failed to load all gardens', err?.message || err);
    } finally {
      setLoadingAll(false);
    }
  };

  // When modal opens and the listing-derived gardens are fewer than PAGE_SIZE,
  // fetch additional gardens and merge enough unique items so the modal shows
  // at least PAGE_SIZE items. This automatic fill should not snapshot the
  // previous override state (user didn't explicitly ask for 'View More').
  const fetchAndMergeToFill = async () => {
    try {
      let payload = [];
      if (typeof fetchFullGardenList === 'function') {
        payload = await fetchFullGardenList();
      } else {
        try {
          const res = await getAdminLeafTrailFilters();
          payload = res?.garden || res?.data?.garden || res?.gardenList || [];
        } catch (apiError) {
          // If API fails (e.g. for Order Summary which uses different order types),
          // just use the current gardens list - no additional gardens to fetch
          console.warn('fetchAndMergeToFill API call failed, using current gardens only:', apiError?.message || apiError);
          payload = [];
        }
      }
  const mapped = Array.isArray(payload) ? payload.map(g => (typeof g === 'string' ? g : (g.name || g.garden || String(g)))) : [];
  const cleaned = mapped.map(m => normalizeGardenName(m)).filter(Boolean).filter(m => m !== 'N/A');
  const uniqueSorted = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
  // store fetched list for debug panel
  try { lastFetchedRef.current = uniqueSorted; } catch (e) {}

  // Debug payload
  try { console.debug('DEBUG fetchAndMergeToFill: fetchedCount=', uniqueSorted.length, 'fetchedSample=', uniqueSorted.slice(0, 12)); } catch (e) {}
  const current = Array.isArray(allGardens) ? allGardens.slice() : [];
  // normalize current listing-derived garden names for reliable comparison
  const normalizedCurrent = current.map(c => normalizeGardenName(c)).filter(Boolean);
  const need = Math.max(0, PAGE_SIZE - normalizedCurrent.length);
      if (need <= 0) return;
      // Prefer gardens with actual listings (non-zero counts) when selecting which
      // fetched gardens to add. Use gardenCounts prop to prioritize.
      const scored = uniqueSorted.map(g => ({
        name: g,
        count: (gardenCounts && gardenCounts[g]) ? gardenCounts[g] : 0
      }));
      // sort by count desc then name
      scored.sort((x, y) => {
        if ((y.count || 0) - (x.count || 0) !== 0) return (y.count || 0) - (x.count || 0);
        return x.name.localeCompare(y.name);
      });
      const toAdd = scored.map(s => s.name).filter(g => !normalizedCurrent.includes(g)).slice(0, need);
      if (toAdd.length > 0) {
        setOverrideGardens([...normalizedCurrent, ...toAdd]);
      }
    } catch (e) {
      // ignore merge failures silently
      console.warn('fetchAndMergeToFill failed', e?.message || e);
    }
  };

  const [overrideGardens, setOverrideGardens] = React.useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  // pagination for modal list
  const PAGE_SIZE = 6;
  const [visiblePage, setVisiblePage] = React.useState(1);
  const scrollRef = React.useRef(null);
  // Debug refs to inspect fetched/merged arrays in-modal (kept for logging)
  const lastFetchedRef = React.useRef([]);
  const lastMergedRef = React.useRef([]);

  // Debounce search query to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150); // 150ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoize filtered gardens to prevent recalculating on every render
  const filteredGardens = useMemo(() => {
    const source = overrideGardens || allGardens || [];
    if (!debouncedSearchQuery.trim()) {
      return source;
    }
    const queryLower = debouncedSearchQuery.toLowerCase();
    return source.filter(garden => {
      if (typeof garden !== 'string') return false;
      return garden.toLowerCase().includes(queryLower);
    });
  }, [overrideGardens, allGardens, debouncedSearchQuery]);

  // visible subset based on pagination
  const visibleGardens = useMemo(() => {
    return filteredGardens.slice(0, visiblePage * PAGE_SIZE);
  }, [filteredGardens, visiblePage]);

  const handleSelect = (garden) => {
    // Prevent re-selecting the already-applied garden from clearing the filter
    // (some callers may toggle on same-value selection). If the tapped garden
    // is already active, just close the modal and do not re-apply the filter.
    try {
      if (currentGarden && String(currentGarden) === String(garden)) {
        onClose();
        return;
      }
    } catch (e) {
      // fallthrough to apply
    }

    onSelectGarden(garden);
    onClose();
  };

  // Reset visible page whenever the source set changes or modal is opened
  React.useEffect(() => {
    setVisiblePage(1);
  }, [isVisible, overrideGardens, allGardens]);

  // Reset visible page when search query changes (after debounce)
  useEffect(() => {
    setVisiblePage(1);
  }, [debouncedSearchQuery]);

  // On modal open, if listing-derived gardens are fewer than a page, try to
  // fetch-and-merge enough gardens to show PAGE_SIZE items (automatic fill).
  React.useEffect(() => {
    if (!isVisible) return;
    const source = overrideGardens || allGardens || [];
    try { console.debug('GardenFilter.onOpen: sourceLength=', (source || []).length, 'overrideGardens=', !!overrideGardens); } catch (e) {}
    if ((source || []).length === 0 && !overrideGardens) {
      // No listing-derived gardens available: fetch the full garden list so the
      // modal shows values immediately (mimics user pressing View More).
      fetchAllGardens();
      return;
    }
    if ((source || []).length < PAGE_SIZE && !overrideGardens) {
      // fire-and-forget: try to auto-fill a small number of items
      fetchAndMergeToFill();
    }
  }, [isVisible]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={{flex: 1}}>
                <SafeAreaView style={{flex: 1}}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Garden</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={onClose}>
                      <CloseIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content Area */}
                <View style={[styles.contentContainer, {flex: 1}]}>
                  {/* debug panel removed */}
                  {/* Search Bar */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Search"
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onFocus={() => {
                        // Brief delay to allow keyboard animation; then scroll
                        setTimeout(() => {
                          try {
                            if (scrollRef && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                              scrollRef.current.scrollTo({ y: 0, animated: true });
                            }
                          } catch (e) {
                            // ignore
                          }
                        }, 120);
                      }}
                      caretColor="#539461"
                      selectionColor="#539461"
                      autoCorrect={false}
                      autoCapitalize="none"
                      allowFontScaling={false}
                      editable={true}
                    />
                    
                  </View>

                  {/* Scrollable List of Gardens */}
                  <ScrollView
                    ref={scrollRef}
                    style={styles.listContainer}
                    contentContainerStyle={styles.listContentContainer}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    scrollEventThrottle={16}
                    bounces={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredGardens.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No gardens found</Text>
                      </View>
                    ) : (
                        filteredGardens.map((garden, index) => {
                          // determine active state using normalized comparison to avoid
                          // mismatches caused by quotes/spacing variants
                          const normCurrent = normalizeGardenName(currentGarden || '');
                          const normThis = normalizeGardenName(garden || '');
                          const isActive = normCurrent && normThis && normCurrent === normThis;
                          return (
                            <View key={garden}>
                              <GardenItem
                                name={garden}
                                count={gardenCounts ? gardenCounts[garden] : undefined}
                                onSelect={() => handleSelect(garden)}
                                isActive={isActive}
                              />
                              {index < filteredGardens.length - 1 && <View style={styles.divider} />}
                            </View>
                          );
                        })
                    )}
                  </ScrollView>
                </View>
                
                    {/* Action Buttons */}
                    <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                      <TouchableOpacity
                        style={styles.showAllButton}
                        onPress={() => {
                          // Always fetch all gardens when "View All" is clicked
                          fetchAllGardens();
                        }}
                        disabled={loadingAll}
                      >
                        {loadingAll ? <ActivityIndicator color="#FFF" /> : <Text style={styles.showAllButtonText}>View All</Text>}
                      </TouchableOpacity>
                    </View>

                </SafeAreaView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 620, // increased to better accommodate keyboard
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  closeIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
    flex: 1,
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIconText: {
    fontSize: 18,
    color: '#7F8D91',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
  },
  listContentContainer: {
    paddingBottom: 8,
  },
  gardenItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    marginVertical: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  gardenName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  gardenNameActive: {
    color: '#14632A',
  },
  gardenCount: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    marginLeft: 8,
  },
  gardenCountActive: {
    color: '#0F5A22',
  },
  gardenItemActive: {
    backgroundColor: '#EFF9F0',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  avatarActive: {
    backgroundColor: '#2F7A3A',
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  showAllButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showAllButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default GardenFilter;