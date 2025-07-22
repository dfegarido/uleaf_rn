import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import DropdownIcon from '../../../assets/icons/greydark/dropdown-arrow.svg';
import TrashIcon from '../../../assets/icons/greydark/trash-regular.svg';
import RedBinIcon from '../../../assets/buyer-icons/red-bin.svg';
import XRegularIcon from '../../../assets/icons/greylight/x-regular.svg';
import { updateAddressBookEntryApi, deleteAddressBookEntryApi } from '../../../components/Api';

const UpdateAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { address: addressData } = route.params || {};
  
  // Initialize state with existing address data
  const [state, setState] = useState(addressData?.state || 'Illinois');
  const [city, setCity] = useState(addressData?.city || 'Springfield');
  const [zip, setZip] = useState(addressData?.zipCode || '');
  const [address, setAddress] = useState(addressData?.address || '');
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Store original values to detect changes
  const [originalData] = useState({
    state: addressData?.state || 'Illinois',
    city: addressData?.city || 'Springfield',
    zip: addressData?.zipCode || '',
    address: addressData?.address || ''
  });

  // Check for changes whenever any field updates
  useEffect(() => {
    const changed = 
      state !== originalData.state ||
      city !== originalData.city ||
      zip !== originalData.zip ||
      address !== originalData.address;
    setHasChanges(changed);
  }, [state, city, zip, address, originalData]);
  
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

  // Save changes function
  const handleSaveChanges = async () => {
    if (!zip || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        state,
        city,
        zipCode: zip,
        address,
      };

      const response = await updateAddressBookEntryApi(
        addressData?.entryId || addressData?.id,
        updateData
      );

      if (response?.success) {
        Alert.alert('Success', 'Address updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response?.message || 'Failed to update address');
      }
    } catch (error) {
      console.log('Error updating address:', error);
      Alert.alert('Error', 'Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete address function
  const handleDeleteAddress = async () => {
    setLoading(true);
    try {
      const response = await deleteAddressBookEntryApi(
        addressData?.entryId || addressData?.id
      );

      if (response?.success) {
        Alert.alert('Success', 'Address deleted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response?.message || 'Failed to delete address');
      }
    } catch (error) {
      console.log('Error deleting address:', error);
      Alert.alert('Error', 'Failed to delete address. Please try again.');
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Address</Text>
        <TouchableOpacity 
          onPress={() => setDeleteModalVisible(true)} 
          style={styles.deleteButton}
        >
          <TrashIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* State */}
        <View style={styles.inputSection}>
          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputLabel}>State<Text style={{color: '#E53935'}}>*</Text></Text>
            <TouchableOpacity 
              style={styles.textField} 
              activeOpacity={0.7} 
              onPress={() => setStateModalVisible(true)}
            >
              <Text style={styles.selectedText}>{state}</Text>
              <DropdownIcon width={18} height={10} fill="#202325" style={styles.dropdownIcon} />
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
              onPress={() => setCityModalVisible(true)}
            >
              <Text style={styles.selectedText}>{city}</Text>
              <DropdownIcon width={18} height={10} fill="#202325" style={styles.dropdownIcon} />
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
            <Text style={styles.inputLabel}>Zip Code<Text style={{color: '#E53935'}}>*</Text></Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholder="62704"
                placeholderTextColor="#202325"
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        {/* Address Line */}
        <View style={styles.addressSection}>
          <View style={styles.addressFieldWrap}>
            <Text style={styles.inputLabel}>Address Line<Text style={{color: '#E53935'}}>*</Text></Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholder="123 Main Street"
                placeholderTextColor="#202325"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
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
              (!zip || !address || !hasChanges || loading) ? styles.saveBtnDisabled : styles.saveBtnEnabled
            ]} 
            disabled={!zip || !address || !hasChanges || loading}
            onPress={handleSaveChanges}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>

      {/* Delete Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1} 
          onPress={() => setDeleteModalVisible(false)}
        >
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalContent}>
              <View style={styles.popover}>
                <View style={styles.deleteModalHeader}>
                  <Text style={styles.deleteModalTitle}>Delete address</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteActionButton}
                  onPress={handleDeleteAddress}
                  disabled={loading}
                >
                  <View style={styles.textWrapper}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#E7522F" />
                    ) : (
                      <>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                        <RedBinIcon width={24} height={24} style={styles.iconRight} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.cancelActionButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <View style={styles.textWrapper}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                  <XRegularIcon width={24} height={24} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    borderRadius: 12,
    padding: 8,
    marginRight: -4, 
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
  inputSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 102,
    alignSelf: 'center',
    flexGrow: 0,
  },
  addressSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 150, // Increased height for address section
    alignSelf: 'center',
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
    alignSelf: 'center', 
    flexGrow: 0,
  },
  addressFieldWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 0,
    gap: 8,
    width: 327,
    height: 126, // Increased height for address field wrap
    alignSelf: 'center', 
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
    textAlign: 'left', 
    alignSelf: 'flex-start',
  },
  textField: {
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
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    backgroundColor: 'transparent',
    padding: 0,
  },
  picker: {
    flex: 1,
    color: '#202325',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    height: 48,
    backgroundColor: 'transparent',
    appearance: 'none', // Hide default dropdown arrow
  },
  pickerItem: {
    color: '#202325',
    fontSize: 16,
  },
  actionSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
    width: 375,
    alignSelf: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    backgroundColor: '#C0DAC2', 
  },
  saveBtnEnabled: {
    backgroundColor: '#539461',
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
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
  dropdownIcon: {
    position: 'absolute',
    right: 16,
    pointerEvents: 'none',
  },
  selectedText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
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
    borderBottomColor: '#EEEEEE',
  },
  stateItemText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#202325',
  },
  selectedStateItem: {
    backgroundColor: '#F5F9F6',
  },
  selectedStateItemText: {
    color: '#539461',
    fontWeight: '600',
  },
  cityItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cityItemText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#202325',
  },
  selectedCityItem: {
    backgroundColor: '#F5F9F6',
  },
  selectedCityItemText: {
    color: '#539461',
    fontWeight: '600',
  },
  helperText: {
    width: 327,
    height: 40,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    alignSelf: 'stretch',
    marginTop: 4,
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: 340,
    height: 158,
    flex: 0,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  popover: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 0,
    width: 340,
    height: 102,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  deleteModalHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
    width: 340,
    height: 38,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  deleteModalTitle: {
    width: 292,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    color: '#202325',
    flex: 0,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  actionSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 340,
    height: 48,
    flex: 0,
    order: 1,
    flexGrow: 0,
  },
  deleteActionButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 340,
    height: 48,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: '#CDD3D4',
    flex: 0,
    order: 1,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  cancelActionButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 340,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    marginTop: 8,
    flex: 0,
    order: 1,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  textWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: '100%',
    height: 16,
    flex: 0,
    order: 2,
    flexGrow: 0,
    position: 'relative',
  },
  deleteButtonText: {
    width: 51,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 16,
    display: 'flex',
    alignItems: 'center',
    color: '#E7522F',
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  cancelButtonText: {
    width: 39,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 16,
    display: 'flex',
    alignItems: 'center',
    color: '#393D40',
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  iconRight: {
    position: 'absolute',
    width: 24,
    height: 24,
    right: 16,
    top: '50%',
    marginTop: -12,
    flex: 0,
    order: 4,
    flexGrow: 0,
    zIndex: 4,
  },
});

export default UpdateAddressScreen;
