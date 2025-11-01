import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StackActions} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import OtpInput from '../../components/InputOtp/OtpInput';
import { auth } from '../../../firebase';
import {
  postSellerPinCodeApi,
  postSellerAfterSignInApi,
  postAdminAfterSignInApi,
  getProfileInfoApi,
} from '../../components/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';

const ScreenLoginOtp = ({navigation}) => {
  const insets = useSafeAreaInsets();
  // Calculate proper bottom padding for safe area
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding

  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState('');
  const {setIsLoggedIn, setUserInfo} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const autoSubmitRef = React.useRef(false);

  const postData = async token => {
    // Try seller PIN validation first (might work for both)
    try {
      const response = await postSellerPinCodeApi(token, pin);
      if (!response.success) {
        throw new Error(response.error || 'Verification failed.');
      }
      console.log('PIN validation successful:', response);
      return response;
    } catch (error) {
      console.log('Seller PIN validation failed:', error.message);
      // For now, still throw the error since we don't have buyer-specific PIN validation
      throw error;
    }
  };

  const postRequestPinData = async token => {
    // Use the PIN validation API which works for both sellers and admins
    try {
      const response = await postSellerPinCodeApi(token, pin);
      if (response.success) {
        return response;
      }
      throw new Error(response.error || 'PIN verification failed.');
    } catch (error) {
      console.log('PIN validation failed:', error.message);
      throw new Error(error.message || 'PIN verification failed.');
    }
  };

  useEffect(() => {
  const user = auth.currentUser;
    console.log('User Here:' + JSON.stringify(user));
    if (user) {
      setCurrentUser(user);
      user.getIdToken().then(token => {
        setIdToken(token);
      });
    } else {
      console.log('No user is signed in.');
    }
  }, []);

  // Auto-submit when pin reaches expected length (skip for test user)
  useEffect(() => {
    const EXPECTED_LENGTH = 4;
    const isTestUser = currentUser?.email === 'testuser@example.com';
    
    // For test user, auto-submit immediately without requiring PIN
    if (isTestUser && !loading && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      setTimeout(async () => {
        try {
          await handlePressLogin();
        } finally {
          autoSubmitRef.current = false;
        }
      }, 100);
      return;
    }
    
    // For regular users, require 4-digit PIN
    if (pin && pin.length === EXPECTED_LENGTH && !loading && !autoSubmitRef.current) {
      autoSubmitRef.current = true; // prevent duplicate auto submissions
      // small timeout so UI updates (keyboard dismiss, etc.) before action
      setTimeout(async () => {
        try {
          await handlePressLogin();
        } finally {
          // allow future auto-submits if user edits the code again
          autoSubmitRef.current = false;
        }
      }, 100);
    }
  }, [pin, loading, currentUser?.email]);

  // const handlePressLogin = async () => {
  //   if (pin.length !== 4) {
  //     Alert.alert('Invalid Code', 'Please enter the 4-digit code.');
  //     return;
  //   } else {
  //     try {
  //       if (idToken != '') {
  //         setLoading(true);
  //         await postData(idToken); // Pass token directly here
  //         console.log('User logged in with ID Token:', idToken);
  //         // TODO: Use this token with your backend API or save session

  //         await AsyncStorage.setItem('authToken', idToken);
  //         setIsLoggedIn(true);
  //       }
  //     } catch (error) {
  //       Alert.alert('Token', error.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  // };

  const handlePressLogin = async () => {
    const isTestUser = currentUser?.email === 'testuser@example.com';
    
    // For test user, skip PIN validation
    if (!isTestUser && pin.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter the 4-digit code.');
      return;
    }

    try {
      if (idToken !== '') {
        setLoading(true);
        
        // Skip OTP verification for test user
        if (!isTestUser) {
          await postData(idToken);
        } else {
          console.log('Skipping OTP verification for test user:', currentUser?.email);
        }

        await AsyncStorage.setItem('authToken', idToken);
        setIsLoggedIn(true);

        // ✅ Fetch and store user profile info after successful login
        const profile = await getProfileInfoApi();
        if (profile?.success) {
          setUserInfo(profile);
          await AsyncStorage.setItem('userInfo', JSON.stringify(profile));

          // Log user type for debugging
          console.log('User type detected:', profile?.user?.userType);
        } else {
          console.log('Profile fetch failed, user type unknown');
        }

        // Force navigation reset to ensure we leave the OTP screen
        setTimeout(() => {
          navigation.dispatch(StackActions.popToTop());
        }, 100);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      // Only show error alert if not a test user (test user skips OTP)
      if (!isTestUser) {
        Alert.alert(
          'Incorrect Code',
          'The authentication code you entered is incorrect. Please check and try again.',
          [{text: 'OK'}]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    setLoading(true);
    try {
      if (idToken != '') {
        await postRequestPinData(idToken);
        setLoading(false);
      }
    } catch (error) {
      console.error('Resend PIN error:', error);
      Alert.alert(
        'Resend Failed',
        'Unable to resend the authentication code. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContent}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.mainContainer}>
        <Text
          style={[
            globalStyles.textXXLGreyDark,
            {textAlign: 'center', fontWeight: 'bold'},
          ]}>
          Enter authentication code
        </Text>
        {currentUser?.email === 'testuser@example.com' ? (
          <Text
            style={[
              globalStyles.textLGGreyDark,
              styles.subtTitle,
              {textAlign: 'center', color: '#699E73', fontStyle: 'italic'},
            ]}>
            Test user detected - OTP verification skipped
          </Text>
        ) : (
          <Text
            style={[
              globalStyles.textLGGreyDark,
              styles.subtTitle,
              {textAlign: 'center'},
            ]}>
            Enter the 4-digit that we have sent via the email
          </Text>
        )}
        {currentUser?.email !== 'testuser@example.com' && (
          <OtpInput length={4} onChangeOtp={setPin} />
        )}
        <View
          style={[
            styles.buttonContainer,
            {marginBottom: safeBottomPadding + 20},
          ]}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          {currentUser?.email !== 'testuser@example.com' && (
            <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
              <TouchableOpacity onPress={handleResendPin}>
                <Text style={globalStyles.textLGAccent}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    margin: 20,
  },
  subtTitle: {
    paddingTop: 10,
  },
  buttonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // marginBottom handled dynamically based on safe area
    marginHorizontal: 10,
  },
  loginAccountContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenLoginOtp;
