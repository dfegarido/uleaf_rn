import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

// Import icons
import CloseIcon from '../../../assets/admin-icons/close-x.svg';
import DownIcon from '../../../assets/admin-icons/arrow-down.svg';

// Import API config
import { API_CONFIG } from '../../../config/apiConfig';

// Import utility functions for index conversion
import { getIndexOptions } from '../../../utils/indexConverters';

const { height: screenHeight } = Dimensions.get('window');

const AddSpecieModal = ({ visible, onClose, onSave }) => {
  const [specieName, setSpecieName] = useState('');
  const [variegation, setVariegation] = useState('');
  const [shippingIndex, setShippingIndex] = useState('');
  const [acclimationIndex, setAcclimationIndex] = useState('');
  
  // Dropdown options state
  const [shippingIndexOptions] = useState(getIndexOptions());
  const [acclimationIndexOptions] = useState(getIndexOptions());
  
  // Dropdown visibility state
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);
  const [showAcclimationDropdown, setShowAcclimationDropdown] = useState(false);

  // Dropdown selection handlers

  const handleShippingSelect = (option) => {
    setShippingIndex(option.value); // Use numeric value instead of name
    setShowShippingDropdown(false);
  };

  const handleAcclimationSelect = (option) => {
    setAcclimationIndex(option.value); // Use numeric value instead of name
    setShowAcclimationDropdown(false);
  };
  
  // Helper functions to get display name from value
  const getShippingDisplayName = () => {
    if (!shippingIndex) return 'Select...';
    const option = shippingIndexOptions.find(opt => opt.value === shippingIndex);
    return option ? option.name : shippingIndex;
  };
  
  const getAcclimationDisplayName = () => {
    if (!acclimationIndex) return 'Select...';
    const option = acclimationIndexOptions.find(opt => opt.value === acclimationIndex);
    return option ? option.name : acclimationIndex;
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowShippingDropdown(false);
    setShowAcclimationDropdown(false);
  };

  // Handle modal close
  const handleClose = () => {
    closeAllDropdowns();
    onClose();
  };

  const handleSave = () => {
    // Validate fields if needed
    if (!specieName.trim()) {
      alert('Please enter a species name');
      return;
    }
    
    const specieData = {
      name: specieName,
      variegation,
      shippingIndex: shippingIndex || 0,
      acclimationIndex: acclimationIndex || 0,
    };
    
    onSave(specieData);
    
    // Reset form
    setSpecieName('');
    setVariegation('');
    setShippingIndex('');
    setAcclimationIndex('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        
        {/* Action Sheet */}
        <View style={styles.actionSheet}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Add Specie</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={true} // Show scroll indicator for debugging
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true} // Enable nested scrolling
            bounces={true} // Enable bouncing for iOS
          >
            {/* Specie Name Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Specie name <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter specie name"
                    value={specieName.toUpperCase()}
                    onChangeText={(text) => setSpecieName(text.toUpperCase())}
                    placeholderTextColor="#647276"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectionColor="#539461"
                  />
                </View>
              </View>
            </View>

            {/* Variegation Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>Variegation</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter variegation (optional)"
                    value={variegation}
                    onChangeText={setVariegation}
                    placeholderTextColor="#647276"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectionColor="#539461"
                  />
                </View>
              </View>
            </View>

            {/* Shipping Index Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Shipping index <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setShowShippingDropdown(!showShippingDropdown)}
                >
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {getShippingDisplayName()}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
                {showShippingDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {shippingIndexOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleShippingSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Acclimation Index Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Acclimation index <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setShowAcclimationDropdown(!showAcclimationDropdown)}
                >
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {getAcclimationDisplayName()}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
                {showAcclimationDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {acclimationIndexOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleAcclimationSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Action */}
            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <View style={styles.saveButtonText}>
                  <Text style={styles.saveText}>Add Specie</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Home Indicator */}
          <View style={styles.homeIndicator}>
            <View style={styles.gestureBar} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  
  // Action Sheet
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: '100%',
    height: '80%', // Changed from fixed height to percentage for better scrolling
    maxHeight: 600,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Title
  titleSection: {
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
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
    flexWrap: 'wrap', // Allow text to wrap if needed
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },

  // Form
  form: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Increased padding for better scrolling clearance
  },

  // Field Section
  fieldSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 0, // Removed horizontal padding since form already has it
    gap: 12,
    width: '100%',
    minHeight: 90, // Reduced from 102 for better layout
    position: 'relative',
    zIndex: 1,
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'flex-start', // Changed from center to flex-start
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    minHeight: 78, // Changed from fixed height to minHeight
    alignSelf: 'stretch',
    width: '100%',
    position: 'relative', // Added for dropdown positioning context
  },
  label: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 4, // Add some margin for better spacing
  },
  asterisk: {
    color: '#FF0000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48, // Use minHeight instead of fixed height
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  textInput: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    textAlign: 'left',
    paddingVertical: 0, // Reset to 0 for better control
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    minHeight: 24, // Ensure minimum height for text visibility
    includeFontPadding: false, // Remove extra font padding on Android
  },
  dropdownText: {
    color: '#647276',
    textAlign: 'left',
    flex: 1, // Allow text to take available space
  },

  // Action Section
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 0, // Removed horizontal padding since form already has it
    gap: 12,
    width: '100%',
    minHeight: 84, // Use minHeight instead of fixed height
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48, // Use minHeight instead of fixed height
    backgroundColor: '#539461',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  saveButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    flex: 1,
    height: 16,
  },
  saveText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Home Indicator
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
  
  // Dropdown Styles
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    maxHeight: 200,
    marginTop: 4,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
    flexGrow: 0, // Prevent scroll from growing
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 44, // Ensure minimum touch target
  },
  dropdownOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flexWrap: 'wrap', // Allow text to wrap if needed
  },
});

export default AddSpecieModal;
