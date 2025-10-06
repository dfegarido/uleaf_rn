import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {
  InputGroupLeftIcon,
  InputPasswordLeftIcon,
} from '../../components/InputGroup/Left';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';
import {postSellerAfterSignInApi, postAdminAfterSignInApi} from '../../components/Api';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import {useHeaderHeight} from '@react-navigation/elements';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';
import EyeClosedIcon from '../../assets/icons/greydark/eye-closed-regular.svg';
import EyeOpenIcon from '../../assets/icons/greydark/eye-regular.svg';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenLoginForm = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  
  // Simplified safe area calculation for Nokia devices
  const safeBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
  const safeTopPadding = Platform.OS === 'android' ? Math.max(insets.top, 8) : insets.top;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const requiredFields = ['email', 'password'];

  // Using shared Web SDK auth instance

  const loadData = async token => {
    try {
      // First try seller API
      const postSellerAfterSignInApiData = await postSellerAfterSignInApi(
        token,
      );
      if (postSellerAfterSignInApiData?.user) {
        return postSellerAfterSignInApiData;
      }
      throw new Error('Seller API returned no user data');
    } catch (sellerError) {
      console.log('Seller API failed, trying admin API:', sellerError.message);
      
      // If seller API fails, try admin API
      try {
        const postAdminAfterSignInApiData = await postAdminAfterSignInApi(
          token,
        );
        if (postAdminAfterSignInApiData?.user) {
          return postAdminAfterSignInApiData;
        }
        throw new Error('Admin API returned no user data');
      } catch (adminError) {
        console.log('Admin API also failed:', adminError.message);
        
        // If both fail, throw the original seller error for now
        throw new Error(
          sellerError.message || 'Failed to authenticate user.'
        );
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
        // console.log(formData.email);
        const authResult = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const user = authResult.user;

        if (user) {
          const localIdToken = await user.getIdToken();
          console.log('Token:', localIdToken);
          const userData = await loadData(localIdToken);
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
          navigation.navigate('LoginOtp');
        }
      } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Unable to login. Please try again.';
        
        // Provide specific error messages based on error code
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
        
        Alert.alert(
          'Login Failed',
          errorMessage,
          [{text: 'OK'}]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePressBuyerBypass = () => {
    // Navigate directly to buyer screens without authentication
    navigation.reset({
      index: 0,
      routes: [{name: 'BuyerTabs'}],
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
        >
          {loading && (
            <Modal transparent animationType="fade">
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#699E73" />
              </View>
            </Modal>
          )}

          <View style={styles.mainContainer}>
            <View style={styles.headerSection}>
              <Text style={[globalStyles.title]}>Welcome back!</Text>
              <Text style={[globalStyles.textXXLGreyDark, styles.subtTitle]}>
                Log in to your account
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <InputGroupLeftIcon
                  IconLeftComponent={EmailIcon}
                  placeholder={'Email'}
                  value={formData.email}
                  onChangeText={text => setFormData({...formData, email: text})}
                />
                {validateErrors.email && (
                  <Text style={globalStyles.textXSRed}>{validateErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <InputPasswordLeftIcon
                  IconLeftComponent={PasswordIcon}
                  value={formData.password}
                  onChangeText={text => setFormData({...formData, password: text})}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? <EyeOpenIcon width={20} height={20} /> : <EyeClosedIcon width={20} height={20} />}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
                {validateErrors.password && (
                  <Text style={globalStyles.textXSRed}>
                    {validateErrors.password}
                  </Text>
                )}
              </View>

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordButton}>
                  <Text style={[globalStyles.textLGAccent, styles.forgotPasswordText]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By clicking login, you agree to the ileafU's{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ScreenTerms')}>
                  <Text style={styles.linkText}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ScreenPrivacy')}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={handlePressLogin}>
                <Text style={globalStyles.primaryButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Fixed bottom padding
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
    minHeight: screenHeight * 0.8, // Minimum height for Nokia devices
  },
  headerSection: {
    paddingBottom: 20,
  },
  subtTitle: {
    paddingTop: 10,
    marginBottom: 20,
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-start',
    maxHeight: screenHeight * 0.5, // Limit form section height
  },
  inputContainer: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 32,
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff', // Ensure visibility above keyboard
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  termsText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#699E73',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenLoginForm;
