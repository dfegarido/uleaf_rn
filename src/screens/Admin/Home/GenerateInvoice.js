import React, {useState, useCallback, useEffect, useRef} from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {FadeInUp} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import Loading from '../../../components/Loading';
import {GREEN, GREEN_DARK, INK, MUTED, PAGE_BG} from './AdminUserUi';
import {Pressable} from 'react-native-gesture-handler';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ArrowDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {generateInvoiceApi, getInvoicePdfApi} from '../../../components/Api/orderManagementApi';
import {getAdminInvoicesApi} from '../../../components/Api/adminOrderApi';
import BuyerFilter from '../../../components/Admin/buyerFilter';
import JoinerFilter from '../../../components/Admin/joinerFilter';
import DateRangeFilter from '../../../components/Admin/dateRangeFilter';
import PlantFlightFilter from '../../../components/Admin/plantFlightFilter';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

const timestampOf = (date) => {
  if (!date) return 0;
  if (typeof date.toDate === 'function') return date.toDate().getTime();
  if (date.seconds) return date.seconds * 1000;
  if (date._seconds) return date._seconds * 1000;
  if (typeof date === 'string') return new Date(date).getTime() || 0;
  if (typeof date === 'number') return date < 4102444800000 ? date * 1000 : date;
  return 0;
};


const formatInvoiceDate = (dateInput) => {
  const ms = timestampOf(dateInput);
  if (!ms) return '—';
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};


const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(2)}`;
};


const asIdList = (value) => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map((id) => String(id).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};


const PAGE_SIZE = 20;
const CACHE_MS = 5 * 60 * 1000; // a filter's invoices are reused for 5 minutes

// One cache key per filter combination (dates as local calendar days).
const dayKey = (date) => (date ? new Date(date).toDateString() : '');
const filterKeyOf = (filters) =>
  JSON.stringify([
    asIdList(filters.buyer).sort(),
    filters.joiner || '',
    dayKey(filters.dateRange?.from),
    dayKey(filters.dateRange?.to),
    [...(filters.plantFlight || [])].sort(),
  ]);

const GenerateInvoice = ({navigation}) => {
  const [filters, setFilters] = useState({
    buyer: null,
    joiner: null,
    dateRange: null,
    plantFlight: [],
  });
  // Invoices per filter: {invoices, page, totalPages, total, at}. Revisiting a filter
  // shows its list at once; pull to refresh fetches it again.
  const cacheRef = useRef(new Map());
  const [, setCacheVersion] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorByKey, setErrorByKey] = useState({});
  // Filter choices come back with every response and are kept across filters.
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [joinerOptions, setJoinerOptions] = useState([]);
  const [flightDates, setFlightDates] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [joinerOpen, setJoinerOpen] = useState(false);
  const [flightOpen, setFlightOpen] = useState(false);
  const [processingTransaction, setProcessingTransaction] = useState(null);
  // Which button on that invoice is working ('view' | 'email'), so only it shows a spinner.
  const [processingAction, setProcessingAction] = useState(null);
  const requestId = useRef(0);

  const filterKey = filterKeyOf(filters);
  const cached = cacheRef.current.get(filterKey);
  const invoices = cached?.invoices || [];
  const page = cached?.page || 1;
  const totalPages = cached?.totalPages || 1;
  const total = cached?.total ?? invoices.length;
  const error = errorByKey[filterKey] || null;
  const loading = !cached && !error;

  const fetchInvoices = useCallback(
    async (nextPage = 1) => {
      const id = ++requestId.current;
      const key = filterKeyOf(filters);
      if (nextPage > 1) setLoadingMore(true);
      try {
        const response = await getAdminInvoicesApi({
          page: nextPage,
          limit: PAGE_SIZE,
          buyer: asIdList(filters.buyer),
          joiner: filters.joiner || undefined,
          dateRange: filters.dateRange || undefined,
          plantFlight: filters.plantFlight || [],
        });
        if (!response?.success) throw new Error(response?.error || 'Failed to load invoices');

        const previous = cacheRef.current.get(key);
        cacheRef.current.set(key, {
          invoices: nextPage > 1 ? [...(previous?.invoices || []), ...response.invoices] : response.invoices,
          page: response.page || nextPage,
          totalPages: response.totalPages || 1,
          total: response.total ?? response.invoices.length,
          at: Date.now(),
        });
        if (Array.isArray(response.buyers) && !asIdList(filters.buyer).length) setBuyerOptions(response.buyers);
        if (Array.isArray(response.joiners) && !filters.joiner) setJoinerOptions(response.joiners);
        if (Array.isArray(response.flightDates) && !filters.plantFlight?.length) setFlightDates(response.flightDates);
        setErrorByKey((prev) => (prev[key] ? {...prev, [key]: null} : prev));
      } catch (err) {
        console.error('Failed to load invoices:', err);
        // A failed first load shows the error state; a failed refresh keeps the list.
        if (nextPage === 1 && !cacheRef.current.get(key)) {
          setErrorByKey((prev) => ({...prev, [key]: err.message || 'Failed to load invoices'}));
        } else {
          Alert.alert('Error', err.message || 'Failed to load invoices');
        }
      } finally {
        setCacheVersion((v) => v + 1);
        if (id === requestId.current) {
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [filters],
  );

  // A fresh cached filter is shown as is; otherwise (or when stale) it is fetched.
  useEffect(() => {
    const hit = cacheRef.current.get(filterKey);
    if (hit && Date.now() - hit.at < CACHE_MS) return;
    fetchInvoices(1);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = () => {
    setErrorByKey((prev) => ({...prev, [filterKey]: null}));
    fetchInvoices(1);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices(1);
  };

  const handleViewInvoice = async (invoice) => {
    const txNumber = invoice.transactionNumber;
    if (!txNumber) {
      Alert.alert('Error', 'Invoice number is missing');
      return;
    }
    if (processingTransaction) return;

    try {
      setProcessingTransaction(txNumber);
      setProcessingAction('view');
      const viewResponse = await getInvoicePdfApi({transactionNumber: txNumber});
      if (viewResponse.success && viewResponse.pdfBase64) {
        const fileName = viewResponse.filename || `Invoice_${txNumber}_${Date.now()}.pdf`;
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, viewResponse.pdfBase64, 'base64');
        try {
          await FileViewer.open(filePath);
        } catch (viewerError) {
          Alert.alert('Error', 'Failed to open PDF viewer');
        }
      } else {
        throw new Error(viewResponse.error || 'Failed to load invoice');
      }
    } catch (viewError) {
      console.error('Error viewing invoice:', viewError);
      Alert.alert('Error', viewError.message || 'Failed to view invoice');
    } finally {
      setProcessingTransaction(null);
      setProcessingAction(null);
    }
  };

  const handleSendInvoice = async (invoice) => {
    const txNumber = invoice.transactionNumber;
    if (!txNumber) {
      Alert.alert('Error', 'Invoice number is missing');
      return;
    }
    if (processingTransaction) return;

    try {
      setProcessingTransaction(txNumber);
      setProcessingAction('email');
      const emailResponse = await generateInvoiceApi({transactionNumber: txNumber});
      if (emailResponse.success) {
        const emailAddress = emailResponse.sentTo || emailResponse.details?.sentTo || invoice.buyerEmail || 'the buyer';
        Alert.alert(
          'Success',
          `Invoice has been sent successfully to:\n\n${emailAddress}\n\nPlease check the email inbox.`,
          [{text: 'OK'}],
        );
      } else {
        throw new Error(emailResponse.error || 'Failed to send invoice');
      }
    } catch (sendError) {
      console.error('Error sending invoice:', sendError);
      Alert.alert('Error', sendError.message || 'Failed to send invoice');
    } finally {
      setProcessingTransaction(null);
      setProcessingAction(null);
    }
  };

  // Emailing goes straight to the buyer, so confirm the address first.
  const confirmSendInvoice = (invoice) => {
    const to = invoice.buyerEmail || invoice.buyerName || 'the buyer';
    Alert.alert('Email this invoice?', `Invoice #${invoice.transactionNumber} will be sent to ${to}.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Send', onPress: () => handleSendInvoice(invoice)},
    ]);
  };

  const filterChips = [
    {
      key: 'date',
      label: 'Date',
      active: !!filters.dateRange,
      onPress: () => {
        if (filters.dateRange) {
          setFilters((prev) => ({...prev, dateRange: null}));
          setDateOpen(false);
          return;
        }
        setDateOpen(true);
      },
    },
    {
      key: 'buyer',
      label: 'Buyer',
      active: asIdList(filters.buyer).length > 0,
      onPress: () => {
        if (asIdList(filters.buyer).length > 0) {
          setFilters((prev) => ({...prev, buyer: null}));
          setBuyerOpen(false);
          return;
        }
        setBuyerOpen(true);
      },
    },
    {
      key: 'joiner',
      label: 'Joiner',
      active: !!filters.joiner,
      onPress: () => {
        if (filters.joiner) {
          setFilters((prev) => ({...prev, joiner: null}));
          setJoinerOpen(false);
          return;
        }
        setJoinerOpen(true);
      },
    },
    {
      key: 'plantFlight',
      label: 'Plant Flight',
      active: filters.plantFlight?.length > 0,
      onPress: () => {
        if (filters.plantFlight?.length > 0) {
          setFilters((prev) => ({...prev, plantFlight: []}));
          setFlightOpen(false);
          return;
        }
        setFlightOpen(true);
      },
    },
  ];

  const filtersActive = filterChips.some((chip) => chip.active);
  const clearFilters = () => setFilters({buyer: null, joiner: null, dateRange: null, plantFlight: []});

  const renderInvoice = ({item, index}) => (
    <InvoiceCard
      invoice={item}
      index={index}
      busyAction={processingTransaction === item.transactionNumber ? processingAction : null}
      locked={Boolean(processingTransaction)}
      onView={() => handleViewInvoice(item)}
      onEmail={() => confirmSendInvoice(item)}
    />
  );

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          activeOpacity={0.8}>
          <BackSolidIcon width={22} height={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices</Text>
        <View style={styles.iconSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}>
        {filterChips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={chip.onPress}
            accessibilityRole="button"
            accessibilityLabel={chip.active ? `Clear ${chip.label} filter` : `Filter by ${chip.label}`}
            style={[styles.chip, chip.active && styles.chipActive]}>
            <Text style={[styles.chipText, chip.active && styles.chipTextActive]} numberOfLines={1}>
              {chip.label}
            </Text>
            {/* An active chip clears on tap, so it shows an × rather than a dropdown caret. */}
            {chip.active ? (
              <Text style={styles.chipClear}>✕</Text>
            ) : (
              <ArrowDownIcon width={14} height={14} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <View style={styles.listContent}>
            {Array.from({length: 5}).map((_, i) => (
              <InvoiceSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : error && invoices.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Couldn't load invoices</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={retry} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={renderInvoice}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListHeaderComponent={
            invoices.length ? (
              <Text style={styles.countText}>
                {total} {total === 1 ? 'invoice' : 'invoices'}
                {filtersActive ? ' match your filters' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>No invoices found</Text>
              <Text style={styles.stateText}>
                {filtersActive ? 'Nothing matches these filters.' : 'Paid orders will show up here.'}
              </Text>
              {filtersActive ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={clearFilters} activeOpacity={0.85}>
                  <Text style={styles.secondaryButtonText}>Clear filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => fetchInvoices(page + 1)}
                disabled={loadingMore}
                activeOpacity={0.85}>
                {loadingMore ? (
                  <Loading visible size={20} color={GREEN} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Load more</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {(dateOpen || buyerOpen || joinerOpen || flightOpen) ? (
      <View style={styles.filterHost}>
      <DateRangeFilter
        embedded
        isVisible={dateOpen}
        onClose={() => setDateOpen(false)}
        onSelectDateRange={(dateRange) => {
          setFilters((prev) => ({...prev, dateRange}));
          setDateOpen(false);
        }}
        onReset={() => {
          setFilters((prev) => ({...prev, dateRange: null}));
          setDateOpen(false);
        }}
      />
      <BuyerFilter
        embedded
        isVisible={buyerOpen}
        onClose={() => setBuyerOpen(false)}
        buyers={buyerOptions}
        currentBuyer={filters.buyer}
        onSelectBuyer={(buyerId) => {
          setFilters((prev) => ({...prev, buyer: buyerId}));
          setBuyerOpen(false);
        }}
      />
      <JoinerFilter
        embedded
        isVisible={joinerOpen}
        onClose={() => setJoinerOpen(false)}
        joiners={joinerOptions}
        onSelectJoiner={(joinerId) => {
          setFilters((prev) => ({...prev, joiner: joinerId}));
          setJoinerOpen(false);
        }}
        onReset={() => {
          setFilters((prev) => ({...prev, joiner: null}));
          setJoinerOpen(false);
        }}
      />
      <PlantFlightFilter
        embedded
        isVisible={flightOpen}
        onClose={() => setFlightOpen(false)}
        flightDates={flightDates}
        selectedValues={filters.plantFlight || []}
        onSelectFlight={(values) => {
          const next = Array.isArray(values)
            ? values.filter((value) => typeof value === 'string' && value.trim())
            : [];
          setFilters((prev) => ({...prev, plantFlight: next}));
          setFlightOpen(false);
        }}
        onReset={() => {
          setFilters((prev) => ({...prev, plantFlight: []}));
          setFlightOpen(false);
        }}
      />
      </View>
      ) : null}
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const DocGlyph = ({color = GREEN_DARK}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MailGlyph = ({color = INK}) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InvoiceCard = React.memo(({invoice, index, busyAction, locked, onView, onEmail}) => (
  <Animated.View entering={FadeInUp.duration(260).delay(Math.min(index, 8) * 50)} style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.cardIcon}>
        <DocGlyph />
      </View>
      <View style={styles.cardMain}>
        <Text style={styles.buyer} numberOfLines={1}>{invoice.buyerName}</Text>
        <Text style={styles.invoiceNo} numberOfLines={1} selectable>#{invoice.transactionNumber}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.amount}>{formatMoney(invoice.finalTotal)}</Text>
        <Text style={styles.date}>{formatInvoiceDate(invoice.createdAt)}</Text>
      </View>
    </View>
    <View style={styles.cardActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.viewButton, locked && !busyAction && styles.actionDimmed]}
        onPress={onView}
        disabled={locked}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`View invoice for ${invoice.buyerName}`}>
        {busyAction === 'view' ? (
          <Loading visible size={18} color="#FFFFFF" />
        ) : (
          <>
            <DocGlyph color="#FFFFFF" />
            <Text style={styles.viewText}>View PDF</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.emailButton, locked && !busyAction && styles.actionDimmed]}
        onPress={onEmail}
        disabled={locked}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Email invoice to ${invoice.buyerName}`}>
        {busyAction === 'email' ? (
          <Loading visible size={18} color={GREEN} />
        ) : (
          <>
            <MailGlyph />
            <Text style={styles.emailText}>Email</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </Animated.View>
));

/** Same shape as InvoiceCard, so nothing shifts when the real list arrives. */
const InvoiceSkeleton = () => {
  const pulse = useRef(new RNAnimated.Value(0.45)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, {toValue: 1, duration: 700, useNativeDriver: true}),
        RNAnimated.timing(pulse, {toValue: 0.45, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <RNAnimated.View style={[styles.card, {opacity: pulse}]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, styles.bone]} />
        <View style={styles.cardMain}>
          <View style={[styles.bone, styles.boneTitle]} />
          <View style={[styles.bone, styles.boneLine]} />
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.bone, styles.boneAmount]} />
          <View style={[styles.bone, styles.boneDate]} />
        </View>
      </View>
      <View style={styles.cardActions}>
        <View style={[styles.actionButton, styles.bone]} />
        <View style={[styles.actionButton, styles.bone]} />
      </View>
    </RNAnimated.View>
  );
};

export default GenerateInvoice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E9ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 44,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  chipScroll: {
    // Never squeezed by the list below (the skeletons are taller than the screen).
    flexGrow: 0,
    flexShrink: 0,
  },
  skeletonWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: GREEN,
    backgroundColor: GREEN,
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
  chipClear: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  countText: {
    marginLeft: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  card: {
    padding: 16,
    gap: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: GREEN_DARK,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3EA',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  buyer: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  invoiceNo: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
    fontVariant: ['tabular-nums'],
  },
  date: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButton: {
    backgroundColor: GREEN,
  },
  viewText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emailButton: {
    borderWidth: 1,
    borderColor: '#D5D9D4',
    backgroundColor: '#FFFFFF',
  },
  emailText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  actionDimmed: {
    opacity: 0.5,
  },
  bone: {
    backgroundColor: '#E9ECE8',
  },
  boneTitle: {
    width: '60%',
    height: 16,
    borderRadius: 8,
  },
  boneLine: {
    width: '80%',
    height: 12,
    borderRadius: 6,
  },
  boneAmount: {
    width: 64,
    height: 16,
    borderRadius: 8,
  },
  boneDate: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  stateBox: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  stateText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7E2CC',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: GREEN_DARK,
  },
  filterHost: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30,
    elevation: 30,
  },
});
