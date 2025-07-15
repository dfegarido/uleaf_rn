import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import DropdownIcon from '../../../assets/icons/greydark/dropdown-arrow.svg';

const AddNewAddressScreen = () => {
  const navigation = useNavigation();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
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

  const handleSaveAddress = () => {
    // Here we would typically save the address to a database or state management
    // For now, we'll just navigate back to the address book
    navigation.goBack();
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
        <View style={styles.addressSection}>
          <View style={styles.addressFieldWrap}>
            <Text style={styles.inputLabel}>Address Line<Text style={{color: '#E53935'}}>*</Text></Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholderTextColor="#647276"
                value={addressLine}
                onChangeText={setAddressLine}
                numberOfLines={1}
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
          >
            <Text style={styles.saveBtnText}>Add Address</Text>
          </TouchableOpacity>
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
    height: 150,
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
    height: 126,
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
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    height: 24,
    padding: 0,
  },
  selectedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    width: '90%',
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    width: '90%',
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
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    marginTop: 8,
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
    flex: 0,
  },
  saveBtn: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 24,
    isolation: 'isolate',
    width: 327,
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    flex: 1,
    flexGrow: 1,
    // Ensuring all Figma CSS properties are included
  },
  saveBtnEnabled: {
    backgroundColor: '#539461', // Vibrant green color for enabled state
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
    alignSelf: 'center',
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
