import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/admin-icons/x.svg';
import CheckIcon from '../../../assets/admin-icons/check.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, onApply, filterType, selectedValues = [] }) => {
  const [tempSelectedValues, setTempSelectedValues] = useState(selectedValues);
  const slideAnim = useRef(new Animated.Value(314)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 314,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Reset temp selection when modal opens
  useEffect(() => {
    if (visible) {
      setTempSelectedValues(selectedValues);
    }
  }, [visible, selectedValues]);

  // Filter options based on type
  const getFilterOptions = () => {
    switch (filterType) {
      case 'eventType':
        return ['Air Cargo', 'Delivery Hub', 'Nursery Drop'];
      case 'status':
        return ['Active', 'Canceled'];
      case 'country':
        return ['Philippines', 'Thailand', 'Indonesia'];
      default:
        return [];
    }
  };

  const getFilterTitle = () => {
    switch (filterType) {
      case 'eventType':
        return 'Event Type';
      case 'status':
        return 'Status';
      case 'country':
        return 'Country';
      default:
        return 'Filter';
    }
  };

  const toggleOption = (option) => {
    if (tempSelectedValues.includes(option)) {
      setTempSelectedValues(tempSelectedValues.filter(v => v !== option));
    } else {
      setTempSelectedValues([...tempSelectedValues, option]);
    }
  };

  const handleClear = () => {
    setTempSelectedValues([]);
  };

  const handleApply = () => {
    onApply(tempSelectedValues);
    onClose();
  };

  const options = getFilterOptions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Action Sheet */}
            <View style={styles.actionSheet}>
              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>{getFilterTitle()}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <CloseIcon width={24} height={24} fill="#7F8D91" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionRow}
                    onPress={() => toggleOption(option)}
                    activeOpacity={0.7}
                  >
                    {/* List Left */}
                    <View style={styles.listLeft}>
                      <Text style={styles.listTitle}>{option}</Text>
                    </View>

                    {/* List Right */}
                    <View style={styles.listRight}>
                      <View style={[
                        styles.checkbox,
                        tempSelectedValues.includes(option) && styles.checkboxChecked
                      ]}>
                        {tempSelectedValues.includes(option) && (
                          <CheckIcon width={16} height={16} fill="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    width: SCREEN_WIDTH,
    height: 314,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 314,
    backgroundColor: '#FFFFFF',
  },
  // Title - padding: 24px 24px 12px, height: 60px
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    width: 287,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },
  // Content - padding: 8px, height: 160px
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 8,
    width: '100%',
    height: 160,
  },
  // Option Row - height: 48px
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    height: 48,
  },
  // List Left
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  listTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  // List Right
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 16,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  // Checkbox
  checkbox: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  // Action Container - padding: 12px 24px 0px, height: 60px
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 8,
    width: '100%',
    height: 60,
  },
  // Clear Button
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
  },
  clearButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  // Apply Button
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  applyButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

export default FilterModal;
