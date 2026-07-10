import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/admin-icons/x.svg';

const OptionRow = ({ title, onPress }) => (
  <TouchableOpacity style={styles.optionsRow} onPress={onPress}>
    <Text style={styles.listTitle}>{title}</Text>
  </TouchableOpacity>
);

export const LEAF_TRAIL_STATUS_OPTIONS = [
  { label: 'For receiving', value: 'forReceiving' },
  { label: 'Received', value: 'received' },
  { label: 'Sorted', value: 'sorted' },
  { label: 'Packed', value: 'packed' },
  { label: 'For Shipping', value: 'shipping' },
  { label: 'In-transit', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Removed from Flight', value: 'removedFromFlight' },
];

/** Leaf trail values displayed and selectable as "Removed from Flight". */
const REMOVED_FROM_FLIGHT_LEAF_STATUSES = new Set([
  'missing',
  'damaged',
  'damage',
  'cancelled',
  'canceled',
  'removedfromflight',
]);

/**
 * Multi-select filter options for Admin Order Summary.
 * Values match leafTrailStatus stored on order docs (verified against production Firestore).
 */
export const ORDER_SUMMARY_LEAF_TRAIL_FILTER_OPTIONS = [
  { label: 'For receiving', value: 'forReceiving' },
  { label: 'Received', value: 'received' },
  { label: 'Sorted', value: 'sorted' },
  { label: 'Packed', value: 'packed' },
  { label: 'For Shipping', value: 'shipping' },
  { label: 'In-transit', value: 'shipped' },
  { label: 'Missing', value: 'missing' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Needs to stay', value: 'needsToStay' },
];

export const PLANT_STATUS_OPTIONS = [
  { label: 'Missing', value: 'missing' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Need to Stay', value: 'needsToStay' },
  { label: 'Others', value: 'others' },
];

/** Detail screen only — includes Active (maps to forReceiving) */
export const PLANT_STATUS_EDIT_OPTIONS = [
  { label: 'Active', value: 'forReceiving' },
  ...PLANT_STATUS_OPTIONS,
];

/** Whether UPS delivery proof exists (Plants are Home eligibility). */
export const hasPlantsAreHomeDeliveryProof = ({
  trackingNumber = '',
  deliveryDate = '',
  deliveryTime = '',
  shippingData,
  shippedData,
} = {}) => {
  const track = String(trackingNumber || shippingData?.trackingNumber || '').trim();
  const dDate = String(deliveryDate || shippedData?.deliveryDate || '').trim();
  const dTime = String(deliveryTime || shippedData?.deliveryTime || '').trim();
  return Boolean(track && track !== '—' && dDate && dTime);
};

/**
 * Leaf trail label for Admin Order Summary — uses stored status plus order/shipping proof.
 */
export const deriveOrderSummaryLeafTrailDisplay = ({
  leafTrailStatus = '',
  status = '',
  deliveryStatus = '',
  trackingNumber = '',
  deliveryDate = '',
  deliveryTime = '',
  shippingData,
  shippedData,
  activeTab,
} = {}) => {
  const leafLower = String(leafTrailStatus || '').toLowerCase().trim();
  const orderLower = String(status || '').toLowerCase().trim();
  const deliveryLower = String(deliveryStatus || '').toLowerCase().trim();
  const mishap = new Set(['missing', 'damaged', 'damage', 'cancelled', 'canceled', 'needstostay', 'dead', 'others']);
  const hasProof = hasPlantsAreHomeDeliveryProof({
    trackingNumber,
    deliveryDate,
    deliveryTime,
    shippingData,
    shippedData,
  });

  if (
    !mishap.has(leafLower) &&
    (leafLower === 'delivered' ||
      orderLower === 'delivered' ||
      deliveryLower === 'delivered' ||
      (hasProof && (leafLower === 'shipped' || leafLower === 'shipping')))
  ) {
    return 'Delivered';
  }

  if (activeTab === 'readyToFly' && leafLower === 'shipping') return 'In-transit';
  if (activeTab === 'completed' && leafLower === 'shipped') return 'Delivered';
  return formatLeafTrailStatusDisplayLabel(leafTrailStatus);
};

/** Display labels for stored leafTrailStatus values. */
export const formatLeafTrailStatusDisplayLabel = (rawStatus) => {
  const key = String(rawStatus || '').toLowerCase().trim();
  if (!key || key === '—') return '—';
  if (key === 'active' || key === 'forreceiving') return 'For receiving';
  if (key === 'shipping') return 'For Shipping';
  if (key === 'delivered') return 'Delivered';
  if (key === 'shipped') return 'In-transit';
  const normalizedKey = key.replace(/[\s_-]+/g, '');
  if (REMOVED_FROM_FLIGHT_LEAF_STATUSES.has(normalizedKey)) return 'Removed from Flight';
  const spaced = String(rawStatus).trim().replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Display labels for stored plantStatus / legacy leafTrailStatus values. */
export const formatPlantStatusDisplayLabel = (rawStatus) => {
  const key = String(rawStatus || '').toLowerCase().trim();
  if (!key) return '—';
  if (key === 'active' || key === 'forreceiving') return 'Active';
  if (key === 'missing' || key === 'wildgone') return 'Missing';
  if (key === 'damaged' || key === 'damage') return 'Damaged';
  if (key === 'needstostay') return 'Need to Stay';
  if (key === 'others' || key === 'cancelled' || key === 'canceled') return 'Others';
  const spaced = key.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Map picker value to API payload for updatePlantStatus. */
export const mapPlantStatusPickerToApi = (pickerValue) => {
  if (pickerValue === 'wildgone') return 'missing';
  if (pickerValue === 'damage') return 'damaged';
  return pickerValue;
};

const PLANT_STATUS_MISHAP_VALUES = new Set([
  'missing', 'damaged', 'damage', 'needstostay', 'others', 'cancelled', 'canceled', 'dead',
]);

const PLANT_STATUS_ACTIVE_VALUES = new Set([
  'active', 'forreceiving', 'received', 'sorted', 'packed', 'shipping', 'shipped', 'delivered',
]);

/**
 * Resolve Admin Order Summary plant status label from order fields.
 * Used by the list (all tabs) and Order Details screen.
 */
export const deriveOrderSummaryPlantStatus = ({
  plantStatus: rawPlantStatus = '',
  leafTrailStatus: rawLeafTrailStatus = '',
  status: rawOrderStatus = '',
} = {}) => {
  const explicitPlant = String(rawPlantStatus || '').toLowerCase().trim();
  const rawLeaf = String(rawLeafTrailStatus || '').toLowerCase().trim();
  const rawOrd = String(rawOrderStatus || '').toLowerCase().trim();
  const storedRaw = String(rawPlantStatus || '');

  if (explicitPlant) {
    if (explicitPlant === 'active') {
      return { display: 'Active', rawPlantStatus: storedRaw };
    }
    if (PLANT_STATUS_MISHAP_VALUES.has(explicitPlant)) {
      return {
        display: formatPlantStatusDisplayLabel(rawPlantStatus),
        rawPlantStatus: storedRaw,
      };
    }
  }
  if (PLANT_STATUS_MISHAP_VALUES.has(rawLeaf)) {
    return {
      display: formatPlantStatusDisplayLabel(rawLeafTrailStatus),
      rawPlantStatus: storedRaw,
    };
  }
  if (rawOrd === 'cancelled' || rawOrd === 'canceled') {
    return { display: 'Others', rawPlantStatus: storedRaw };
  }
  if (PLANT_STATUS_ACTIVE_VALUES.has(rawLeaf)) {
    return { display: 'Active', rawPlantStatus: storedRaw };
  }
  return { display: '—', rawPlantStatus: storedRaw };
};

/**
 * Receiving ⋯ → Change plant status: standard plant statuses plus legacy tag-as actions.
 * @param {{ isOthers?: boolean, forShipping?: boolean }} tagFlags
 */
export function buildReceivingPlantStatusOptions(tagFlags = {}) {
  let options = PLANT_STATUS_EDIT_OPTIONS.map((o) => ({ ...o }));

  if (tagFlags.isMissing || tagFlags.isDamaged) {
    options = options.filter((o) => !['wildgone', 'missing', 'damaged'].includes(o.value));
    const mishapOptions = [];
    if (tagFlags.isMissing) {
      mishapOptions.push({ label: 'Tag as Missing', value: 'missing' });
    }
    if (tagFlags.isDamaged) {
      mishapOptions.push({ label: 'Tag as Damage', value: 'damaged' });
    }
    const activeIdx = options.findIndex((o) => o.value === 'forReceiving');
    if (activeIdx >= 0) {
      options.splice(activeIdx + 1, 0, ...mishapOptions);
    } else {
      options.unshift(...mishapOptions);
    }
  }

  const values = new Set(options.map((o) => o.value));

  if (tagFlags.forShipping && !values.has('received')) {
    options.push({
      label: 'For shipping',
      value: 'received',
      updatesLeafTrail: true,
    });
  }
  if (tagFlags.isOthers) {
    const othersIdx = options.findIndex((o) => o.value === 'others');
    if (othersIdx >= 0) {
      options[othersIdx] = { ...options[othersIdx], updatesLeafTrail: true };
    } else {
      options.push({
        label: 'Others',
        value: 'others',
        updatesLeafTrail: true,
      });
    }
  }
  return options;
}

export function receivingPlantStatusUsesLeafTrail(value, options = []) {
  const opt = options.find((o) => o.value === value);
  return Boolean(opt?.updatesLeafTrail);
}

/** Map stored plantStatus / leafTrailStatus to plant-status picker value */
export const plantStatusToPickerValue = (rawPlant, rawLeaf, rawOrderStatus = '') => {
  const plant = String(rawPlant || '').toLowerCase().trim();
  const leaf = String(rawLeaf || '').toLowerCase().trim();
  const ord = String(rawOrderStatus || '').toLowerCase().trim();

  if (plant === 'active' || plant === 'forreceiving') return 'forReceiving';
  if (plant === 'missing' || plant === 'wildgone') return 'missing';
  if (plant === 'damaged' || plant === 'damage') return 'damaged';
  if (plant === 'needstostay') return 'needsToStay';
  if (plant === 'others' || plant === 'cancelled' || plant === 'canceled') return 'others';

  const active = new Set([
    'active', 'forreceiving', 'received', 'sorted', 'packed', 'shipping', 'shipped', 'delivered',
  ]);

  if (leaf === 'missing') return 'missing';
  if (leaf === 'damaged' || leaf === 'damage') return 'damaged';
  if (leaf === 'needstostay') return 'needsToStay';
  if (leaf === 'others' || leaf === 'cancelled' || leaf === 'canceled') return 'others';
  if (ord === 'cancelled' || ord === 'canceled') return 'others';
  if (active.has(leaf)) return 'forReceiving';
  return 'forReceiving';
};

/** @deprecated Use plantStatusToPickerValue */
export const leafTrailToPlantStatusPickerValue = (rawLeaf, rawOrderStatus = '') =>
  plantStatusToPickerValue('', rawLeaf, rawOrderStatus);

const OrderSummaryStatusSheet = ({
  visible,
  title,
  options,
  onClose,
  onSelect,
  /** Absolute overlay instead of Modal — required when parent is already a Modal (Android). */
  embedded = false,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const sheetBody = (
    <View style={styles.root}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.indicatorContainer}>
          <View style={styles.indicatorBar} />
        </View>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
            accessibilityRole="button">
            <CloseIcon width={24} height={24} fill="#647276" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {options.map((opt, index) => (
            <View key={opt.value}>
              <OptionRow
                title={opt.label}
                onPress={() => onSelect(opt.value)}
              />
              {index < options.length - 1 && (
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{sheetBody}</View>;
  }

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent
      visible={visible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      {sheetBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 110,
    elevation: 110,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  indicatorContainer: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorBar: {
    width: 50,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    paddingTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
  },
  listTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#393D40',
  },
  dividerContainer: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
});

export default OrderSummaryStatusSheet;
