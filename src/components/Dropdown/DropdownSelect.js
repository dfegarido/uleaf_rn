import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import DropdownIcon from '../../assets/icons/greydark/dropdown-arrow.svg';

const DropdownSelect = ({
  label,
  placeholder = "Select",
  value,
  data = [],
  onSelect,
  required = false,
  disabled = false,
  style,
  labelStyle,
  textFieldStyle,
  modalStyle,
  itemStyle,
  onEndReached, // New prop for pagination
  onEndReachedThreshold = 0.1, // New prop for pagination threshold
  loading = false // New prop to show loading state
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, value === item && styles.selectedDropdownItem, itemStyle]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.dropdownItemText, value === item && styles.selectedDropdownItemText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.inputSection, style]}>
      <View style={styles.inputFieldWrap}>
        <Text style={[styles.inputLabel, labelStyle]}>
          {label}
          {required && <Text style={{color: '#E53935'}}>*</Text>}
        </Text>
        <TouchableOpacity 
          style={[
            styles.textField, 
            textFieldStyle,
            disabled && styles.textFieldDisabled
          ]} 
          activeOpacity={0.7} 
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          <Text style={[
            value ? styles.selectedText : styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {value || placeholder}
          </Text>
          <View style={styles.dropdownIconContainer}>
            <DropdownIcon 
              width={18} 
              height={10} 
              fill={disabled ? "#CDD3D4" : "#202325"} 
            />
          </View>
        </TouchableOpacity>
        
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, modalStyle]}>
              <FlatList
                data={data}
                keyExtractor={(item) => item}
                renderItem={renderItem}
                onEndReached={onEndReached}
                onEndReachedThreshold={onEndReachedThreshold}
                ListFooterComponent={loading ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color="#539461" />
                    <Text style={styles.loadingText}>Loading more...</Text>
                  </View>
                ) : null}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 102,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  inputFieldWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    width: 327,
    height: 78,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    width: 327,
    height: 22,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  textField: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  selectedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    flexGrow: 1,
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    flexGrow: 1,
  },
  dropdownIconContainer: {
    position: 'absolute',
    right: 16,
    width: 18,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F6',
  },
  selectedDropdownItem: {
    backgroundColor: '#F5F6F6',
  },
  dropdownItemText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  selectedDropdownItemText: {
    color: '#539461',
    fontWeight: '600',
  },
  textFieldDisabled: {
    backgroundColor: '#F5F6F6',
    borderColor: '#E0E5E6',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
  },
});

export default DropdownSelect;
