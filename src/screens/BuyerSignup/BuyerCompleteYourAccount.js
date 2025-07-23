import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  useColorScheme,
} from 'react-native';

import CheckBox from '@react-native-community/checkbox';
import IconEyeOpen from '../../assets/icons/greydark/eye-regular.svg';
import IconEyeClose from '../../assets/icons/greydark/eye-closed-regular.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {postBuyerSignupApi} from '../../components/Api/postBuyerSignupApi';
import {globalStyles, getComponentStyles} from '../../assets/styles/styles';
import ValidIcon from '../../assets/buyer-icons/valid.svg';
import NotValidIcon from '../../assets/buyer-icons/not-valid.svg';

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

  const passwordChecks = PASSWORD_REQUIREMENTS.map(req => req.test(password));
  const isPasswordValid = passwordChecks.every(Boolean);
  const isUsernameValid = /^[A-Za-z0-9]{4,15}$/.test(username);
  const canSubmit =
    isUsernameValid && isPasswordValid && password === retypePassword && agree;

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
        await AsyncStorage.removeItem('buyerSignupData');
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
        return;
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (e) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.step}>4/4</Text>
      </View>
      <Text style={styles.title}>Complete your account</Text>

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

      {/* Password strength bar and requirements */}
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
            {/* Use SVG icons instead of text for check/circle */}
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

      <TouchableOpacity
        style={[
          styles.button,
          {backgroundColor: canSubmit ? '#388E3C' : '#BDBDBD'},
        ]}
        disabled={!canSubmit || loading}
        onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}
