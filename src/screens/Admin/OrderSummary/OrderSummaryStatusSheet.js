import React from 'react';
import {
  Modal,
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
  { label: 'Shipping', value: 'shipping' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

/**
 * Multi-select filter options for Admin Order Summary.
 * Values match leafTrailStatus stored on order docs (verified against production Firestore).
 */
export const ORDER_SUMMARY_LEAF_TRAIL_FILTER_OPTIONS = [
  { label: 'For receiving', value: 'forReceiving' },
  { label: 'Received', value: 'received' },
  { label: 'Sorted', value: 'sorted' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Missing', value: 'missing' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Needs to stay', value: 'needsToStay' },
];

export const PLANT_STATUS_OPTIONS = [
  { label: 'Wildgone', value: 'wildgone' },
  { label: 'Need to Stay', value: 'needsToStay' },
  { label: 'Others', value: 'others' },
];

/** Detail screen only — includes Active (maps to forReceiving) */
export const PLANT_STATUS_EDIT_OPTIONS = [
  { label: 'Active', value: 'forReceiving' },
  ...PLANT_STATUS_OPTIONS,
];

/** Display labels for stored leafTrailStatus values. */
export const formatLeafTrailStatusDisplayLabel = (rawStatus) => {
  const key = String(rawStatus || '').toLowerCase().trim();
  if (!key || key === '—') return '—';
  if (key === 'active' || key === 'forreceiving') return 'For receiving';
  if (key === 'shipping') return 'In transit (UPS)';
  if (key === 'shipped') return 'Shipped';
  const spaced = String(rawStatus).trim().replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Display labels for stored plantStatus / legacy leafTrailStatus values. */
export const formatPlantStatusDisplayLabel = (rawStatus) => {
  const key = String(rawStatus || '').toLowerCase().trim();
  if (!key) return '—';
  if (key === 'active' || key === 'forreceiving') return 'Active';
  if (key === 'missing' || key === 'damaged' || key === 'damage' || key === 'wildgone') {
    return 'Wildgone';
  }
  if (key === 'needstostay') return 'Need to Stay';
  if (key === 'others' || key === 'cancelled' || key === 'canceled') return 'Others';
  const spaced = key.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Map picker value to API payload for updatePlantStatus. */
export const mapPlantStatusPickerToApi = (pickerValue) => {
  if (pickerValue === 'wildgone') return 'missing';
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
  const options = PLANT_STATUS_EDIT_OPTIONS.map((o) => ({ ...o }));
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
  if (plant === 'missing' || plant === 'damaged' || plant === 'damage' || plant === 'wildgone') {
    return 'wildgone';
  }
  if (plant === 'needstostay') return 'needsToStay';
  if (plant === 'others' || plant === 'cancelled' || plant === 'canceled') return 'others';

  const wildgoneLeaf = new Set(['missing', 'damaged', 'damage']);
  const active = new Set([
    'active', 'forreceiving', 'received', 'sorted', 'packed', 'shipping', 'shipped', 'delivered',
  ]);

  if (wildgoneLeaf.has(leaf)) return 'wildgone';
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
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
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
