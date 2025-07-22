import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {
  InputGroupLeftIcon,
  InputPasswordLeftIcon,
} from '../../components/InputGroup/Left';
import {getApp} from '@react-native-firebase/app';
import {getAuth, signInWithEmailAndPassword} from '@react-native-firebase/auth';
import {postSellerAfterSignInApi} from '../../components/Api';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHeaderHeight} from '@react-navigation/elements';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';
import EyeClosedIcon from '../../assets/icons/greydark/eye-closed-regular.svg';
import EyeOpenIcon from '../../assets/icons/greydark/eye-regular.svg';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenLoginForm = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const adjustedHeight =
    screenHeight - insets.top - insets.bottom - headerHeight;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const requiredFields = ['email', 'password'];

  const app = getApp();
  const auth = getAuth(app);

  const loadData = async token => {
    try {
      const postSellerAfterSignInApiData = await postSellerAfterSignInApi(
        token,
      );
      if (!postSellerAfterSignInApiData?.user) {
        throw new Error(
          postSellerAfterSignInApiData?.message || 'Login verification failed.',
        );
      }
      return postSellerAfterSignInApiData;
    } catch (error) {
      throw new Error(error.message || 'Failed to load seller data.');
    }
  };

  const validateFields = () => {
    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'This is a required field';
      }
    });

    setValidateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePressLogin = async () => {
    if (validateFields()) {
      try {
        setLoading(true);
        // console.log(formData.email);
        const authResult = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const user = authResult.user;

        if (user) {
          const localIdToken = await user.getIdToken();
          console.log('Token:', localIdToken);
          const userData = await loadData(localIdToken);
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
          navigation.navigate('LoginOtp');
        }
      } catch (error) {
        Alert.alert('Login failed', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePressBuyerBypass = () => {
    // Navigate directly to buyer screens without authentication
    navigation.reset({
      index: 0,
      routes: [{name: 'BuyerTabs'}],
    });
  };

  return (
    <ScrollView>
      <View
        style={[
          styles.mainContent,
          {height: adjustedHeight, width: screenWidth},
        ]}>
        {loading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}

        <View style={styles.mainContainer}>
          <Text style={[globalStyles.title]}>Welcome back!</Text>
          <Text style={[globalStyles.textXXLGreyDark, styles.subtTitle]}>
            Log in to your account
          </Text>

          <View style={{paddingTop: 30}}>
            <InputGroupLeftIcon
              IconLeftComponent={EmailIcon}
              placeholder={'Email'}
              value={formData.email}
              onChangeText={text => setFormData({...formData, email: text})}
            />
            {validateErrors.email && (
              <Text style={globalStyles.textXSRed}>{validateErrors.email}</Text>
            )}
          </View>

          <View style={{paddingTop: 30}}>
            <InputPasswordLeftIcon
              IconLeftComponent={PasswordIcon}
              value={formData.password}
              onChangeText={text => setFormData({...formData, password: text})}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? <EyeOpenIcon width={20} height={20} /> : <EyeClosedIcon width={20} height={20} />}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            {validateErrors.password && (
              <Text style={globalStyles.textXSRed}>
                {validateErrors.password}
              </Text>
            )}
          </View>

          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textLGAccent, {textAlign: 'right'}]}>
              Forgot password?
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <View style={styles.loginAccountContainer}>
              <Text style={{color: '#000', textAlign: 'center'}}>
                By clicking login, you agree to the ileafU's{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenTerms')}>
                <Text style={{color: '#699E73'}}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={{color: '#000'}}> and </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ScreenPrivacy')}>
                <Text style={{color: '#699E73'}}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={globalStyles.primaryButton}
              onPress={handlePressLogin}>
              <Text style={globalStyles.primaryButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
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

export default ScreenLoginForm;
