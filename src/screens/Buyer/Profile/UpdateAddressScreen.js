import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAddressBookEntryApi, updateAddressBookEntryApi, getCitiesByStateApi } from '../../../components/Api';
import InputDropdownPaginated from '../../../components/Input/InputDropdownPaginated';
// Backend API for location data from dropdown_state collection
import { getStatesFromBackend } from '../../../components/Api/geoDbApi';
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
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [autoFilledFromAddress, setAutoFilledFromAddress] = useState(false);
  const addressTimeoutRef = useRef(null);
  
  // States and cities from GeoDB API
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [loadingMoreStates, setLoadingMoreStates] = useState(false);
  const [loadingMoreCities, setLoadingMoreCities] = useState(false);
  const [statesOffset, setStatesOffset] = useState(0);
  const [citiesOffset, setCitiesOffset] = useState(0);
  const citiesOffsetRef = useRef(0); // Use ref to track offset without causing re-renders
  const [statesHasMore, setStatesHasMore] = useState(true);
  const [citiesHasMore, setCitiesHasMore] = useState(true);
  
  // User info from AsyncStorage
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    contactNumber: ''
  });
  
  // Load states from backend (dropdown_state collection) with pagination
  const loadStates = useCallback(async (isLoadMore = false) => {
    try {
      const currentPage = isLoadMore ? Math.floor(statesOffset / 50) + 1 : 1;
      console.log(`🔥 Loading US states from backend... (page: ${currentPage})`);
      
      if (isLoadMore) {
        setLoadingMoreStates(true);
      } else {
        setStatesLoading(true);
        setStates([]); // Clear existing states for fresh load
        setStatesOffset(0);
      }
      
      const response = await getStatesFromBackend(50, currentPage);
      
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
          setStatesOffset(prevOffset => prevOffset + filteredStates.length);
        } else {
          // Replace states
          setStates(filteredStates);
          setStatesOffset(filteredStates.length);
        }
        
        // Update pagination state
        setStatesHasMore(response.hasMore);
        
        console.log(`✅ Successfully loaded ${filteredStates.length} US states from backend (total: ${isLoadMore ? states.length + filteredStates.length : filteredStates.length}, hasMore: ${response.hasMore})`);
      } else {
        console.error('❌ Backend API returned error:', response.error);
        throw new Error(response.error || 'Failed to load states from backend');
      }
    } catch (error) {
      console.error('❌ Error loading states from backend:', error.message);
      
      if (!isLoadMore) {
        Alert.alert(
          'Location Service Issue', 
          'Could not load states from backend. Using fallback list.',
          [{ text: 'OK' }]
        );
        
        // Fallback to common states if backend fails (excluding restricted states)
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
        setStatesHasMore(false);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMoreStates(false);
      } else {
        setStatesLoading(false);
      }
    }
  }, [statesOffset]); // Only re-create if offset changes

  useEffect(() => {
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, loadStates is stable due to useCallback

  // Load more states when reaching end of list
  const loadMoreStates = useCallback(async () => {
    if (!statesHasMore || loadingMoreStates) {
      console.log('⏭️ Skipping loadMoreStates - hasMore:', statesHasMore, 'loading:', loadingMoreStates);
      return;
    }
    console.log('📜 Loading more states...');
    await loadStates(true);
  }, [statesHasMore, loadingMoreStates, loadStates]);

  // Load cities when state changes using GeoDB API with pagination
  const loadCities = useCallback(async (isLoadMore = false) => {
    if (!selectedStateData) {
      setCities([]);
      setCitiesOffset(0);
      citiesOffsetRef.current = 0;
      setCitiesHasMore(true);
      return;
    }

    try {
      // Use ref to get current offset without it being a dependency
      const currentOffset = isLoadMore ? citiesOffsetRef.current : 0;
      console.log(`🏙️ Loading cities for state from GeoDB API: ${selectedStateData.name} (offset: ${currentOffset})`);
      
      if (isLoadMore) {
        setLoadingMoreCities(true);
      } else {
        setCitiesLoading(true);
        setCities([]); // Clear existing cities for fresh load
        setCitiesOffset(0);
        citiesOffsetRef.current = 0;
      }
      
      // Load cities from cached backend API (faster and no rate limits)
      const response = await getCitiesByStateApi(selectedStateData.isoCode, 50, currentOffset, '');
      
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
        const newOffset = currentOffset + 50;
        setCitiesOffset(newOffset);
        citiesOffsetRef.current = newOffset;
        setCitiesHasMore(response.hasMore);
        
        console.log(`✅ Successfully loaded ${filteredCities.length} filtered cities for ${selectedStateData.name} (cached: ${response.cached}, hasMore: ${response.hasMore})`);
      } else {
        console.log(`⚠️ No cities found for ${selectedStateData.name}`);
        
        if (!isLoadMore) {
          setCities(['Enter city manually']);
          setCitiesHasMore(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading cities:', error.message);
      console.log('📝 Providing manual entry option for cities');
      
      if (!isLoadMore) {
        setCities(['Enter city manually']);
        setCitiesHasMore(false);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMoreCities(false);
      } else {
        setCitiesLoading(false);
      }
    }
  }, [selectedStateData]); // Only depend on selectedStateData

  // Call loadCities when selectedStateData changes
  useEffect(() => {
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStateData]); // Only trigger when selectedStateData changes, not when loadCities function changes

  // Load more cities when reaching end of list
  const loadMoreCities = useCallback(async () => {
    if (!citiesHasMore || loadingMoreCities || !selectedStateData) {
      console.log('⏭️ Skipping loadMoreCities - hasMore:', citiesHasMore, 'loading:', loadingMoreCities, 'hasState:', !!selectedStateData);
      return;
    }
    console.log('📜 Loading more cities...');
    await loadCities(true);
  }, [citiesHasMore, loadingMoreCities, selectedStateData, loadCities]);

  // Handle address input with autocomplete (using Nominatim - FREE!)
  const handleAddressChange = useCallback((text) => {
    setStreet(text);
    setAutoFilledFromAddress(false);
    
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }
    
    if (text.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    addressTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(text)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `countrycodes=us&` +
          `limit=5`,
          {
            headers: {
              'User-Agent': 'iLeafU-App/1.0'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const suggestions = data.map(item => ({
            place_id: item.place_id,
            description: item.display_name,
            address: item.address,
            lat: item.lat,
            lon: item.lon
          }));
          setAddressSuggestions(suggestions);
        } else {
          setAddressSuggestions([]);
        }
      } catch (error) {
        console.error('❌ Error fetching address suggestions:', error);
        setAddressSuggestions([]);
      }
    }, 800);
  }, []);

  // Handle selecting an address suggestion (Nominatim format)
  const handleSelectSuggestion = useCallback((suggestion) => {
    try {
      console.log('📍 Selected suggestion:', suggestion);
      const addr = suggestion.address;
      
      const houseNumber = addr.house_number || '';
      const road = addr.road || addr.street || '';
      const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const stateName = addr.state || '';
      const zipCodeValue = addr.postcode || '';
      
      let streetAddress = '';
      if (houseNumber && road) {
        streetAddress = `${houseNumber} ${road}`.trim();
      } else if (road) {
        streetAddress = road;
      } else {
        const parts = suggestion.description.split(',');
        streetAddress = parts[0].trim();
      }
      
      setStreet(streetAddress);
      
      if (stateName) {
        setState(stateName);
        const stateData = states.find(s => 
          s.name.toLowerCase() === stateName.toLowerCase() ||
          s.isoCode === addr.state_code
        );
        if (stateData) {
          setSelectedStateData(stateData);
        }
      }
      
      if (cityName) {
        setCity(cityName);
      }
      
      if (zipCodeValue) {
        setZipCode(zipCodeValue);
      }
      
      setAutoFilledFromAddress(true);
      setAddressSuggestions([]);
      
      console.log('✅ Address auto-filled successfully!');
    } catch (error) {
      console.error('❌ Error parsing address:', error);
      const parts = suggestion.description.split(',');
      setStreet(parts[0].trim());
      setAddressSuggestions([]);
    }
  }, [states]);

  // Handle city search (auto-search with backend caching)
  const handleCitySearch = useCallback(async (searchText) => {
    if (!selectedStateData) {
      console.log('⚠️ No state selected, cannot search cities');
      return;
    }

    try {
      setCitiesLoading(true);
      setCitiesOffset(0);
      citiesOffsetRef.current = 0;
      
      console.log(`🔍 Searching cities in ${selectedStateData.name} with query: "${searchText}"`);
      
      // Use cached backend endpoint instead of external API
      const response = await getCitiesByStateApi(
        selectedStateData.isoCode,
        50, // Higher limit for better UX (backend is cached)
        0,   // Reset offset
        searchText  // Search query
      );
      
      if (response.success && response.cities && response.cities.length > 0) {
        const cityNames = [...new Set(response.cities.map(city => city.name))];
        const filteredCities = filterRestrictedCities(cityNames, selectedStateData);
        filteredCities.sort();
        
        setCities(filteredCities);
        setCitiesHasMore(response.hasMore);
        
        console.log(`✅ Search complete: ${filteredCities.length} cities found ${response.cached ? '(cached)' : '(fresh)'}`);
      } else {
        console.log(`⚠️ No cities found for search: "${searchText}"`);
        setCities([]);
        setCitiesHasMore(false);
      }
    } catch (error) {
      console.error('❌ Error searching cities:', error.message);
      setCities([]);
      setCitiesHasMore(false);
    } finally {
      setCitiesLoading(false);
    }
  }, [selectedStateData]);

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
    }
  }, [addressToUpdate]);

  // Update selectedStateData when states are loaded and we have an address to update
  useEffect(() => {
    if (states.length > 0 && addressToUpdate && addressToUpdate.state && !selectedStateData) {
      const stateObj = states.find(s => s.name === addressToUpdate.state);
      if (stateObj) {
        console.log('🔄 Setting selectedStateData from loaded states:', stateObj);
        setSelectedStateData(stateObj);
      }
    }
  }, [states.length, addressToUpdate?.state]); // Only react to states length change and address state, not the full states array

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
          {/* Address Line - First with autocomplete */}
          <View style={styles.addressLineSection}>
            <View style={styles.addressFieldWrap}>
              <Text style={styles.inputLabel}>Address Line<Text style={{color: '#E53935'}}>*</Text></Text>
              <View style={styles.addressInputWrapper}>
                <View style={styles.textField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type to search address..."
                    placeholderTextColor="#647276"
                    value={street}
                    onChangeText={handleAddressChange}
                  />
                </View>
                {addressSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView 
                      style={styles.suggestionsScrollView}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      {addressSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => handleSelectSuggestion(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <Text style={styles.helperText}>Street address, apartment, suite, unit, building, floor, etc.</Text>
            </View>
          </View>

          {/* State - Auto-populated */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>
                State<Text style={{color: '#FF5247'}}>*</Text>
              </Text>
              <InputDropdownPaginated
                options={states.map(s => s.name)}
                selectedOption={state}
                onSelect={(selectedStateName) => {
                  const sel = states.find(s => s.name === selectedStateName);
                  setState(selectedStateName);
                  setSelectedStateData(sel);
                  
                  // Only reset city when state changes and we're not editing an existing address
                  // Or if we're editing but changing to a different state
                  if (!addressToUpdate || (addressToUpdate && selectedStateName !== addressToUpdate.state)) {
                    setCity('');
                  }
                }}
                placeholder={state || (statesLoading ? "Loading US states..." : "Select or type address...")}
                disabled={statesLoading}
                onLoadMore={loadMoreStates}
                hasMore={statesHasMore}
                loadingMore={loadingMoreStates}
              />
            </View>
          </View>
          
          {/* City - Auto-populated */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>
                City<Text style={{color: '#FF5247'}}>*</Text>
              </Text>
              <InputDropdownPaginated
                options={cities}
                selectedOption={city}
                onSelect={setCity}
                placeholder={
                  city || (citiesLoading 
                    ? "Loading cities..." 
                    : selectedStateData 
                      ? "Select or type address..." 
                      : "Type address or select state")
                }
                disabled={citiesLoading}
                onLoadMore={loadMoreCities}
                hasMore={citiesHasMore}
                loadingMore={loadingMoreCities}
                enableServerSearch={true}
                onSearch={handleCitySearch}
              />
            </View>
          </View>

          {/* Zip Code - Auto-populated */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>
                Zip Code<Text style={{color: '#FF5247'}}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.input}
                  placeholder="Auto-filled from address"
                  placeholderTextColor="#9AA0A0"
                  value={zipCode}
                  onChangeText={setZipCode}
                  editable={true}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
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
    overflow: 'visible', // Allow suggestions to overflow
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
    zIndex: 9999, // Ensure entire section is on top
    overflow: 'visible', // Don't clip suggestions
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
    zIndex: 9999, // Match parent z-index
    overflow: 'visible', // Don't clip suggestions
  },
  addressInputWrapper: {
    position: 'relative',
    width: '100%',
    zIndex: 9999, // Very high z-index to appear above all other elements
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
  suggestionsContainer: {
    position: 'absolute',
    top: 48, // Position right below the input (input height = 48px)
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 999, // Very high elevation (Android)
    overflow: 'hidden',
    zIndex: 9999, // Maximum z-index to appear on top of everything
  },
  suggestionsScrollView: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
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
