import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  { label: 'Active', value: 'active' },
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
  { label: 'Missing', value: 'missing' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Needs to stay', value: 'needsToStay' },
  { label: 'Cancelled (Wildgone)', value: 'cancelled' },
];

/** Detail screen only — includes Active (maps to forReceiving) */
export const PLANT_STATUS_EDIT_OPTIONS = [
  { label: 'Active', value: 'forReceiving' },
  ...PLANT_STATUS_OPTIONS,
];

/** Map stored leafTrailStatus to plant-status picker value */
export const leafTrailToPlantStatusPickerValue = (rawLeaf, rawOrderStatus = '') => {
  const leaf = String(rawLeaf || '').toLowerCase().trim();
  const ord = String(rawOrderStatus || '').toLowerCase().trim();
  const mishap = new Set(['missing', 'damaged', 'needstostay', 'cancelled', 'canceled']);
  const active = new Set([
    'active', 'forreceiving', 'received', 'sorted', 'packed', 'shipping', 'shipped', 'delivered',
  ]);
  if (mishap.has(leaf)) return leaf === 'needstostay' ? 'needsToStay' : leaf;
  if (ord === 'cancelled' || ord === 'canceled') return 'cancelled';
  if (active.has(leaf)) return 'forReceiving';
  return 'forReceiving';
};

const OrderSummaryStatusSheet = ({
  visible,
  title,
  options,
  onClose,
  onSelect,
}) => (
  <Modal
    animationType="slide"
    transparent
    visible={visible}
    onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable onPress={() => {}}>
        <View style={styles.actionSheetContainer}>
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
              accessibilityRole="button"
            >
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
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
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
