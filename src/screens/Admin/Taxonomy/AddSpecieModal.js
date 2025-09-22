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

const { height: screenHeight } = Dimensions.get('window');

const AddSpecieModal = ({ visible, onClose, onSave }) => {
  const [specieName, setSpecieName] = useState('');
  const [variegation, setVariegation] = useState('');
  const [shippingIndex, setShippingIndex] = useState('');
  const [acclimationIndex, setAcclimationIndex] = useState('');
  
  // Dropdown options state
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [shippingIndexOptions, setShippingIndexOptions] = useState([]);
  const [acclimationIndexOptions, setAcclimationIndexOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Dropdown visibility state
  const [showVariegationDropdown, setShowVariegationDropdown] = useState(false);
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);
  const [showAcclimationDropdown, setShowAcclimationDropdown] = useState(false);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      setLoadingOptions(true);
      
      // Fetch all dropdown data in parallel
      const [variegationRes, shippingRes, acclimationRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/getVariegationDropdown`),
        fetch(`${API_CONFIG.BASE_URL}/getShippingIndexDropdown`),
        fetch(`${API_CONFIG.BASE_URL}/getAcclimationIndexDropdown`)
      ]);

      const [variegationData, shippingData, acclimationData] = await Promise.all([
        variegationRes.json(),
        shippingRes.json(),
        acclimationRes.json()
      ]);

      // Set dropdown options
      setVariegationOptions(variegationData.data || []);
      setShippingIndexOptions(shippingData.data || []);
      setAcclimationIndexOptions(acclimationData.data || []);
      
      console.log('✅ Dropdown data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      // Set default options in case of error
      setVariegationOptions([
        { id: 'none', name: 'None' },
        { id: 'variegated', name: 'Variegated' },
        { id: 'highly_variegated', name: 'Highly Variegated' }
      ]);
      setShippingIndexOptions([
        { id: 'low', name: 'Low' },
        { id: 'medium', name: 'Medium' },
        { id: 'high', name: 'High' }
      ]);
      setAcclimationIndexOptions([
        { id: 'easy', name: 'Easy' },
        { id: 'moderate', name: 'Moderate' },
        { id: 'difficult', name: 'Difficult' }
      ]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Load dropdown data when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🔄 Modal opened, loading dropdown data...');
      fetchDropdownData();
    }
  }, [visible]);

  // Dropdown selection handlers
  const handleVariegationSelect = (option) => {
    setVariegation(option.name);
    setShowVariegationDropdown(false);
  };

  const handleShippingSelect = (option) => {
    setShippingIndex(option.name);
    setShowShippingDropdown(false);
  };

  const handleAcclimationSelect = (option) => {
    setAcclimationIndex(option.name);
    setShowAcclimationDropdown(false);
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowVariegationDropdown(false);
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
      shippingIndex,
      acclimationIndex,
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
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
                    value={specieName}
                    onChangeText={setSpecieName}
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
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setShowVariegationDropdown(!showVariegationDropdown)}
                >
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {variegation || 'Select...'}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
                {showVariegationDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {variegationOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleVariegationSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
                    {shippingIndex || 'Select...'}
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
                    {acclimationIndex || 'Select...'}
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
    height: 586,
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

  // Form
  form: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Field Section
  fieldSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    minHeight: 102,
    position: 'relative',
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    height: 78,
    alignSelf: 'stretch',
    width: '100%',
  },
  label: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
    width: '100%',
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
    height: 48,
    minHeight: 48,
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
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },
  dropdownText: {
    color: '#647276',
    textAlign: 'left',
  },

  // Action Section
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    height: 84,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
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
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
});

export default AddSpecieModal;
