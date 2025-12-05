import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CheckBoxGroup} from '../../components/CheckBox';
import {globalStyles} from '../../assets/styles/styles';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROW_OPTIONS = [
  {label: 'Indoor greenhouse', value: 'indoor_greenhouse'},
  {label: 'Ambient environment', value: 'ambient_environment'},
  {label: 'Outdoor greenhouse', value: 'outdoor_greenhouse'},
  {label: 'Outdoor open garden', value: 'outdoor_open_garden'},
];

const BuyerSignup = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState([]);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        if (stored) {
          const data = JSON.parse(stored);
          console.log('Loading existing grow plants data:', data);
          
          // Restore growPlants selection
          if (data.growPlants) {
            const savedSelections = data.growPlants.split(',');
            setSelected(savedSelections);
          }
        }
      } catch (e) {
        console.error('Failed to load existing grow plants data', e);
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

  const handleContinue = async () => {
    try {
      const prev = await AsyncStorage.getItem('buyerSignupData');
      const prevData = prev ? JSON.parse(prev) : {};
      await AsyncStorage.setItem(
        'buyerSignupData',
        JSON.stringify({
          ...prevData,
          growPlants: selected.join(','),
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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={[styles.container, {paddingBottom: 32}]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackSolidIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.stepText}>1/4</Text>
        </View>
        <Text style={styles.title}>Start joining us</Text>
        <Text style={styles.subtitleBold}>How do you grow your plants?</Text>
        <Text style={styles.subtitle}>Choose any that applies.</Text>
        <View style={{marginTop: 24, marginBottom: 32}}>
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
        </View>
        <View style={{flex: 1}} />
        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            styles.continueBtn,
            {marginBottom: 8},
            selected.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selected.length === 0}>
          <Text style={[
            globalStyles.primaryButtonText,
            selected.length === 0 && styles.disabledButtonText,
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.loginLinkContainer, {marginBottom: 8}]}>
          <Text style={styles.loginLink}>Log in to your existing account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8, // Further reduced to match good positioning
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
  continueBtn: {
    marginTop: 12,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginLink: {
    color: '#539461',
    fontSize: 16,
    fontWeight: '800',
    textDecorationLine: 'none',
  },
});

export default BuyerSignup;
