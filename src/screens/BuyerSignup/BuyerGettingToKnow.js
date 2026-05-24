import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {InputBox, InputCheckBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {globalStyles} from '../../assets/styles/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrganicBackground from '../../components/OrganicBackground/OrganicBackground';
import StepIndicator from '../../components/StepIndicator/StepIndicator';

const BuyerGettingToKnow = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [receiveEmail, setReceiveEmail] = useState(true);
  const [errors, setErrors] = useState({});

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        if (stored) {
          const data = JSON.parse(stored);
          console.log('Loading existing signup data:', data);
          
          // Populate fields with existing data if available
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.contactNumber) setContactNumber(data.contactNumber);
          if (data.email) setEmail(data.email);
        }
      } catch (e) {
        console.error('Failed to load existing signup data', e);
      }
    };

    loadExistingData();
  }, []); // Empty dependency array - only run once on mount

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

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    // Contact number is now optional - no validation needed
    if (!email.trim()) newErrors.email = 'Email address is required';
    // Basic email validation
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      newErrors.email = 'Invalid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validate()) {
      try {
        const prev = await AsyncStorage.getItem('buyerSignupData');
        const prevData = prev ? JSON.parse(prev) : {};
        await AsyncStorage.setItem(
          'buyerSignupData',
          JSON.stringify({
            ...prevData,
            firstName,
            lastName,
            contactNumber,
            email,
          }),
        );
      } catch (e) {
        console.error('Failed to save personal info', e);
      }
      navigation.navigate('BuyerCompleteYourAccount');
    }
  };

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
  const continueBtnScale = useSharedValue(1);
  const backBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: backBtnScale.value}],
  }));
  const continueBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: continueBtnScale.value}],
  }));

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
      <OrganicBackground />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{flex: 1}}>
          <Animated.View style={[fadeUp(0), {marginTop: 8, marginBottom: 24, alignItems: 'center'}]}>
            <StepIndicator currentStep={3} />
          </Animated.View>

          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            bounces={false}
          >
            <View style={styles.container}>
              <Animated.View style={fadeUp(1)}>
                <Text style={styles.title}>Getting to know you</Text>
              </Animated.View>

              <Animated.View style={fadeUp(2)}>
                <Text style={styles.label}>
                  First name<Text style={styles.required}>*</Text>
                </Text>
                <InputBox placeholder="" value={firstName} setValue={setFirstName} />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}

                <Text style={styles.label}>
                  Last name<Text style={styles.required}>*</Text>
                </Text>
                <InputBox placeholder="" value={lastName} setValue={setLastName} />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}

                <Text style={styles.label}>
                  Contact number <Text style={styles.optional}>(Optional)</Text>
                </Text>
                <PhoneInput
                  initialPhoneNumber={
                    contactNumber.startsWith('+1') ? contactNumber : ''
                  }
                  onChange={setContactNumber}
                  usOnly={true}
                />
                {errors.contactNumber && (
                  <Text style={styles.errorText}>{errors.contactNumber}</Text>
                )}

                <Text style={styles.label}>
                  Email address<Text style={styles.required}>*</Text>
                </Text>
                <InputBox
                  placeholder="E.g. olla@ileafu.com"
                  value={email}
                  setValue={setEmail}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <View style={styles.checkboxRow}>
                  <InputCheckBox
                    label="Receive email notifications for the latest news and updates."
                    checked={receiveEmail}
                    onChange={setReceiveEmail}
                  />
                </View>
              </Animated.View>

              <View style={{flex: 1, minHeight: 24}} />
            </View>
          </ScrollView>
          <View style={styles.bottomBar}>
            <Animated.View style={[fadeUp(3), {flexDirection: 'row', gap: 12}]}>
              <Animated.View style={[backBtnStyle, {flex: 1}]}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPressIn={() => {
                    backBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
                  }}
                  onPressOut={() => {
                    backBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
                  }}
                  style={[globalStyles.secondaryButtonAccent, {borderRadius: 10, paddingVertical: 12, marginVertical: 0}]}
                  onPress={() => navigation.goBack()}>
                  <Text style={{color: '#539461', fontWeight: '700', fontSize: 16, textAlign: 'center'}}>Back</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={[continueBtnStyle, {flex: 1}]}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPressIn={() => {
                    continueBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
                  }}
                  onPressOut={() => {
                    continueBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
                  }}
                  style={[
                    globalStyles.primaryButton,
                    {marginVertical: 0, borderRadius: 10, paddingVertical: 12},
                    (!firstName.trim() || !lastName.trim() || !email.trim()) && styles.disabledButton,
                  ]}
                  onPress={handleContinue}
                  disabled={!firstName.trim() || !lastName.trim() || !email.trim()}>
                  <Text style={[
                    globalStyles.primaryButtonText,
                    (!firstName.trim() || !lastName.trim() || !email.trim()) && styles.disabledButtonText,
                  ]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding to ensure content is scrollable above keyboard
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 22,
    color: '#393D43',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202325',
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: '#393D43',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  required: {
    color: '#FF5247',
  },
  optional: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '400',
  },
  errorText: {
    color: '#FF5247',
    fontSize: 13,
    marginBottom: 2,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default BuyerGettingToKnow;
