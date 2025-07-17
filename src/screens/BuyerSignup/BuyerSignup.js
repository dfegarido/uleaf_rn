import React, {useState} from 'react';
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

  const handleContinue = async () => {
    try {
      const prev = await AsyncStorage.getItem('buyerSignupData');
      const prevData = prev ? JSON.parse(prev) : {};
      await AsyncStorage.setItem(
        'buyerSignupData',
        JSON.stringify({
          ...prevData,
          growPlants: selected.length === 1 ? selected[0] : selected,
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
          ]}
          onPress={handleContinue}
          disabled={selected.length === 0}>
          <Text style={globalStyles.primaryButtonText}>Continue</Text>
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
