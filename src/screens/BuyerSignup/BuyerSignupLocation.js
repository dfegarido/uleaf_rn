import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import InputDropdown from '../../components/Input/InputDropdown';
import InputBox from '../../components/Input/InputBox';
import InfoIcon from '../../assets/buyer-icons/information.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATES = ['California', 'Texas', 'New York', 'Florida', 'Illinois'];
const CITIES = ['Los Angeles', 'Houston', 'New York City', 'Miami', 'Chicago'];

const BuyerSignupLocation = () => {
  const navigation = useNavigation();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');

  const handleContinue = async () => {
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
      console.error('Failed to save location info', e);
    }
    navigation.navigate('BuyerGettingToKnow');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
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
              We only serve U.S. buyers. Accounts cannot be created outside the
              United States.
            </Text>
          </View>

          {/* State dropdown */}
          <Text style={styles.label}>
            State<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdown
            options={STATES}
            selectedOption={state}
            onSelect={setState}
            placeholder="Select..."
          />

          {/* City dropdown */}
          <Text style={styles.label}>
            City<Text style={{color: '#FF5247'}}>*</Text>
          </Text>
          <InputDropdown
            options={CITIES}
            selectedOption={city}
            onSelect={setCity}
            placeholder="Select..."
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
            placeholder="Street address, apartment, suite, unit, building, floor, etc."
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
    paddingTop: 32,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
