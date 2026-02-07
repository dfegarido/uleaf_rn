import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';

const LEAF_TRAIL_STATUSES = [
  { id: 'forReceiving', label: 'For Receiving' },
  { id: 'inventoryForHub', label: 'Inventory for Hub' },
  { id: 'sorted', label: 'Sorted' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
];

const StatusItem = ({ status, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[styles.statusItem, isSelected && styles.statusItemSelected]}
      onPress={() => onSelect(status.id)}
      activeOpacity={0.7}
    >
      <View style={styles.statusInfo}>
        <Text style={[styles.statusLabel, isSelected && styles.statusLabelSelected]}>
          {status.label}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const LeafTrailFilter = ({ isVisible, onClose, onSelectStatus, onReset, currentStatus = null }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  // Initialize with current value when modal opens
  React.useEffect(() => {
    if (isVisible) {
      setSelectedStatus(currentStatus);
    }
  }, [isVisible, currentStatus]);

  const handleSelect = (statusId) => {
    setSelectedStatus(statusId);
  };

  const handleView = () => {
    if (onSelectStatus && typeof onSelectStatus === 'function') {
      onSelectStatus(selectedStatus);
    }
    onClose();
  };

  const handleReset = () => {
    setSelectedStatus(null);
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
    onClose();
  };

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
              <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>Leaf Trail Status</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <CloseIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Status List */}
                <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                  {LEAF_TRAIL_STATUSES.map((status) => (
                    <StatusItem
                      key={status.id}
                      status={status}
                      isSelected={selectedStatus === status.id}
                      onSelect={handleSelect}
                    />
                  ))}
                </ScrollView>

                {/* Actions */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonView}
                    onPress={handleView}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

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
    maxHeight: '70%',
    minHeight: 350,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    padding: 6,
    width: 24,
    height: 24,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusItemSelected: {
    backgroundColor: '#F0F7F1',
    borderColor: '#539461',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  statusLabelSelected: {
    color: '#539461',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#23C16B',
  },
  buttonView: {
    flex: 1,
    backgroundColor: '#23C16B',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default LeafTrailFilter;
