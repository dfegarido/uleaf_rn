import moment from 'moment';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CaretRightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import ScreenHeader from '../../../components/Admin/header';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';
import { updateLeafTrailStatus, updatePlantStatus } from '../../../components/Api/getAdminLeafTrail';
import Toast from '../../../components/Toast/Toast';
import OrderSummaryDeliveredModal from './OrderSummaryDeliveredModal';
import OrderSummaryStatusSheet, {
  deriveOrderSummaryPlantStatus,
  formatLeafTrailStatusDisplayLabel,
  LEAF_TRAIL_STATUS_OPTIONS,
  mapPlantStatusPickerToApi,
  PLANT_STATUS_EDIT_OPTIONS,
} from './OrderSummaryStatusSheet';

const resolveInitialTracking = (order) => {
  if (order.rawTrackingNumber) return order.rawTrackingNumber;
  const t = order.trackingNumber;
  return t && t !== '—' ? t : '';
};

const formatLabel = (value) => formatLeafTrailStatusDisplayLabel(value);

const deriveDisplayPlantStatus = (rawPlantStatus, rawLeaf, rawOrderStatus) =>
  deriveOrderSummaryPlantStatus({
    plantStatus: rawPlantStatus,
    leafTrailStatus: rawLeaf,
    status: rawOrderStatus,
  }).display;

const getPlantStatusTheme = (displayStatus) => {
  const key = String(displayStatus || '').toLowerCase();
  if (key === 'active') {
    return { bg: '#E8F5EB', text: '#2D6A3E', border: '#B8DFC4', dot: '#539461' };
  }
  if (key === 'wildgone' || key === 'missing' || key === 'damaged') {
    return { bg: '#FDECE8', text: '#B83D1F', border: '#F5C4B8', dot: '#E7522F' };
  }
  if (key.includes('stay')) {
    return { bg: '#FFF8E6', text: '#8A6A00', border: '#F5E6A8', dot: '#E6A817' };
  }
  if (key === 'others' || key === 'cancelled') {
    return { bg: '#F0F2F2', text: '#647276', border: '#CDD3D4', dot: '#7F8D91' };
  }
  return { bg: '#F5F6F6', text: '#647276', border: '#E4E7E9', dot: '#7F8D91' };
};

const getLeafTrailTheme = (rawLeaf) => {
  const leaf = String(rawLeaf || '').toLowerCase().trim();
  if (['missing', 'damaged', 'needstostay', 'cancelled', 'canceled'].includes(leaf)) {
    return getPlantStatusTheme(formatLabel(rawLeaf));
  }
  if (['delivered', 'shipped', 'shipping'].includes(leaf)) {
    return { bg: '#E8F0F5', text: '#2A5F7A', border: '#B8D4E8', dot: '#3D7FA6' };
  }
  if (['packed', 'sorted', 'received'].includes(leaf)) {
    return { bg: '#E8F5EB', text: '#2D6A3E', border: '#B8DFC4', dot: '#539461' };
  }
  return { bg: '#F5F6F6', text: '#202325', border: '#E4E7E9', dot: '#539461' };
};

const StatusBadge = ({ label, theme }) => (
  <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
    <View style={[styles.statusDot, { backgroundColor: theme.dot }]} />
    <Text style={[styles.statusBadgeText, { color: theme.text }]}>{label}</Text>
  </View>
);

const SectionCard = ({ title, subtitle, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value || '—'}
    </Text>
  </View>
);

const StatusEditCard = ({ title, description, value, theme, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.statusEditCard, { borderLeftColor: theme.dot }, disabled && styles.statusEditDisabled]}
    onPress={onPress}
    activeOpacity={0.75}
    disabled={disabled}
  >
    <View style={styles.statusEditLeft}>
      <Text style={styles.statusEditTitle}>{title}</Text>
      <Text style={styles.statusEditDesc}>{description}</Text>
      <View style={[styles.statusEditPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View style={[styles.statusDot, { backgroundColor: theme.dot }]} />
        <Text style={[styles.statusEditValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
    <CaretRightIcon width={20} height={20} />
  </TouchableOpacity>
);

const OrderSummaryDetail = ({ navigation, route }) => {
  const initial = route.params?.order || {};
  const [orderId] = useState(initial.id);
  const [rawLeafTrailStatus, setRawLeafTrailStatus] = useState(initial.rawLeafTrailStatus || '');
  const [rawPlantStatus, setRawPlantStatus] = useState(initial.rawPlantStatus || '');
  const [rawOrderStatus, setRawOrderStatus] = useState(initial.rawOrderStatus || '');
  const [orderMeta, setOrderMeta] = useState(initial);
  const [trackingDisplay, setTrackingDisplay] = useState(resolveInitialTracking(initial));
  const [deliveryDateDisplay, setDeliveryDateDisplay] = useState(initial.rawDeliveryDate || '');
  const [deliveryTimeDisplay, setDeliveryTimeDisplay] = useState(initial.rawDeliveryTime || '');
  const [isDelayedDelivery, setIsDelayedDelivery] = useState(Boolean(initial.isDelayedUPSDelivery));
  const [saving, setSaving] = useState(false);
  const [leafSheetVisible, setLeafSheetVisible] = useState(false);
  const [plantSheetVisible, setPlantSheetVisible] = useState(false);
  const [deliveredModalVisible, setDeliveredModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const leafTrailDisplay = formatLabel(rawLeafTrailStatus || '—');
  const plantStatusDisplay = deriveDisplayPlantStatus(
    rawPlantStatus,
    rawLeafTrailStatus,
    rawOrderStatus,
  );
  const plantTheme = useMemo(() => getPlantStatusTheme(plantStatusDisplay), [plantStatusDisplay]);
  const leafTheme = useMemo(() => getLeafTrailTheme(rawLeafTrailStatus), [rawLeafTrailStatus]);

  const plantName = [orderMeta.genus, orderMeta.species].filter(Boolean).join(' ').trim() || 'Unknown plant';
  const buyerName = `${orderMeta.buyerFirstName || ''} ${orderMeta.buyerLastName || ''}`.trim() || '—';
  const sellerLine = [orderMeta.gardenName, orderMeta.sellerName].filter((v) => v && v !== '—').join(' · ');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const applyLocalLeafTrailSuccess = (status, statusLower, deliveryInfo) => {
    setRawLeafTrailStatus(status);
    if (statusLower === 'delivered' && deliveryInfo) {
      setRawOrderStatus('delivered');
      setTrackingDisplay(deliveryInfo.trackingNumber);
      setDeliveryDateDisplay(deliveryInfo.deliveryDate);
      setDeliveryTimeDisplay(deliveryInfo.deliveryTime);
      setIsDelayedDelivery(Boolean(deliveryInfo.isDelayedUPSDelivery));
      setOrderMeta((prev) => ({
        ...prev,
        trackingNumber: deliveryInfo.trackingNumber,
        rawTrackingNumber: deliveryInfo.trackingNumber,
        rawDeliveryDate: deliveryInfo.deliveryDate,
        rawDeliveryTime: deliveryInfo.deliveryTime,
      }));
      setDeliveredModalVisible(false);
    } else if (statusLower === 'cancelled' || statusLower === 'canceled') {
      setRawOrderStatus('cancelled');
    } else if (!['missing', 'damaged', 'needstostay'].includes(statusLower)) {
      setRawOrderStatus((prev) => {
        const p = String(prev || '').toLowerCase();
        if (p === 'cancelled' || p === 'canceled') return 'Ready to Fly';
        return prev;
      });
    }
  };

  const applyLocalPlantStatusSuccess = (status) => {
    const statusLower = String(status).toLowerCase();
    const stored =
      statusLower === 'forreceiving' || statusLower === 'active' ? 'active' : status;
    setRawPlantStatus(stored);
    if (statusLower === 'cancelled' || statusLower === 'canceled') {
      setRawOrderStatus('cancelled');
    } else if (statusLower === 'active' || statusLower === 'forreceiving') {
      setRawOrderStatus((prev) => {
        const p = String(prev || '').toLowerCase();
        if (p === 'cancelled' || p === 'canceled') return 'Ready to Fly';
        return prev;
      });
    }
  };

  const applyLeafTrailUpdate = async (status, deliveryInfo = null) => {
    if (!orderId) {
      Alert.alert('Error', 'Order ID is missing.');
      return;
    }
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'delivered' && !deliveryInfo) {
      setDeliveredModalVisible(true);
      return;
    }
    setSaving(true);
    try {
      const response = await updateLeafTrailStatus(orderId, status, {
        deliveryInfo: deliveryInfo || undefined,
      });
      const isSuccess =
        response?.success === true ||
        (response?.success !== false && response?.leafTrailStatus != null);

      if (isSuccess) {
        applyLocalLeafTrailSuccess(status, statusLower, deliveryInfo);
        setSaving(false);
        showToast('Leaf trail status updated.');
        route.params?.onOrderUpdated?.();
      } else {
        setSaving(false);
        const msg = response?.message || response?.error || 'Failed to update status.';
        showToast(msg, 'error');
      }
    } catch (e) {
      setSaving(false);
      showToast(e?.message || 'Failed to update status.', 'error');
    }
  };

  const applyPlantStatusUpdate = async (status) => {
    if (!orderId) {
      Alert.alert('Error', 'Order ID is missing.');
      return;
    }
    setSaving(true);
    try {
      const response = await updatePlantStatus(orderId, mapPlantStatusPickerToApi(status));
      const isSuccess =
        response?.success === true || response?.plantStatus != null;

      if (isSuccess) {
        applyLocalPlantStatusSuccess(response.plantStatus || status);
        setSaving(false);
        showToast('Plant status updated.');
        route.params?.onOrderUpdated?.();
      } else {
        setSaving(false);
        const msg = response?.message || response?.error || 'Failed to update plant status.';
        showToast(msg, 'error');
      }
    } catch (e) {
      setSaving(false);
      showToast(e?.message || 'Failed to update plant status.', 'error');
    }
  };

  const onLeafTrailSelect = (value) => {
    setLeafSheetVisible(false);
    if (String(value).toLowerCase() === 'delivered') {
      setDeliveredModalVisible(true);
      return;
    }
    Alert.alert('Update leaf trail status', `Set to "${formatLabel(value)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => applyLeafTrailUpdate(value) },
    ]);
  };

  const formatDeliveryDateDisplay = (isoDate) => {
    if (!isoDate) return '—';
    const m = moment(isoDate, 'YYYY-MM-DD', true);
    return m.isValid() ? m.format('MMM D, YYYY') : isoDate;
  };

  const formatDeliveryTimeDisplay = (time) => {
    if (!time) return '—';
    const m = moment(time, ['HH:mm', 'h:mm A'], true);
    return m.isValid() ? m.format('h:mm A') : time;
  };

  const isDeliveredLeaf = String(rawLeafTrailStatus || '').toLowerCase() === 'delivered';

  const onPlantStatusSelect = (value) => {
    setPlantSheetVisible(false);
    const label = PLANT_STATUS_EDIT_OPTIONS.find((o) => o.value === value)?.label || value;
    Alert.alert('Update plant status', `Set to "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => applyPlantStatusUpdate(value) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader navigation={navigation} title="Order details" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          {orderMeta.imageUrl ? (
            <Image source={{ uri: orderMeta.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Text style={styles.heroPlaceholderEmoji}>🌿</Text>
              <Text style={styles.placeholderText}>No plant image</Text>
            </View>
          )}
          <View style={styles.heroBody}>
            <View style={styles.heroTopRow}>
              {orderMeta.countryCode ? (
                <CountryFlagIcon code={orderMeta.countryCode} width={24} height={16} />
              ) : null}
              <Text style={styles.plantCodePill}>{orderMeta.plantCode}</Text>
              {orderMeta.listingType && orderMeta.listingType !== '—' ? (
                <View style={styles.listingBadge}>
                  <Text style={styles.listingBadgeText}>{orderMeta.listingType}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.plantName}>{plantName}</Text>
            {orderMeta.variegation ? (
              <Text style={styles.variegation}>{orderMeta.variegation}</Text>
            ) : null}
            <Text style={styles.txnLabel}>Transaction</Text>
            <Text style={styles.txn}>{orderMeta.transactionNumber}</Text>
          </View>
        </View>

        {/* Live status summary */}
        <View style={styles.summaryRow}>
          <StatusBadge label={`Plant: ${plantStatusDisplay}`} theme={plantTheme} />
          <StatusBadge label={`Trail: ${leafTrailDisplay}`} theme={leafTheme} />
        </View>

        {/* Update status */}
        <SectionCard title="Update status" subtitle="Tap a field to change it for this order line">
          <StatusEditCard
            title="Leaf trail status"
            description="Hub fulfillment stage"
            value={leafTrailDisplay}
            theme={leafTheme}
            onPress={() => setLeafSheetVisible(true)}
            disabled={saving}
          />
          <View style={styles.statusEditGap} />
          <StatusEditCard
            title="Plant status"
            description="Operational or mishap state"
            value={plantStatusDisplay}
            theme={plantTheme}
            onPress={() => setPlantSheetVisible(true)}
            disabled={saving}
          />
        </SectionCard>

        {/* Dates & tracking */}
        <SectionCard
          title="Dates & tracking"
          subtitle={
            isDeliveredLeaf
              ? 'Used for Plants are Home tab eligibility'
              : undefined
          }
        >
          <InfoRow label="Order date" value={orderMeta.createdAt || orderMeta.orderDate} />
          <InfoRow label="Plant flight" value={orderMeta.plantFlight} />
          <InfoRow label="Hub received" value={orderMeta.hubReceivedDate} />
          <InfoRow label="Hub packed" value={orderMeta.hubPackedDate} />
          <InfoRow label="UPS tracking" value={trackingDisplay || '—'} />
          <InfoRow label="UPS delivery date" value={formatDeliveryDateDisplay(deliveryDateDisplay)} />
          <InfoRow
            label="UPS delivery time"
            value={formatDeliveryTimeDisplay(deliveryTimeDisplay)}
            isLast={!isDeliveredLeaf}
          />
          {isDeliveredLeaf ? (
            <TouchableOpacity
              style={styles.editDeliveryBtn}
              onPress={() => setDeliveredModalVisible(true)}
              disabled={saving}
            >
              <Text style={styles.editDeliveryBtnText}>Edit UPS delivery details</Text>
            </TouchableOpacity>
          ) : null}
        </SectionCard>

        {/* People */}
        <SectionCard title="People">
          <InfoRow label="Buyer" value={buyerName} />
          {orderMeta.buyerUsername ? (
            <InfoRow label="Buyer username" value={`@${orderMeta.buyerUsername}`} />
          ) : null}
          <InfoRow label="Garden & seller" value={sellerLine || '—'} />
          {orderMeta.isJoinerOrder ? (
            <InfoRow
              label="Joiner"
              value={`${orderMeta.joinerFirstName || ''} ${orderMeta.joinerLastName || ''}`.trim()}
              isLast
            />
          ) : (
            <InfoRow label="Receiver" value={orderMeta.receiverName} isLast />
          )}
        </SectionCard>

        {/* Plant details */}
        <SectionCard title="Plant details">
          {Array.isArray(orderMeta.potSizes) && orderMeta.potSizes.length > 0 ? (
            <InfoRow
              label="Pot size(s)"
              value={orderMeta.potSizes.join(', ')}
            />
          ) : null}
          {Array.isArray(orderMeta.quantities) && orderMeta.quantities.length > 0 ? (
            <InfoRow label="Quantity" value={orderMeta.quantities.join(', ')} />
          ) : null}
          <InfoRow
            label="USD price"
            value={
              Array.isArray(orderMeta.usdPrices) && orderMeta.usdPrices.length
                ? orderMeta.usdPrices.map((p) => (p ? `$${Number(p).toFixed(2)}` : '—')).join(', ')
                : '—'
            }
            isLast
          />
        </SectionCard>
      </ScrollView>

      <OrderSummaryStatusSheet
        visible={leafSheetVisible}
        title="Change leaf trail status"
        options={LEAF_TRAIL_STATUS_OPTIONS}
        onClose={() => setLeafSheetVisible(false)}
        onSelect={onLeafTrailSelect}
      />
      <OrderSummaryStatusSheet
        visible={plantSheetVisible}
        title="Change plant status"
        options={PLANT_STATUS_EDIT_OPTIONS}
        onClose={() => setPlantSheetVisible(false)}
        onSelect={onPlantStatusSelect}
      />

      <OrderSummaryDeliveredModal
        visible={deliveredModalVisible}
        onClose={() => !saving && setDeliveredModalVisible(false)}
        onSave={(deliveryInfo) => applyLeafTrailUpdate('delivered', deliveryInfo)}
        saving={saving}
        initialTracking={trackingDisplay}
        initialDeliveryDate={deliveryDateDisplay}
        initialDeliveryTime={deliveryTimeDisplay}
        initialIsDelayed={isDelayedDelivery}
      />

      {saving ? (
        <View style={styles.loadingOverlay} pointerEvents="box-none">
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Updating status…</Text>
          </View>
        </View>
      ) : null}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E8EEEA',
  },
  heroImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroPlaceholderEmoji: {
    fontSize: 40,
  },
  heroBody: {
    padding: 16,
    gap: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  plantCodePill: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#539461',
    backgroundColor: '#E8F5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  listingBadge: {
    backgroundColor: '#202325',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listingBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  plantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 22,
    color: '#202325',
    marginTop: 4,
  },
  variegation: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#647276',
    fontStyle: 'italic',
  },
  txnLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#7F8D91',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txn: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  placeholderText: {
    fontFamily: 'Inter',
    color: '#647276',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 17,
    color: '#202325',
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#647276',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    gap: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    flex: 1,
  },
  infoValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#202325',
    flex: 1.2,
    textAlign: 'right',
  },
  statusEditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderLeftWidth: 4,
  },
  statusEditDisabled: {
    opacity: 0.6,
  },
  statusEditLeft: {
    flex: 1,
    marginRight: 8,
  },
  statusEditTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 15,
    color: '#202325',
  },
  statusEditDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#7F8D91',
    marginTop: 2,
    marginBottom: 8,
  },
  statusEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusEditValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
  },
  statusEditGap: {
    height: 10,
  },
  editDeliveryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#E8F5EB',
  },
  editDeliveryBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: '#2D6A3E',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 35, 37, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: '#202325',
  },
});

export default OrderSummaryDetail;
