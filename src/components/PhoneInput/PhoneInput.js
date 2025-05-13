import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';

const countries = [
  {
    name: 'Philippines',
    code: 'PH',
    callingCode: '+63',
    flag: '🇵🇭',
  },
  {
    name: 'United States',
    code: 'US',
    callingCode: '+1',
    flag: '🇺🇸',
  },
  {
    name: 'India',
    code: 'IN',
    callingCode: '+91',
    flag: '🇮🇳',
  },
  // Add more as needed
];

const PhoneInput = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [modalVisible, setModalVisible] = useState(false);

  const onSelectCountry = country => {
    setSelectedCountry(country);
    setModalVisible(false);
  };

  return (
    <View>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.countryPicker}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.callingCode}>{selectedCountry.callingCode}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="XXX-XXX-XXXX"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      {/* Country picker modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <FlatList
              data={countries}
              keyExtractor={item => item.code}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => onSelectCountry(item)}>
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.countryText}>
                    {item.name} ({item.callingCode})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}>
              <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: 'red',
  },
  inputContainer: {
    flexDirection: 'row',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    height: 50,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  flag: {
    fontSize: 20,
  },
  callingCode: {
    marginLeft: 6,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    maxHeight: '60%',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  countryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});

export default PhoneInput;
