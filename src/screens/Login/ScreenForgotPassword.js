import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

import {sendPasswordResetEmail} from 'firebase/auth';
import {auth} from '../../../firebase';
import Loading from '../../components/Loading';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import CloseIcon from '../../assets/buyer-icons/close.svg';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// ------------------------------------------------------------------
// Design Tokens — same as ScreenLoginForm
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
            placeholderTextColor="transparent"
          />
        </View>
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------
// Screen
// ------------------------------------------------------------------
const ScreenForgotPassword = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState({});

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

  // Button scale animation
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: buttonScale.value}],
  }));

  const validateForm = () => {
    const errors = {};
    if (!email || email.trim() === '') {
      errors.email = 'This is a required field';
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
    <View style={styles.rootContainer}>
      {/* Full-screen background blobs */}
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
              {/* Back button */}
              <Animated.View style={[styles.backButtonSection, fadeUp(0)]}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}>
                  <CloseIcon width={20} height={20} fill={TOKENS.textPrimary} />
                </TouchableOpacity>
              </Animated.View>

              {/* Centered Content */}
              <View style={styles.centerContent}>
                {/* Header */}
                <Animated.View style={[styles.headerSection, fadeUp(1)]}>
                  <Text style={styles.headline}>Reset Your Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                </Animated.View>

                {/* Form */}
                <Animated.View style={[styles.formSection, fadeUp(2)]}>
                  <FloatingInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    IconComponent={EmailIcon}
                    error={validateErrors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Animated.View>

                {/* Actions */}
                <Animated.View style={[styles.actionsSection, fadeUp(3)]}>
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPressIn={() => {
                      buttonScale.value = withSpring(0.97, {stiffness: 400, damping: 15});
                    }}
                    onPressOut={() => {
                      buttonScale.value = withSpring(1, {stiffness: 400, damping: 15});
                    }}
                    onPress={handleResetPassword}
                    disabled={loading}>
                    <Animated.View style={[styles.resetButton, buttonAnimatedStyle]}>
                      <Text style={styles.resetButtonText}>Send Reset Link</Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Bottom */}
              <Animated.View style={[styles.bottomSection, fadeUp(4)]}>
                <Text style={styles.bottomText}>
                  Remember your password?{' '}
                  <Text onPress={() => navigation.goBack()} style={styles.bottomLink}>
                    Sign In
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
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

  // Back button
  backButtonSection: {
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
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
  errorText: {
    color: TOKENS.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  // Actions
  actionsSection: {
    marginTop: 8,
  },
  resetButton: {
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
  resetButtonText: {
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

export default ScreenForgotPassword;
