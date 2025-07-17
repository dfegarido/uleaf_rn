import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!contactNumber.trim())
      newErrors.contactNumber = 'Contact number is required';
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
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
            Contact number<Text style={styles.required}>*</Text>
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
          style={[globalStyles.primaryButton, {marginBottom: 8}]}
          onPress={handleContinue}>
          <Text style={globalStyles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
});

export default BuyerGettingToKnow;
