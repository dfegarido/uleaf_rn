import React, {useState, useEffect} from 'react';
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
// GeoDB API for location data using centralized config
import { getUSStatesSimple, getStateCitiesSimple, getAllUSCitiesSimple } from '../../components/Api/geoDbApi';

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

  // Load states from GeoDB API with pagination
  const loadStates = async (isLoadMore = false) => {
    try {
      const currentOffset = isLoadMore ? statesOffset : 0;
      console.log(`🇺🇸 Loading US states from GeoDB API... (offset: ${currentOffset})`);
      
      if (isLoadMore) {
        setLoadingMoreStates(true);
      } else {
        setStatesLoading(true);
        setStates([]); // Clear existing states for fresh load
        setStatesOffset(0);
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
        setStatesOffset(currentOffset + 5);
        setStatesHasMore(response.hasMore);
        
        console.log(`✅ Successfully loaded ${stateList.length} US states from GeoDB API (total: ${isLoadMore ? states.length + stateList.length : stateList.length}, hasMore: ${response.hasMore})`);
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
        
        // Fallback to common states if GeoDB fails
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
  };

  useEffect(() => {
    loadStates();
  }, []);

  // Load cities when state changes using GeoDB API with pagination
  const loadCities = async (isLoadMore = false) => {
    if (!selectedStateData) {
      setCities([]);
      return;
    }

    try {
      const currentOffset = isLoadMore ? citiesOffset : 0;
      console.log(`🏙️ Loading cities for state from GeoDB API: ${selectedStateData.name} (offset: ${currentOffset})`);
      
      if (isLoadMore) {
        setLoadingMoreCities(true);
      } else {
        setCitiesLoading(true);
        setCities([]); // Clear existing cities for fresh load
        setCitiesOffset(0);
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
        setCitiesOffset(currentOffset + 5);
        setCitiesHasMore(response.hasMore);
        
        console.log(`✅ Successfully loaded ${cityNames.length} unique cities for ${selectedStateData.name} (total: ${isLoadMore ? 'appended' : cityNames.length}, hasMore: ${response.hasMore})`);
      } else {
        console.log(`⚠️ No cities found for ${selectedStateData.name} from GeoDB API`);
        
        if (!isLoadMore) {
          // Provide option to enter manually
          setCities(['Enter city manually']);
          setCitiesHasMore(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading cities from GeoDB API:', error.message);
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
  };

  useEffect(() => {
    loadCities();
  }, [selectedStateData]);

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
              Our green marketplace blooms just for buyers in the continental United States. Accounts won’t grow beyond this region.
            </Text>
          </View>

          {/* State dropdown */}
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
              setCity(''); // Reset city when state changes
            }}
            placeholder={statesLoading ? "Loading US states..." : "Select..."}
            disabled={statesLoading}
            onLoadMore={() => loadStates(true)}
            hasMore={statesHasMore}
            loadingMore={loadingMoreStates}
          />

          {/* City dropdown */}
          <Text style={styles.label}>
            City<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdownPaginated
            options={cities}
            selectedOption={city}
            onSelect={setCity}
            placeholder={
              citiesLoading 
                ? "Loading cities..." 
                : selectedStateData 
                  ? "Select..." 
                  : "Select state first"
            }
            disabled={!selectedStateData || citiesLoading}
            onLoadMore={() => loadCities(true)}
            hasMore={citiesHasMore}
            loadingMore={loadingMoreCities}
          />

          {/* Zip code */}
          <Text style={styles.label}>Zip code</Text>
          <InputBox
            placeholder=""
            value={zip}
            setValue={setZip}
            isNumeric={true}
          />

          {/* Address Line */}
          <Text style={styles.label}>
            Address Line<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputBox
            placeholder="Street address, apt, suite, unit, etc."
            value={address}
            setValue={setAddress}
          />

          {/* Spacer */}
          <View style={{flex: 1, minHeight: 24}} />
        </View>
        </ScrollView>
        {/* Continue button at bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[globalStyles.primaryButton, {marginBottom: 8}]}
            onPress={handleContinue}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
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
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
});

export default BuyerSignupLocation;
