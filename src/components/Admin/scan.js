import React, { useState } from 'react';
import { Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../assets/admin-icons/x.svg';

// A single radio button option
const ScanOption = ({ label, isSelected, onPress }) => (
  <TouchableOpacity style={styles.optionRow} onPress={onPress}>
    <View style={styles.optionLeft}>
      <Text style={styles.optionLabel}>{label}</Text>
    </View>
    <View style={styles.optionRight}>
      {isSelected ? (
        <View style={styles.radioButtonSelected}>
          <View style={styles.radioButtonInnerCircle} />
        </View>
      ) : (
        <View style={styles.radioButton} />
      )}
    </View>
  </TouchableOpacity>
);

const ScanOptions = ({ isVisible, onClose, onApplyScan }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const insets = useSafeAreaInsets();

  const options = ['Scanned', 'Unscanned'];

  const handleApply = () => {
    if (onApplyScan) {
      onApplyScan(selectedOption);
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedOption(null);
  };

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.actionSheetContainer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}>
              <SafeAreaView edges={['bottom']}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Scan</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon />
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  {options.map(option => (
                    <ScanOption
                      key={option}
                      label={option}
                      isSelected={selectedOption === option}
                      onPress={() => setSelectedOption(option)}
                    />
                  ))}
                </View>

                <View style={styles.actionContainer}>
                  <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>View</Text>
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
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  content: {
    padding: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  optionLeft: {
    flex: 1,
    paddingLeft: 16,
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#393D40',
  },
  optionRight: {
    paddingRight: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#647276',
  },
  radioButtonSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
    height: 60,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default ScanOptions;
