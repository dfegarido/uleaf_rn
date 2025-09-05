import React, {useState, useEffect, useContext} from 'react';
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
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {InputDropdown} from '../../components/Input';
import NetInfo from '@react-native-community/netinfo';
import {ImagePickerNoButton} from '../../components/ImagePicker';
import {uploadImageToFirebaseProfile} from '../../utils/uploadImageToFirebaseProfile';
import {AuthContext} from '../../auth/AuthProvider';
import Avatar from '../../components/Avatar/Avatar';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CameraIcon from '../../assets/icons/accent/camera.svg';

import {postProfileUpdateInfoApi} from '../../components/Api';

const ScreenProfileAccount = ({navigation, route}) => {
  const {updateProfileImage, userInfo} = useContext(AuthContext);
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
    // Handle additional fields that might be in the data
    address,
    city,
    state,
    zipCode,
    profileImage,
  } = route.params || {};

  const [firstNameState, setFirstNameState] = useState(firstName);
  const [lastNameState, setLastNameState] = useState(lastName);
  const [contactNumberState, setContactNumberState] = useState(contactNumber);
  const [finalPhone, setFinalPhone] = useState('');
  const [gardenOrCompanyNameState, setGardenOrCompanyNameState] =
    useState(gardenOrCompanyName);
  const [countryState, setCountryState] = useState(country);

  // Track original values to detect changes
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [selectedCountry, setSelectedCountry] = useState('');

  // Set up original data and track changes
  useEffect(() => {
    const originalValues = {
      firstName: firstName || '',
      lastName: lastName || '',
      contactNumber: contactNumber || '',
      gardenOrCompanyName: gardenOrCompanyName || '',
      country: country || '',
      isImageChange: isImageChange,
    };
    setOriginalData(originalValues);
    // Prefer authoritative profile image from AuthContext when available
    const contextImage = userInfo?.profileImage || '';
    const initialImage = contextImage || profileImage || '';
    if (initialImage) setImages([initialImage]);
  }, [firstName, lastName, contactNumber, gardenOrCompanyName, country]);

  // Keep local images in sync when AuthContext profile image changes elsewhere
  useEffect(() => {
    if (userInfo?.profileImage) {
      setImages([userInfo.profileImage]);
    }
  }, [userInfo?.profileImage]);

  // Check for changes in form fields
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return; // Wait for original data to be loaded

    const currentData = {
      firstName: firstNameState,
      lastName: lastNameState,
      contactNumber: finalPhone || contactNumberState,
      gardenOrCompanyName: gardenOrCompanyNameState,
      country: countryState,
      isImageChange: isImageChange,
    };

    const originalComparison = {
      firstName: originalData.firstName,
      lastName: originalData.lastName,
      contactNumber: originalData.contactNumber,
      gardenOrCompanyName: originalData.gardenOrCompanyName,
      country: originalData.country,
      isImageChange: originalData.isImageChange,
    };

    const hasFormChanges =
      JSON.stringify(currentData) !== JSON.stringify(originalComparison);
    console.log('form change: ' + hasFormChanges);
    setHasChanges(hasFormChanges);
  }, [
    firstNameState,
    lastNameState,
    finalPhone,
    contactNumberState,
    gardenOrCompanyNameState,
    countryState,
    originalData,
    images,
  ]);

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

      // Upload images to Firebase
      const uploadedUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebaseProfile(uri);
        uploadedUrls.push(firebaseUrl);
      }

      const response = await postProfileUpdateInfoApi(
        firstNameState,
        lastNameState,
        finalPhone,
        countryState,
        gardenOrCompanyNameState,
        uploadedUrls.length > 0 ? uploadedUrls[0] : '',
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Update account failed.');
      }

      Alert.alert('Update Account', 'Account updated successfully!');

      updateProfileImage(uploadedUrls.length > 0 ? uploadedUrls[0] : '');

      // Reset changes flag and update original data
      setHasChanges(false);
      const updatedOriginalData = {
        firstName: firstNameState,
        lastName: lastNameState,
        contactNumber: finalPhone || contactNumberState,
        gardenOrCompanyName: gardenOrCompanyNameState,
        country: countryState,
        isImageChange: false,
      };
      setOriginalData(updatedOriginalData);
    } catch (error) {
      console.log('Update Account:', error.message);
      Alert.alert('Update Account', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Update

  // Profile Image
  const [images, setImages] = useState([]);
  const [isImageChange, setIsImageChange] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const handleImagePicked = uris => {
    setIsImageChange(!isImageChange);
    // console.log(isImageChange);
    setHasChanges(true);
    setImages(uris);
    // console.log(uris);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{
          marginBottom: insets.bottom + 30,
        }}>
        {/* Search and Icons */}
        <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
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
              {/* Use shared Avatar component so profile updates propagate across screens */}
              {(() => {
                // Determine the canonical image and timestamp to build a cache-busted URI
                const canonical = userInfo?.profileImage || images[0] || '';
                const ts = userInfo?.profileImageTimestamp || Date.now();
                const avatarUri = canonical
                  ? `${canonical}${canonical.includes('?') ? '&' : '?'}cb=${ts}`
                  : null;
                return <Avatar size={120} imageUri={avatarUri} rounded />;
              })()}

              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  backgroundColor: '#F2F7F3',
                  padding: 10,
                  borderRadius: 20,
                }}>
                <ImagePickerNoButton
                  visible={modalVisible}
                  onRequestClose={() => setModalVisible(false)}
                  onImagePicked={handleImagePicked}
                  limit={1}
                />
                <CameraIcon width={20} height={20} />
              </TouchableOpacity>
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
              placeholder={'Enter first name'}
              value={firstNameState}
              setValue={setFirstNameState}
            />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Last name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox
              placeholder={'Enter last name'}
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
              placeholder={'Enter garden or company name'}
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
              style={[
                globalStyles.primaryButton,
                !hasChanges && styles.buttonDisabled,
              ]}
              onPress={onPressUpdate}
              disabled={!hasChanges}>
              <Text
                style={[
                  globalStyles.primaryButtonText,
                  !hasChanges && styles.buttonTextDisabled,
                ]}>
                Update Account
              </Text>
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
    paddingBottom: 12,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  buttonTextDisabled: {
    color: '#888888',
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderWidth: 1,
    borderRadius: 100,
    backgroundColor: '#eee',
  },
});

export default ScreenProfileAccount;
