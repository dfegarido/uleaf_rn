import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
// import {useHeaderHeight} from '@react-navigation/elements';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  withSequence,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../../../firebase';
import {postSellerAfterSignInApi, postAdminAfterSignInApi} from '../../components/Api';
import {checkMaintenanceApi} from '../../components/Api/maintenanceApi';
import Loading from '../../components/Loading';
import {AuthContext} from '../../auth/AuthProvider';
import {
  completeLoginSession,
  isSupplierAccount,
} from '../../utils/completeLoginSession';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';
import EyeClosedIcon from '../../assets/icons/greydark/eye-closed-regular.svg';
import EyeOpenIcon from '../../assets/icons/greydark/eye-regular.svg';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// ------------------------------------------------------------------
// Design Tokens
// ------------------------------------------------------------------
const TOKENS = {
  sage: '#6BA368',
  sageDark: '#4E8A4B',
  bg: '#F7F8F2',
  textPrimary: '#243024',
  textSecondary: '#7A7A7A',
  inputBorder: '#E0E5DB',
  inputFocus: '#6BA368',
  error: '#FF5247',
  white: '#FFFFFF',
  cream: '#F0EDE5',
  lightSage: '#D4E5D2',
};

// ------------------------------------------------------------------
// Floating Label Input
// ------------------------------------------------------------------
function FloatingInput({
  label,
  value,
  onChangeText,
  IconComponent,
  error,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const hasValue = value && value.length > 0;
  const shouldFloat = isFocused || hasValue;

  useEffect(() => {
    focusProgress.value = withTiming(shouldFloat ? 1 : 0, {duration: 200});
  }, [shouldFloat]);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [error ? TOKENS.error : TOKENS.inputBorder, error ? TOKENS.error : TOKENS.inputFocus],
    ),
    shadowColor: TOKENS.inputFocus,
    shadowOpacity: interpolate(focusProgress.value, [0, 1], [0, 0.15]),
    shadowRadius: interpolate(focusProgress.value, [0, 1], [0, 8]),
    shadowOffset: {width: 0, height: 0},
    elevation: interpolate(focusProgress.value, [0, 1], [0, 2]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(focusProgress.value, [0, 1], [0, -14]),
      },
      {
        scale: interpolate(focusProgress.value, [0, 1], [1, 0.82]),
      },
    ],
    color: interpolateColor(
      focusProgress.value,
      [0, 1],
      [TOKENS.textSecondary, TOKENS.inputFocus],
    ),
  }));

  return (
    <View style={styles.inputWrapper}>
      <Animated.View style={[styles.inputContainer, containerStyle]}>
        <IconComponent width={20} height={20} color={TOKENS.textSecondary} />
        <View style={styles.inputInner}>
          <Animated.Text style={[styles.floatingLabel, labelStyle]}>
            {label}
          </Animated.Text>
          <TextInput
            style={styles.inputField}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            placeholderTextColor="transparent"
          />
        </View>
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------
// Screen
// ------------------------------------------------------------------
const ScreenLoginForm = ({navigation}) => {
  const {setIsLoggedIn, setUserInfo} = useContext(AuthContext);
  const [formData, setFormData] = useState({email: '', password: ''});
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animations
  const entranceProgress = useSharedValue(0);

  useEffect(() => {
    entranceProgress.value = withTiming(1, {duration: 800, easing: Easing.out(Easing.ease)});
  }, []);

  const fadeUp = (delay = 0) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(entranceProgress.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(entranceProgress.value, [0, 1], [20 + delay * 0.5, 0]),
        },
      ],
    }));

  // Logo float animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, {duration: 1500, easing: Easing.inOut(Easing.ease)}),
        withTiming(8, {duration: 1500, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      true,
    );
  }, []);

  const logoFloatStyle = useAnimatedStyle(() => ({
    transform: [{translateY: floatY.value}],
  }));

  // Blob drift (very subtle)
  const blobDrift = useSharedValue(0);
  useEffect(() => {
    blobDrift.value = withRepeat(
      withSequence(
        withTiming(20, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
        withTiming(-20, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      true,
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{translateX: blobDrift.value}],
  }));

  const loginButtonScale = useSharedValue(1);
  const loginButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: loginButtonScale.value}],
  }));

  const requiredFields = ['email', 'password'];

  const loadData = async token => {
    try {
      const postSellerAfterSignInApiData = await postSellerAfterSignInApi(token);
      if (postSellerAfterSignInApiData?.user) {
        return postSellerAfterSignInApiData;
      }
      throw new Error('Seller API returned no user data');
    } catch (sellerError) {
      try {
        const postAdminAfterSignInApiData = await postAdminAfterSignInApi(token);
        if (postAdminAfterSignInApiData?.user) {
          return postAdminAfterSignInApiData;
        }
        throw new Error('Admin API returned no user data');
      } catch (adminError) {
        throw new Error(sellerError.message || 'Failed to authenticate user.');
      }
    }
  };

  const validateFields = () => {
    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'This is a required field';
      }
    });
    setValidateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePressLogin = async () => {
    if (validateFields()) {
      try {
        setLoading(true);
        const authResult = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = authResult.user;

        if (user) {
          const maintenanceResponse = await checkMaintenanceApi();
          if (maintenanceResponse.success && maintenanceResponse.data?.maintenance?.enabled) {
            try {
              const adminResponse = await postAdminAfterSignInApi(await user.getIdToken());
              if (adminResponse?.user) {
                console.log('Admin access allowed during maintenance');
              } else {
                await auth.signOut();
                Alert.alert('Under Maintenance', 'The app is under maintenance. Please try again later.', [{text: 'OK'}]);
                setLoading(false);
                return;
              }
            } catch (error) {
              await auth.signOut();
              Alert.alert('Under Maintenance', 'The app is under maintenance. Please try again later.', [{text: 'OK'}]);
              setLoading(false);
              return;
            }
          }

          const localIdToken = await user.getIdToken();
          const userData = await loadData(localIdToken);
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData));

          const profilePhotoUrl =
            userData?.data?.profilePhotoUrl ||
            userData?.data?.profileImage ||
            userData?.user?.profilePhotoUrl ||
            userData?.user?.profileImage ||
            userData?.profilePhotoUrl ||
            userData?.profileImage ||
            null;

          if (profilePhotoUrl) {
            const timestamp = Date.now();
            const cacheBustedUrl = `${profilePhotoUrl}${profilePhotoUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
            await AsyncStorage.setItem('profilePhotoUrl', profilePhotoUrl);
            await AsyncStorage.setItem('profilePhotoUrlWithTimestamp', cacheBustedUrl);
          }

          if (isSupplierAccount(userData)) {
            await completeLoginSession({
              idToken: localIdToken,
              setIsLoggedIn,
              setUserInfo,
            });
          } else {
            await AsyncStorage.setItem('loginPhase', 'credentials_entered');
            navigation.navigate('LoginOtp');
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Unable to login. Please try again.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Login Failed', errorMessage, [{text: 'OK'}]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('BuyerAuthStack', {screen: 'BuyerSignup'});
  };

  return (
    <View style={styles.rootContainer}>
      {/* Full-screen background blobs (behind everything, fills notch area too) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.blob1, blobStyle]} />
        <Animated.View style={[styles.blob2, blobStyle]} />
        <Animated.View style={[styles.blob3]} />
      </View>

      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[styles.scrollContent, {paddingBottom: 24}]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}>
            <View style={styles.mainContainer}>
            {/* Logo with float */}
            <Animated.View style={[styles.logoSection, fadeUp(0)]}>
              <Animated.View style={logoFloatStyle}>
                <Image
                  source={require('../../assets/images/login-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animated.View>

            {/* Header */}
            <Animated.View style={[styles.headerSection, fadeUp(1)]}>
              <Text style={styles.headline}>Welcome Back</Text>
              <Text style={styles.subtitle}>Continue growing your indoor paradise.</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formSection, fadeUp(2)]}>
              <FloatingInput
                label="Email"
                value={formData.email}
                onChangeText={text => setFormData({...formData, email: text})}
                IconComponent={EmailIcon}
                error={validateErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FloatingInput
                label="Password"
                value={formData.password}
                onChangeText={text => setFormData({...formData, password: text})}
                IconComponent={PasswordIcon}
                error={validateErrors.password}
                secureTextEntry={!showPassword}
                rightIcon={
                  showPassword ? (
                    <EyeOpenIcon width={20} height={20} color={TOKENS.textSecondary} />
                  ) : (
                    <EyeClosedIcon width={20} height={20} color={TOKENS.textSecondary} />
                  )
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <View style={styles.forgotPasswordRow}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Actions */}
            <Animated.View style={[styles.actionsSection, fadeUp(3)]}>
              {/* Terms */}
              <View style={styles.termsRow}>
                <Text style={styles.termsText}>By logging in, you agree to our </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ScreenTerms')}>
                  <Text style={styles.termsLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> &amp; </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ScreenPrivacy')}>
                  <Text style={styles.termsLink}>Privacy</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => {
                  loginButtonScale.value = withSpring(0.97, {stiffness: 400, damping: 15});
                }}
                onPressOut={() => {
                  loginButtonScale.value = withSpring(1, {stiffness: 400, damping: 15});
                }}
                onPress={handlePressLogin}
                disabled={loading}>
                <Animated.View style={[styles.loginButton, loginButtonAnimatedStyle]}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </Animated.View>
              </TouchableOpacity>

            </Animated.View>

            {/* Bottom */}
            <Animated.View style={[styles.bottomSection, fadeUp(4)]}>
              <Text style={styles.bottomText}>
                Don’t have an account?{' '}
                <Text onPress={handleCreateAccount} style={styles.bottomLink}>
                  Create Account
                </Text>
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

    <Loading visible={loading} fullscreen />
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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

  // Logo
  logoSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  logo: {
    width: Math.min(180, SCREEN_H * 0.18),
    height: Math.min(180, SCREEN_H * 0.18),
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: TOKENS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: TOKENS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  formSection: {
    marginBottom: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TOKENS.inputBorder,
    backgroundColor: TOKENS.white,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  inputInner: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    height: 56,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 18,
    fontSize: 15,
    color: TOKENS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  inputField: {
    fontSize: 15,
    color: TOKENS.textPrimary,
    padding: 0,
    margin: 0,
    height: 24,
    marginTop: 8,
  },
  rightIcon: {
    padding: 4,
  },
  errorText: {
    color: TOKENS.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: TOKENS.sage,
    fontSize: 14,
    fontWeight: '500',
  },

  // Actions
  actionsSection: {
    marginTop: 8,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  termsText: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: TOKENS.sage,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TOKENS.sage,
    shadowColor: TOKENS.sage,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  loginButtonText: {
    color: TOKENS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // Bottom
  bottomSection: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: TOKENS.textSecondary,
  },
  bottomLink: {
    color: TOKENS.sage,
    fontWeight: '600',
  },

});

export default ScreenLoginForm;
