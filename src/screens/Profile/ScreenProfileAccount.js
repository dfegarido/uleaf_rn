import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {InputDropdown} from '../../components/Input';
import NetInfo from '@react-native-community/netinfo';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CameraIcon from '../../assets/icons/accent/camera.svg';

import {postProfileUpdateInfoApi} from '../../components/Api';

const ScreenProfileAccount = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const {
    activationCode,
    activationUsed,
    authPin,
    authPinExpiresAt,
    contactNumber,
    country,
    currency,
    dateOfEnrollment,
    email,
    firstName,
    gardenOrCompanyName,
    id,
    lastName,
    liveFlag,
    status,
    success,
    timestamp,
    uid,
  } = route.params;

  const [firstNameState, setFirstNameState] = useState(firstName);
  const [lastNameState, setLastNameState] = useState(lastName);
  const [contactNumberState, setContactNumberState] = useState(contactNumber);
  const [finalPhone, setFinalPhone] = useState('');
  const [gardenOrCompanyNameState, setGardenOrCompanyNameState] =
    useState(gardenOrCompanyName);
  const [countryState, setCountryState] = useState(country);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [selectedCountry, setSelectedCountry] = useState('');

  // Form validation
  const validateForm = () => {
    let errors = [];

    if (!firstNameState) errors.push('First name is required.');
    if (!lastNameState) errors.push('Last name is required.');
    if (!finalPhone) errors.push('Contact number is required.');
    if (!gardenOrCompanyNameState)
      errors.push('Garden/company name is required.');
    if (!countryState) errors.push('Country is required.');

    return errors;
  };
  // Form validation

  // Update
  const onPressUpdate = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation', errors.join('\n'));
      return;
    }
    setLoading(true);

    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Network', 'No internet connection.');
        throw new Error('No internet connection.');
      }

      const response = await postProfileUpdateInfoApi(
        firstNameState,
        lastNameState,
        finalPhone,
        countryState,
        gardenOrCompanyNameState,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Update account failed.');
      }

      Alert.alert('Update Account', 'Account updated successfully!');
    } catch (error) {
      console.log('Update Account:', error.message);
      Alert.alert('Update Account', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Update

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView style={[styles.container, {paddingTop: insets.top}]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Account Information
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}
        <View style={{marginHorizontal: 20}}>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <View style={{position: 'relative'}}>
              <Image
                source={require('../../assets/images/AvatarBig.png')}
                style={styles.image}
                resizeMode="contain"
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5, // ⬅️ Add this line to move it to bottom-right
                  backgroundColor: '#F2F7F3',
                  padding: 10,
                  borderRadius: 20,
                }}>
                <CameraIcon width={20} height={20} />
              </View>
            </View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <Text style={globalStyles.textMDGreyDark}>{email}</Text>
          </View>

          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              First name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox
              placeholder={''}
              value={firstNameState}
              setValue={setFirstNameState}
            />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Last name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox
              placeholder={''}
              value={lastNameState}
              setValue={setLastNameState}
            />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Contact number <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <PhoneInput
              initialPhoneNumber={contactNumberState}
              onChange={value => setFinalPhone(value)}
              required
            />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Garden / company name{' '}
              <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox
              placeholder={''}
              value={gardenOrCompanyNameState}
              setValue={setGardenOrCompanyNameState}
            />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Country <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputDropdown
              options={[
                'Philippines',
                'Thailand',
                'Indonesia',
                'United States',
              ]}
              selectedOption={countryState}
              onSelect={setCountryState}
              placeholder="Choose an option"
            />
          </View>
          <View style={{paddingVertical: 20}}>
            <TouchableOpacity
              style={globalStyles.primaryButton}
              onPress={onPressUpdate}>
              <Text style={globalStyles.primaryButtonText}>Update Acount</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Main Content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenProfileAccount;
