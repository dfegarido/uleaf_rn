import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';

import CheckBox from '@react-native-community/checkbox';
import IconEyeOpen from '../../assets/icons/greydark/eye-regular.svg';
import IconEyeClose from '../../assets/icons/greydark/eye-closed-regular.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {postBuyerSignupApi} from '../../components/Api/postBuyerSignupApi';

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
        setSuccess(true);
        await AsyncStorage.removeItem('buyerSignupData');
        // Optionally navigate or show success UI
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
        placeholder="Use 4-15 characters with no spaces or symbols."
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={15}
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
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
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
                    ? '#eee'
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
            <Text
              style={{
                color: passwordChecks[idx] ? '#4CAF50' : '#aaa',
                fontSize: 18,
              }}>
              {passwordChecks[idx] ? '✔️' : '○'}
            </Text>
            <Text
              style={[
                styles.requirementText,
                {color: passwordChecks[idx] ? '#4CAF50' : '#aaa'},
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
        <CheckBox value={agree} onValueChange={setAgree} />
        <Text style={styles.checkboxText}>
          I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://example.com/terms')}>
            Terms of Use
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://example.com/privacy')}>
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
      {error ? <Text style={{color: 'red', marginTop: 8}}>{error}</Text> : null}
      {success ? (
        <Text style={{color: 'green', marginTop: 8}}>Signup successful!</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  step: {
    color: '#888',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  required: {
    color: '#E53935',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  helper: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    padding: 8,
  },
  passwordStrengthBox: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  strengthBarContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#388E3C',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  link: {
    color: '#388E3C',
    textDecorationLine: 'none',
    fontWeight: '800',
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
