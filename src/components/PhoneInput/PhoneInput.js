import React, {useState, useEffect} from 'react';
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
    name: 'Thailand',
    code: 'TH',
    callingCode: '+66',
    flag: '🇹🇭',
  },
  {
    name: 'Japan',
    code: 'JP',
    callingCode: '+81',
    flag: '🇯🇵',
  },
  {
    name: 'South Korea',
    code: 'KR',
    callingCode: '+82',
    flag: '🇰🇷',
  },
  {
    name: 'China',
    code: 'CN',
    callingCode: '+86',
    flag: '🇨🇳',
  },
  {
    name: 'Indonesia',
    code: 'ID',
    callingCode: '+62',
    flag: '🇮🇩',
  },
];

const PhoneInput = ({initialPhoneNumber = '', onChange}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [modalVisible, setModalVisible] = useState(false);

  // Detect and set country from initialPhoneNumber
  useEffect(() => {
    if (initialPhoneNumber) {
      const found = countries.find(c =>
        initialPhoneNumber.startsWith(c.callingCode),
      );
      if (found) {
        setSelectedCountry(found);
        setPhoneNumber(initialPhoneNumber.replace(found.callingCode, ''));
      } else {
        setPhoneNumber(initialPhoneNumber);
      }
    }
  }, [initialPhoneNumber]);

  // Update parent with final full number
  useEffect(() => {
    if (onChange) {
      onChange(selectedCountry.callingCode + phoneNumber);
    }
  }, [selectedCountry, phoneNumber]);

  const onSelectCountry = country => {
    setSelectedCountry(country);
    setModalVisible(false);
  };

  return (
    <View>
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.countryPicker} onPress={() => {}}>
          <Text style={styles.flag}>{US_COUNTRY.flag}</Text>
          <Text style={styles.callingCode}>{US_COUNTRY.callingCode}</Text>
          <DownIcon width={20} height={20} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="XXX-XXX-XXXX"
          keyboardType="phone-pad"
          value={phoneNumber}
          maxLength={10}
          onChangeText={text => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
        />
      </View>

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
    color: '#000',
  },
  callingCode: {
    marginLeft: 6,
    fontSize: 16,
    color: '#000',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
    color: '#000',
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});

export default PhoneInput;
