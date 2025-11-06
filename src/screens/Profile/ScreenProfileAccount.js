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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {InputDropdown} from '../../components/Input';
import NetInfo from '@react-native-community/netinfo';
import {ImagePickerNoButton} from '../../components/ImagePicker';
import {uploadProfilePhotoApi} from '../../components/Api/uploadProfilePhotoApi';
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

  // Map country names to country codes for phone numbers
  const countryToCodeMap = {
    'Philippines': '+63',
    'Thailand': '+66',
    'Indonesia': '+62',
    'United States': '+1',
  };

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

  // Synchronize phone number with country selection
  useEffect(() => {
    if (countryState && finalPhone) {
      // Get the expected country code for the selected country
      const expectedCode = countryToCodeMap[countryState];
      
      if (expectedCode && !finalPhone.startsWith(expectedCode)) {
        // Extract phone number without any country code
        let numberOnly = finalPhone;
        // Remove any existing country codes
        Object.values(countryToCodeMap).forEach(code => {
          if (numberOnly.startsWith(code)) {
            numberOnly = numberOnly.substring(code.length);
          }
        });
        
        // Rebuild with the correct country code
        const correctedNumber = expectedCode + numberOnly;
        console.log(`Country changed to ${countryState}, updating phone from ${finalPhone} to ${correctedNumber}`);
        setContactNumberState(correctedNumber);
        setFinalPhone(correctedNumber);
      }
    }
  }, [countryState]);

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

      // Use already uploaded image URL if available, otherwise upload now
      const uploadedUrls = [];
      if (isImageChange && images.length > 0) {
        // If image was already auto-uploaded, use that URL
        if (uploadedImageUrl) {
          console.log('✅ Using already uploaded image URL:', uploadedImageUrl);
          uploadedUrls.push(uploadedImageUrl);
        } else {
          // Otherwise, upload now (fallback for edge cases)
          try {
            console.log('🖼️ Starting profile image upload...', { isImageChange, imageCount: images.length });
            
            // Upload using backend API (works for both buyer and seller via Bearer token)
            for (let i = 0; i < images.length; i++) {
              const uri = images[i];
              // Skip if it's already a URL (not a local file)
              if (uri.startsWith('http://') || uri.startsWith('https://')) {
                console.log('ℹ️ Image is already a URL, skipping upload:', uri);
                uploadedUrls.push(uri);
                continue;
              }
              
              console.log(`📤 Uploading image ${i + 1}/${images.length}:`, uri);
              try {
                const result = await uploadProfilePhotoApi(uri);
                const imageUrl = result?.profilePhotoUrl || result?.profileImage;
                if (!imageUrl) {
                  throw new Error('Upload succeeded but no URL returned');
                }
                console.log('✅ Image uploaded successfully:', imageUrl);
                uploadedUrls.push(imageUrl);
              } catch (uploadError) {
                console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
                throw new Error(`Failed to upload image: ${uploadError.message}`);
              }
            }
            console.log('✅ All images uploaded successfully:', uploadedUrls);
          } catch (uploadError) {
            console.error('❌ Image upload error:', uploadError);
            Alert.alert(
              'Image Upload Failed',
              `Could not upload profile image: ${uploadError.message}`,
              [{ text: 'OK' }]
            );
            // Don't continue with profile update if image upload fails
            throw uploadError;
          }
        }
      } else {
        console.log('ℹ️ No image change detected or no images to upload', { isImageChange, imageCount: images.length });
      }

      const response = await postProfileUpdateInfoApi(
        firstNameState,
        lastNameState,
        finalPhone,
        countryState,
        gardenOrCompanyNameState,
        uploadedUrls.length > 0 ? uploadedUrls[0] : (profileImage || ''),
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Update account failed.');
      }

      Alert.alert('Update Account', 'Account updated successfully!');

      if (uploadedUrls.length > 0) {
        updateProfileImage(uploadedUrls[0]);
      }

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  
  const handleImagePicked = async uris => {
    console.log('📸 handleImagePicked called with:', uris);
    if (uris && uris.length > 0 && Array.isArray(uris)) {
      const imageUri = uris[0];
      setImages([imageUri]);
      setHasChanges(true);
      // Close the modal after image is picked
      setModalVisible(false);
      
      // Auto-upload the image immediately
      setUploadingImage(true);
      try {
        console.log('🖼️ Auto-uploading profile image...');
        const result = await uploadProfilePhotoApi(imageUri);
        const imageUrl = result?.profilePhotoUrl || result?.profileImage;
        
        if (!imageUrl) {
          throw new Error('Upload succeeded but no URL returned');
        }
        
        console.log('✅ Profile image auto-uploaded successfully:', imageUrl);
        setUploadedImageUrl(imageUrl);
        setIsImageChange(true);
        
        // Update the AuthContext immediately so the image shows in the UI
        if (updateProfileImage) {
          updateProfileImage(imageUrl);
        }
        
        // Also update the images array with the uploaded URL for display
        setImages([imageUrl]);
      } catch (uploadError) {
        console.error('❌ Auto-upload failed:', uploadError);
        // Show error to user but don't prevent them from saving
        Alert.alert(
          'Upload Warning',
          `Image upload failed: ${uploadError.message}. The image will be uploaded when you click "Update".`,
          [{ text: 'OK' }]
        );
        // Keep the local image so Update button can upload it
        setIsImageChange(true); // Mark as changed so Update will try to upload
      } finally {
        setUploadingImage(false);
      }
    } else {
      console.warn('⚠️ handleImagePicked received invalid URIs:', uris);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={[styles.container]}
            contentContainerStyle={{
              marginBottom: insets.bottom + 30,
            }}
            keyboardShouldPersistTaps="handled">
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
                // Show uploaded image immediately if available, otherwise show current image
                const displayImage = uploadedImageUrl || images[0] || userInfo?.profileImage || '';
                const ts = Date.now();
                const avatarUri = displayImage
                  ? `${displayImage}${displayImage.includes('?') ? '&' : '?'}cb=${ts}`
                  : null;
                return (
                  <View>
                    <Avatar size={120} imageUri={avatarUri} rounded />
                    {uploadingImage && (
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 60,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                );
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
