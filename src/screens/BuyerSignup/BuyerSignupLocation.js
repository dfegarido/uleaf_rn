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
import InputBox from '../../components/Input/InputBox';
import InfoIcon from '../../assets/buyer-icons/information.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
// New public (no-auth) location dropdown APIs
import { getPublicStatesApi, getPublicCitiesApi } from '../../components/Api/locationDropdownApi';

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

  // Load states from public endpoint
  useEffect(() => {
    const loadStates = async () => {
      try {
        console.log('Loading states from public endpoint...');
        setStatesLoading(true);
        const stateList = await getPublicStatesApi();
        stateList.sort((a,b) => a.name.localeCompare(b.name));
        setStates(stateList);
      } catch (error) {
        console.error('Error loading states:', error);
        Alert.alert('Error', 'Failed to load states. Please try again.');
        // Fallback to some common states
        setStates([
          { name: 'California', isoCode: 'CA' },
          { name: 'Texas', isoCode: 'TX' },
          { name: 'New York', isoCode: 'NY' },
          { name: 'Florida', isoCode: 'FL' },
          { name: 'Illinois', isoCode: 'IL' }
        ]);
      } finally {
        setStatesLoading(false);
      }
    };

    loadStates();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedStateData) {
        setCities([]);
        return;
      }

      try {
        console.log('Loading cities for state:', selectedStateData.name);
        setCitiesLoading(true);
        const { cities: cityNames } = await getPublicCitiesApi(selectedStateData.isoCode, 50, 0);
        setCities(cityNames);
      } catch (error) {
        console.error('Error loading cities:', error);
        // Fallback to some common cities
        setCities(['Enter city manually']);
      } finally {
        setCitiesLoading(false);
      }
    };

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
          <InputDropdown
            options={states.map(s => s.name)}
            selectedOption={state}
            onSelect={(selectedName) => {
              const sel = states.find(s => s.name === selectedName);
              setState(selectedName);
              setSelectedStateData(sel);
              setCity(''); // Reset city when state changes
            }}
            placeholder={statesLoading ? "Loading states..." : "Select..."}
            disabled={statesLoading}
          />

          {/* City dropdown */}
          <Text style={styles.label}>
            City<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdown
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
