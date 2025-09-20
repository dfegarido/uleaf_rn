import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAddressBookEntryApi, updateAddressBookEntryApi } from '../../../components/Api';
import DropdownSelect from '../../../components/Dropdown/DropdownSelect';
// GeoDB API for location data using centralized config
import { getUSStatesSimple, getStateCitiesSimple } from '../../../components/Api/geoDbApi';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

// Restricted states and territories configuration
const RESTRICTED_LOCATIONS = {
  STATES: [
    'Alaska',
    'Hawaii'
  ],
  TERRITORIES: [
    'Puerto Rico',
    'Guam', 
    'American Samoa',
    'U.S. Virgin Islands',
    'United States Virgin Islands',
    'Northern Mariana Islands',
    'Commonwealth of the Northern Mariana Islands'
  ],
  // ISO codes for restricted locations
  RESTRICTED_CODES: [
    'AK', // Alaska
    'HI', // Hawaii
    'PR', // Puerto Rico
    'GU', // Guam
    'AS', // American Samoa
    'VI', // U.S. Virgin Islands
    'MP'  // Northern Mariana Islands
  ]
};

// Filter function to remove restricted states/territories
const filterRestrictedStates = (states) => {
  return states.filter(state => {
    // Check by ISO code (most reliable)
    if (RESTRICTED_LOCATIONS.RESTRICTED_CODES.includes(state.isoCode)) {
      console.log(`🚫 Filtering out restricted state: ${state.name} (${state.isoCode})`);
      return false;
    }
    
    // Check by name (backup method)
    const stateName = state.name;
    const isRestrictedState = RESTRICTED_LOCATIONS.STATES.some(restricted => 
      stateName.toLowerCase().includes(restricted.toLowerCase())
    );
    const isRestrictedTerritory = RESTRICTED_LOCATIONS.TERRITORIES.some(restricted => 
      stateName.toLowerCase().includes(restricted.toLowerCase())
    );
    
    if (isRestrictedState || isRestrictedTerritory) {
      console.log(`🚫 Filtering out restricted location: ${stateName}`);
      return false;
    }
    
    return true;
  });
};

// Filter function to remove cities in restricted territories
const filterRestrictedCities = (cities, stateData) => {
  // If the state itself is restricted, return empty array
  if (RESTRICTED_LOCATIONS.RESTRICTED_CODES.includes(stateData?.isoCode)) {
    console.log(`🚫 State ${stateData.name} is restricted - no cities will be shown`);
    return [];
  }
  
  // Filter out cities that might be in territories
  return cities.filter(cityName => {
    const isInTerritory = RESTRICTED_LOCATIONS.TERRITORIES.some(territory => 
      cityName.toLowerCase().includes(territory.toLowerCase())
    );
    
    if (isInTerritory) {
      console.log(`🚫 Filtering out city in restricted territory: ${cityName}`);
      return false;
    }
    
    return true;
  });
};

const UpdateAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const addressToUpdate = route.params?.address;
  
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedStateData, setSelectedStateData] = useState(null); // Store both name and isoCode
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressId, setAddressId] = useState(null);
  
  // States and cities from GeoDB API
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [loadingMoreStates, setLoadingMoreStates] = useState(false);
  const [loadingMoreCities, setLoadingMoreCities] = useState(false);
  const [statesPagination, setStatesPagination] = useState({
    offset: 0,
    hasMore: true,
    totalCount: 0
  });
  const [citiesPagination, setCitiesPagination] = useState({
    offset: 0,
    hasMore: true,
    totalCount: 0
  });
  
  // User info from AsyncStorage
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    contactNumber: ''
  });
  
  // Load states from GeoDB API with pagination
  const loadStates = async (isLoadMore = false) => {
    try {
      const currentOffset = isLoadMore ? statesPagination.offset : 0;
      console.log(`🇺🇸 Loading US states from GeoDB API... (offset: ${currentOffset})`);
      
      if (isLoadMore) {
        setLoadingMoreStates(true);
      } else {
        setStatesLoading(true);
        setStates([]); // Clear existing states for fresh load
        setStatesPagination({
          offset: 0,
          hasMore: true,
          totalCount: 0
        });
      }
      
      const response = await getUSStatesSimple(5, currentOffset);
      
      if (response.success && response.states) {
        // Transform to match existing component structure
        const stateList = response.states.map(state => ({
          name: state.name,
          isoCode: state.code,
          id: state.id
        }));
        
        // Filter out restricted states and territories
        const filteredStates = filterRestrictedStates(stateList);
        console.log(`📊 Filtered ${stateList.length - filteredStates.length} restricted states/territories`);
        
        // Sort alphabetically
        filteredStates.sort((a, b) => a.name.localeCompare(b.name));
        
        if (isLoadMore) {
          // Append to existing states
          setStates(prevStates => [...prevStates, ...filteredStates]);
        } else {
          // Replace states
          setStates(filteredStates);
        }
        
        // Update pagination state
        setStatesPagination({
          offset: currentOffset + 5,
          hasMore: response.hasMore,
          totalCount: response.totalCount
        });
        
        console.log(`✅ Successfully loaded ${filteredStates.length} US states from GeoDB API (total: ${isLoadMore ? states.length + filteredStates.length : filteredStates.length}, hasMore: ${response.hasMore})`);
      } else {
        console.error('❌ GeoDB API returned error:', response.error);
        throw new Error(response.error || 'Failed to load states from GeoDB');
      }
    } catch (error) {
      console.error('❌ Error loading states from GeoDB API:', error.message);
      
      if (!isLoadMore) {
        Alert.alert(
          'Location Service Issue', 
          'Could not load states from location service. Using fallback list.',
          [{ text: 'OK' }]
        );
        
        // Fallback to common states if GeoDB fails (excluding restricted states)
        const fallbackStates = [
          { name: 'California', isoCode: 'CA' },
          { name: 'Texas', isoCode: 'TX' },
          { name: 'New York', isoCode: 'NY' },
          { name: 'Florida', isoCode: 'FL' },
          { name: 'Illinois', isoCode: 'IL' },
          { name: 'Pennsylvania', isoCode: 'PA' },
          { name: 'Ohio', isoCode: 'OH' },
          { name: 'Georgia', isoCode: 'GA' },
          { name: 'North Carolina', isoCode: 'NC' },
          { name: 'Michigan', isoCode: 'MI' },
          { name: 'Virginia', isoCode: 'VA' },
          { name: 'Washington', isoCode: 'WA' },
          { name: 'Arizona', isoCode: 'AZ' },
          { name: 'Massachusetts', isoCode: 'MA' },
          { name: 'Tennessee', isoCode: 'TN' }
        ];
        
        // Apply filtering to fallback states as well
        const filteredFallbackStates = filterRestrictedStates(fallbackStates);
        setStates(filteredFallbackStates);
        setStatesPagination({
          offset: filteredFallbackStates.length,
          hasMore: false,
          totalCount: filteredFallbackStates.length
        });
      }
    } finally {
      if (isLoadMore) {
        setLoadingMoreStates(false);
      } else {
        setStatesLoading(false);
      }
    }
  };

  // Load states from GeoDB API
  useEffect(() => {
    loadStates();
  }, []);

  // Load more states when reaching end of list
  const loadMoreStates = async () => {
    if (!statesPagination.hasMore || loadingMoreStates) return;
    await loadStates(true);
  };

  // Load cities when state changes using GeoDB API with pagination
  const loadCities = async (isLoadMore = false) => {
    if (!selectedStateData) {
      setCities([]);
      setCitiesPagination({
        offset: 0,
        hasMore: true,
        totalCount: 0
      });
      return;
    }

    try {
      const currentOffset = isLoadMore ? citiesPagination.offset : 0;
      console.log(`🏙️ Loading cities for state from GeoDB API: ${selectedStateData.name} (offset: ${currentOffset})`);
      
      if (isLoadMore) {
        setLoadingMoreCities(true);
      } else {
        setCitiesLoading(true);
        setCities([]); // Clear existing cities for fresh load
        setCitiesPagination({
          offset: 0,
          hasMore: true,
          totalCount: 0
        });
      }
      
      // Load cities from GeoDB API
      const response = await getStateCitiesSimple(selectedStateData.isoCode, 5, currentOffset);
      
      if (response.success && response.cities && response.cities.length > 0) {
        // Extract just city names and remove duplicates
        const cityNames = [...new Set(response.cities.map(city => city.name))];
        
        // Filter out cities in restricted territories
        const filteredCities = filterRestrictedCities(cityNames, selectedStateData);
        console.log(`📊 Filtered ${cityNames.length - filteredCities.length} cities in restricted territories`);
        
        // Sort alphabetically
        filteredCities.sort();
        
        if (isLoadMore) {
          // Append to existing cities
          setCities(prevCities => {
            const combined = [...prevCities, ...filteredCities];
            return [...new Set(combined)]; // Remove duplicates across pages
          });
        } else {
          // Replace cities
          setCities(filteredCities);
        }
        
        // Update pagination state
        setCitiesPagination({
          offset: currentOffset + 5,
          hasMore: response.hasMore,
          totalCount: response.totalCount
        });
        
        console.log(`✅ Successfully loaded ${filteredCities.length} filtered cities for ${selectedStateData.name} (original: ${cityNames.length}, hasMore: ${response.hasMore})`);
      } else {
        console.log(`⚠️ No cities found for ${selectedStateData.name} from GeoDB API`);
        
        if (!isLoadMore) {
          // Provide option to enter manually
          setCities(['Enter city manually']);
          setCitiesPagination({
            offset: 1,
            hasMore: false,
            totalCount: 1
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading cities from GeoDB API:', error.message);
      console.log('📝 Providing manual entry option for cities');
      
      if (!isLoadMore) {
        // Fallback option
        setCities(['Enter city manually']);
        setCitiesPagination({
          offset: 1,
          hasMore: false,
          totalCount: 1
        });
      }
    } finally {
      if (isLoadMore) {
        setLoadingMoreCities(false);
      } else {
        setCitiesLoading(false);
      }
    }
  };

  // Load cities for selected state via GeoDB API
  useEffect(() => {
    loadCities();
  }, [selectedStateData]);

  // Load more cities when reaching end of list
  const loadMoreCities = async () => {
    if (!citiesPagination.hasMore || loadingMoreCities || !selectedStateData) return;
    await loadCities(true);
  };

  // Load user info from AsyncStorage and initialize address data
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo({
            firstName: parsedUserInfo.firstName || '',
            lastName: parsedUserInfo.lastName || '',
            contactNumber: parsedUserInfo.contactNumber || parsedUserInfo.phoneNumber || ''
          });
        }
      } catch (error) {
        console.log('Error loading user info:', error);
      }
    };

    loadUserInfo();
    
    // Initialize form with address data if updating
    if (addressToUpdate) {
      console.log('Loading address to update:', addressToUpdate);
      setStreet(addressToUpdate.address || '');
      setCity(addressToUpdate.city || '');
      setState(addressToUpdate.state || '');
      setZipCode(addressToUpdate.zipCode || '');
      setAddressId(addressToUpdate.entryId || addressToUpdate.id);
      
      // Set the selected state data when we have it
      if (addressToUpdate.state) {
        // We'll find and set the state object when states are loaded
        const stateObj = {
          name: addressToUpdate.state,
          isoCode: addressToUpdate.stateCode || '',
        };
        setSelectedStateData(stateObj);
      }
    }
  }, [addressToUpdate]);

  const handleSaveAddress = async () => {
    // Validation
    if (!street.trim()) {
      Alert.alert('Error', 'Please enter street address');
      return;
    }
    // if (!city.trim()) {
    //   Alert.alert('Error', 'Please select a city');
    //   return;
    // }
    if (!state.trim()) {
      Alert.alert('Error', 'Please select a state');
      return;
    }

    setLoading(true);
    
    try {
      const addressData = {
        firstName: userInfo.firstName || "John Doe",
        lastName: userInfo.lastName || "John Doe", 
        contactNumber: userInfo.contactNumber || "+1234567890",
        address: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: 'United States',
        isDefault: addressToUpdate ? addressToUpdate.isDefault : false
      };

      let response;
      
      if (addressId) {
        // Update existing address
        response = await updateAddressBookEntryApi(addressId, addressData);
      } else {
        // Create new address
        response = await createAddressBookEntryApi(addressData);
      }
      
      if (response?.success) {
        Alert.alert(
          'Success', 
          addressId ? 'Address updated successfully!' : 'Address added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response?.message || addressId ? 'Failed to update address' : 'Failed to add address');
      }
    } catch (error) {
      console.log('Error saving address:', error);
      Alert.alert(
        'Error', 
        error.message || addressId ? 'Failed to update address. Please try again.' : 'Failed to add address. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger to load more states when user clicks on dropdown
  const handleStateDropdownClick = async () => {
    // If we already have states loaded or are loading, don't fetch more
    if (states.length > 10 || statesLoading) {
      return;
    }
    
    // Load more states using GeoDB API
    await loadMoreStates();
  };

  // Load cities when city dropdown is clicked
  const handleCityDropdownClick = () => {
    if (selectedStateData && cities.length === 0 && !citiesLoading) {
      // Trigger city loading
      loadCities();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{addressId ? 'Update Address' : 'Add New Address'}</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* State */}
          <DropdownSelect
            label="State"
            placeholder={statesLoading ? "Loading states..." : "Select"}
            value={state}
            data={Array.from(new Set(states.map(stateObj => stateObj.name))).sort()} // Ensure unique state names
            onSelect={(selectedStateName) => {
              const selectedStateObj = states.find(stateObj => stateObj.name === selectedStateName);
              
              // Add a flag to indicate this change was triggered by user interaction
              if (selectedStateObj) {
                selectedStateObj._userTriggered = true;
              }
              
              setState(selectedStateName);
              setSelectedStateData(selectedStateObj);
              
              // Only reset city when state changes and we're not editing an existing address
              // Or if we're editing but changing to a different state
              if (!addressToUpdate || (addressToUpdate && selectedStateName !== addressToUpdate.state)) {
                setCity('');
              }
            }}
            onPress={handleStateDropdownClick}
            required={true}
            disabled={statesLoading}
            onEndReached={loadMoreStates}
            loading={loadingMoreStates}
          />
          
          {/* City */}
          <DropdownSelect
            label="City"
            placeholder={
              citiesLoading 
                ? "Loading cities..." 
                : selectedStateData 
                  ? "Select city" 
                  : "Select state first"
            }
            value={city}
            // data={Array.from(new Set(cities)).sort()} // Ensure unique city names
            // onSelect={(selectedCity) => {
            //   setCity(selectedCity);
            // }}
            // onPress={handleCityDropdownClick}
            required={true}
            disabled={true}
            // onEndReached={loadMoreCities}
            // loading={loadingMoreCities}
          />

          {/* Zip Code (disabled) */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>Zip Code</Text>
              <View style={[styles.textField, styles.textFieldDisabled]}>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="Zip code"
                  placeholderTextColor="#9AA0A0"
                  value={zipCode}
                  editable={false}
                  selectTextOnFocus={false}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Address Line */}
          <View style={styles.addressLineSection}>
            <View style={styles.addressFieldWrap}>
              <Text style={styles.inputLabel}>Address Line<Text style={{color: '#E53935'}}>*</Text></Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter street address"
                  placeholderTextColor="#647276"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>
              <Text style={styles.helperText}>Street address, apartment, suite, unit, building, floor, etc.</Text>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[
              styles.saveBtn, 
              styles.saveBtnEnabled
            ]} 
            onPress={handleSaveAddress}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{addressId ? 'Save Changes' : 'Add Address'}</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    width: '100%',
    minHeight: '100%',
    flexGrow: 1,
    paddingBottom: 34,
    paddingTop: 0,
  },
  formContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
    width: 375,
    height: 540,
    alignSelf: 'center',
    flexGrow: 0,
  },
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
  addressLineSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 150,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  addressFieldWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    width: 327,
    height: 126,
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
  textFieldDisabled: {
    backgroundColor: '#F1F3F3',
    borderColor: '#CDD3D4',
  },
  input: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
    flexGrow: 1,
    padding: 0,
  },
  disabledInput: {
    color: '#94A0A0',
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
  helperText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#647276',
    width: 327,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: 375,
    height: 84,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    flexGrow: 1,
  },
  saveBtnEnabled: {
    backgroundColor: '#539461',
  },
  saveBtnDisabled: {
    backgroundColor: '#CDD3D4',
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    width: 100,
    height: 16,
  },
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
    zIndex: 1,
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
});

export default UpdateAddressScreen;
