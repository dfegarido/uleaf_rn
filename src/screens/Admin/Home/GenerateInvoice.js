import React, {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ArrowDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {generateInvoiceApi, getInvoicePdfApi} from '../../../components/Api/orderManagementApi';
import {getAdminOrdersApi} from '../../../components/Api/adminOrderApi';
import BuyerFilter from '../../../components/Admin/buyerFilter';
import JoinerFilter from '../../../components/Admin/joinerFilter';
import DateRangeFilter from '../../../components/Admin/dateRangeFilter';
import PlantFlightFilter, {parseAdminFlightDateTokenToIso} from '../../../components/Admin/plantFlightFilter';
import NetInfo from '@react-native-community/netinfo';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

// Custom Header
const GenerateInvoiceHeader = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Generate Invoice</Text>
      <View style={styles.backButton} />
    </View>
  );
};

const isPendingPayment = (order) => {
  const status = String(order?.status || '').toLowerCase().replace(/[\s_]/g, '');
  return status === 'pendingpayment';
};

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

const buyerNameFromOrder = (order) => {
  const info = order?.buyerInfo || {};
  const fromInfo = [info.firstName, info.lastName].filter(Boolean).join(' ').trim();
  return fromInfo || order?.buyerName || '—';
};

const isInvoiceOrder = (order) =>
  !isPendingPayment(order) && Boolean(order?.transactionNumber || order?.trxNumber);

const buyerOptionFromOrder = (order) => {
  const id = order?.buyerUid || order?.buyerId || order?.buyerInfo?.uid || order?.buyerInfo?.id;
  if (id == null || id === '') return null;
  const name = buyerNameFromOrder(order);
  if (!name || name === '—') return null;
  const info = order.buyerInfo || {};
  return {
    id: String(id),
    name,
    email: info.email || order.buyerEmail || '',
    username: info.username || '',
    avatar: info.profilePhotoUrl || info.profileImage || info.avatar || '',
  };
};

const orderMatchesBuyer = (order, buyerIds, buyerOptions) => {
  const orderBuyerIds = [
    order.buyerUid,
    order.buyerId,
    order.buyerInfo?.uid,
    order.buyerInfo?.id,
  ]
    .filter((id) => id != null && id !== '')
    .map((id) => String(id));
  if (buyerIds.some((id) => orderBuyerIds.includes(id))) return true;

  const selected = buyerOptions.filter((buyer) => buyerIds.includes(String(buyer.id)));
  const orderName = buyerNameFromOrder(order).trim().toLowerCase();
  const orderUsername = String(order.buyerInfo?.username || '').trim().toLowerCase();
  const orderEmail = String(order.buyerInfo?.email || order.buyerEmail || '').trim().toLowerCase();
  return selected.some((buyer) => {
    const name = String(buyer.name || '').trim().toLowerCase();
    const username = String(buyer.username || '').trim().toLowerCase();
    const email = String(buyer.email || '').trim().toLowerCase();
    return (
      (name && name === orderName) ||
      (username && username === orderUsername) ||
      (email && email === orderEmail)
    );
  });
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(2)}`;
};

const groupInvoices = (orders) => {
  const map = new Map();
  orders.forEach((order) => {
    const txNumber = order.transactionNumber || order.trxNumber;
    if (!txNumber) return;

    if (!map.has(txNumber)) {
      map.set(txNumber, {
        id: String(txNumber),
        transactionNumber: txNumber,
        createdAt: order.createdAt || order.orderDate || order.dateCreated,
        finalTotal: 0,
        hasOrderTotal: false,
        buyerName: buyerNameFromOrder(order),
        buyerEmail: order.buyerInfo?.email || order.buyerEmail || '',
      });
    }

    const invoice = map.get(txNumber);
    const orderTotal = Number(order.finalTotal);
    if (Number.isFinite(orderTotal) && orderTotal > 0) {
      invoice.finalTotal = orderTotal;
      invoice.hasOrderTotal = true;
    } else if (!invoice.hasOrderTotal) {
      const line = Number(order.subtotal || order.totalPrice || order.price || 0);
      if (Number.isFinite(line)) invoice.finalTotal += line;
    }

    const orderDate = order.createdAt || order.orderDate || order.dateCreated;
    if (timestampOf(orderDate) > timestampOf(invoice.createdAt)) {
      invoice.createdAt = orderDate;
    }
    if (invoice.buyerName === '—') invoice.buyerName = buyerNameFromOrder(order);
    if (!invoice.buyerEmail) {
      invoice.buyerEmail = order.buyerInfo?.email || order.buyerEmail || '';
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => timestampOf(b.createdAt) - timestampOf(a.createdAt),
  );
};

const asIdList = (value) => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map((id) => String(id).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const isoDay = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${parsed.getFullYear()}-${month}-${day}`;
    }
    return null;
  }
  const ms = timestampOf(value);
  if (!ms) return null;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const startOfLocalDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const calendarDayForApi = (date) => {
  if (!date) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
};

const addFlightDay = (days, value) => {
  const iso = parseAdminFlightDateTokenToIso(value);
  if (iso) days.add(iso);
};

const invoicePlantFlightDay = (order) => {
  const candidates = [
    order?.flightDateFormatted,
    order?.plantFlight,
    order?.plantFlightDate,
    order?.flightDate,
  ];
  if (Array.isArray(order?.products)) {
    order.products.forEach((product) => {
      candidates.push(product?.flightDateFormatted, product?.flightDate);
    });
  }
  for (const value of candidates) {
    const iso = parseAdminFlightDateTokenToIso(value);
    if (iso && iso !== '2001-11-08') return iso;
  }
  return null;
};

const orderFlightDays = (order) => {
  const days = new Set();
  addFlightDay(days, order?.flightDateFormatted);
  addFlightDay(days, order?.cargoDateFormatted);
  addFlightDay(days, order?.flightDate);
  addFlightDay(days, order?.cargoDate);
  addFlightDay(days, order?.plantFlight);
  addFlightDay(days, order?.plantFlightDate);
  if (Array.isArray(order?.products)) {
    order.products.forEach((product) => {
      addFlightDay(days, product?.flightDateFormatted);
      addFlightDay(days, product?.cargoDateFormatted);
      addFlightDay(days, product?.flightDate);
      addFlightDay(days, product?.cargoDate);
    });
  }
  return days;
};

const orderMatchesFilters = (order, filters, buyerOptions) => {
  const buyerIds = asIdList(filters.buyer);
  if (buyerIds.length && !orderMatchesBuyer(order, buyerIds, buyerOptions)) return false;

  if (filters.joiner) {
    const joinerId = String(filters.joiner);
    const orderJoinerIds = [
      order.buyerUid,
      order.joinerInfo?.joinerUid,
      order.joinerInfo?.uid,
      order.joinerInfo?.id,
    ].map((id) => (id == null ? '' : String(id)));
    if (!order.isJoinerOrder || !orderJoinerIds.includes(joinerId)) return false;
  }

  if (filters.plantFlight?.length) {
    const wanted = new Set(
      filters.plantFlight.map((value) => parseAdminFlightDateTokenToIso(value)).filter(Boolean),
    );
    const orderFlights = orderFlightDays(order);
    const matchesFlight = [...orderFlights].some((day) => wanted.has(day));
    if (!matchesFlight) return false;
  }

  if (filters.dateRange?.from || filters.dateRange?.to) {
    const ms = timestampOf(order.createdAt || order.orderDate || order.dateCreated);
    if (!ms) return false;
    const orderDay = startOfLocalDay(new Date(ms));
    if (filters.dateRange.from && orderDay < startOfLocalDay(filters.dateRange.from)) return false;
    if (filters.dateRange.to) {
      const end = startOfLocalDay(filters.dateRange.to);
      end.setHours(23, 59, 59, 999);
      if (orderDay > end) return false;
    }
  }

  return true;
};

const GenerateInvoice = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [joinerOptions, setJoinerOptions] = useState([]);
  const [filters, setFilters] = useState({
    buyer: null,
    joiner: null,
    dateRange: null,
    plantFlight: [],
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [joinerOpen, setJoinerOpen] = useState(false);
  const [flightOpen, setFlightOpen] = useState(false);
  const [processingTransaction, setProcessingTransaction] = useState(null);
  const requestId = useRef(0);
  const hasLoadedRef = useRef(false);

  const invoiceBuyerOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      if (!isInvoiceOrder(order)) return;
      const option = buyerOptionFromOrder(order);
      if (!option) return;
      const known = buyerOptions.find((buyer) => String(buyer.id) === option.id);
      map.set(option.id, known ? {...option, ...known, id: option.id, name: option.name || known.name} : option);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, buyerOptions]);

  const invoiceFlightDates = useMemo(() => {
    const days = new Set();
    orders.forEach((order) => {
      if (!isInvoiceOrder(order)) return;
      const day = invoicePlantFlightDay(order);
      if (day) days.add(day);
    });
    return Array.from(days).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  const invoices = useMemo(
    () => groupInvoices(orders.filter((order) => isInvoiceOrder(order) && orderMatchesFilters(order, filters, invoiceBuyerOptions))),
    [orders, filters, invoiceBuyerOptions],
  );

  const fetchInvoices = useCallback(async (nextPage = 1) => {
    const id = ++requestId.current;
    try {
      if (nextPage === 1 && !hasLoadedRef.current) {
        setLoading(true);
        setError(null);
      } else if (nextPage > 1) {
        setLoadingMore(true);
      } else {
        setError(null);
      }

      const net = await NetInfo.fetch();
      if (!net.isConnected || !net.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const buyerIds = asIdList(filters.buyer);
      const filtersActive = Boolean(
        buyerIds.length || filters.joiner || filters.dateRange || filters.plantFlight?.length,
      );
      const response = await getAdminOrdersApi({
        status: 'all',
        sort: 'latest',
        limit: 200,
        page: nextPage,
        buyer: buyerIds.length === 1 ? buyerIds[0] : undefined,
        joiner: filters.joiner || undefined,
        dateRange: filters.dateRange
          ? {
              from: calendarDayForApi(filters.dateRange.from),
              to: calendarDayForApi(filters.dateRange.to),
            }
          : undefined,
        plantFlight: filters.plantFlight?.length ? filters.plantFlight.join(',') : undefined,
      });

      if (id !== requestId.current) return;
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fetch invoices');
      }

      const pageOrders = (response.orders || []).filter((order) => isInvoiceOrder(order));
      const clientNarrowing = buyerIds.length > 0 || filters.plantFlight?.length > 0;
      setOrders((prev) => {
        if (nextPage > 1 || clientNarrowing) {
          if (nextPage === 1 && clientNarrowing && pageOrders.length === 0) return prev;
          const seen = new Set(prev.map((order) => order.id));
          return prev.concat(pageOrders.filter((order) => order.id && !seen.has(order.id)));
        }
        if (filtersActive && pageOrders.length === 0 && prev.length) return prev;
        return pageOrders;
      });
      setPage(response.currentPage || nextPage);
      setTotalPages(response.totalPages || 1);
      if (!buyerIds.length && Array.isArray(response.buyers) && response.buyers.length) {
        setBuyerOptions(response.buyers);
      }
      if (Array.isArray(response.joiners) && response.joiners.length) setJoinerOptions(response.joiners);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('Failed to load invoices:', err);
      if (nextPage === 1 && !hasLoadedRef.current) {
        setError(err.message || 'Failed to load invoices');
        setOrders([]);
      }
    } finally {
      if (id === requestId.current) {
        hasLoadedRef.current = true;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  const handleViewInvoice = async (invoice) => {
    const txNumber = invoice.transactionNumber;
    if (!txNumber) {
      Alert.alert('Error', 'Invoice number is missing');
      return;
    }
    if (processingTransaction) return;

    try {
      setProcessingTransaction(txNumber);
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
    }
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

  const renderInvoice = ({item}) => {
    const busy = processingTransaction === item.transactionNumber;
    return (
      <View style={styles.invoiceRow}>
        <View style={styles.invoiceTop}>
          <Text style={styles.invoiceDate} numberOfLines={1}>
            {formatInvoiceDate(item.createdAt)}
          </Text>
          <Text style={styles.invoiceTotal} numberOfLines={1}>
            {formatMoney(item.finalTotal)}
          </Text>
        </View>
        <Text style={styles.invoiceNumber} numberOfLines={1}>
          Invoice # {item.transactionNumber}
        </Text>
        <View style={styles.invoiceBottom}>
          <Text style={styles.invoiceBuyer} numberOfLines={1}>
            {item.buyerName}
          </Text>
          <View style={styles.invoiceActions}>
            <TouchableOpacity
              style={[styles.actionButton, busy && styles.buttonDisabled]}
              onPress={() => handleViewInvoice(item)}
              disabled={busy}
              activeOpacity={0.7}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#539461" />
              ) : (
                <Text style={styles.actionButtonText}>View</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, busy && styles.buttonDisabled]}
              onPress={() => handleSendInvoice(item)}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GenerateInvoiceHeader navigation={navigation} />

      <View style={styles.filterRow}>
        {filterChips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={chip.onPress}
            style={[styles.filterChip, chip.active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, chip.active && styles.filterChipTextActive]} numberOfLines={1}>
              {chip.label}
            </Text>
            <ArrowDownIcon width={14} height={14} />
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : error && invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchInvoices(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          style={styles.invoiceList}
          contentContainerStyle={styles.flatListContent}
          renderItem={renderInvoice}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchInvoices(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#539461" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
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
        buyers={invoiceBuyerOptions}
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
        flightDates={invoiceFlightDates}
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

export default GenerateInvoice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    height: 58,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    flex: 1,
    fontFamily: 'Inter',
  },
  buyerDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  buyerDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  buyerDropdownText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    marginRight: 8,
  },
  clearBuyerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F7F3',
  },
  clearBuyerText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#539461',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
  },
  buyerCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  buyerCardAvatarPlaceholder: {
    backgroundColor: '#48A7F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#539461',
  },
  buyerCardAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
  },
  buyerCardInfo: {
    flex: 1,
  },
  buyerCardName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  buyerCardEmail: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 2,
  },
  buyerCardUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 569,
  },
  invoiceModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  modalHeaderTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  buyerListContainer: {
    height: 343,
    marginTop: 16,
  },
  buyerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  buyerAvatarPlaceholder: {
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#CDD3D4',
  },
  buyerAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  buyerInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  buyerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  buyerEmail: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
  },
  buyerUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 4,
  },
  emptyBuyerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBuyerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  invoiceModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  selectedBuyerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  selectedBuyerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBuyerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  selectedBuyerInfo: {
    flex: 1,
  },
  selectedBuyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  selectedBuyerEmail: {
    fontSize: 14,
    color: '#647276',
    fontFamily: 'Inter',
  },
  invoiceFormContainer: {
    paddingBottom: 20,
  },
  invoiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  invoiceInputContainer: {
    marginBottom: 20,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  invoiceOptionalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  invoiceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202325',
    fontFamily: 'Inter',
    backgroundColor: '#FFFFFF',
  },
  invoiceGenerateButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  invoiceGenerateButtonDisabled: {
    opacity: 0.6,
  },
  invoiceGenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 8,
  },
  transactionCardContent: {
    flexDirection: 'column',
  },
  transactionCardInfo: {
    marginBottom: 12,
  },
  transactionCardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  transactionCardDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 4,
  },
  transactionCardFlightDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 8,
  },
  transactionCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionCardStatus: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#539461',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  transactionCardPrice: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#202325',
    marginTop: 4,
    textAlign: 'right',
  },
  invoiceList: {
    flex: 1,
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 2,
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  filterPanelScroll: {
    maxHeight: 240,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F3',
  },
  filterOptionText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '500',
    color: '#202325',
  },
  filterOptionSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  filterEmpty: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 2,
  },
  filterChipActive: {
    borderColor: '#23C16B',
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#393D40',
    flexShrink: 1,
  },
  filterChipTextActive: {
    fontWeight: '600',
    color: '#23C16B',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  columnHeaderText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  invoiceRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F3',
    gap: 4,
  },
  invoiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  invoiceDate: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  invoiceTotal: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  invoiceNumber: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#647276',
  },
  invoiceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  invoiceBuyer: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#202325',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#539461',
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },

});
