import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {InputBox, InputCheckBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {globalStyles} from '../../assets/styles/styles';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          bounces={false}
        >
        <View style={styles.container}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackSolidIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.stepText}>3/4</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Getting to know you</Text>

          {/* First name */}
          <Text style={styles.label}>
            First name<Text style={styles.required}>*</Text>
          </Text>
          <InputBox placeholder="" value={firstName} setValue={setFirstName} />
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}

          {/* Last name */}
          <Text style={styles.label}>
            Last name<Text style={styles.required}>*</Text>
          </Text>
          <InputBox placeholder="" value={lastName} setValue={setLastName} />
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}

          {/* Contact number */}
          <Text style={styles.label}>
            Contact number <Text style={styles.optional}>(Optional)</Text>
          </Text>
          {/* Restrict PhoneInput to US only by setting initialPhoneNumber to '+1' and hiding country picker if possible */}
          <PhoneInput
            initialPhoneNumber={
              contactNumber.startsWith('+1') ? contactNumber : ''
            }
            onChange={setContactNumber}
            usOnly={true} // This prop is for future refactor; currently, PhoneInput does not support it, so only US will be shown by default
          />
          {errors.contactNumber && (
            <Text style={styles.errorText}>{errors.contactNumber}</Text>
          )}

          {/* Email address */}
          <Text style={styles.label}>
            Email address<Text style={styles.required}>*</Text>
          </Text>
          <InputBox
            placeholder="E.g. olla@ileafu.com"
            value={email}
            setValue={setEmail}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Email notifications checkbox */}
          <View style={styles.checkboxRow}>
            <InputCheckBox
              label="Receive email notifications for the latest news and updates."
              checked={receiveEmail}
              onChange={setReceiveEmail}
            />
          </View>

          {/* Spacer */}
          <View style={{flex: 1, minHeight: 24}} />
        </View>
        </ScrollView>
        {/* Continue button at bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              globalStyles.primaryButton,
              {marginBottom: 8},
              (!firstName.trim() || !lastName.trim() || !email.trim()) && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim() || !email.trim()}>
            <Text style={[
              globalStyles.primaryButtonText,
              (!firstName.trim() || !lastName.trim() || !email.trim()) && styles.disabledButtonText,
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
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
    paddingTop: 8, // Further reduced to match good positioning
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32, // Increased from 8 to 16 for better positioning
    paddingTop: 16, // Increased from 8 to 16 for better positioning
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
  stepText: {
    marginLeft: 'auto',
    fontSize: 16,
    color: '#393D43',
    fontWeight: '500',
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
    backgroundColor: '#fff',
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
