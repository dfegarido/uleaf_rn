import React, {useContext, useEffect} from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {globalStyles} from '../../assets/styles/styles';

import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../../../firebase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';
import {
  completeLoginSession,
  isSupplierAccount,
} from '../../utils/completeLoginSession';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const TOKENS = {
  bg: '#F7F8F2',
  sage: '#6BA368',
  sageDark: '#4E8A4B',
  lightSage: '#D4E5D2',
  cream: '#F0EDE5',
};

const ScreenLogin = ({navigation}) => {
  const {setIsLoggedIn, setUserInfo} = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const safeBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const storedPhase = await AsyncStorage.getItem('loginPhase');
          await AsyncStorage.setItem('authToken', token);

          if (storedPhase === 'otp_verified') {
            setIsLoggedIn(true);
          } else if (storedPhase === 'credentials_entered') {
            const storedUserInfo = await AsyncStorage.getItem('userInfo');
            let parsedUserInfo = null;
            if (storedUserInfo) {
              try {
                parsedUserInfo = JSON.parse(storedUserInfo);
              } catch (parseError) {
                console.log('Failed to parse stored userInfo:', parseError.message);
              }
            }

            if (isSupplierAccount(parsedUserInfo)) {
              await completeLoginSession({
                idToken: token,
                setIsLoggedIn,
                setUserInfo,
              });
            } else {
              navigation.navigate('LoginOtp');
            }
          }
        } catch (err) {
          console.log('Session token error:', err.message);
        }
      }
    };
    fetchData();
  }, []);

  // Entrance animation
  const entranceProgress = useSharedValue(0);
  useEffect(() => {
    entranceProgress.value = withTiming(1, {duration: 900, easing: Easing.out(Easing.ease)});
  }, []);

  const fadeUp = (delay = 0) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(entranceProgress.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(entranceProgress.value, [0, 1], [30 + delay * 8, 0]),
        },
      ],
    }));

  // Logo float animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-10, {duration: 2000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, []);

  const logoFloatStyle = useAnimatedStyle(() => ({
    transform: [{translateY: floatY.value}],
  }));

  // Blob drift (very subtle)
  const blobDrift = useSharedValue(0);
  useEffect(() => {
    blobDrift.value = withRepeat(
      withTiming(18, {duration: 14000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{translateX: blobDrift.value}],
  }));

  // Button press scale
  const createBtnScale = useSharedValue(1);
  const loginBtnScale = useSharedValue(1);

  const createBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: createBtnScale.value}],
  }));

  const loginBtnStyle = useAnimatedStyle(() => ({
    transform: [{scale: loginBtnScale.value}],
  }));

  const handlePressCreateAccount = () => {
    navigation.navigate('BuyerAuthStack', {
      screen: 'BuyerSignup',
    });
  };
  const handlePressLogin = () => {
    navigation.navigate('LoginForm');
  };

  return (
    <View style={styles.mainContent}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android'
          ? {backgroundColor: TOKENS.bg}
          : {})}
      />

      {/* Organic Background Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.blob1, blobStyle]} />
        <Animated.View style={[styles.blob2, blobStyle]} />
        <Animated.View style={[styles.blob3]} />
      </View>

      {/* Logo with float + fade-in */}
      <Animated.View style={[styles.logoContainer, fadeUp(0)]}>
        <Animated.View style={logoFloatStyle}>
          <Image
            source={require('../../assets/images/login-logo.png')}
            style={styles.logo}
          />
        </Animated.View>
      </Animated.View>

      {/* Buttons with staggered fade-in */}
      <View style={[styles.buttonContainer, {paddingBottom: safeBottomPadding + 28}]}>
        <Animated.View style={[createBtnStyle, fadeUp(2)]}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPressIn={() => {
              createBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
            }}
            onPressOut={() => {
              createBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
            }}
            onPress={handlePressCreateAccount}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[loginBtnStyle, fadeUp(3), {marginTop: 14}]}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPressIn={() => {
              loginBtnScale.value = withSpring(0.96, {stiffness: 400, damping: 15});
            }}
            onPressOut={() => {
              loginBtnScale.value = withSpring(1, {stiffness: 400, damping: 15});
            }}
            onPress={handlePressLogin}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: screenHeight,
    backgroundColor: TOKENS.bg,
  },

  // Background blobs
  blob1: {
    position: 'absolute',
    top: -screenHeight * 0.06,
    left: -screenWidth * 0.22,
    width: screenWidth * 0.75,
    height: screenWidth * 0.75,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.3,
  },
  blob2: {
    position: 'absolute',
    top: screenHeight * 0.22,
    right: -screenWidth * 0.28,
    width: screenWidth * 0.65,
    height: screenWidth * 0.65,
    borderRadius: 999,
    backgroundColor: TOKENS.cream,
    opacity: 0.35,
  },
  blob3: {
    position: 'absolute',
    bottom: -screenHeight * 0.1,
    left: screenWidth * 0.12,
    width: screenWidth * 0.55,
    height: screenWidth * 0.55,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.22,
  },

  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: Math.min(340, screenHeight * 0.32),
    height: Math.min(340, screenHeight * 0.32),
    resizeMode: 'contain',
  },
  buttonContainer: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: TOKENS.sage,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: TOKENS.sageDark,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ScreenLogin;
