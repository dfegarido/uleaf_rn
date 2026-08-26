import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthContext} from '../../auth/AuthProvider';
import {getAdminListingsApi} from '../../components/Api/getAdminListingsApi';
import {updateB2BListingApi} from '../../components/Api/b2bListingApi';
import {fetchSellerListingsFromFirestore} from '../../utils/fetchSellerListingsFromFirestore';
import MockupHeader from './MockupHeader';

const POTS = ['2"', '4"', '6"'];
const HEIGHTS = ['Below', 'Above'];
const STATUSES = ['Live', 'Inactive'];
const TYPES = ['Live', 'Group Chat'];
const PAGE_SIZE = 20;

const CHANNELS = [
  {key: 'live', label: 'Live', status: 'Live'},
  {key: 'group', label: 'Group Chat', status: 'GroupChatListing'},
  {key: 'all', label: 'All', status: 'Live,GroupChatListing'},
];

const cycle = (options, value) => {
  const idx = options.indexOf(value);
  return options[(idx + 1) % options.length];
};

const mapHeight = value =>
  String(value || '')
    .toLowerCase()
    .includes('above')
    ? 'Above'
    : 'Below';

const mapChannelType = listing =>
  String(listing?.status || '')
    .trim()
    .toLowerCase() === 'groupchatlisting'
    ? 'Group Chat'
    : 'Live';

const mapStatus = listing =>
  String(listing?.status || '')
    .trim()
    .toLowerCase() === 'inactive'
    ? 'Inactive'
    : 'Live';

const listingToRow = listing => ({
  id: listing.id,
  plantCode: listing.plantCode,
  genus: listing.genus || '',
  species: listing.species || '',
  variegation: listing.variegation || '',
  status: mapStatus(listing),
  pin: Boolean(listing.pinTag),
  listingType: mapChannelType(listing),
  price: Number(listing.usdPrice || listing.localPrice || 0).toFixed(2),
  potSize: listing.potSize || '4"',
  height: mapHeight(listing.approximateHeight),
});

const rowsEqual = (a, b) =>
  a.genus === b.genus &&
  a.species === b.species &&
  a.variegation === b.variegation &&
  a.status === b.status &&
  a.pin === b.pin &&
  a.listingType === b.listingType &&
  a.price === b.price &&
  a.potSize === b.potSize &&
  a.height === b.height;

const ScreenB2BListingEdit = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const isAdmin =
    userInfo?.userType === 'admin' || userInfo?.userType === 'sub_admin';
  const sellerUid = userInfo?.uid || userInfo?.id;
  const [rows, setRows] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [manageMode, setManageMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkField, setBulkField] = useState('price');
  const [bulkValue, setBulkValue] = useState('50.00');
  const [channel, setChannel] = useState('live');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const selectedCount = selected.length;
  const dirtyRows = useMemo(
    () =>
      rows.filter(row => {
        const original = baseline.find(item => item.id === row.id);
        return !original || !rowsEqual(row, original);
      }),
    [rows, baseline],
  );

  const channelConfig = CHANNELS.find(item => item.key === channel) || CHANNELS[0];

  const loadListings = useCallback(
    async ({isRefresh = false} = {}) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        let mapped = [];
        let totalItems = 0;
        let totalPages = 1;

        if (isAdmin) {
          const result = await getAdminListingsApi({
            status: channelConfig.status,
            sort: 'latest',
            limit: PAGE_SIZE,
            page,
          });
          if (!result.success) {
            setRows([]);
            setBaseline([]);
            setLoadError(result.error || 'Could not load listings.');
            return;
          }
          mapped = (result.data?.listings || []).map(listingToRow);
          const serverPagination = result.data?.pagination || {};
          totalItems = Number(serverPagination.totalItems) || mapped.length;
          totalPages = Math.max(
            1,
            Number(serverPagination.totalPages) || Math.ceil(totalItems / PAGE_SIZE) || 1,
          );
        } else {
          if (!sellerUid) {
            setRows([]);
            setBaseline([]);
            setLoadError('Sign in as a seller to load your listings.');
            return;
          }
          const {listings} = await fetchSellerListingsFromFirestore(sellerUid);
          const wanted = new Set(
            String(channelConfig.status)
              .split(',')
              .map(item => item.trim().toLowerCase()),
          );
          const filtered = listings.filter(item =>
            wanted.has(String(item.status || '').trim().toLowerCase()),
          );
          totalItems = filtered.length;
          totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
          const start = (page - 1) * PAGE_SIZE;
          mapped = filtered.slice(start, start + PAGE_SIZE).map(listingToRow);
        }

        setRows(mapped);
        setBaseline(mapped.map(row => ({...row})));
        setPagination({currentPage: page, totalPages, totalItems});
        setLoadError(null);
        setSelected([]);
      } catch (error) {
        setRows([]);
        setBaseline([]);
        setLoadError(error.message || 'Could not load listings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [channelConfig.status, page, isAdmin, sellerUid],
  );

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const confirmLeaveDirty = action => {
    if (!dirtyRows.length) {
      action();
      return;
    }
    Alert.alert('Unsaved changes', 'Discard edits on this page?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Discard', style: 'destructive', onPress: action},
    ]);
  };

  const goToPage = nextPage => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) {
      return;
    }
    confirmLeaveDirty(() => setPage(nextPage));
  };

  const changeChannel = nextChannel => {
    if (nextChannel === channel) {
      return;
    }
    confirmLeaveDirty(() => {
      setChannel(nextChannel);
      setPage(1);
    });
  };

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => (row.id === id ? {...row, ...patch} : row)));
  };

  const toggleSelect = id => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const onUpdate = async () => {
    if (!dirtyRows.length) {
      Alert.alert('No changes', 'Edit a listing first, then tap Save.');
      return;
    }
    setSaving(true);
    const result = await updateB2BListingApi(
      dirtyRows.map(row => ({
        id: row.id,
        plantCode: row.plantCode,
        genus: row.genus,
        species: row.species,
        variegation: row.variegation,
        status: row.status,
        listingType: row.listingType,
        price: row.price,
        potSize: row.potSize,
        height: row.height,
        pin: row.pin,
      })),
    );
    setSaving(false);
    if (!result.success) {
      Alert.alert('Update failed', result.error || 'Could not save listings.');
      return;
    }
    const errorCount = result.data?.errors?.length || 0;
    Alert.alert(
      'Saved',
      errorCount
        ? `Updated ${result.data.updatedCount}. ${errorCount} failed.`
        : `Updated ${result.data.updatedCount} listing(s).`,
    );
    await loadListings({isRefresh: true});
  };

  const applyBulk = () => {
    if (!selectedCount) {
      Alert.alert('Select listings', 'Choose one or more cards first.');
      return;
    }
    setRows(prev =>
      prev.map(row => {
        if (!selected.includes(row.id)) {
          return row;
        }
        if (bulkField === 'price') {
          return {...row, price: Number(bulkValue).toFixed(2)};
        }
        if (bulkField === 'potSize') {
          return {...row, potSize: bulkValue};
        }
        if (bulkField === 'height') {
          return {...row, height: bulkValue};
        }
        if (bulkField === 'status') {
          return {...row, status: bulkValue};
        }
        if (bulkField === 'listingType') {
          return {...row, listingType: bulkValue};
        }
        if (bulkField === 'pin') {
          return {...row, pin: bulkValue === 'Pin'};
        }
        return row;
      }),
    );
    setSelected([]);
    setManageMode(false);
  };

  const bulkOptions = useMemo(() => {
    if (bulkField === 'potSize') {
      return POTS;
    }
    if (bulkField === 'height') {
      return HEIGHTS;
    }
    if (bulkField === 'status') {
      return STATUSES;
    }
    if (bulkField === 'listingType') {
      return TYPES;
    }
    if (bulkField === 'pin') {
      return ['Pin', 'Unpin'];
    }
    return null;
  }, [bulkField]);

  const renderItem = ({item: row}) => {
    const original = baseline.find(item => item.id === row.id);
    const dirty = original && !rowsEqual(row, original);
    const checked = selected.includes(row.id);

    return (
      <View style={[styles.card, dirty && styles.cardDirty, checked && styles.cardSelected]}>
        <View style={styles.cardTop}>
          {manageMode ? (
            <TouchableOpacity
              style={[styles.check, checked && styles.checkOn]}
              onPress={() => toggleSelect(row.id)}
            />
          ) : null}
          <View style={styles.cardTitleWrap}>
            <Text style={styles.plantName} numberOfLines={2}>
              {`${row.genus} ${row.species}`.trim() || 'Untitled'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {row.variegation || 'No variegation'} · {row.plantCode}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.pinBtn, row.pin && styles.pinBtnOn]}
            onPress={() => updateRow(row.id, {pin: !row.pin})}>
            <Text style={[styles.pinBtnText, row.pin && styles.pinBtnTextOn]}>
              {row.pin ? 'Pinned' : 'Pin'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.pricePrefix}>USD</Text>
          <TextInput
            style={styles.priceInput}
            keyboardType="decimal-pad"
            value={row.price}
            onChangeText={price => updateRow(row.id, {price})}
          />
        </View>

        <View style={styles.chipGrid}>
          <Chip
            label="Status"
            value={row.status}
            tone={row.status === 'Live' ? 'live' : 'off'}
            onPress={() => updateRow(row.id, {status: cycle(STATUSES, row.status)})}
          />
          <Chip
            label="Type"
            value={row.listingType}
            onPress={() => updateRow(row.id, {listingType: cycle(TYPES, row.listingType)})}
          />
          <Chip
            label="Pot"
            value={row.potSize}
            onPress={() => updateRow(row.id, {potSize: cycle(POTS, row.potSize)})}
          />
          <Chip
            label="Height"
            value={row.height}
            onPress={() => updateRow(row.id, {height: cycle(HEIGHTS, row.height)})}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Live listings" />

      <View style={styles.channelRow}>
        {CHANNELS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.channelChip, channel === item.key && styles.channelChipOn]}
            onPress={() => changeChannel(item.key)}>
            <Text style={[styles.channelText, channel === item.key && styles.channelTextOn]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.countText}>
          {pagination.totalItems} listing{pagination.totalItems === 1 ? '' : 's'}
          {dirtyRows.length ? ` · ${dirtyRows.length} unsaved` : ''}
        </Text>
        <View style={styles.toolbarBtns}>
          <TouchableOpacity
            style={[styles.toolBtn, manageMode && styles.toolBtnOn]}
            onPress={() => {
              setManageMode(!manageMode);
              setSelected([]);
            }}>
            <Text style={[styles.toolText, manageMode && styles.toolTextOn]}>
              {manageMode ? 'Done' : 'Select'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolBtn, styles.saveBtn, (!dirtyRows.length || saving) && styles.saveBtnOff]}
            onPress={onUpdate}
            disabled={saving || loading || !dirtyRows.length}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {manageMode ? (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedCount} selected</Text>
          <TouchableOpacity
            onPress={() =>
              setSelected(selected.length === rows.length ? [] : rows.map(r => r.id))
            }>
            <Text style={styles.link}>
              {selected.length === rows.length && rows.length ? 'Clear' : 'Select all'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#539461" />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn’t load listings</Text>
          <Text style={styles.centerText}>{loadError}</Text>
          <TouchableOpacity style={styles.toolBtn} onPress={() => loadListings()}>
            <Text style={styles.toolText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.errorTitle}>No listings on this page</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadListings({isRefresh: true})}
              tintColor="#539461"
            />
          }
        />
      )}

      <View style={styles.pager}>
        <TouchableOpacity
          style={[styles.pagerBtn, page <= 1 && styles.pagerBtnDisabled]}
          disabled={page <= 1 || loading}
          onPress={() => goToPage(page - 1)}>
          <Text style={styles.pagerBtnText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pagerLabel}>
          {pagination.currentPage} / {pagination.totalPages}
        </Text>
        <TouchableOpacity
          style={[styles.pagerBtn, page >= pagination.totalPages && styles.pagerBtnDisabled]}
          disabled={page >= pagination.totalPages || loading}
          onPress={() => goToPage(page + 1)}>
          <Text style={styles.pagerBtnText}>Next</Text>
        </TouchableOpacity>
      </View>

      {manageMode ? (
        <View style={styles.bulkPanel}>
          <Text style={styles.bulkTitle}>Apply to selected</Text>
          <View style={styles.fieldRow}>
            {['price', 'potSize', 'height', 'status', 'pin', 'listingType'].map(field => (
              <TouchableOpacity
                key={field}
                style={[styles.fieldChip, bulkField === field && styles.fieldChipOn]}
                onPress={() => {
                  setBulkField(field);
                  if (field === 'price') {
                    setBulkValue('50.00');
                  } else if (field === 'potSize') {
                    setBulkValue('6"');
                  } else if (field === 'height') {
                    setBulkValue('Above');
                  } else if (field === 'status') {
                    setBulkValue('Live');
                  } else if (field === 'pin') {
                    setBulkValue('Pin');
                  } else {
                    setBulkValue('Live');
                  }
                }}>
                <Text style={[styles.fieldChipText, bulkField === field && styles.fieldChipTextOn]}>
                  {field === 'potSize'
                    ? 'Pot'
                    : field === 'listingType'
                      ? 'Type'
                      : field}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {bulkField === 'price' ? (
            <TextInput
              style={styles.bulkInput}
              keyboardType="decimal-pad"
              value={bulkValue}
              onChangeText={setBulkValue}
              placeholder="50.00"
            />
          ) : (
            <View style={styles.optionRow}>
              {bulkOptions.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.opt, bulkValue === opt && styles.optOn]}
                  onPress={() => setBulkValue(opt)}>
                  <Text style={[styles.optText, bulkValue === opt && styles.optTextOn]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.applyBtn} onPress={applyBulk}>
            <Text style={styles.applyText}>Apply, then tap Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const Chip = ({label, value, onPress, tone}) => (
  <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.chipLabel}>{label}</Text>
    <Text style={[styles.chipValue, tone === 'live' && styles.chipLive, tone === 'off' && styles.chipOff]}>
      {value}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F8F6'},
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D7E3D8',
  },
  channelChipOn: {backgroundColor: '#356641', borderColor: '#356641'},
  channelText: {color: '#356641', fontWeight: '700', fontSize: 13},
  channelTextOn: {color: '#fff'},
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {color: '#556065', fontSize: 13, fontWeight: '600', flex: 1, paddingRight: 8},
  toolbarBtns: {flexDirection: 'row', gap: 8},
  toolBtn: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  toolBtnOn: {backgroundColor: '#356641', borderColor: '#356641'},
  toolText: {color: '#356641', fontWeight: '700'},
  toolTextOn: {color: '#fff'},
  saveBtn: {backgroundColor: '#539461', borderColor: '#539461'},
  saveBtnOff: {opacity: 0.4},
  saveText: {color: '#fff', fontWeight: '700'},
  bulkBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bulkCount: {color: '#556065', fontWeight: '600'},
  link: {color: '#539461', fontWeight: '700'},
  list: {paddingHorizontal: 16, paddingBottom: 20},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  centerText: {color: '#7F8D91', marginTop: 8, textAlign: 'center'},
  errorTitle: {fontWeight: '700', color: '#202325'},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3EBE4',
  },
  cardDirty: {borderColor: '#539461', backgroundColor: '#F4FAF5'},
  cardSelected: {borderColor: '#356641'},
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  cardTitleWrap: {flex: 1},
  plantName: {color: '#202325', fontSize: 16, fontWeight: '700', lineHeight: 22},
  meta: {color: '#7F8D91', fontSize: 12, marginTop: 4},
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#539461',
    marginTop: 2,
  },
  checkOn: {backgroundColor: '#539461'},
  pinBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7E3D8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pinBtnOn: {backgroundColor: '#DFECDF', borderColor: '#C0DAC2'},
  pinBtnText: {color: '#7F8D91', fontSize: 12, fontWeight: '700'},
  pinBtnTextOn: {color: '#356641'},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  pricePrefix: {color: '#356641', fontWeight: '800', fontSize: 13, marginRight: 8},
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#202325',
    paddingVertical: 10,
  },
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  chip: {
    width: '48%',
    backgroundColor: '#F7F9F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E3EBE4',
  },
  chipLabel: {color: '#7F8D91', fontSize: 11, fontWeight: '600', marginBottom: 2},
  chipValue: {color: '#202325', fontSize: 14, fontWeight: '700'},
  chipLive: {color: '#356641'},
  chipOff: {color: '#B54708'},
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    backgroundColor: '#fff',
  },
  pagerBtn: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  pagerBtnDisabled: {opacity: 0.35},
  pagerBtnText: {color: '#356641', fontWeight: '700', fontSize: 13},
  pagerLabel: {color: '#556065', fontSize: 13, fontWeight: '700'},
  bulkPanel: {
    borderTopWidth: 1,
    borderColor: '#E4E7E9',
    padding: 16,
    backgroundColor: '#fff',
  },
  bulkTitle: {fontWeight: '700', marginBottom: 10, color: '#202325'},
  fieldRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  fieldChip: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fieldChipOn: {backgroundColor: '#539461', borderColor: '#539461'},
  fieldChipText: {color: '#356641', fontWeight: '700', fontSize: 12, textTransform: 'capitalize'},
  fieldChipTextOn: {color: '#fff'},
  bulkInput: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  optionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  opt: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F7F3',
  },
  optOn: {backgroundColor: '#539461', borderColor: '#539461'},
  optText: {color: '#356641', fontWeight: '700'},
  optTextOn: {color: '#fff'},
  applyBtn: {
    backgroundColor: '#356641',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {color: '#fff', fontWeight: '700'},
});

export default ScreenB2BListingEdit;
