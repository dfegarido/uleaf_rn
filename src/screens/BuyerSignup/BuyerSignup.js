import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
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
import {CheckBoxGroup} from '../../components/CheckBox';
import {globalStyles} from '../../assets/styles/styles';
import InfoIcon from '../../assets/buyer-icons/information.svg';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrganicBackground from '../../components/OrganicBackground/OrganicBackground';
import StepIndicator from '../../components/StepIndicator/StepIndicator';

const GROW_OPTIONS = [
  {label: 'Indoor greenhouse', value: 'indoor_greenhouse'},
  {label: 'Ambient environment', value: 'ambient_environment'},
  {label: 'Outdoor greenhouse', value: 'outdoor_greenhouse'},
  {label: 'Outdoor open garden', value: 'outdoor_open_garden'},
];

const BuyerSignup = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [hasDeepLinkReferral, setHasDeepLinkReferral] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        let loadedInviteCode = '';
        if (stored) {
          const data = JSON.parse(stored);
          console.log('Loading existing grow plants data:', data);
          if (data.growPlants) {
            const savedSelections = data.growPlants.split(',');
            setSelected(savedSelections);
          }
          if (data.inviteCode) loadedInviteCode = data.inviteCode;
        }
        const pendingCode = await AsyncStorage.getItem('pendingInviteCode');
        if (pendingCode && pendingCode.length === 6) {
          setInviteCode(pendingCode);
          setHasDeepLinkReferral(true);
          const prevData = stored ? JSON.parse(stored) : {};
          await AsyncStorage.setItem('buyerSignupData', JSON.stringify({
            ...prevData,
            inviteCode: pendingCode,
          }));
          await AsyncStorage.removeItem('pendingInviteCode');
        } else if (loadedInviteCode) {
          setInviteCode(loadedInviteCode);
        }
        const pendingRef = await AsyncStorage.getItem('pendingReferrerUid');
        if (pendingRef && !pendingCode) setHasDeepLinkReferral(true);
      } catch (e) {
        console.error('Failed to load existing grow plants data', e);
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

  const handleContinue = async () => {
    try {
      const prev = await AsyncStorage.getItem('buyerSignupData');
      const prevData = prev ? JSON.parse(prev) : {};
      await AsyncStorage.setItem(
        'buyerSignupData',
        JSON.stringify({
          ...prevData,
          growPlants: selected.join(','),
          inviteCode: inviteCode.trim(),
        }),
      );
    } catch (e) {
      console.error('Failed to save growPlants', e);
    }
    navigation.navigate('BuyerSignupLocation');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
      <View style={[styles.container, {paddingBottom: 32}]}>
        <Animated.View style={[fadeUp(0), {marginTop: 8, marginBottom: 24, alignItems: 'center'}]}>
          <StepIndicator currentStep={1} />
        </Animated.View>
        <Animated.View style={fadeUp(1)}>
          <Text style={styles.title}>Start joining us</Text>
          <Text style={styles.subtitleBold}>How do you grow your plants?</Text>
          <Text style={styles.subtitle}>Choose any that applies.</Text>
        </Animated.View>
        <Animated.View style={[fadeUp(2), {marginTop: 24, marginBottom: 32}]}>
          <CheckBoxGroup
            options={GROW_OPTIONS}
            selectedValues={selected}
            onChange={setSelected}
            optionStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 18,
            }}
            boxStyle={{marginLeft: 0, marginRight: 12}}
            labelStyle={{fontSize: 16, marginLeft: 0}}
          />
        </Animated.View>

        <Animated.View style={fadeUp(3)}>
          <View style={styles.inviteLabelRow}>
            <Text style={styles.inviteLabel}>
              Invite Code <Text style={styles.inviteOptional}>(optional)</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => setInfoModalVisible(true)}>
              <InfoIcon width={18} height={18} style={styles.inviteInfoIcon} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.inviteInput}
            placeholder="Enter 6-digit code"
            value={inviteCode}
            onChangeText={setInviteCode}
            maxLength={6}
            keyboardType="number-pad"
            autoCorrect={false}
            placeholderTextColor="#aaa"
          />
          {hasDeepLinkReferral && !inviteCode ? (
            <Text style={styles.deepLinkNotice}>
              Referral applied from your invite link
            </Text>
          ) : null}
        </Animated.View>

        <View style={{flex: 1}} />
        <Animated.View style={[fadeUp(4), styles.buttonRow]}>
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
                styles.backButton,
              ]}
              onPress={handleLogin}>
              <Text style={styles.backButtonText}>Back</Text>
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
                styles.nextButton,
                selected.length === 0 && styles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={selected.length === 0}>
              <Text style={[
                globalStyles.primaryButtonText,
                selected.length === 0 && styles.disabledButtonText,
              ]}>
                Next
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
      <CustomAlert
        visible={infoModalVisible}
        title="Invite Code"
        message="Have a friend on ileafU? Ask them for their 6-digit invite code. When you make your first purchase, they earn 20 Leaf Points and you receive 20 Leaf Coins."
        buttons={[{text: 'Got it', onPress: () => setInfoModalVisible(false)}]}
        onDismiss={() => setInfoModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#202325',
    marginBottom: 18,
  },
  subtitleBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#393D43',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#393D43',
    marginBottom: 8,
  },
  inviteLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inviteLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#393D43',
  },
  inviteInfoIcon: {
    marginLeft: 6,
  },
  inviteOptional: {
    color: '#aaa',
    fontWeight: '400',
    fontSize: 13,
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202325',
    backgroundColor: '#fff',
  },
  deepLinkNotice: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 0,
  },
  backButtonText: {
    color: '#539461',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  nextButton: {
    marginVertical: 0,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default BuyerSignup;
