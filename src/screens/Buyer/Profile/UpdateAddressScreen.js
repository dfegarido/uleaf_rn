import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAddressBookEntryApi, updateAddressBookEntryApi } from '../../../components/Api';
import DropdownSelect from '../../../components/Dropdown/DropdownSelect';
const { fetchUSStates, fetchCitiesForState } = require('../../../utils/locationApi');
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

console.log('Imports loaded. fetchUSStates:', fetchUSStates);
console.log('fetchCitiesForState:', fetchCitiesForState);

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
  
  // To track the last time we made an API request to prevent rate limiting
  const [lastApiCallTime, setLastApiCallTime] = useState(0);
  
  // States and cities from API
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
  
  // Load states from API - only when creating a new address
  useEffect(() => {
    const loadStates = async () => {
      // If we're updating an address, don't automatically load states
      // We'll just add the needed state directly to the states array
      if (addressToUpdate) {
        setStatesLoading(false);
        return;
      }
      
      try {
        console.log('Starting to load initial states...');
        console.log('fetchUSStates function:', fetchUSStates);
        setStatesLoading(true);
        setLastApiCallTime(Date.now());
        
        // Load more states initially to reduce pagination needs
        const result = await fetchUSStates(0, 30); // Load 30 states initially instead of 10
        console.log('Initial states fetched successfully:', result);
        
        // Populate with common US states if the API fails or returns limited data
        let statesData = result.data || [];
        
        // If we got fewer than expected states, add common US states as a fallback
        if (statesData.length < 30) {
          const commonStates = [
            { name: 'Alabama', isoCode: 'AL' },
            { name: 'Alaska', isoCode: 'AK' },
            { name: 'Arizona', isoCode: 'AZ' },
            { name: 'Arkansas', isoCode: 'AR' },
            { name: 'California', isoCode: 'CA' },
            { name: 'Colorado', isoCode: 'CO' },
            { name: 'Connecticut', isoCode: 'CT' },
            { name: 'Delaware', isoCode: 'DE' },
            { name: 'Florida', isoCode: 'FL' },
            { name: 'Georgia', isoCode: 'GA' },
            { name: 'Hawaii', isoCode: 'HI' },
            { name: 'Idaho', isoCode: 'ID' },
            { name: 'Illinois', isoCode: 'IL' },
            { name: 'Indiana', isoCode: 'IN' },
            { name: 'Iowa', isoCode: 'IA' },
            { name: 'Kansas', isoCode: 'KS' },
            { name: 'Kentucky', isoCode: 'KY' },
            { name: 'Louisiana', isoCode: 'LA' },
            { name: 'Maine', isoCode: 'ME' },
            { name: 'Maryland', isoCode: 'MD' },
            { name: 'Massachusetts', isoCode: 'MA' },
            { name: 'Michigan', isoCode: 'MI' },
            { name: 'Minnesota', isoCode: 'MN' },
            { name: 'Mississippi', isoCode: 'MS' },
            { name: 'Missouri', isoCode: 'MO' },
            { name: 'Montana', isoCode: 'MT' },
            { name: 'Nebraska', isoCode: 'NE' },
            { name: 'Nevada', isoCode: 'NV' },
            { name: 'New Hampshire', isoCode: 'NH' },
            { name: 'New Jersey', isoCode: 'NJ' },
            { name: 'New Mexico', isoCode: 'NM' },
            { name: 'New York', isoCode: 'NY' },
            { name: 'North Carolina', isoCode: 'NC' },
            { name: 'North Dakota', isoCode: 'ND' },
            { name: 'Ohio', isoCode: 'OH' },
            { name: 'Oklahoma', isoCode: 'OK' },
            { name: 'Oregon', isoCode: 'OR' },
            { name: 'Pennsylvania', isoCode: 'PA' },
            { name: 'Rhode Island', isoCode: 'RI' },
            { name: 'South Carolina', isoCode: 'SC' },
            { name: 'South Dakota', isoCode: 'SD' },
            { name: 'Tennessee', isoCode: 'TN' },
            { name: 'Texas', isoCode: 'TX' },
            { name: 'Utah', isoCode: 'UT' },
            { name: 'Vermont', isoCode: 'VT' },
            { name: 'Virginia', isoCode: 'VA' },
            { name: 'Washington', isoCode: 'WA' },
            { name: 'West Virginia', isoCode: 'WV' },
            { name: 'Wisconsin', isoCode: 'WI' },
            { name: 'Wyoming', isoCode: 'WY' },
            { name: 'District of Columbia', isoCode: 'DC' }
          ];
          
          // Merge API results with our fallback list
          const uniqueMap = new Map();
          
          // Add API results first
          statesData.forEach(state => {
            uniqueMap.set(state.name, state);
          });
          
          // Add missing states from our fallback list
          commonStates.forEach(state => {
            if (!uniqueMap.has(state.name)) {
              uniqueMap.set(state.name, state);
            }
          });
          
          statesData = Array.from(uniqueMap.values());
        }
        
        setStates(statesData);
        setStatesPagination({
          offset: statesData.length,
          hasMore: result.hasMore,
          totalCount: result.totalCount || statesData.length
        });
      } catch (error) {
        console.error('Error loading states:', error);
        
        // Fallback to hardcoded list of states if API fails
        const fallbackStates = [
          { name: 'Alabama', isoCode: 'AL' },
          { name: 'Alaska', isoCode: 'AK' },
          { name: 'Arizona', isoCode: 'AZ' },
          { name: 'Arkansas', isoCode: 'AR' },
          { name: 'California', isoCode: 'CA' },
          { name: 'Colorado', isoCode: 'CO' },
          { name: 'Connecticut', isoCode: 'CT' },
          { name: 'Delaware', isoCode: 'DE' },
          { name: 'Florida', isoCode: 'FL' },
          { name: 'Georgia', isoCode: 'GA' },
          { name: 'Hawaii', isoCode: 'HI' },
          { name: 'Idaho', isoCode: 'ID' },
          { name: 'Illinois', isoCode: 'IL' },
          { name: 'Indiana', isoCode: 'IN' },
          { name: 'Iowa', isoCode: 'IA' },
          { name: 'Kansas', isoCode: 'KS' },
          { name: 'Kentucky', isoCode: 'KY' },
          { name: 'Louisiana', isoCode: 'LA' },
          { name: 'Maine', isoCode: 'ME' },
          { name: 'Maryland', isoCode: 'MD' },
          { name: 'Massachusetts', isoCode: 'MA' },
          { name: 'Michigan', isoCode: 'MI' },
          { name: 'Minnesota', isoCode: 'MN' },
          { name: 'Mississippi', isoCode: 'MS' },
          { name: 'Missouri', isoCode: 'MO' },
          { name: 'Montana', isoCode: 'MT' },
          { name: 'Nebraska', isoCode: 'NE' },
          { name: 'Nevada', isoCode: 'NV' },
          { name: 'New Hampshire', isoCode: 'NH' },
          { name: 'New Jersey', isoCode: 'NJ' },
          { name: 'New Mexico', isoCode: 'NM' },
          { name: 'New York', isoCode: 'NY' },
          { name: 'North Carolina', isoCode: 'NC' },
          { name: 'North Dakota', isoCode: 'ND' },
          { name: 'Ohio', isoCode: 'OH' },
          { name: 'Oklahoma', isoCode: 'OK' },
          { name: 'Oregon', isoCode: 'OR' },
          { name: 'Pennsylvania', isoCode: 'PA' },
          { name: 'Rhode Island', isoCode: 'RI' },
          { name: 'South Carolina', isoCode: 'SC' },
          { name: 'South Dakota', isoCode: 'SD' },
          { name: 'Tennessee', isoCode: 'TN' },
          { name: 'Texas', isoCode: 'TX' },
          { name: 'Utah', isoCode: 'UT' },
          { name: 'Vermont', isoCode: 'VT' },
          { name: 'Virginia', isoCode: 'VA' },
          { name: 'Washington', isoCode: 'WA' },
          { name: 'West Virginia', isoCode: 'WV' },
          { name: 'Wisconsin', isoCode: 'WI' },
          { name: 'Wyoming', isoCode: 'WY' },
          { name: 'District of Columbia', isoCode: 'DC' }
        ];
        
        setStates(fallbackStates);
        setStatesPagination({
          offset: fallbackStates.length,
          hasMore: false,
          totalCount: fallbackStates.length
        });
      } finally {
        setStatesLoading(false);
      }
    };

    loadStates();
  }, [addressToUpdate]);

  // Load more states when reaching end of list
  const loadMoreStates = async () => {
    // Don't fetch more if we've reached the end or are already loading
    if (!statesPagination.hasMore || loadingMoreStates) {
      return;
    }
    
    // Rate limiting check - ensure at least 2 seconds between API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < 2000) {
      console.log('Rate limiting active, skipping API call');
      return;
    }

    try {
      console.log('Loading more states from offset:', statesPagination.offset);
      setLoadingMoreStates(true);
      setLastApiCallTime(now);
      
      const result = await fetchUSStates(statesPagination.offset, 10);
      console.log('More states fetched:', result);
      
      setStates(prevStates => {
        const combined = [...prevStates, ...result.data];
        // Remove duplicates by name
        const uniqueMap = new Map();
        combined.forEach(state => {
          if (!uniqueMap.has(state.name)) {
            uniqueMap.set(state.name, state);
          }
        });
        // Convert back to array and sort
        return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      });
      
      setStatesPagination({
        offset: statesPagination.offset + result.data.length,
        hasMore: result.hasMore,
        totalCount: result.totalCount
      });
    } catch (error) {
      console.error('Error loading more states:', error);
      // Don't show alert for rate limit errors to avoid spamming the user
      if (!error.message.includes('429')) {
        Alert.alert('Error', 'Failed to load more states. Please try again later.');
      }
    } finally {
      setLoadingMoreStates(false);
    }
  };

  // Load cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      // Don't load cities automatically on component mount or when setting state from existing data
      // Only load when selectedStateData changes from user interaction
      if (!selectedStateData || selectedStateData._userTriggered !== true) {
        return;
      }

      // Check for rate limiting
      if (Date.now() - lastApiCallTime < 2000) {
        console.log('Rate limiting active for cities, using fallback data');
        provideFallbackCities();
        return;
      }

      try {
        console.log('Loading initial cities for state:', selectedStateData.name, 'isoCode:', selectedStateData.isoCode);
        setCitiesLoading(true);
        setLastApiCallTime(Date.now());
        
        const result = await fetchCitiesForState(selectedStateData.isoCode, 0, 10); // Use isoCode
        console.log('Initial cities fetched successfully:', result);
        
        if (result?.data?.length > 0) {
          // Remove duplicates
          const uniqueCities = Array.from(new Set(result.data.map(city => city.name)))
            .map(name => name);
          setCities(uniqueCities);
          
          setCitiesPagination({
            offset: result.data.length,
            hasMore: result.hasMore,
            totalCount: result.totalCount
          });
        } else {
          // Use fallback if API returns empty result
          provideFallbackCities();
        }
      } catch (error) {
        console.error('Error loading cities:', error);
        // Don't show alert for rate limit errors
        if (!error.message.includes('429')) {
          Alert.alert('Error', 'Failed to load cities. Using common cities instead.');
        }
        // Use fallback on error
        provideFallbackCities();
      } finally {
        setCitiesLoading(false);
      }
    };

    // Helper function to provide fallback city data
    const provideFallbackCities = () => {
      if (!selectedStateData || !selectedStateData.name) return;
      
      const getCommonCities = (stateName) => {
        const commonCitiesByState = {
          'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
          'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
          'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
          'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
          'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
          'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
          'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
          'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
          'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
          'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
          'Hawaii': ['Honolulu', 'Hilo', 'Kailua', 'Kapolei', 'Kaneohe'],
          'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
          'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
          'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
          'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
          'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka'],
          'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
          'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
          'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
          'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Annapolis'],
          'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge'],
          'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
          'Minnesota': ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
          'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
          'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
          'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
          'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
          'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
          'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
          'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
          'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
          'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
          'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
          'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
          'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
          'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond'],
          'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'],
          'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
          'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
          'South Carolina': ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
          'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
          'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
          'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth'],
          'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
          'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Essex Junction', 'Colchester'],
          'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
          'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
          'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
          'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
          'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'],
          'District of Columbia': ['Washington']
        };
        
        return commonCitiesByState[stateName] || ['Enter city manually'];
      };
      
      // Get common cities for this state and set them
      const citiesForState = getCommonCities(selectedStateData.name);
      setCities(citiesForState);
      
      // Set pagination to indicate we're not going to load more from API
      setCitiesPagination({
        offset: citiesForState.length,
        hasMore: false,
        totalCount: citiesForState.length
      });
    };

    loadCities();
  }, [selectedStateData]);

  // Load more cities when reaching end of list
  const loadMoreCities = async () => {
    // Prevent API calls if we don't have a user-selected state or if we're already loading
    if (!citiesPagination.hasMore || loadingMoreCities || !selectedStateData || selectedStateData._userTriggered !== true) {
      return;
    }
    
    // Check for rate limiting
    if (Date.now() - lastApiCallTime < 2000) {
      console.log('Rate limiting active for loading more cities, skipping API call');
      return;
    }

    try {
      console.log('Loading more cities from offset:', citiesPagination.offset);
      setLoadingMoreCities(true);
      setLastApiCallTime(Date.now());
      
      const result = await fetchCitiesForState(selectedStateData.isoCode, citiesPagination.offset, 10); // Use isoCode
      console.log('More cities fetched:', result);
      
      if (result?.data?.length > 0) {
        setCities(prevCities => {
          const combined = [...prevCities, ...result.data.map(city => city.name || city)];
          // Remove duplicates and sort
          return Array.from(new Set(combined)).sort();
        });
        
        setCitiesPagination({
          offset: citiesPagination.offset + result.data.length,
          hasMore: result.hasMore,
          totalCount: result.totalCount
        });
      }
    } catch (error) {
      console.error('Error loading more cities:', error);
      // Don't show alert for rate limit errors
      if (!error.message.includes('429')) {
        Alert.alert('Error', 'Failed to load more cities. Please try again.');
      }
    } finally {
      setLoadingMoreCities(false);
    }
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
      
      // Create a mock state object with the required data
      // This prevents any API calls to fetch the state
      if (addressToUpdate.state) {
        const mockStateObj = {
          name: addressToUpdate.state,
          isoCode: addressToUpdate.stateCode || '', // Use stateCode if available
          _userTriggered: false // Mark as not user triggered
        };
        
        // Add this state to the states array
        setStates(prevStates => {
          if (!prevStates.some(s => s.name === mockStateObj.name)) {
            return [...prevStates, mockStateObj];
          }
          return prevStates;
        });
        
        // Set the selected state data
        setSelectedStateData(mockStateObj);
        
        // Add the city directly to the cities array without any API call
        if (addressToUpdate.city) {
          setCities(prevCities => {
            if (!prevCities.includes(addressToUpdate.city)) {
              return [...prevCities, addressToUpdate.city];
            }
            return prevCities;
          });
        }
      }
    }
  }, [addressToUpdate]);

  const handleSaveAddress = async () => {
    // Validation
    if (!street.trim()) {
      Alert.alert('Error', 'Please enter street address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please select a city');
      return;
    }
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

  // Manual trigger to load states when user clicks on dropdown
  const handleStateDropdownClick = async () => {
    // If we already have a good amount of states, don't fetch more
    if (states.length > 30 || statesLoading) {
      return;
    }
    
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < 2000) {
      console.log('Rate limiting active, skipping API call');
      return;
    }
    
    try {
      console.log('User clicked state dropdown, loading states...');
      setStatesLoading(true);
      setLastApiCallTime(now);
      
      // Use our complete fallback list instead of making API calls
      const fallbackStates = [
        { name: 'Alabama', isoCode: 'AL' },
        { name: 'Alaska', isoCode: 'AK' },
        { name: 'Arizona', isoCode: 'AZ' },
        { name: 'Arkansas', isoCode: 'AR' },
        { name: 'California', isoCode: 'CA' },
        { name: 'Colorado', isoCode: 'CO' },
        { name: 'Connecticut', isoCode: 'CT' },
        { name: 'Delaware', isoCode: 'DE' },
        { name: 'Florida', isoCode: 'FL' },
        { name: 'Georgia', isoCode: 'GA' },
        { name: 'Hawaii', isoCode: 'HI' },
        { name: 'Idaho', isoCode: 'ID' },
        { name: 'Illinois', isoCode: 'IL' },
        { name: 'Indiana', isoCode: 'IN' },
        { name: 'Iowa', isoCode: 'IA' },
        { name: 'Kansas', isoCode: 'KS' },
        { name: 'Kentucky', isoCode: 'KY' },
        { name: 'Louisiana', isoCode: 'LA' },
        { name: 'Maine', isoCode: 'ME' },
        { name: 'Maryland', isoCode: 'MD' },
        { name: 'Massachusetts', isoCode: 'MA' },
        { name: 'Michigan', isoCode: 'MI' },
        { name: 'Minnesota', isoCode: 'MN' },
        { name: 'Mississippi', isoCode: 'MS' },
        { name: 'Missouri', isoCode: 'MO' },
        { name: 'Montana', isoCode: 'MT' },
        { name: 'Nebraska', isoCode: 'NE' },
        { name: 'Nevada', isoCode: 'NV' },
        { name: 'New Hampshire', isoCode: 'NH' },
        { name: 'New Jersey', isoCode: 'NJ' },
        { name: 'New Mexico', isoCode: 'NM' },
        { name: 'New York', isoCode: 'NY' },
        { name: 'North Carolina', isoCode: 'NC' },
        { name: 'North Dakota', isoCode: 'ND' },
        { name: 'Ohio', isoCode: 'OH' },
        { name: 'Oklahoma', isoCode: 'OK' },
        { name: 'Oregon', isoCode: 'OR' },
        { name: 'Pennsylvania', isoCode: 'PA' },
        { name: 'Rhode Island', isoCode: 'RI' },
        { name: 'South Carolina', isoCode: 'SC' },
        { name: 'South Dakota', isoCode: 'SD' },
        { name: 'Tennessee', isoCode: 'TN' },
        { name: 'Texas', isoCode: 'TX' },
        { name: 'Utah', isoCode: 'UT' },
        { name: 'Vermont', isoCode: 'VT' },
        { name: 'Virginia', isoCode: 'VA' },
        { name: 'Washington', isoCode: 'WA' },
        { name: 'West Virginia', isoCode: 'WV' },
        { name: 'Wisconsin', isoCode: 'WI' },
        { name: 'Wyoming', isoCode: 'WY' },
        { name: 'District of Columbia', isoCode: 'DC' }
      ];
      
      // Merge with existing states
      setStates(prevStates => {
        const combined = [...prevStates, ...fallbackStates];
        // Remove duplicates by name
        const uniqueMap = new Map();
        combined.forEach(state => {
          if (!uniqueMap.has(state.name)) {
            uniqueMap.set(state.name, state);
          }
        });
        // Convert back to array and sort
        return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      });
      
      // Set pagination to indicate we have all states now
      setStatesPagination({
        offset: fallbackStates.length,
        hasMore: false,
        totalCount: fallbackStates.length
      });
      
    } catch (error) {
      console.error('Error loading states on demand:', error);
      // Don't show alert for rate limit errors
      if (!error.message.includes('429')) {
        Alert.alert('Error', 'Failed to load states. Please try again later.');
      }
    } finally {
      setStatesLoading(false);
    }
  };

  // Manually load cities for a state when the city dropdown is clicked
  const handleCityDropdownClick = () => {
    if (selectedStateData && cities.length === 0) {
      // If we have isoCode, try to load cities from API with rate limiting
      if (selectedStateData.isoCode && (Date.now() - lastApiCallTime > 2000)) {
        selectedStateData._userTriggered = true;
        setLastApiCallTime(Date.now());
        setSelectedStateData({...selectedStateData});
      } else {
        // Fallback - provide some common cities for the selected state
        const getCommonCities = (stateName) => {
          const commonCitiesByState = {
            'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
            'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
            'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
            'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
            'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
            'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
            'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
            'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
            'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
            'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
            'Hawaii': ['Honolulu', 'Hilo', 'Kailua', 'Kapolei', 'Kaneohe'],
            'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
            'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
            'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
            'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
            'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka'],
            'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
            'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
            'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
            'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Annapolis'],
            'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge'],
            'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
            'Minnesota': ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
            'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
            'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
            'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
            'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
            'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
            'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
            'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
            'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
            'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
            'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
            'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
            'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
            'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond'],
            'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'],
            'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
            'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
            'South Carolina': ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
            'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
            'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
            'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth'],
            'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
            'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Essex Junction', 'Colchester'],
            'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
            'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
            'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
            'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
            'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'],
            'District of Columbia': ['Washington']
          };
          
          return commonCitiesByState[stateName] || ['Enter city manually'];
        };
        
        // Get common cities for this state and set them
        const citiesForState = getCommonCities(selectedStateData.name);
        setCities(citiesForState);
      }
    }
  };

  return (
    <View style={styles.container}>
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
            data={Array.from(new Set(cities)).sort()} // Ensure unique city names
            onSelect={(selectedCity) => {
              setCity(selectedCity);
            }}
            onPress={handleCityDropdownClick}
            required={true}
            disabled={(!selectedStateData && !city) || citiesLoading}
            onEndReached={loadMoreCities}
            loading={loadingMoreCities}
          />

          {/* Zip Code */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>Zip Code<Text style={{color: '#E53935'}}></Text></Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter zip code"
                  placeholderTextColor="#647276"
                  value={zipCode}
                  onChangeText={setZipCode}
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
    </View>
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
