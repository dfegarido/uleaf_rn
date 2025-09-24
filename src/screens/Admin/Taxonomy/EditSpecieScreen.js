import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updatePlantTaxonomyApi } from '../../../auth/updatePlantTaxonomyApi';

// Import API config
import { API_CONFIG } from '../../../config/apiConfig';

// Import auth utilities
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { getStoredAdminId } from '../../../utils/getStoredUserInfo';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../assets/admin-icons/arrow-down.svg';

const EditSpecieScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get the specie data passed from the previous screen
  const { specieData = {}, genusId, genusName } = route.params || {};
  
  console.log('Received specieData:', specieData); // Debug log
  
  const [specieName, setSpecieName] = useState(specieData.name || '');
  const [variegation, setVariegation] = useState(specieData.variegation || '');
  const [shippingIndex, setShippingIndex] = useState(specieData.shipping || '');
  const [acclimationIndex, setAcclimationIndex] = useState(specieData.acclimation || '');
  
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
      console.log('🔄 Fetching dropdown data...');
      
      // Set fallback dropdown options for testing
      const fallbackVariegationOptions = [
        { id: 'none', name: 'None' },
        { id: 'slight', name: 'Slight' },
        { id: 'moderate', name: 'Moderate' },
        { id: 'heavy', name: 'Heavy' },
        { id: 'full', name: 'Full Variegation' }
      ];
      
      const fallbackShippingOptions = [
        { id: 'low', name: 'Low' },
        { id: 'medium', name: 'Medium' },
        { id: 'high', name: 'High' },
        { id: 'very_high', name: 'Very High' }
      ];
      
      const fallbackAcclimationOptions = [
        { id: 'easy', name: 'Easy' },
        { id: 'moderate', name: 'Moderate' },
        { id: 'difficult', name: 'Difficult' },
        { id: 'expert', name: 'Expert' }
      ];

      try {
        // Try to fetch real data with basic headers
        const [variegationRes, shippingRes, acclimationRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/getVariegationDropdown`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch(`${API_CONFIG.BASE_URL}/getShippingIndexDropdown`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch(`${API_CONFIG.BASE_URL}/getAcclimationIndexDropdown`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        ]);

        // Check if responses are ok
        if (variegationRes.ok && shippingRes.ok && acclimationRes.ok) {
          const [variegationData, shippingData, acclimationData] = await Promise.all([
            variegationRes.json(),
            shippingRes.json(),
            acclimationRes.json()
          ]);

          // Set real API data if successful
          setVariegationOptions(variegationData.data || fallbackVariegationOptions);
          setShippingIndexOptions(shippingData.data || fallbackShippingOptions);
          setAcclimationIndexOptions(acclimationData.data || fallbackAcclimationOptions);
          
          console.log('✅ Real dropdown data loaded successfully');
        } else {
          throw new Error('API responses not ok');
        }
      } catch (apiError) {
        console.warn('⚠️ API fetch failed, using fallback data:', apiError.message);
        
        // Use fallback data when API fails
        setVariegationOptions(fallbackVariegationOptions);
        setShippingIndexOptions(fallbackShippingOptions);
        setAcclimationIndexOptions(fallbackAcclimationOptions);
        
        console.log('✅ Fallback dropdown data loaded successfully');
      }
      
    } catch (error) {
      console.error('❌ Error in fetchDropdownData:', error);
      
      // Final fallback - ensure we always have some data
      setVariegationOptions([
        { id: 'none', name: 'None' },
        { id: 'variegated', name: 'Variegated' }
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

  // Load dropdown data when component mounts
  useEffect(() => {
    console.log('🔄 Component mounted, loading dropdown data...');
    fetchDropdownData();
  }, []);

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

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!specieName.trim()) {
      Alert.alert('Error', 'Please enter a species name');
      return;
    }
    if (!genusId || !specieData?.id) {
      Alert.alert('Error', 'Missing genus or species identifier');
      return;
    }

    try {
      // Retrieve auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        console.warn('⚠️ No auth token found. Update may fail in production.');
      }

      // Optional: retrieve adminId from storage for emulator/local testing fallback
      const storedAdminId = await getStoredAdminId();

      const payload = {
        genusId,
        authToken,
        // Provide adminId only if available (useful for emulator/local mode)
        ...(storedAdminId ? { adminId: storedAdminId } : {}),
        species: [{
          id: specieData.id,
          name: specieName.trim(),
          variegation: variegation || '',
          shippingIndex: shippingIndex || '',
          acclimationIndex: acclimationIndex || '',
          action: 'update'
        }]
      };

      console.log('🔄 Updating species with payload:', payload);
      const resp = await updatePlantTaxonomyApi(payload);
      
      if (resp?.success) {
        Alert.alert('Success', 'Species updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', resp?.error || 'Failed to update species');
      }
    } catch (e) {
      console.error('❌ update species error', e);
      Alert.alert('Error', 'Failed to update species. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Navigation / Title Bar: Main */}
      <View style={styles.navigationTitleBar}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          {/* Left Side */}
          <View style={styles.leftSide}>
            <View style={styles.time} />
          </View>
          
          {/* Right Side */}
          <View style={styles.rightSide}>
            <View style={styles.mobileSignal} />
            <View style={styles.wifi} />
            <View style={styles.battery} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.navContent}>
          {/* Controls */}
          <View style={styles.controls}>
            {/* Back */}
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            
            {/* Title */}
            <Text style={styles.title}>Update Species</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeAllDropdowns}
        >
        {/* Form Taxonomy */}
        <View style={styles.formTaxonomy}>
          {/* Specie Name */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Specie name <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.textInput}>
                <TextInput
                  style={styles.placeholder}
                  value={specieName.toUpperCase()}
                  onChangeText={(text) => setSpecieName(text.toUpperCase())}
                  placeholder={specieData.name || "Accuminate"}
                  placeholderTextColor="#647276"
                />
              </View>
            </View>
          </View>

          {/* Variegation */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>Variegation</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => {
                  closeAllDropdowns();
                  setShowVariegationDropdown(!showVariegationDropdown);
                }}
              >
                <Text style={[styles.placeholder, styles.dropdownText]}>
                  {variegation || 'Select...'}
                </Text>
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </TouchableOpacity>
              {showVariegationDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                    {loadingOptions ? (
                      <View style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Loading...</Text>
                      </View>
                    ) : variegationOptions.length > 0 ? (
                      variegationOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleVariegationSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>No options available</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Shipping Index */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Shipping index <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => {
                  closeAllDropdowns();
                  setShowShippingDropdown(!showShippingDropdown);
                }}
              >
                <Text style={[styles.placeholder, styles.dropdownText]}>
                  {shippingIndex || 'Select...'}
                </Text>
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </TouchableOpacity>
              {showShippingDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                    {shippingIndexOptions.length === 0 ? (
                      <TouchableOpacity style={styles.dropdownOption} disabled>
                        <Text style={[styles.dropdownOptionText, {color: '#999'}]}>Loading...</Text>
                      </TouchableOpacity>
                    ) : (
                      shippingIndexOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleShippingSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Acclimation Index */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Acclimation index <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => {
                  closeAllDropdowns();
                  setShowAcclimationDropdown(!showAcclimationDropdown);
                }}
              >
                <Text style={[styles.placeholder, styles.dropdownText]}>
                  {acclimationIndex || 'Select...'}
                </Text>
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </TouchableOpacity>
              {showAcclimationDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                    {acclimationIndexOptions.length === 0 ? (
                      <TouchableOpacity style={styles.dropdownOption} disabled>
                        <Text style={[styles.dropdownOptionText, {color: '#999'}]}>Loading...</Text>
                      </TouchableOpacity>
                    ) : (
                      acclimationIndexOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.dropdownOption}
                          onPress={() => handleAcclimationSelect(option)}
                        >
                          <Text style={styles.dropdownOptionText}>{option.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <View style={styles.buttonText}>
              <Text style={styles.buttonLabel}>Update Species</Text>
            </View>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Navigation / Title Bar: Main
  navigationTitleBar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    position: 'absolute',
    width: '100%',
    height: 106,
    minHeight: 106,
    left: 0,
    top: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  
  // Status Bar
  statusBar: {
    width: '100%',
    height: 48,
    position: 'relative',
  },
  
  // Left Side
  leftSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 54,
    height: 12,
    left: 15,
    top: 18,
  },
  
  // Time
  time: {
    width: 28.43,
    height: 11.09,
    backgroundColor: '#202325',
  },
  
  // Right Side
  rightSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 66.6,
    height: 12,
    right: 15,
    top: 18,
  },
  
  // Mobile Signal
  mobileSignal: {
    width: 17,
    height: 10.67,
    backgroundColor: '#202325',
  },
  
  // Wifi
  wifi: {
    width: 15.27,
    height: 10.97,
    backgroundColor: '#202325',
  },
  
  // Battery
  battery: {
    width: 24.33,
    height: 11.33,
    backgroundColor: '#202325',
  },
  
  // Content - Navigation Header
  navContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 58,
    minHeight: 58,
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 16,
    width: '100%',
    height: 58,
    minHeight: 58,
    position: 'relative',
  },
  
  // Back Button
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  
  // Title
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    marginLeft: -120, // Half of width to center
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  
  // Navigation / Title Bar: Main
  placeholder: {
    width: 24,
    height: 24,
  },
  
  // Form Taxonomy
  
  // Status Bar
  statusBar: {
    width: '100%',
    height: 48,
    position: 'relative',
  },
  
  // Left Side
  leftSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 54,
    height: 12,
    left: 15,
    top: 18,
  },
  
  // Time
  time: {
    width: 28.43,
    height: 11.09,
    backgroundColor: '#202325',
  },
  
  // Right Side
  rightSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 66.6,
    height: 12,
    right: 15,
    top: 18,
  },
  
  // Mobile Signal
  mobileSignal: {
    width: 17,
    height: 10.67,
    backgroundColor: '#202325',
  },
  
  // Wifi
  wifi: {
    width: 15.27,
    height: 10.97,
    backgroundColor: '#202325',
  },
  
  // Battery (Vector)
  battery: {
    width: 24.33,
    height: 11.33,
    backgroundColor: '#202325',
  },
  
  // Nav Content
  navContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 58,
    minHeight: 58,
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    position: 'relative',
  },
  
  // Back
  backButton: {
    width: 24,
    height: 24,
  },
  
  // Title
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    marginLeft: -120, // calc(50% - 240px/2 + 0.5px)
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  
  // Content
  content: {
    flex: 1,
    paddingTop: 106, // Account for navigation bar height
    paddingHorizontal: 16,
    alignItems: 'center', // Center the content
    width: '100%',
  },
  
  scrollContent: {
    flex: 1,
    paddingBottom: 20, // Add some bottom padding
    width: '100%',
  },
  
  // Form Taxonomy
  formTaxonomy: {
    flexDirection: 'column',
    alignItems: 'center', // Center form elements
    padding: 0,
    paddingTop: 18, // Add top padding for better spacing
    width: '100%',
    gap: 16, // Add gap between form elements
  },
  
  // Input Section (Price, Quantity, Variegation, Size)
  inputSection: {
    flexDirection: 'column',
    alignItems: 'center', // Center input elements
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 16,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  
  // Text Field Container
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    minHeight: 78,
    position: 'relative',
    zIndex: 1,
  },
  
  // Label
  label: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
  },
  
  // Asterisk for required fields
  asterisk: {
    color: '#FF0000',
  },
  
  // Text Input (without icon)
  textInput: {
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
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  
  // Text Input (with icon)
  textInputWithIcon: {
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
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  
  // Placeholder/Input Text
  placeholder: {
    flex: 1,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#647276',
    paddingVertical: 0,
  },
  
  // Icon Right
  iconRight: {
    width: 24,
    height: 24,
  },
  
  // Action Section
  actionSection: {
    alignItems: 'center', // Center the button
    paddingTop: 12, // Reduced from 24 to bring button closer
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  
  // Save Button (Controls / Button)
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  
  // Button Text Container
  buttonText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Button Label
  buttonLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Input Container for dropdowns
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  
  // Dropdown Text Style
  dropdownText: {
    color: '#647276',
    textAlign: 'left',
    flex: 1,
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
    flexGrow: 0,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 44,
  },
  dropdownOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flexWrap: 'wrap',
  },
});

export default EditSpecieScreen;
