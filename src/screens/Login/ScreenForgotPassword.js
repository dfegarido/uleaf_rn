import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {InputGroupLeftIcon} from '../../components/InputGroup/Left';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHeaderHeight} from '@react-navigation/elements';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import BackIcon from '../../assets/iconnav/caret-left-bold.svg';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenForgotPassword = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const adjustedHeight =
    screenHeight - insets.top - insets.bottom - headerHeight;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState({});

  // Use shared Web SDK auth instance

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link has been sent to ${email}. Please check your email and follow the instructions to reset your password.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'An error occurred while sending the reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many reset attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An error occurred while sending the reset email.';
      }
      
      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {minHeight: adjustedHeight},
      ]}
      showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <InputGroupLeftIcon
              title="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              leftIcon={<EmailIcon width={20} height={20} />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {validateErrors.email && (
              <Text style={globalStyles.textXSRed}>
                {validateErrors.email}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.resetButton,
              loading && styles.resetButtonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backToLoginText}>
              Remember your password? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#393D40',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#393D40',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#699E73',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  resetButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  loginLink: {
    color: '#699E73',
    fontWeight: '600',
  },
});

export default ScreenForgotPassword;
