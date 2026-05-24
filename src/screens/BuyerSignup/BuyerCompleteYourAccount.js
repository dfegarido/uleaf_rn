import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Linking, useColorScheme, KeyboardAvoidingView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

import CheckBox from '@react-native-community/checkbox';
import IconEyeOpen from '../../assets/icons/greydark/eye-regular.svg';
import IconEyeClose from '../../assets/icons/greydark/eye-closed-regular.svg';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrganicBackground from '../../components/OrganicBackground/OrganicBackground';
import StepIndicator from '../../components/StepIndicator/StepIndicator';
import {postBuyerSignupApi} from '../../components/Api/postBuyerSignupApi';
import {createReferralApi} from '../../components/Api/referralApi';
import {doc, getDoc} from 'firebase/firestore';
import {db} from '../../../firebase';
import {globalStyles, getComponentStyles} from '../../assets/styles/styles';
import ValidIcon from '../../assets/buyer-icons/valid.svg';
import NotValidIcon from '../../assets/buyer-icons/not-valid.svg';
import CustomAlert from '../../components/CustomAlert/CustomAlert';

const PASSWORD_REQUIREMENTS = [
  {
    label: 'Use at least 8 Characters',
    test: pw => pw.length >= 8,
  },
  {
    label: 'Use at least 1 capital letter',
    test: pw => /[A-Z]/.test(pw),
  },
  {
    label: 'Use at least 1 number',
    test: pw => /[0-9]/.test(pw),
  },
  {
    label: 'No spaces',
    test: pw => !/\s/.test(pw),
  },
];

export default function BuyerCompleteYourAccount() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() || 'light';
  const styles = getComponentStyles(colorScheme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        if (stored) {
          const data = JSON.parse(stored);
          console.log('Loading existing account data:', data);
          
          // Restore username if previously entered
          if (data.username) setUsername(data.username);
        }
      } catch (e) {
        console.error('Failed to load existing account data', e);
      }
    };

    loadExistingData();
  }, []);

  // Clear data when navigating away from buyer signup flow
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const targetRouteName = e.data?.action?.payload?.name;
      
      // List of allowed buyer signup screens
      const buyerSignupScreens = [
        'BuyerSignup',
        'BuyerSignupLocation', 
        'BuyerGettingToKnow',
        'BuyerCompleteYourAccount'
      ];

      // If navigating to a screen outside buyer signup flow, clear data
      if (targetRouteName && !buyerSignupScreens.includes(targetRouteName)) {
        AsyncStorage.removeItem('buyerSignupData').catch(e => 
          console.error('Failed to clear signup data:', e)
        );
        console.log('Cleared buyer signup data - navigating to:', targetRouteName);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const passwordChecks = PASSWORD_REQUIREMENTS.map(req => req.test(password));
  const isPasswordValid = passwordChecks.every(Boolean);
  const isUsernameValid = /^[A-Za-z0-9]{4,15}$/.test(username);
  const canSubmit =
    isUsernameValid && isPasswordValid && password === retypePassword && agree;

  // Entrance animation
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

  // Button press scale
  const backBtnScale = useSharedValue(1);
  const submitBtnScale = useSharedValue(1);
  const backBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: backBtnScale.value}],
  }));
  const submitBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: submitBtnScale.value}],
  }));

  const showCustomAlert = (title, message, buttons = [{text: 'OK'}]) => {
    setAlertConfig({title, message, buttons});
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  // Function to make error messages more user-friendly
  const makeErrorMessageFriendly = (errorMessage) => {
    if (!errorMessage) return errorMessage;
    
    // Replace technical terms with user-friendly alternatives
    return errorMessage
      .replace(/Firebase Authentication/gi, 'our system')
      .replace(/Firebase/gi, 'our system')
      .replace(/authentication/gi, 'account verification')
      .replace(/API/gi, 'server')
      .replace(/HTTP error/gi, 'Connection error')
      .replace(/status: 500/gi, 'server is temporarily unavailable')
      .replace(/status: 404/gi, 'service not found')
      .replace(/status: 403/gi, 'access denied')
      .replace(/network request failed/gi, 'connection failed')
      .replace(/NETWORK_ERROR/gi, 'network connection issue');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const stored = await AsyncStorage.getItem('buyerSignupData');
      const signupData = stored ? JSON.parse(stored) : {};
      signupData.username = username;
      signupData.password = password;
      const result = await postBuyerSignupApi(signupData);
      if (result.success) {
        try {
          let referrerUid = await AsyncStorage.getItem('pendingReferrerUid');

          const savedInviteCode = (signupData.inviteCode || '').trim();
          if (savedInviteCode.length === 6) {
            try {
              const snap = await getDoc(doc(db, 'referralCodes', savedInviteCode));
              if (snap.exists() && snap.data().uid) {
                referrerUid = snap.data().uid;
              }
            } catch (e) { /* non-blocking */ }
          }

          if (referrerUid) {
            const refereeEmail = signupData.email;
            const refereePhone = signupData.contactNumber;
            const refereeUid = result.data?.uid;
            await createReferralApi({
              referrerId: referrerUid,
              refereeEmail: refereeEmail || null,
              refereePhone: refereePhone || null,
              refereeUid: refereeUid || null,
            });
            await AsyncStorage.removeItem('pendingReferrerUid');
          }
        } catch (refErr) {
          console.warn('Referral creation failed (non-blocking):', refErr);
        }

        await AsyncStorage.removeItem('buyerSignupData');
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
        return;
      } else {
        // Handle specific error types
        if (result.error && result.error.includes('Missing required fields')) {
          // Try to parse the error details for missing fields
          try {
            // Check if the error message contains field details
            const errorResponse = JSON.parse(result.error);
            if (errorResponse.details && Array.isArray(errorResponse.details)) {
              const missingFields = errorResponse.details.map(detail => {
                // Extract field name from messages like "Field 'state' is required"
                const match = detail.match(/Field '([^']+)' is required/);
                return match ? match[1] : detail;
              });
              
              const fieldDisplayNames = {
                'state': 'State',
                'city': 'City', 
                'zipCode': 'Zip Code',
                'address': 'Address Line',
                'growPlants': 'Plant Growing Method',
                'contactNumber': 'Contact Number',
                'firstName': 'First Name',
                'lastName': 'Last Name',
                'email': 'Email Address'
              };
              
              const friendlyFieldNames = missingFields.map(field => 
                fieldDisplayNames[field] || field
              );
              
              showCustomAlert(
                'Missing Information',
                `Please complete the following required fields:\n\n• ${friendlyFieldNames.join('\n• ')}`,
                [{text: 'OK', onPress: hideCustomAlert}]
              );
              return;
            }
          } catch (parseError) {
            // If parsing fails, fall back to generic message
            console.log('Could not parse error details:', parseError);
          }
        }
        
        // Generic error handling for other cases
        const friendlyError = makeErrorMessageFriendly(result.error || 'Signup failed');
        setError(friendlyError);
        showCustomAlert(
          'Signup Error', 
          friendlyError,
          [{text: 'OK', onPress: hideCustomAlert}]
        );
      }
    } catch (e) {
      const friendlyError = makeErrorMessageFriendly(e.message || 'Signup failed');
      setError(friendlyError);
      showCustomAlert(
        'Error', 
        friendlyError,
        [{text: 'OK', onPress: hideCustomAlert}]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
      <OrganicBackground />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{flex: 1}}>
          <Animated.View style={[fadeUp(0), {marginTop: 8, marginBottom: 24, alignItems: 'center'}]}>
            <StepIndicator currentStep={4} />
          </Animated.View>

          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={[styles.container, {backgroundColor: 'transparent'}]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
          >
            <Animated.View style={fadeUp(1)}>
              <Text style={styles.title}>Complete your account</Text>
            </Animated.View>

            <Animated.View style={fadeUp(2)}>
              <Text style={styles.label}>
                Username<Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={15}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'}
              />
              <Text style={styles.helper}>
                Use 4-15 characters with no spaces or symbols.
              </Text>

              <Text style={styles.label}>
                Password<Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, {flex: 1, paddingRight: 40}]}
                  placeholder="8@N~!r8HiN6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeIcon}>
                  {showPassword ? (
                    <IconEyeClose width={20} height={20} />
                  ) : (
                    <IconEyeOpen width={20} height={20} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.passwordStrengthBox}>
                <View style={styles.strengthBarContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          password.length === 0
                            ? colorScheme === 'dark'
                              ? '#444'
                              : '#eee'
                            : isPasswordValid
                            ? '#4CAF50'
                            : '#FFC107',
                        width: `${
                          (passwordChecks.filter(Boolean).length /
                            PASSWORD_REQUIREMENTS.length) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.strengthText}>
                  {isPasswordValid
                    ? 'Good Password'
                    : password.length > 0
                    ? 'Weak Password'
                    : ''}
                </Text>
                {PASSWORD_REQUIREMENTS.map((req, idx) => (
                  <View key={req.label} style={styles.requirementRow}>
                    {passwordChecks[idx] ? (
                      <ValidIcon width={20} height={20} style={{marginRight: 6}} />
                    ) : (
                      <NotValidIcon width={20} height={20} style={{marginRight: 6}} />
                    )}
                    <Text
                      style={[
                        styles.requirementText,
                        {
                          color: passwordChecks[idx]
                            ? '#4CAF50'
                            : colorScheme === 'dark'
                            ? '#555'
                            : '#aaa',
                        },
                      ]}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>
                Re-type password<Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, {flex: 1, paddingRight: 40}]}
                  placeholder="Re-type password"
                  value={retypePassword}
                  onChangeText={setRetypePassword}
                  secureTextEntry={!showRetypePassword}
                  autoCapitalize="none"
                  placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'}
                />
                <TouchableOpacity
                  onPress={() => setShowRetypePassword(v => !v)}
                  style={styles.eyeIcon}>
                  {showRetypePassword ? (
                    <IconEyeClose width={20} height={20} />
                  ) : (
                    <IconEyeOpen width={20} height={20} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxRow}>
                <CheckBox
                  value={agree}
                  onValueChange={setAgree}
                  tintColors={{
                    true: '#388E3C',
                    false: colorScheme === 'dark' ? '#888' : '#aaa',
                  }}
                />
                <Text style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate('TermsOfUseScreen')}>
                    Terms of Use
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate('PrivacyPolicyScreen')}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </Animated.View>

          </ScrollView>
          <View style={{paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12, backgroundColor: 'transparent'}}>
            {error ? <Text style={[styles.errorText, {marginBottom: 8}]}>{error}</Text> : null}
            <Animated.View style={{flexDirection: 'row', gap: 12}}>
              <Animated.View style={[backBtnStyle, {flex: 1}]}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPressIn={() => {
                    backBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
                  }}
                  onPressOut={() => {
                    backBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
                  }}
                  style={[
                    globalStyles.secondaryButtonAccent,
                    {borderRadius: 10, paddingVertical: 12, marginVertical: 0},
                  ]}
                  onPress={() => navigation.goBack()}>
                  <Text style={{color: '#539461', fontWeight: '700', fontSize: 16, textAlign: 'center'}}>Back</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={[submitBtnStyle, {flex: 1}]}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPressIn={() => {
                    submitBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
                  }}
                  onPressOut={() => {
                    submitBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
                  }}
                  style={{
                    backgroundColor: canSubmit ? '#388E3C' : '#BDBDBD',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  disabled={!canSubmit || loading}
                  onPress={handleSubmit}>
                  <Text style={styles.buttonText}>
                    {loading ? 'Creating...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideCustomAlert}
      />
    </SafeAreaView>
  );
}
