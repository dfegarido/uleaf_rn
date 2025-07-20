import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createAddressBookEntryApi } from '../../../components/Api';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import DropdownIcon from '../../../assets/icons/greydark/dropdown-arrow.svg';

const AddNewAddressScreen = () => {
  const navigation = useNavigation();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User info from AsyncStorage
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    contactNumber: ''
  });
  
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  
  const states = [
    'Illinois',
    'California',
    'Texas',
    'New York',
    'Florida',
    'Michigan',
    'Ohio',
    'Pennsylvania'
  ];
  
  const cities = {
    'Illinois': ['Springfield', 'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
    'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Lansing', 'Flint', 'Ann Arbor'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Harrisburg', 'Allentown', 'Erie']
  };

  // Load user info from AsyncStorage
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
  }, []);

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
        isDefault: false
      };

      const response = await createAddressBookEntryApi(addressData);
      
      if (response?.success) {
        Alert.alert(
          'Success', 
          'Address added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response?.message || 'Failed to add address');
      }
    } catch (error) {
      console.log('Error adding address:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to add address. Please try again.'
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
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* State */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>State<Text style={{color: '#E53935'}}>*</Text></Text>
              <TouchableOpacity 
                style={styles.textField} 
                activeOpacity={0.7} 
                onPress={() => setStateModalVisible(true)}
              >
                <Text style={state ? styles.selectedText : styles.placeholderText}>
                  {state || "Select"}
                </Text>
                <View style={styles.dropdownIconContainer}>
                  <DropdownIcon width={18} height={10} fill="#202325" />
                </View>
              </TouchableOpacity>
              
              <Modal
                transparent={true}
                visible={stateModalVisible}
                animationType="fade"
                onRequestClose={() => setStateModalVisible(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1} 
                  onPress={() => setStateModalVisible(false)}
                >
                  <View style={styles.modalContent}>
                    <FlatList
                      data={states}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.stateItem, state === item && styles.selectedStateItem]}
                          onPress={() => {
                            setState(item);
                            setCity('');
                            setStateModalVisible(false);
                          }}
                        >
                          <Text style={[styles.stateItemText, state === item && styles.selectedStateItemText]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
          
          {/* City */}
          <View style={styles.inputSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>City<Text style={{color: '#E53935'}}>*</Text></Text>
              <TouchableOpacity 
                style={styles.textField} 
                activeOpacity={0.7} 
                onPress={() => state ? setCityModalVisible(true) : null}
                disabled={!state}
              >
                <Text style={city ? styles.selectedText : styles.placeholderText}>
                  {city || (state ? "Select city" : "Select")}
                </Text>
                <View style={styles.dropdownIconContainer}>
                  <DropdownIcon width={18} height={10} fill="#202325" />
                </View>
              </TouchableOpacity>
              
              <Modal
                transparent={true}
                visible={cityModalVisible}
                animationType="fade"
                onRequestClose={() => setCityModalVisible(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1} 
                  onPress={() => setCityModalVisible(false)}
                >
                  <View style={styles.modalContent}>
                    <FlatList
                      data={cities[state]}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.stateItem, city === item && styles.selectedStateItem]}
                          onPress={() => {
                            setCity(item);
                            setCityModalVisible(false);
                          }}
                        >
                          <Text style={[styles.stateItemText, city === item && styles.selectedStateItemText]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>

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
              <Text style={styles.saveBtnText}>Add Address</Text>
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
  inputLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
    width: 327,
    height: 22,
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
    lineHeight: 22, // 140% of 16px
    color: '#202325',
    flex: 1,
    flexGrow: 1,
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  stateItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F6',
  },
  selectedStateItem: {
    backgroundColor: '#F5F6F6',
  },
  stateItemText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  selectedStateItemText: {
    color: '#539461',
    fontWeight: '600',
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

export default AddNewAddressScreen;
