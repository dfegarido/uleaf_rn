import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, StatusBar, Modal, FlatList, ActivityIndicator, Animated, Alert } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import CheckIcon from '../../../assets/admin-icons/checked-box.svg';
import PhFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IdFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { API_ENDPOINTS, API_CONFIG } from '../../../config/apiConfig';

// Skeleton loading component for the country field
const CountryFieldSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    const pulseTiming = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseTiming.start();
    
    return () => {
      pulseTiming.stop();
    };
  }, [pulseAnim]);
  
  return (
    <View style={styles.textField}>
      <Animated.View 
        style={[
          styles.skeletonText,
          { opacity: pulseAnim }
        ]} 
      />
      <DownIcon width={24} height={24} fill="#CDD3D4" />
    </View>
  );
};

const EnrollAdminHeader = ({insets}) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.headerContainer, {paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Enroll Seller</Text>

        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const EnrollAdmin = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminRole, setAdminRole] = useState('supplier');
  const [gardenName, setGardenName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [allowLiveVideo, setAllowLiveVideo] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryCode, setCountryCode] = useState('+66'); // Thailand country code
  const [selectedFlag, setSelectedFlag] = useState('TH'); // Thailand flag
  const [countryOptions, setCountryOptions] = useState([]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCountryFieldLoading, setIsCountryFieldLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission
  const [errors, setErrors] = useState({});
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); // Initialize navigation
  
  // Animation for skeleton loading effects
  const modalSkeletonAnim = useRef(new Animated.Value(0.3)).current;
  
  // Set up the animation effect
  useEffect(() => {
    const pulseTiming = Animated.loop(
      Animated.sequence([
        Animated.timing(modalSkeletonAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(modalSkeletonAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isLoading) {
      pulseTiming.start();
    }
    
    return () => {
      pulseTiming.stop();
    };
  }, [isLoading, modalSkeletonAnim]);

  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60; // Standard admin tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 16); // At least 16px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 34; // 34px from CSS padding

  // Fetch country dropdown data from API
  const fetchCountryOptions = async () => {
    try {
      setIsLoading(true);
      setIsCountryFieldLoading(true); // Set the field-specific loading state
      
      // Get the auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Use the API endpoint from config
      const response = await fetch(API_ENDPOINTS.GET_COUNTRY, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Check if response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.data)) {
        // Map the response to the format our component expects
        // The API returns objects with a 'country' property instead of 'name'
        const formattedOptions = data.data.map(item => ({
          id: item.id,
          name: item.country, // Map 'country' to 'name' for our component
          order: item.order || 0
        }));
        
        // Sort by order field if available
        formattedOptions.sort((a, b) => a.order - b.order);
        
        setCountryOptions(formattedOptions);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      // Fallback countries in case API fails - prioritizing Philippines, Thailand, and Indonesia
      setCountryOptions([
        { id: 'PH', name: 'Philippines', order: 1 },
        { id: 'TH', name: 'Thailand', order: 2 },
        { id: 'ID', name: 'Indonesia', order: 3 },
        { id: 'US', name: 'United States', order: 4 },
        { id: 'SG', name: 'Singapore', order: 5 }
      ]);
    } finally {
      setIsLoading(false);
      // Add a slight delay before turning off field loading for a better UX
      setTimeout(() => {
        setIsCountryFieldLoading(false);
      }, 500);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country.name);
    setIsCountryModalVisible(false);
    
    // Set country code based on selection
    // Focused on Philippines, Thailand, and Indonesia
    const countryCodes = {
      'Philippines': '+63',
      'Thailand': '+66',
      'Indonesia': '+62',
    };
    
    // Set the flag component based on selected country
    switch(country.name) {
      case 'Philippines':
        setSelectedFlag('PH');
        break;
      case 'Thailand':
        setSelectedFlag('TH');
        break;
      case 'Indonesia':
        setSelectedFlag('ID');
        break;
      default:
        setSelectedFlag('TH'); // Default to Thailand flag
    }
    
    // Update the countryCode state with the corresponding code
    // Default to +66 (Thailand) if not found
    setCountryCode(countryCodes[country.name] || '+66');
  };

  // Handle contact number input to only allow numeric characters
  const handleContactNumberChange = (text) => {
    // Replace any non-numeric characters with an empty string
    const numericValue = text.replace(/[^0-9]/g, '');
    setContactNumber(numericValue);
  };

  const handleSubmit = async () => {
    // Reset previous errors
    setErrors({});
    
    // Validate all required fields
    const newErrors = {};
    
    if (!selectedCountry) newErrors.country = 'Country is required';
    if (!gardenName.trim()) newErrors.gardenName = 'Garden/Company name is required';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Only validate contact number if a country is selected
    if (selectedCountry && !contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }
    
    if (!email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email format is invalid';
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // If no country is selected, show that error
    if (!selectedCountry) {
      setErrors({ country: 'Please select a country first' });
      return;
    }
    
    // Prepare form data for submission
    const formData = {
      profileImage: '', // Default empty as not provided in the form
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumber: `${countryCode}${contactNumber.trim()}`,
      gardenOrCompanyName: gardenName.trim(),
      password: 'securePassword123', // Temporary password that will be changed later
      country: selectedCountry,
      email: email.trim(),
      liveFlag: allowLiveVideo ? 'Yes' : 'No'
    };
    
    try {
      setIsSubmitting(true);
      
      // Get the auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Construct the API URL using the base URL from apiConfig
      const signUpUrl = `${API_CONFIG.BASE_URL}/signUpSupplier`;
      
      // Make the API call
      const response = await fetch(signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to enroll seller');
      }
      
      // Show success message and navigate back
      Alert.alert(
        "Success",
        "Seller enrolled successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      // Show error message
      Alert.alert(
        "Error",
        `Failed to enroll seller: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <EnrollAdminHeader insets={insets} />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, {paddingBottom: totalBottomPadding}]}
        showsVerticalScrollIndicator={false}
      >
        {/* Country Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country <Text style={styles.requiredStar}>*</Text></Text>
            {isCountryFieldLoading ? (
              <CountryFieldSkeleton />
            ) : (
              <TouchableOpacity 
                style={[
                  styles.textField, 
                  errors.country && styles.inputError
                ]}
                onPress={() => {
                  fetchCountryOptions();
                  setIsCountryModalVisible(true);
                }}
              >
                <Text 
                  style={[
                    styles.input, 
                    !selectedCountry && { color: '#647276' }
                  ]}
                >
                  {selectedCountry || "Select country"}
                </Text>
                <DownIcon width={24} height={24} fill="#7F8D91" />
              </TouchableOpacity>
            )}
            {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
          </View>
        </View>

        {/* Garden Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Garden / Company Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.textField, errors.gardenName && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter garden name"
                placeholderTextColor="#647276"
                value={gardenName}
                onChangeText={setGardenName}
              />
            </View>
            {errors.gardenName && <Text style={styles.errorText}>{errors.gardenName}</Text>}
          </View>
        </View>

        {/* First Name Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.textField, errors.firstName && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#647276"
              />
            </View>
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>
        </View>

        {/* Last Name Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.textField, errors.lastName && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor="#647276"
              />
            </View>
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>
        </View>

        {/* Contact Number Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[
              styles.textField, 
              errors.contactNumber && styles.inputError,
              !selectedCountry && styles.disabledField
            ]}>
              <View style={styles.countryCodeSection}>
                <View style={styles.countryFlag}>
                  {selectedFlag === 'PH' && <PhFlag width={24} height={16} />}
                  {selectedFlag === 'TH' && <ThFlag width={24} height={16} />}
                  {selectedFlag === 'ID' && <IdFlag width={24} height={16} />}
                  {!selectedFlag && <View style={styles.emptyFlag} />}
                </View>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <DownIcon width={16} height={16} fill="#202325" />
              </View>
              <TextInput
                style={[
                  styles.input, 
                  styles.phoneInput,
                  !selectedCountry && styles.disabledText
                ]}
                placeholder={selectedCountry ? "Enter phone number" : "Select a country first"}
                placeholderTextColor={selectedCountry ? "#647276" : "#A0AEB4"}
                keyboardType="phone-pad"
                value={contactNumber}
                onChangeText={handleContactNumberChange}
                maxLength={15} // Reasonable limit for phone numbers
                editable={!!selectedCountry}
              />
            </View>
            {!selectedCountry && <Text style={styles.helperText}>Select a country to enable this field</Text>}
            {errors.contactNumber && <Text style={styles.errorText}>{errors.contactNumber}</Text>}
          </View>
        </View>

        {/* Email Address Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.textField, errors.email && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#647276"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        {/* Video Live Switch */}
        <View style={styles.videoLiveContainer}>
          <View style={styles.switchContainer}>
            <TouchableOpacity 
              style={[
                styles.checkbox, 
                allowLiveVideo && styles.checkboxChecked
              ]} 
              onPress={() => setAllowLiveVideo(!allowLiveVideo)}
              activeOpacity={0.7}
            >
              {allowLiveVideo && <CheckIcon width={16} height={16} />}
            </TouchableOpacity>
            <Text style={styles.switchLabel}>Allow video live features</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity 
                onPress={() => setIsCountryModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.skeletonList}>
                  {[...Array(3)].map((_, index) => (
                    <Animated.View 
                      key={index} 
                      style={[
                        styles.countrySkeletonItem,
                        { opacity: modalSkeletonAnim }
                      ]} 
                    />
                  ))}
                </View>
              </View>
            ) : (
              <FlatList
                data={countryOptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      selectedCountry === item.name && styles.selectedCountryItem
                    ]}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text 
                      style={[
                        styles.countryItemText,
                        selectedCountry === item.name && styles.selectedCountryText
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedCountry === item.name && (
                      <CheckIcon width={20} height={20} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>No countries available</Text>
                  </View>
                )}
                contentContainerStyle={countryOptions.length === 0 ? { flex: 1 } : {}}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EnrollAdmin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 2,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 24, // Reduced from 98px to remove excessive gap
    width: '100%', // Use 100% to ensure it spans the width of the screen
    minHeight: 812,
  },
  fieldContainer: {
    flexDirection: 'column',
    alignItems: 'center', // Center the fields
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%', // Use 100% to ensure it spans the width of the screen
    alignSelf: 'center', // Center in parent
  },
  inputGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    maxWidth: 327, // Max width to maintain the design spec
    marginBottom: 8, // Add some bottom margin for spacing
    alignSelf: 'center', // Center in parent
  },
  label: {
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    padding: 0,
  },
  countryCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 75, // Increased width to accommodate "+66"
    height: 20,
  },
  countryFlag: {
    width: 24,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyFlag: {
    width: 24,
    height: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
  },
  countryCode: {
    width: 30, // Increased width to fit "+66"
    height: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#202325',
  },
  phoneInput: {
    width: 208, // Adjusted to accommodate wider country code section
  },
  videoLiveContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    maxWidth: 327,
    height: 24,
  },
  checkbox: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  switchLabel: {
    fontFamily: 'Inter',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  actionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 24,
    width: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#8FB89A',
  },
  submitText: {
    width: 55,
    height: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8F9AA3',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCountryItem: {
    backgroundColor: '#EAF2EC',
  },
  countryItemText: {
    fontSize: 16,
    color: '#393D40',
  },
  selectedCountryText: {
    fontWeight: '600',
    color: '#539461',
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 16,
    color: '#8F9AA3',
    textAlign: 'center',
  },
  skeletonText: {
    height: 20,
    width: '80%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    flex: 1,
    marginRight: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#647276',
  },
  skeletonList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  countrySkeletonItem: {
    height: 56,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  requiredStar: {
    color: '#EB5757',
    fontSize: 14,
    fontWeight: '400',
  },
  inputError: {
    borderColor: '#EB5757',
  },
  errorText: {
    color: '#EB5757',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  helperText: {
    color: '#647276',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  disabledField: {
    backgroundColor: '#F5F7F8',
    borderColor: '#E5E7EB',
  },
  disabledText: {
    color: '#A0AEB4',
  },
});