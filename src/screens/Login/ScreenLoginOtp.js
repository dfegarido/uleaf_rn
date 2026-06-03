import React, {useState, useEffect, useContext} from 'react';
import {View, Text, TouchableOpacity, Modal, Alert, StyleSheet, Dimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import OtpInput from '../../components/InputOtp/OtpInput';
import {auth} from '../../../firebase';
import {
  postSellerPinCodeApi,
  postSellerAfterSignInApi,
  postAdminAfterSignInApi,
  getProfileInfoApi,
} from '../../components/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';
import Loading from '../../components/Loading';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import XCircleIcon from '../../assets/icons/greydark/x-circle.svg';
import EnvelopeIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import LottieView from 'lottie-react-native';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const TOKENS = {
  bg: '#F7F8F2',
  lightSage: '#D4E5D2',
  cream: '#F0EDE5',
  sage: '#6BA368',
  sageDark: '#4E8A4B',
  textPrimary: '#243024',
  textSecondary: '#7A7A7A',
  white: '#FFFFFF',
  error: '#FF5247',
  errorBg: '#FFF0EF',
};

const ScreenLoginOtp = ({navigation}) => {
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState('');
  const {setIsLoggedIn, setUserInfo} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [resendModalVisible, setResendModalVisible] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(120);
  const autoSubmitRef = React.useRef(false);
  const lastAutoSubmittedPinRef = React.useRef(null);
  const countdownIntervalRef = React.useRef(null);

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
    // Resend flow must call signInSupplier to generate/send a fresh OTP PIN.
    try {
      const response = await postSellerAfterSignInApi(token);
      if (response.success) {
        return response;
      }
      throw new Error(response.error || 'Failed to resend PIN.');
    } catch (error) {
      console.log('PIN resend failed:', error.message);
      throw new Error(error.message || 'PIN resend failed.');
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

  // Allow auto-submit again only after user edits code below expected length.
  useEffect(() => {
    const EXPECTED_LENGTH = 4;
    if ((pin || '').length < EXPECTED_LENGTH) {
      lastAutoSubmittedPinRef.current = null;
    }
  }, [pin]);

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
    if (
      pin &&
      pin.length === EXPECTED_LENGTH &&
      !loading &&
      !autoSubmitRef.current &&
      lastAutoSubmittedPinRef.current !== pin
    ) {
      autoSubmitRef.current = true; // prevent duplicate auto submissions
      lastAutoSubmittedPinRef.current = pin; // prevent re-submitting same unchanged wrong PIN
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
        await AsyncStorage.setItem('loginPhase', 'otp_verified');

        // ✅ Fetch and store user profile info BEFORE setting isLoggedIn
        // This ensures AppNavigation has userInfo when it checks auth state
        let profileData = null;
        try {
          const profile = await getProfileInfoApi();
          if (profile?.success) {
            profileData = profile;
            // Set userInfo in context FIRST - use a callback to ensure it's set
            setUserInfo(profile);
            // Then save to AsyncStorage
            await AsyncStorage.setItem('userInfo', JSON.stringify(profile));
            console.log('✅ userInfo set in context and AsyncStorage');

            // Extract and store profile photo
            const profilePhotoUrl = profile?.data?.profilePhotoUrl || 
                                   profile?.data?.profileImage ||
                                   profile?.user?.profilePhotoUrl ||
                                   profile?.user?.profileImage ||
                                   profile?.profilePhotoUrl ||
                                   profile?.profileImage ||
                                   null;
            
            if (profilePhotoUrl) {
              const timestamp = Date.now();
              const cacheBustedUrl = `${profilePhotoUrl}${profilePhotoUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
              await AsyncStorage.setItem('profilePhotoUrl', profilePhotoUrl);
              await AsyncStorage.setItem('profilePhotoUrlWithTimestamp', cacheBustedUrl);
              console.log('✅ Profile photo stored in AsyncStorage:', profilePhotoUrl);
            } else {
              console.log('ℹ️ No profile photo found in profile response');
            }

            // Log user type for debugging
            console.log('✅ User type detected:', profile?.user?.userType);
            console.log('✅ Profile loaded successfully');
          } else {
            console.warn('⚠️ Profile fetch returned unsuccessful response:', profile);
            // Still set isLoggedIn even if profile fetch fails
            // AppNavigation will handle the fallback
          }
        } catch (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          // Don't block login if profile fetch fails - AppNavigation will handle it
          // But log the error for debugging
        }
        
        // Clear loading state BEFORE setting isLoggedIn to ensure screen is ready for navigation
        setLoading(false);

        // Show success checkmark animation before switching to dashboard
        setShowSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowSuccess(false);

        // Ensure userInfo is available before setting isLoggedIn
        // If profile fetch failed, AppNavigation will show loading and handle fallback
        if (!profileData) {
          console.warn('⚠️ No profile data available, but proceeding with login');
        }

        console.log('🔄 Setting isLoggedIn to true...');
        setIsLoggedIn(true);
        console.log('✅ setIsLoggedIn(true) called - NavigationContainer should remount with new key');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setLoading(false);
      // Only show error modal if not a test user (test user skips OTP)
      if (!isTestUser) {
        setErrorModalVisible(true);
      }
    }
  };

  const startResendCountdown = () => {
    setResendDisabled(true);
    setCountdown(120);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startResendCountdown();
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleResendPin = () => {
    if (resendDisabled) return;
    setResendModalVisible(true);
  };

  const confirmResend = async () => {
    setResendModalVisible(false);
    setLoading(true);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken(true) : idToken;
      if (!token) {
        Alert.alert(
          'Session expired',
          'Please go back and sign in again to request a new code.',
          [{text: 'OK'}],
        );
        return;
      }
      setIdToken(token);
      await postRequestPinData(token);
      setPin('');
      startResendCountdown();
    } catch (error) {
      console.error('Resend PIN error:', error);
      Alert.alert(
        'Resend Failed',
        error?.message || 'Unable to resend the authentication code. Please try again.',
        [{text: 'OK'}],
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <View style={styles.rootContainer}>
      {/* Organic Background Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
      </View>

      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.mainContainer}>
          {/* Back button */}
          <View style={styles.backButtonRow}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('LoginForm');
                }
              }}>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.lottieRow}>
            <LottieView
              source={require('../../assets/lottie/otp_mobile_notification.lottie')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>Verification Code</Text>
          {currentUser?.email === 'testuser@example.com' ? (
            <Text style={[styles.subtitle, {color: TOKENS.sage, fontStyle: 'italic'}]}>
              Test user detected - OTP verification skipped
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Please enter verification code sent to your email
            </Text>
          )}

          <View style={styles.inputSection}>
            {currentUser?.email !== 'testuser@example.com' && (
              <OtpInput length={4} onChangeOtp={setPin} />
            )}
          </View>

          {currentUser?.email !== 'testuser@example.com' && (
            <View style={styles.resendRow}>
              <TouchableOpacity
                onPress={handleResendPin}
                disabled={resendDisabled}
                activeOpacity={resendDisabled ? 1 : 0.7}
              >
                <Text
                  style={[
                    styles.resendText,
                    resendDisabled && styles.resendTextDisabled,
                  ]}>
                  {resendDisabled
                    ? `Resend code in ${formatCountdown()}`
                    : 'RESEND CODE'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handlePressLogin}>
              <Text style={styles.verifyButtonText}>VERIFY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Loading visible={loading} fullscreen />

      {/* Success checkmark overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <LottieView
            source={require('../../assets/lottie/Checkmark.lottie')}
            autoPlay
            loop={false}
            style={styles.checkmarkLottie}
          />
        </View>
      )}

      {/* Incorrect code modal */}
      <Modal
        transparent
        animationType="fade"
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <XCircleIcon width={32} height={32} color={TOKENS.error} />
              </View>
            </View>

            <Text style={styles.modalTitle}>Incorrect Code</Text>
            <Text style={styles.modalMessage}>
              The authentication code you entered is incorrect. Please check and try again.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setErrorModalVisible(false);
                setPin('');
              }}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Resend code confirmation modal */}
      <Modal
        transparent
        animationType="fade"
        visible={resendModalVisible}
        onRequestClose={() => setResendModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircleSuccess}>
                <EnvelopeIcon width={32} height={32} color={TOKENS.sage} />
              </View>
            </View>

            <Text style={styles.modalTitle}>Check Your Email</Text>
            <Text style={styles.modalMessage}>
              A new 4-digit authentication code has been sent to your email. Please check your inbox.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={confirmResend}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: TOKENS.bg,
  },
  safeContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginTop: 12,
  },
  backButtonRow: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  lottieRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  lottie: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TOKENS.textPrimary,
    textAlign: 'left',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: TOKENS.textSecondary,
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendRow: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.sage,
    letterSpacing: 0.5,
  },
  resendTextDisabled: {
    color: TOKENS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  buttonSection: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  verifyButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TOKENS.sage,
    shadowColor: TOKENS.sageDark,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  verifyButtonText: {
    color: TOKENS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  checkmarkLottie: {
    width: 200,
    height: 200,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(36, 48, 36, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: TOKENS.white,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  modalIconRow: {
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: TOKENS.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: TOKENS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TOKENS.sage,
  },
  modalButtonText: {
    color: TOKENS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Background blobs
  blob1: {
    position: 'absolute',
    top: -SCREEN_H * 0.05,
    left: -SCREEN_W * 0.2,
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.35,
  },
  blob2: {
    position: 'absolute',
    top: SCREEN_H * 0.25,
    right: -SCREEN_W * 0.25,
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    borderRadius: 999,
    backgroundColor: TOKENS.cream,
    opacity: 0.4,
  },
  blob3: {
    position: 'absolute',
    bottom: -SCREEN_H * 0.08,
    left: SCREEN_W * 0.15,
    width: SCREEN_W * 0.5,
    height: SCREEN_W * 0.5,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.25,
  },
});

export default ScreenLoginOtp;
