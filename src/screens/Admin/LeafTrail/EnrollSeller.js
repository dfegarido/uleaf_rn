import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, StatusBar, Modal, FlatList, ActivityIndicator, Animated, Alert, Dimensions, Platform } from 'react-native';
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

const EnrollSellerHeader = ({insets}) => {
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

        <Text style={styles.headerTitle}>Enrol Seller</Text>

        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const EnrollSeller = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sellerRole, setSellerRole] = useState('supplier');
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
    // Start the pulsing animation for skeleton loaders in the modal
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
    
    pulseTiming.start();
    
    return () => {
      pulseTiming.stop();
    };
  }, [modalSkeletonAnim]);
  
  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60; // Standard admin tab bar height
  
  useEffect(() => {
    // Fetch available countries when the component mounts
    const fetchCountries = async () => {
      setIsCountryFieldLoading(true);
      try {
        // Simulate API call with timeout
        // In a real app, you would fetch from an API
        setTimeout(() => {
          const availableCountries = [
            { 
              name: 'Philippines',
              code: 'PH',
              flag: PhFlag,
              dialCode: '+63'
            },
            { 
              name: 'Thailand',
              code: 'TH',
              flag: ThFlag,
              dialCode: '+66'
            },
            { 
              name: 'Indonesia',
              code: 'ID',
              flag: IdFlag, 
              dialCode: '+62'
            }
          ];
          
          setCountryOptions(availableCountries);
          setIsCountryFieldLoading(false);
        }, 800); // Simulate network delay
      } catch (error) {
        console.error('Error fetching countries:', error);
        setIsCountryFieldLoading(false);
      }
    };
    
    fetchCountries();
  }, []);
  
  const handleCountrySelect = (country) => {
    setSelectedCountry(country.name);
    setSelectedFlag(country.code);
    setCountryCode(country.dialCode);
    setIsCountryModalVisible(false);
    
    // Clear any country-related errors when a country is selected
    if (errors.country) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.country;
        return newErrors;
      });
    }
  };
  
  // Handle phone number input to ensure only numbers
  const handlePhoneNumberChange = (text) => {
    // Remove any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setContactNumber(numericValue);
  };

  const handleSubmit = async () => {
    // Reset previous errors
    setErrors({});
    console.log('Starting form submission');
    
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
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }
    
    // If no country is selected, show that error
    if (!selectedCountry) {
      console.log('Country selection error');
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
      country: selectedCountry, // Use the 2-letter country code instead of the full name
      email: email.trim(),
      liveFlag: allowLiveVideo ? 'Yes' : 'No'
    };
    
    console.log('Submitting form data:', JSON.stringify(formData, null, 2));
    try {
      setIsSubmitting(true);
      
      // Get the auth token
      const authToken = await getStoredAuthToken();
      console.log('Auth token retrieved:', authToken ? 'Token exists' : 'No token');
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Construct the API URL using the base URL from apiConfig
      const signUpUrl = `${API_CONFIG.BASE_URL}/signUpSupplier`;
      console.log('API endpoint:', signUpUrl);
      
      // Make the API call
      console.log('Sending API request...');
      const response = await fetch(signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('Error parsing JSON response:', e.message);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.log('API error:', responseData.error || 'Unknown error');
        throw new Error(responseData.error || responseData.message || 'Failed to enrol seller');
      }
      
      console.log('Success response:', responseData);
      
      // Show success message and navigate back
      Alert.alert(
        "Success",
        "Seller enrolled successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error details:', error.stack);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to enrol seller: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <EnrollSellerHeader insets={insets} />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.contentContainer,
          {paddingBottom: insets.bottom + tabBarHeight + 20}
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Form Title */}
          <Text style={styles.formTitle}>Seller Information</Text>
          
          {/* Country Selection Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Country <Text style={styles.requiredStar}>*</Text>
            </Text>
            {isCountryFieldLoading ? (
              <CountryFieldSkeleton />
            ) : (
              <TouchableOpacity
                style={[
                  styles.textField,
                  errors.country && styles.errorField
                ]}
                onPress={() => setIsCountryModalVisible(true)}
              >
                {selectedCountry ? (
                  <View style={styles.selectedCountryContainer}>
                    {selectedFlag === 'PH' && <PhFlag width={24} height={24} />}
                    {selectedFlag === 'TH' && <ThFlag width={24} height={24} />}
                    {selectedFlag === 'ID' && <IdFlag width={24} height={24} />}
                    <Text style={styles.textValue}>{selectedCountry}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select Country</Text>
                )}
                <DownIcon width={24} height={24} fill="#CDD3D4" />
              </TouchableOpacity>
            )}
            {errors.country && (
              <Text style={styles.errorText}>{errors.country}</Text>
            )}
          </View>
          
          {/* Garden/Company Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Garden/Company Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                errors.gardenName && styles.errorField
              ]}
              placeholder="Enter garden or company name"
              placeholderTextColor="#9CA3AF"
              value={gardenName}
              onChangeText={setGardenName}
            />
            {errors.gardenName && (
              <Text style={styles.errorText}>{errors.gardenName}</Text>
            )}
          </View>
          
          {/* First Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              First Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                errors.firstName && styles.errorField
              ]}
              placeholder="Enter first name"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>
          
          {/* Last Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Last Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                errors.lastName && styles.errorField
              ]}
              placeholder="Enter last name"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
          
          {/* Contact Number Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Contact Number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[
              styles.phoneInputContainer,
              errors.contactNumber && styles.errorField
            ]}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={contactNumber}
                onChangeText={handlePhoneNumberChange}
              />
            </View>
            {errors.contactNumber && (
              <Text style={styles.errorText}>{errors.contactNumber}</Text>
            )}
          </View>
          
          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Email Address <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                errors.email && styles.errorField
              ]}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>
          
          {/* Live Video Option */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAllowLiveVideo(!allowLiveVideo)}
            >
              {allowLiveVideo ? (
                <CheckIcon width={24} height={24} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              Allow seller to do live video selling
            </Text>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCountryModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={countryOptions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => handleCountrySelect(item)}
                >
                  <View style={styles.countryFlag}>
                    <item.flag width={32} height={32} />
                  </View>
                  <Text style={styles.countryName}>{item.name}</Text>
                  {selectedCountry === item.name && (
                    <CheckIcon width={24} height={24} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  formContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#1F2937',
  },
  placeholderText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  textValue: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 8,
  },
  errorField: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
  },
  selectedCountryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  countryCodeText: {
    fontSize: 15,
    color: '#1F2937',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    height: 24,
    width: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    height: 24,
    width: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  countryFlag: {
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  skeletonText: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  requiredStar: {
    color: '#EB5757',
    fontSize: 14,
    fontWeight: '400',
  }
});

export default EnrollSeller;
