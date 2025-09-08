import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  findNodeHandle,
  UIManager,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {getProfileInfoApi, postBuyerUpdateInfoApi, uploadProfilePhotoApi} from '../../../components/Api';
import {AuthContext} from '../../../auth/AuthProvider';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Avatar from '../../../components/Avatar/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';

// Edit Icon Component (Camera Icon)
const EditIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M14 12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V6C2 5.64638 2.14048 5.30724 2.39052 5.05719C2.64057 4.80714 2.97971 4.66667 3.33333 4.66667H5.33333L6.66667 2.66667H9.33333L10.6667 4.66667H12.6667C13.0203 4.66667 13.3594 4.80714 13.6095 5.05719C13.8595 5.30724 14 5.64638 14 6V12.6667Z"
      stroke="#539461"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M8 11.3333C9.47276 11.3333 10.6667 10.1394 10.6667 8.66667C10.6667 7.19391 9.47276 6 8 6C6.52724 6 5.33333 7.19391 5.33333 8.66667C5.33333 10.1394 6.52724 11.3333 8 11.3333Z"
      stroke="#539461"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);


// Dropdown Icon Component
const DropdownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M4 6L8 10L12 6"
      stroke="#202325"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Simple skeleton UI used while profile data is loading
const SkeletonProfile = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonLine} />
    <View style={styles.skeletonInput} />
    <View style={styles.skeletonInput} />
    <View style={styles.skeletonInput} />
    <View style={styles.skeletonButton} />
  </View>
);

const AccountInformationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {userInfo, updateProfileImage} = useContext(AuthContext);
  const isFocused = useIsFocused();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [email, setEmail] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Profile photo states
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Ref for Avatar component
  const avatarRef = useRef(null);

  // Track original values to detect changes
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const countryOptions = [
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+63', country: 'PH', flag: '🇵🇭' },
    { code: '+66', country: 'TH', flag: '🇹🇭' },
    { code: '+62', country: 'ID', flag: '🇮🇩' },
  ];

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        // Try to load the profile photo from AsyncStorage first
        try {
          const storedPhotoUrl = await AsyncStorage.getItem('profilePhotoUrlWithTimestamp') || 
                                 await AsyncStorage.getItem('profilePhotoUrl');
          if (storedPhotoUrl) {
            setProfilePhotoUri(storedPhotoUrl);
          }
        } catch (e) {
          console.warn('Failed to get profile photo from AsyncStorage:', e);
        }
        
        await loadProfileData();
    } catch (error) {
      
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused]);

  // Check for changes in form fields
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return; // Wait for original data to be loaded
    
    const currentData = {
      firstName,
      lastName,
      phoneNumber,
      countryCode
    };
    
    const originalComparison = {
      firstName: originalData.firstName,
      lastName: originalData.lastName,
      phoneNumber: originalData.phoneNumber,
      countryCode: originalData.countryCode
    };
    
    const hasFormChanges = JSON.stringify(currentData) !== JSON.stringify(originalComparison);
    setHasChanges(hasFormChanges);
  }, [firstName, lastName, phoneNumber, countryCode, originalData]);

  const loadProfileData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getProfileInfoApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load profile api');
    }
    setData(res);
    
    // Store original data for comparison
    const originalValues = {
      firstName: res.firstName || '',
      lastName: res.lastName || '',
      phoneNumber: res.contactNumber || '',
      countryCode: res.countryCode || '+1',
      email: res.email || ''
    };
    setOriginalData(originalValues);
    
    // Populate form fields with fetched data
    setFirstName(originalValues.firstName);
    setLastName(originalValues.lastName);
    setPhoneNumber(originalValues.phoneNumber);
    setCountryCode(originalValues.countryCode);
    setEmail(originalValues.email);
    
    // Set profile photo if available
    if (res.profilePhotoUrl) {
      setProfilePhotoUri(res.profilePhotoUrl);
    }
    
    // Reset changes flag
    setHasChanges(false);
  };

  const validateForm = () => {
    let errors = [];

    if (!firstName.trim()) errors.push('First name is required.');
    if (!lastName.trim()) errors.push('Last name is required.');
    if (!phoneNumber.trim()) errors.push('Contact number is required.');

    return errors;
  };

  // Request permissions for camera and photo library
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    const sdkInt = parseInt(Platform.Version, 10);
    const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

    if (sdkInt >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const allGranted = Object.values(granted).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED,
    );

    return allGranted;
  };

  // Handle camera selection
  const handleCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera or media access was not granted.',
      );
      setShowImagePicker(false);
      return;
    }

    launchCamera({mediaType: 'photo', quality: 1}, response => {
      setShowImagePicker(false);
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        handlePhotoUpload(uri);
      }
    });
  };

  // Handle gallery selection
  const handleGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Media access was not granted.');
      setShowImagePicker(false);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
      },
      response => {
        setShowImagePicker(false);
        if (response.didCancel || response.errorCode) return;
        const uri = response.assets?.[0]?.uri;
        if (uri) {
          handlePhotoUpload(uri);
        }
      },
    );
  };

  // Handle photo selection and upload via server multipart/form-data endpoint
  const handlePhotoUpload = async (imageUri) => {
    if (!imageUri) return;

    setUploadingPhoto(true);

    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Error', 'No internet connection.');
        return;
      }

      // Get and display current user ID for debugging purposes
      let currentUserId = null;
      try {
        const firebase = require('../../../../firebase');
        currentUserId = firebase.auth().currentUser?.uid;
        console.log('Current user ID for upload:', currentUserId);
        
        // Check if user ID matches hardcoded server ID
        const hardcodedTestId = "IxsO07FVxxYE5pw944YTEkBt0QJ3";
        if (currentUserId && currentUserId !== hardcodedTestId) {
          console.warn(`Warning: Your user ID (${currentUserId}) doesn't match the hardcoded server ID (${hardcodedTestId})`);
        }
      } catch (e) {
        console.log('Could not get current user ID:', e.message);
      }

      console.log('Starting profile photo upload with URI:', imageUri);
      
      // Upload via server endpoint which expects form-data field 'profilePhoto'
      const result = await uploadProfilePhotoApi(imageUri);
      console.log('Upload API response:', result);

      // Check if the server response indicates an error
      if (!result.success) {
        throw new Error(result.error || result.message || 'Server reported an error during upload');
      }

      // Server returns profilePhotoUrl on success
      const newUrl = result?.profilePhotoUrl || result?.profileImage || null;
      if (!newUrl) throw new Error('Upload succeeded but server did not return a URL.');

      console.log('New profile photo URL:', newUrl);

      // Update local UI with a cache-busted URL for immediate refresh
      const timestamp = Date.now();
      const localCacheBusted = `${newUrl}${newUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
      setProfilePhotoUri(localCacheBusted);

      // Store the URL in AsyncStorage for other screens to access
      try {
        // Store both the canonical URL and the cache-busted URL
        await AsyncStorage.setItem('profilePhotoUrl', newUrl);
        await AsyncStorage.setItem('profilePhotoUrlWithTimestamp', localCacheBusted);
        
        // Also store in buyerProfile if it exists
        const profileRaw = await AsyncStorage.getItem('buyerProfile');
        if (profileRaw) {
          try {
            const profile = JSON.parse(profileRaw);
            profile.profilePhotoUrl = newUrl;
            await AsyncStorage.setItem('buyerProfile', JSON.stringify(profile));
          } catch (e) {
            
          }
        }
  } catch (e) {
        
  }

      // Persist canonical URL into AuthContext with the same timestamp for consistency
  if (typeof updateProfileImage === 'function') {
        
        // Force the timestamp in AuthContext to match our local one for consistent updates
        await updateProfileImage(newUrl);
        
        // Also update userInfo in AsyncStorage directly for immediate consistency across screens
        try {
          const userInfoStr = await AsyncStorage.getItem('userInfo');
          if (userInfoStr) {
            const userInfoObj = JSON.parse(userInfoStr);
            userInfoObj.profileImage = newUrl;
            userInfoObj.profileImageTimestamp = timestamp;
            userInfoObj.profileImageWithTimestamp = localCacheBusted;
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoObj));
            
          }
        } catch (e) {
          
        }
        
        // Force Avatar components to refresh by triggering a state update
        setTimeout(() => {
          // Re-apply profile URI with a fresh timestamp after a short delay
          setProfilePhotoUri(`${newUrl}${newUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`);
          
          // Refresh the avatar component using ref
          if (avatarRef.current) {
            avatarRef.current.refresh();
          }
        }, 100);
      }

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Photo upload error:', error);
      // Provide more specific error message based on the type of error
      let errorMessage = 'Failed to upload photo. Please try again.';
      
      if (error.serverResponse) {
        // This is a server response error with details
        errorMessage = error.message || 'Server error during photo upload';
        
        // Check for typical test/development errors
        if (error.message && error.message.toLowerCase().includes('testing')) {
          const firebase = require('../../../../firebase');
          const currentUserId = firebase.auth().currentUser?.uid;
          const hardcodedTestId = "IxsO07FVxxYE5pw944YTEkBt0QJ3";
          
          if (currentUserId && currentUserId !== hardcodedTestId) {
            errorMessage += `\n\nServer using test ID: ${hardcodedTestId}\nYour ID: ${currentUserId}\n\nThe server is currently in test mode using a hardcoded user ID.`;
          }
        }
      } else if (error.message) {
        // Use the error message if available
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'OK',
            style: 'cancel'
          },
          {
            text: 'Debug Details',
            onPress: () => {
              if (error.serverResponse) {
                Alert.alert(
                  'Debug Info',
                  JSON.stringify(error.serverResponse, null, 2),
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Debug Info', 'No detailed server response available');
              }
            }
          }
        ]
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Validation Error: ' + errors.join(' '));
      return;
    }

    setLoading(true);

    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        alert('No internet connection.');
        throw new Error('No internet connection.');
      }

      const response = await postBuyerUpdateInfoApi(
        firstName.trim(),
        lastName.trim(),
        countryCode,
        phoneNumber.trim(),
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Update account failed.');
      }

      alert('Account updated successfully!');
      
      // Reset changes flag and update original data
      setHasChanges(false);
      const updatedOriginalData = {
        firstName,
        lastName,
        phoneNumber,
        countryCode,
        email
      };
      setOriginalData(updatedOriginalData);
      
      // Refresh the data after successful update
      await loadProfileData();
    } catch (error) {
      console.log('Update Account:', error.message);
      alert('Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      {loading ? (
        <SkeletonProfile />
      ) : (
        <>
          <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

          {/* Header */}
          <View style={[styles.header, {paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <LeftIcon width={24} height={24} fill="#393D40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account Information</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 20)}}
            showsVerticalScrollIndicator={false}
          >
        {/* Form */}
  <View style={styles.form}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {/* Use the shared Avatar component with imageUri to force refresh */}
              <Avatar 
                ref={avatarRef}
                size={96}
                imageUri={profilePhotoUri}
                style={styles.avatarImage}
                onPress={null} // Disable default navigation
              />
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#539461" />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowImagePicker(true)}
            >
              <EditIcon />
            </TouchableOpacity>
          </View>

          {/* Email Display */}
          <View style={styles.emailSection}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                First Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#888888"
                />
              </View>
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                Last Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#888888"
                />
              </View>
            </View>
          </View>

          {/* Contact Number */}
          <View style={styles.contactSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <View style={styles.phoneField}>
                <TouchableOpacity 
                  style={styles.countryCode}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <View style={styles.countrySection}>
                    <Text style={styles.flagEmoji}>
                      {countryOptions.find(c => c.code === countryCode)?.flag || '🇺🇸'}
                    </Text>
                  </View>
                  <Text style={styles.codeText}>{countryCode}</Text>
                  <DropdownIcon />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="123-456-7890"
                  placeholderTextColor="#202325"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !hasChanges && styles.saveButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <View style={styles.buttonTextContainer}>
                <Text style={[
                  styles.buttonText,
                  !hasChanges && styles.buttonTextDisabled
                ]}>
                  Update Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
          </ScrollView>
        </>
      )}

      {/* Country Picker Modal */}
      <Modal 
        visible={showCountryPicker} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            {countryOptions.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode(option.code);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>{option.flag}</Text>
                <Text style={styles.countryText}>{option.country}</Text>
                <Text style={styles.codeText}>{option.code}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>

      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showImagePicker}
        onRequestClose={() => setShowImagePicker(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowImagePicker(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalOption} onPress={handleCamera}>
              <Text style={styles.modalOptionText}>
                📷 Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleGallery}>
              <Text style={styles.modalOptionText}>
                🖼️ Choose from Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  spacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  form: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    padding: 0,
    width: 375,
    minWidth: 375,
    maxWidth: 375,
    alignSelf: 'center', 
    flexGrow: 0,
  },
  avatarSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 120,
    alignSelf: 'stretch',
    position: 'relative',
  },
  avatarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 96,
    height: 96,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#FFF',
    position: 'relative',
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 48,
  },
  // Skeleton styles
  skeletonContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: 375,
    alignSelf: 'center',
  },
  skeletonAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6EAEA',
    marginBottom: 16,
  },
  skeletonLine: {
    width: 200,
    height: 16,
    backgroundColor: '#E6EAEA',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonInput: {
    width: 327,
    height: 48,
    backgroundColor: '#F2F5F4',
    borderRadius: 12,
    marginBottom: 12,
  },
  skeletonButton: {
    width: 327,
    height: 48,
    backgroundColor: '#E6EAEA',
    borderRadius: 12,
    marginTop: 16,
  },
  editButton: {
    position: 'absolute',
    width: 34,
    minWidth: 34,
    height: 34,
    minHeight: 34,
    left: 223.5,
    top: 43,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    zIndex: 1,
  },
  emailSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    width: 375,
    height: 34,
    alignSelf: 'stretch',
  },
  emailText: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flexGrow: 1,
  },
  inputSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: 375,
    height: 102,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  inputField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    height: 78,
    alignSelf: 'stretch',
  },
  inputLabel: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
  },
  requiredAsterisk: {
    color: '#E53E3E', // Red color for required asterisk
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
    alignSelf: 'stretch',
  },
  textInput: {
    width: 295,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    paddingVertical: 0,
  },
  contactSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 102,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  phoneField: {
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
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 67,
    height: 20,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    width: 24,
    height: 20,
  },
  codeText: {
    width: 19,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#202325',
  },
  flagEmoji: {
    fontSize: 20,
  },
  phoneInput: {
    width: 216,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    paddingVertical: 0,
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    gap: 12,
    width: 375,
    height: 84,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  saveButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 142,
    height: 16,
  },
  buttonText: {
    width: 126,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  buttonTextDisabled: {
    color: '#888888',
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
    marginLeft: -74, // center horizontally
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#202325',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  countryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#202325',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E4E7E9',
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#202325',
  },
  modalCancelText: {
    marginTop: 15,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default AccountInformationScreen;
