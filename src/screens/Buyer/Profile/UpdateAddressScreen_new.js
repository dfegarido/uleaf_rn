import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAddressBookEntryApi, updateAddressBookEntryApi } from '../../../components/Api';
import DropdownSelect from '../../../components/Dropdown/DropdownSelect';
// New public (no-auth) location dropdown APIs
import { getPublicStatesApi, getPublicCitiesApi } from '../../../components/Api/locationDropdownApi';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const UpdateAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const addressToUpdate = route.params?.address;
  
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedStateData, setSelectedStateData] = useState(null);
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressId, setAddressId] = useState(null);
  
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
  
  // Load states from new public endpoint
  useEffect(() => {
    const loadStates = async () => {
      try {
        console.log('Loading states from public endpoint...');
        setStatesLoading(true);
        const stateList = await getPublicStatesApi();
        stateList.sort((a,b) => a.name.localeCompare(b.name));
        setStates(stateList);
        setStatesPagination({
          offset: stateList.length,
          hasMore: false,
          totalCount: stateList.length
        });
      } catch (error) {
        console.error('Error loading states:', error);
        Alert.alert('Error', 'Failed to load states. Please try again.');
      } finally {
        setStatesLoading(false);
      }
    };

    loadStates();
  }, []);

  // No-op for states since public endpoint returns full list
  const loadMoreStates = async () => {};

  // Load cities for selected state via public endpoint (offset pagination)
  useEffect(() => {
    const loadCities = async () => {
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
        console.log('Loading initial cities (public) for state:', selectedStateData.name, 'isoCode:', selectedStateData.isoCode);
        setCitiesLoading(true);
        const { cities: cityNames, pagination } = await getPublicCitiesApi(selectedStateData.isoCode, 50, 0);
        setCities(cityNames);
        setCitiesPagination({
          offset: pagination.offset + cityNames.length,
          hasMore: pagination.hasMore,
          totalCount: pagination.total
        });
      } catch (error) {
        console.error('Error loading cities:', error);
        Alert.alert('Error', 'Failed to load cities. Please try again.');
      } finally {
        setCitiesLoading(false);
      }
    };

    loadCities();
  }, [selectedStateData]);

  // Load more cities when reaching end of list
  const loadMoreCities = async () => {
    if (!citiesPagination.hasMore || loadingMoreCities || !selectedStateData) return;
    try {
      console.log('Loading more cities (public) from offset:', citiesPagination.offset);
      setLoadingMoreCities(true);
      const { cities: moreCityNames, pagination } = await getPublicCitiesApi(selectedStateData.isoCode, 50, citiesPagination.offset);
      setCities(prev => {
        const merged = [...prev, ...moreCityNames];
        return Array.from(new Set(merged)).sort();
      });
      setCitiesPagination({
        offset: pagination.offset + moreCityNames.length,
        hasMore: pagination.hasMore,
        totalCount: pagination.total
      });
    } catch (error) {
      console.error('Error loading more cities:', error);
      Alert.alert('Error', 'Failed to load more cities. Please try again.');
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
      
      // Set the selected state data when we have it
      if (addressToUpdate.state) {
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
            data={states.map(s => s.name)}
            onSelect={(selectedName) => {
              const sel = states.find(s => s.name === selectedName);
              setState(selectedName);
              setSelectedStateData(sel);
              setCity('');
            }}
            required={true}
            disabled={statesLoading || states.length === 0}
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
            data={cities}
            onSelect={(selectedCity) => {
              setCity(selectedCity);
            }}
            required={true}
            disabled={!selectedStateData || citiesLoading}
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
    lineHeight: 22,
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
    lineHeight: 20,
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
