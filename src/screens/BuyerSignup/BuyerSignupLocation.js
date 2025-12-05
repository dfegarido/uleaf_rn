import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import InputDropdown from '../../components/Input/InputDropdown';
import InputDropdownPaginated from '../../components/Input/InputDropdownPaginated';
import InputBox from '../../components/Input/InputBox';
import InfoIcon from '../../assets/buyer-icons/information.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCitiesByStateApi } from '../../components/Api';
// Backend API for location data from dropdown_state collection
import { getUSStatesSimple, getStatesFromBackend, getAllUSCitiesSimple } from '../../components/Api/geoDbApi';

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

const BuyerSignupLocation = () => {
  const navigation = useNavigation();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [autoFilledFromAddress, setAutoFilledFromAddress] = useState(false);
  const addressTimeoutRef = useRef(null);
  
  // States and cities from public API
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateData, setSelectedStateData] = useState(null);
  const [statesLoading, setStatesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  
  // Pagination state
  const [statesOffset, setStatesOffset] = useState(0);
  const [citiesOffset, setCitiesOffset] = useState(0);
  const citiesOffsetRef = useRef(0); // Use ref to track offset without causing re-renders
  const [statesHasMore, setStatesHasMore] = useState(true);
  const [citiesHasMore, setCitiesHasMore] = useState(true);
  const [loadingMoreStates, setLoadingMoreStates] = useState(false);
  const [loadingMoreCities, setLoadingMoreCities] = useState(false);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        if (stored) {
          const data = JSON.parse(stored);
          console.log('Loading existing location data:', data);
          
          // Populate location fields with existing data if available
          if (data.state) setState(data.state);
          if (data.city) setCity(data.city);
          if (data.zipCode) setZip(data.zipCode);
          if (data.address) setAddress(data.address);
        }
      } catch (e) {
        console.error('Failed to load existing location data', e);
      }
    };

    loadExistingData();
  }, []); // Empty dependency array - only run on mount

  // Clear data when navigating away from buyer signup flow
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const targetRouteName = e.data?.action?.payload?.name;
      
      // List of allowed buyer signup screens
      const buyerSignupScreens = [
        'BuyerSignup',
        'BuyerSignupLocation', 
        'BuyerGettingToKnow',
        'BuyerCompleteYourAccount'
      ];

      // If navigating to a screen outside buyer signup flow, clear data
      if (targetRouteName && !buyerSignupScreens.includes(targetRouteName)) {
        AsyncStorage.removeItem('buyerSignupData').catch(e => 
          console.error('Failed to clear signup data:', e)
        );
        console.log('Cleared buyer signup data - navigating to:', targetRouteName);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Update selectedStateData when states are loaded and we have a saved state
  useEffect(() => {
    if (states.length > 0 && state && !selectedStateData) {
      const savedStateData = states.find(s => s.name === state);
      if (savedStateData) {
        setSelectedStateData(savedStateData);
        console.log('Restored selectedStateData:', savedStateData);
      }
    }
  }, [states, state, selectedStateData]); // Include selectedStateData to prevent infinite loops

  // Load states from backend (dropdown_state collection) with pagination
  const loadStates = useCallback(async (isLoadMore = false) => {
    try {
      // For signup flow we must NOT call protected backend endpoints (they require auth)
      // Use the public GeoDB wrapper which doesn't require an auth token.
      const offset = isLoadMore ? statesOffset : 0;
      console.log(`🔥 Loading US states (public API) (offset: ${offset})`);

      if (isLoadMore) {
        setLoadingMoreStates(true);
      } else {
        setStatesLoading(true);
        setStates([]); // Clear existing states for fresh load
        setStatesOffset(0);
      }

      const response = await getUSStatesSimple(50, offset);

      if (response.success && response.states) {
        // Transform to match existing component structure (use isoCode for compatibility)
        const stateList = response.states.map(s => ({
          name: s.name,
          isoCode: s.code || s.isoCode || s.stateCode || null,
          id: s.id
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

        console.log(`✅ Successfully loaded ${stateList.length} US states (offset: ${offset}, hasMore: ${response.hasMore})`);
      } else {
        console.error('❌ Public API returned error when loading states:', response.error);
        throw new Error(response.error || 'Failed to load states');
      }
    } catch (error) {
      console.error('❌ Error loading states (public API):', error.message);

      if (!isLoadMore) {
        Alert.alert(
          'Location Service Issue', 
          'Could not load states. Using fallback list.',
          [{ text: 'OK' }]
        );

        // Fallback to common states
        setStates([
          { name: 'California', isoCode: 'CA' },
          { name: 'Texas', isoCode: 'TX' },
          { name: 'New York', isoCode: 'NY' },
          { name: 'Florida', isoCode: 'FL' },
          { name: 'Illinois', isoCode: 'IL' },
          { name: 'Pennsylvania', isoCode: 'PA' },
          { name: 'Ohio', isoCode: 'OH' },
          { name: 'Georgia', isoCode: 'GA' },
          { name: 'North Carolina', isoCode: 'NC' },
          { name: 'Michigan', isoCode: 'MI' }
        ]);
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
        
        console.log(`✅ Successfully loaded ${cityNames.length} unique cities for ${selectedStateData.name} (cached: ${response.cached}, hasMore: ${response.hasMore})`);
      } else {
        console.log(`⚠️ No cities found for ${selectedStateData.name}`);
        
        if (!isLoadMore) {
          // Provide option to enter manually
          setCities(['Enter city manually']);
          setCitiesHasMore(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading cities:', error.message);
      console.log('📝 Providing manual entry option for cities');
      
      if (!isLoadMore) {
        // Fallback option
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
  }, [selectedStateData]); // Only depend on selectedStateData, not citiesOffset

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

  // Handle address input with autocomplete (using Nominatim - FREE!)
  const handleAddressChange = useCallback((text) => {
    setAddress(text);
    setAutoFilledFromAddress(false); // Reset auto-fill flag when manually typing
    
    // Clear previous timeout
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }
    
    // Only search if text is long enough
    if (text.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    // Debounce address search
    addressTimeoutRef.current = setTimeout(async () => {
      try {
        // Using Nominatim (OpenStreetMap) - FREE, no API key needed!
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(text)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `countrycodes=us&` +
          `limit=5`,
          {
            headers: {
              'User-Agent': 'iLeafU-App/1.0' // Required by Nominatim
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Transform Nominatim results to our format
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
    }, 800); // Nominatim prefers longer delays (max 1 request/sec)
  }, []);

  // Handle selecting an address suggestion (Nominatim format)
  const handleSelectSuggestion = useCallback((suggestion) => {
    try {
      console.log('📍 Selected suggestion:', suggestion);
      console.log('📍 Address components:', suggestion.address);
      
      // Nominatim already provides address components in the result
      const addr = suggestion.address;
      
      // Extract address components from Nominatim response
      // Nominatim can have various field names, so we check multiple options
      const houseNumber = addr.house_number || '';
      const road = addr.road || addr.street || '';
      
      // City can be in multiple fields
      const cityName = addr.city || 
                       addr.town || 
                       addr.village || 
                       addr.municipality || 
                       addr.county || '';
      
      // State
      const stateName = addr.state || '';
      
      // Zip code
      const zipCode = addr.postcode || '';
      
      // Build street address
      let streetAddress = '';
      if (houseNumber && road) {
        streetAddress = `${houseNumber} ${road}`.trim();
      } else if (road) {
        streetAddress = road;
      } else {
        // Fallback: extract first part of display name (before first comma)
        const parts = suggestion.description.split(',');
        streetAddress = parts[0].trim();
      }
      
      console.log('🏠 Parsed address:', {
        streetAddress,
        cityName,
        stateName,
        zipCode
      });
      
      // Set address field
      setAddress(streetAddress);
      
      // Auto-fill state and find matching state data for city dropdown
      if (stateName) {
        console.log('🗺️ Setting state:', stateName);
        setState(stateName);
        
        // Find the state data object for city dropdown to work
        const stateData = states.find(s => 
          s.name.toLowerCase() === stateName.toLowerCase() ||
          s.isoCode === addr.state_code
        );
        
        if (stateData) {
          setSelectedStateData(stateData);
          console.log('✅ State data set for city dropdown:', stateData.name);
        } else {
          console.log('⚠️ State data not found in states list:', stateName);
        }
      }
      
      // Auto-fill city
      if (cityName) {
        console.log('🏙️ Setting city:', cityName);
        setCity(cityName);
      }
      
      // Auto-fill zip
      if (zipCode) {
        console.log('📮 Setting zip:', zipCode);
        setZip(zipCode);
      }
      
      // Mark as auto-filled
      setAutoFilledFromAddress(true);
      
      // Clear suggestions
      setAddressSuggestions([]);
      
      console.log('✅ Address auto-filled successfully!');
    } catch (error) {
      console.error('❌ Error parsing address:', error);
      // Fallback: set the full description as address
      const parts = suggestion.description.split(',');
      setAddress(parts[0].trim());
      setAddressSuggestions([]);
    }
  }, [states]);

  const handleContinue = async () => {
    setCheckingLocation(true);
    try {
      // Get public IP
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      const ip = ipData.ip;

      // Get geolocation info using apiip.net
      const geoRes = await fetch(`https://apiip.net/api/check?accessKey=58e625be-685c-4695-b7f0-1fc7a990725d&ip=${ip}`);
      const geoData = await geoRes.json();
      console.log('Geolocation data:', geoData.countryCode);
      if (geoData && geoData.countryCode === 'US') {
        // Save location info to AsyncStorage
        try {
          const prev = await AsyncStorage.getItem('buyerSignupData');
          const prevData = prev ? JSON.parse(prev) : {};
          await AsyncStorage.setItem(
            'buyerSignupData',
            JSON.stringify({
              ...prevData,
              state,
              city,
              zipCode: zip,
              address,
            }),
          );
        } catch (e) {
          // silent fail
        }
        navigation.navigate('BuyerGettingToKnow');
      } else {
        Alert.alert('Registration Restricted', 'Registration is only allowed for users located in the United States.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to verify your location. Please check your internet connection and try again.');
    } finally {
      setCheckingLocation(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
        >
        <View style={styles.container}>
          {/* Top nav: back arrow and step indicator */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackSolidIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.stepText}>2/4</Text>
          </View>

          {/* Title and subtitle */}
          <Text style={styles.title}>{'Your location & your\nplants'}</Text>
          <Text style={styles.subtitle}>
            This information will help us with packaging considerations and send
            alerts related to weather conditions.
          </Text>

          {/* Info box */}
          <View style={styles.infoBox}>
            <InfoIcon width={20} height={20} style={styles.infoBoxIcon} />
            <Text style={styles.infoBoxText}>
              Our green marketplace blooms just for buyers in the continental United States. Accounts won't grow beyond this region.
            </Text>
          </View>

          {/* Address Line - First field */}
          <Text style={styles.label}>
            Address Line<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputBox
            placeholder="Street address, apt, suite, unit, etc."
            value={address}
            setValue={handleAddressChange}
          />
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

          {/* State - Auto-populated from address, can be changed */}
          <Text style={styles.label}>
            State<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdownPaginated
            options={states.map(s => s.name)}
            selectedOption={state}
            onSelect={(selectedName) => {
              const sel = states.find(s => s.name === selectedName);
              setState(selectedName);
              setSelectedStateData(sel);
              setCity(''); // Reset city when state changes manually
            }}
            placeholder={state ? state : (statesLoading ? "Loading US states..." : "Select or type address above...")}
            disabled={statesLoading}
            onLoadMore={loadMoreStates}
            hasMore={statesHasMore}
            loadingMore={loadingMoreStates}
          />

          {/* City - Auto-populated from address, can be changed */}
          <Text style={styles.label}>
            City<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdownPaginated
            options={cities}
            selectedOption={city}
            onSelect={setCity}
            placeholder={
              city 
                ? city // Show auto-filled city
                : citiesLoading 
                  ? "Loading cities..." 
                  : selectedStateData 
                    ? "Select or type address above..." 
                    : "Type address above or select state"
            }
            disabled={citiesLoading}
            onLoadMore={loadMoreCities}
            hasMore={citiesHasMore}
            loadingMore={loadingMoreCities}
            enableServerSearch={true}
            onSearch={handleCitySearch}
          />

          {/* Zip code */}
          <Text style={styles.label}>
            Zip code<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputBox
            placeholder="Auto-filled from address"
            value={zip}
            setValue={setZip}
            isNumeric={true}
            editable={!autoFilledFromAddress}
          />

          {/* Spacer */}
          <View style={{flex: 1, minHeight: 24}} />
        </View>
        </ScrollView>
        {/* Continue button at bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              globalStyles.primaryButton,
              {marginBottom: 8},
              (!state || !city || !zip || !address) && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!state || !city || !zip || !address}>
            <Text style={[
              globalStyles.primaryButtonText,
              (!state || !city || !zip || !address) && styles.disabledButtonText,
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8, // Further reduced to match good positioning
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32, // Increased from 8 to 16 for better positioning
    paddingTop: 16, // Increased from 8 to 16 for better positioning
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 22,
    color: '#393D43',
    fontWeight: 'bold',
  },
  stepText: {
    marginLeft: 'auto',
    fontSize: 16,
    color: '#393D43',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202325',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#393D43',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#D6F0FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBoxIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoBoxText: {
    color: '#556065',
    fontSize: 14,
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: '#393D43',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
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
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default BuyerSignupLocation;
