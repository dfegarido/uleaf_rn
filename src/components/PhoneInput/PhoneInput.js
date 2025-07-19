import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';

const US_COUNTRY = {
  name: 'United States',
  code: 'US',
  callingCode: '+1',
  flag: '🇺🇸',
};

const PhoneInput = ({initialPhoneNumber = '', onChange}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (initialPhoneNumber) {
      if (initialPhoneNumber.startsWith(US_COUNTRY.callingCode)) {
        setPhoneNumber(initialPhoneNumber.replace(US_COUNTRY.callingCode, ''));
      } else {
        setPhoneNumber(initialPhoneNumber);
      }
    }
  }, [initialPhoneNumber]);

  useEffect(() => {
    if (onChange) {
      onChange(US_COUNTRY.callingCode + phoneNumber);
    }
  }, [phoneNumber, onChange]);

  return (
    <View>
      <View style={styles.inputContainer}>
        <View style={styles.countryPicker}>
          <Text style={styles.flag}>{US_COUNTRY.flag}</Text>
          <Text style={styles.callingCode}>{US_COUNTRY.callingCode}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="XXX-XXX-XXXX"
          keyboardType="phone-pad"
          value={phoneNumber}
          maxLength={10}
          onChangeText={text => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
        />
      </View>
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
