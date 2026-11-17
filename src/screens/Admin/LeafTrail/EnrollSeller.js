import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, StatusBar, Alert, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PhFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IdFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import UsFlag from '../../../assets/buyer-icons/usa-flag.svg';
import Loading from '../../../components/Loading';
import { BUSINESS_COUNTRIES } from '../../../utils/b2bCountries';
import { API_CONFIG } from '../../../config/apiConfig';
import { GREEN, GREEN_DARK, INK, MUTED, PAGE_BG } from '../Home/AdminUserUi';

function tokenExpiry(token) {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return 0;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded));
    return Number(json.exp) || 0;
  } catch (e) {
    return 0;
  }
}

async function readAdminAuthToken() {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  if (tokenExpiry(token) >= now) return token;

  const { auth } = require('../../../../firebase');
  const user = auth?.currentUser;
  if (!user) return null;
  const freshToken = await user.getIdToken(true);
  await AsyncStorage.setItem('authToken', freshToken);
  return freshToken;
}

const FLAG_ICONS = { PH: PhFlag, TH: ThFlag, ID: IdFlag, US: UsFlag };

const Flag = ({ country, size = 20 }) => {
  const Icon = FLAG_ICONS[country.code];
  return Icon ? <Icon width={size} height={size} /> : <Text style={{ fontSize: size - 2 }}>{country.flag}</Text>;
};

const Field = ({ label, error, children, style }) => (
  <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const Section = ({ title, hint, delay, children }) => (
  <Animated.View entering={FadeInUp.duration(280).delay(delay)}>
    <Text style={styles.sectionLabel}>{title}</Text>
    {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    <View style={styles.card}>{children}</View>
  </Animated.View>
);

const EnrollSeller = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gardenName, setGardenName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [allowLiveVideo, setAllowLiveVideo] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // "Next" on the keyboard walks down the form.
  const lastRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const firstRef = useRef(null);

  const clearError = key => {
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };
  // Each field clears its own error as soon as it is edited.
  const onEdit = (key, setter) => text => {
    setter(text);
    clearError(key);
  };
  const inputProps = (key) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(f => (f === key ? null : f)),
    placeholderTextColor: '#9AA4A8',
    style: [styles.input, focused === key && styles.inputFocused, errors[key] && styles.inputError],
  });

  const handleCountrySelect = (country) => {
    setSelectedCountry(country.name);
    setCountryCode(country.dialCode);
    clearError('country');
  };

  // Handle phone number input to ensure only numbers
  const handlePhoneNumberChange = (text) => {
    setContactNumber(text.replace(/[^0-9]/g, ''));
    clearError('contactNumber');
  };

  const handleSubmit = async () => {
    // Reset previous errors
    setErrors({});
    console.log('Starting form submission');
    
    // Validate all required fields
    const newErrors = {};
    
    if (!selectedCountry) newErrors.country = 'Country is required';
    if (!gardenName.trim()) newErrors.gardenName = 'Garden/Company name is required';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Only validate contact number if a country is selected
    if (selectedCountry && !contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }
    
    if (!email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email format is invalid';
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }
    
    // If no country is selected, show that error
    if (!selectedCountry) {
      console.log('Country selection error');
      setErrors({ country: 'Please select a country first' });
      return;
    }
    
    // Prepare form data for submission
    const formData = {
      profileImage: '', // Default empty as not provided in the form
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumber: `${countryCode}${contactNumber.trim()}`,
      gardenOrCompanyName: gardenName.trim(),
      password: 'securePassword123', // Temporary password that will be changed later
      country: selectedCountry, // Use the 2-letter country code instead of the full name
      email: email.trim(),
      liveFlag: allowLiveVideo ? 'Yes' : 'No'
    };
    
    console.log('Submitting form data:', JSON.stringify(formData, null, 2));
    try {
      setIsSubmitting(true);
      
      // Get the auth token
      const authToken = await readAdminAuthToken();
      console.log('Auth token retrieved:', authToken ? 'Token exists' : 'No token');
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Construct the API URL using the base URL from apiConfig
      const signUpUrl = `${API_CONFIG.BASE_URL}/signUpSupplier`;
      console.log('API endpoint:', signUpUrl);
      
      // Make the API call
      console.log('Sending API request...');
      const response = await fetch(signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('Error parsing JSON response:', e.message);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        // Extract error message from various possible formats
        let errorMessage = 'Failed to enroll seller';
        
        if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          errorMessage = responseData.errors[0];
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
        
        console.log('API error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Success response:', responseData);
      
      // Show success message and navigate back
      Alert.alert(
        "Success",
        "Seller enrolled successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error details:', error.stack);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to enrol seller: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor={PAGE_BG} barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          activeOpacity={0.8}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enrol seller</Text>
        <View style={styles.iconSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Animated.Text entering={FadeInUp.duration(280)} style={styles.intro}>
            Add a new garden to iLeafU. All fields are required.
          </Animated.Text>

          <Section title="Garden" delay={40}>
            <Field label="Country" error={errors.country}>
              <View style={styles.chips}>
                {BUSINESS_COUNTRIES.map(c => {
                  const active = selectedCountry === c.name;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={() => handleCountrySelect(c)}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[styles.chip, active && styles.chipActive, errors.country && !active && styles.chipError]}>
                      <Flag country={c} size={18} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <Field label="Garden / company name" error={errors.gardenName} style={styles.divider}>
              <TextInput
                {...inputProps('gardenName')}
                placeholder="e.g. Green Leaf Gardens"
                value={gardenName}
                onChangeText={onEdit('gardenName', setGardenName)}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => firstRef.current?.focus()}
              />
            </Field>
          </Section>

          <Section title="Contact person" delay={80}>
            <View style={styles.row}>
              <Field label="First name" error={errors.firstName} style={styles.flex}>
                <TextInput
                  ref={firstRef}
                  {...inputProps('firstName')}
                  placeholder="First"
                  value={firstName}
                  onChangeText={onEdit('firstName', setFirstName)}
                  autoCapitalize="words"
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastRef.current?.focus()}
                />
              </Field>
              <Field label="Last name" error={errors.lastName} style={styles.flex}>
                <TextInput
                  ref={lastRef}
                  {...inputProps('lastName')}
                  placeholder="Last"
                  value={lastName}
                  onChangeText={onEdit('lastName', setLastName)}
                  autoCapitalize="words"
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
              </Field>
            </View>

            <Field label="Contact number" error={errors.contactNumber} style={styles.divider}>
              <View
                style={[
                  styles.phoneBox,
                  focused === 'contactNumber' && styles.inputFocused,
                  errors.contactNumber && styles.inputError,
                ]}>
                <Text style={[styles.dialCode, !countryCode && styles.dialCodeEmpty]}>{countryCode || '+ —'}</Text>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  placeholder={countryCode ? 'Phone number' : 'Pick a country first'}
                  placeholderTextColor="#9AA4A8"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  value={contactNumber}
                  onChangeText={handlePhoneNumberChange}
                  onFocus={() => setFocused('contactNumber')}
                  onBlur={() => setFocused(f => (f === 'contactNumber' ? null : f))}
                />
              </View>
            </Field>

            <Field label="Email" error={errors.email} style={styles.divider}>
              <TextInput
                ref={emailRef}
                {...inputProps('email')}
                placeholder="name@garden.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                value={email}
                onChangeText={onEdit('email', setEmail)}
                returnKeyType="done"
              />
            </Field>
          </Section>

          <Section title="Permissions" delay={120}>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchLabel}>Live selling</Text>
                <Text style={styles.switchHint}>Let this seller run live video sales. You can change this later.</Text>
              </View>
              <Switch
                value={allowLiveVideo}
                onValueChange={setAllowLiveVideo}
                trackColor={{ false: '#D5D9D4', true: GREEN }}
                ios_backgroundColor="#D5D9D4"
                thumbColor="#FFFFFF"
              />
            </View>
          </Section>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonBusy]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}>
            {isSubmitting ? (
              <Loading visible size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enrol seller</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E9ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 44,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 24,
  },
  intro: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: MUTED,
  },
  sectionLabel: {
    marginLeft: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHint: {
    marginLeft: 4,
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  card: {
    marginTop: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  field: {
    paddingVertical: 16,
    gap: 8,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7E9',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E3',
    backgroundColor: '#FAFBFA',
    fontFamily: 'Inter',
    fontSize: 16,
    color: INK,
  },
  inputFocused: {
    borderColor: GREEN,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E5484D',
    backgroundColor: '#FFF8F8',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#C8341C',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE2E3',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: GREEN,
    backgroundColor: '#E8F3EA',
  },
  chipError: {
    borderColor: '#F3B8B4',
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
  },
  chipTextActive: {
    color: GREEN_DARK,
  },
  phoneBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E3',
    backgroundColor: '#FAFBFA',
    overflow: 'hidden',
  },
  dialCode: {
    paddingHorizontal: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: INK,
    borderRightWidth: 1,
    borderRightColor: '#E4E7E9',
  },
  dialCodeEmpty: {
    color: '#9AA4A8',
    fontWeight: '400',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    color: INK,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  switchLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  switchHint: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: PAGE_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7E9',
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonBusy: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EnrollSeller;
