import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import CheckIcon from '../../assets/admin-icons/check.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

// Represents a single selectable country row
const CountryOption = ({ label, isSelected, onSelect }) => (
  <TouchableOpacity style={styles.optionRow} onPress={onSelect}>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={isSelected ? styles.checkboxSelected : styles.checkbox}>
      {isSelected && <CheckIcon />}
    </View>
  </TouchableOpacity>
);

const CountryFilter = ({ isVisible, onClose, onApply }) => {
  // Mock data for the list of countries
  const availableCountries = [{label: 'Thailand', value: 'TH'}, {label: 'Indonesia', value: 'ID'}, {label: 'Philippines', value: 'PH'}];
  
  // State to manage the array of selected countries
  const [selectedCountries, setSelectedCountries] = useState([]);

  // Toggles a country in the selection list
  const handleSelectCountry = (country) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleClear = () => {
    setSelectedCountries([]);
  };

  const handleApply = () => {
    onApply(selectedCountries);
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
          <View style={styles.actionSheetContainer}>
            <SafeAreaView>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Country</Text>
                <TouchableOpacity onPress={onClose}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              {/* Content with selectable options */}
              <View style={styles.content}>
                {availableCountries.map(country => (
                  <CountryOption
                    key={country.value}
                    label={country.label}
                    isSelected={selectedCountries.includes(country.value)}
                    onSelect={() => handleSelectCountry(country.value)}
                  />
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                  <Text style={styles.clearButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>Update Schedule</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
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
    paddingBottom: 20, // For home indicator area
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
  closeIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  content: {
    padding: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    height: 48,
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#393D40',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#647276',
  },
  checkboxSelected: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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

export default CountryFilter;