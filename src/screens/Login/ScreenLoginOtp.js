import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import OtpInput from '../../components/InputOtp/OtpInput';
import {getAuth} from '@react-native-firebase/auth';
import {
  postSellerPinCodeApi,
  postSellerAfterSignInApi,
} from '../../components/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';

const ScreenLoginOtp = ({navigation}) => {
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState('');
  const {setIsLoggedIn} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const postData = async token => {
    // If this throws, it must be caught outside
    const response = await postSellerPinCodeApi(token, pin);

    // Optionally validate response success
    if (!response.success) {
      throw new Error(response.error || 'Verification failed.');
    }

    console.log('After Submit:', response);
  };

  const postRequestPinData = async token => {
    // If this throws, it must be caught outside
    const response = await postSellerAfterSignInApi(token, pin);

    // Optionally validate response success
    if (!response.success) {
      throw new Error(response.error || 'Verification failed.');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setCurrentUser(user);
      user.getIdToken().then(token => {
        setIdToken(token);
      });
    } else {
      console.log('No user is signed in.');
    }
  }, []);

  const handlePressLogin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter the 4-digit code.');
      return;
    } else {
      try {
        if (idToken != '') {
          setLoading(true);
          await postData(idToken); // Pass token directly here
          console.log('User logged in with ID Token:', idToken);
          // TODO: Use this token with your backend API or save session

          await AsyncStorage.setItem('authToken', idToken);
          setIsLoggedIn(true);
        }
      } catch (error) {
        Alert.alert('Token', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendPin = async () => {
    setLoading(true);
    try {
      if (idToken != '') {
        await postRequestPinData(idToken);
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Token ', error.message);
    }
  };

  return (
    <View style={styles.mainContent}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.mainContainer}>
        <Text
          style={[
            globalStyles.textXXLGreyDark,
            {textAlign: 'center', fontWeight: 'bold'},
          ]}>
          Enter authentication code
        </Text>
        <Text
          style={[
            globalStyles.textLGGreyDark,
            styles.subtTitle,
            {textAlign: 'center'},
          ]}>
          Enter the 4-digit that we have sent via the email
        </Text>
        <OtpInput length={4} onChangeOtp={setPin} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
            <TouchableOpacity onPress={handleResendPin}>
              <Text style={globalStyles.textLGAccent}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    margin: 20,
  },
  subtTitle: {
    paddingTop: 10,
  },
  buttonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 30,
    marginHorizontal: 10,
  },
  loginAccountContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenLoginOtp;
