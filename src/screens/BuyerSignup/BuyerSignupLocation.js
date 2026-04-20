import React, {useState, useEffect, useCallback} from 'react';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import InputDropdownPaginated from '../../components/Input/InputDropdownPaginated';
import InputBox from '../../components/Input/InputBox';
import InfoIcon from '../../assets/buyer-icons/information.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUSStatesSimple} from '../../components/Api/geoDbApi';

const RESTRICTED_LOCATIONS = {
  STATES: ['Alaska', 'Hawaii'],
  TERRITORIES: [
    'Puerto Rico',
    'Guam',
    'American Samoa',
    'U.S. Virgin Islands',
    'United States Virgin Islands',
    'Northern Mariana Islands',
    'Commonwealth of the Northern Mariana Islands',
  ],
  RESTRICTED_CODES: ['AK', 'HI', 'PR', 'GU', 'AS', 'VI', 'MP'],
};

const filterRestrictedStates = states => {
  return states.filter(state => {
    if (RESTRICTED_LOCATIONS.RESTRICTED_CODES.includes(state.isoCode)) {
      return false;
    }
    const stateName = state.name;
    const isRestrictedState = RESTRICTED_LOCATIONS.STATES.some(restricted =>
      stateName.toLowerCase().includes(restricted.toLowerCase()),
    );
    const isRestrictedTerritory = RESTRICTED_LOCATIONS.TERRITORIES.some(restricted =>
      stateName.toLowerCase().includes(restricted.toLowerCase()),
    );
    return !(isRestrictedState || isRestrictedTerritory);
  });
};

const BuyerSignupLocation = () => {
  const navigation = useNavigation();
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [statesOffset, setStatesOffset] = useState(0);
  const [statesHasMore, setStatesHasMore] = useState(true);
  const [loadingMoreStates, setLoadingMoreStates] = useState(false);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const stored = await AsyncStorage.getItem('buyerSignupData');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.state) setState(data.state);
          if (data.zipCode) setZip(String(data.zipCode));
        }
      } catch (e) {
        console.error('Failed to load existing location data', e);
      }
    };
    loadExistingData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      const targetRouteName = e.data?.action?.payload?.name;
      const buyerSignupScreens = [
        'BuyerSignup',
        'BuyerSignupLocation',
        'BuyerGettingToKnow',
        'BuyerCompleteYourAccount',
      ];
      if (targetRouteName && !buyerSignupScreens.includes(targetRouteName)) {
        AsyncStorage.removeItem('buyerSignupData').catch(err =>
          console.error('Failed to clear signup data:', err),
        );
      }
    });
    return unsubscribe;
  }, [navigation]);

  const loadStates = useCallback(
    async (isLoadMore = false) => {
      try {
        const offset = isLoadMore ? statesOffset : 0;

        if (isLoadMore) {
          setLoadingMoreStates(true);
        } else {
          setStatesLoading(true);
          setStates([]);
          setStatesOffset(0);
        }

        const response = await getUSStatesSimple(50, offset);

        if (response.success && response.states) {
          const stateList = response.states.map(s => ({
            name: s.name,
            isoCode: s.code || s.isoCode || s.stateCode || null,
            id: s.id,
          }));
          const filteredStates = filterRestrictedStates(stateList);
          filteredStates.sort((a, b) => a.name.localeCompare(b.name));

          if (isLoadMore) {
            setStates(prev => [...prev, ...filteredStates]);
            setStatesOffset(prev => prev + filteredStates.length);
          } else {
            setStates(filteredStates);
            setStatesOffset(filteredStates.length);
          }
          setStatesHasMore(response.hasMore);
        } else {
          throw new Error(response.error || 'Failed to load states');
        }
      } catch (error) {
        console.error('Error loading states:', error.message);
        if (!isLoadMore) {
          Alert.alert(
            'Location Service Issue',
            'Could not load states. Using fallback list.',
            [{text: 'OK'}],
          );
          setStates([
            {name: 'California', isoCode: 'CA'},
            {name: 'Texas', isoCode: 'TX'},
            {name: 'New York', isoCode: 'NY'},
            {name: 'Florida', isoCode: 'FL'},
            {name: 'Illinois', isoCode: 'IL'},
            {name: 'Pennsylvania', isoCode: 'PA'},
            {name: 'Ohio', isoCode: 'OH'},
            {name: 'Georgia', isoCode: 'GA'},
            {name: 'North Carolina', isoCode: 'NC'},
            {name: 'Michigan', isoCode: 'MI'},
          ]);
          setStatesHasMore(false);
        }
      } finally {
        if (isLoadMore) {
          setLoadingMoreStates(false);
        } else {
          setStatesLoading(false);
        }
      }
    },
    [statesOffset],
  );

  useEffect(() => {
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreStates = useCallback(async () => {
    if (!statesHasMore || loadingMoreStates) return;
    await loadStates(true);
  }, [statesHasMore, loadingMoreStates, loadStates]);

  const saveLocationAndContinue = async () => {
    try {
      const prev = await AsyncStorage.getItem('buyerSignupData');
      const prevData = prev ? JSON.parse(prev) : {};
      await AsyncStorage.setItem(
        'buyerSignupData',
        JSON.stringify({
          ...prevData,
          state,
          zipCode: zip,
          city: '',
          address: '',
        }),
      );
    } catch (e) {
      // silent
    }
    navigation.navigate('BuyerGettingToKnow');
  };

  const handleContinue = async () => {
    if (__DEV__) {
      await saveLocationAndContinue();
      return;
    }

    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      const ip = ipData.ip;

      const geoRes = await fetch(
        `https://apiip.net/api/check?accessKey=58e625be-685c-4695-b7f0-1fc7a990725d&ip=${ip}`,
      );
      const geoData = await geoRes.json();
      if (geoData && geoData.countryCode === 'US') {
        await saveLocationAndContinue();
      } else {
        Alert.alert(
          'Registration Restricted',
          'Registration is only allowed for users located in the United States.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'Unable to verify your location. Please check your internet connection and try again.',
      );
    }
  };

  const canContinue = !!(state && zip);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}>
          <View style={styles.container}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackSolidIcon width={24} height={24} />
              </TouchableOpacity>
              <Text style={styles.stepText}>2/4</Text>
            </View>

            <Text style={styles.title}>{'Your location & your\nplants'}</Text>
            <Text style={styles.subtitle}>
              This information will help us with packaging considerations and send
              alerts related to weather conditions.
            </Text>

            <View style={styles.infoBox}>
              <InfoIcon width={20} height={20} style={styles.infoBoxIcon} />
              <Text style={styles.infoBoxText}>
                Our green marketplace blooms just for buyers in the continental United States.
                Accounts won't grow beyond this region.
              </Text>
            </View>

            <Text style={styles.label}>
              State<Text style={{color: '#FF5247'}}>*</Text>
            </Text>
            <InputDropdownPaginated
              options={states.map(s => s.name)}
              selectedOption={state}
              onSelect={selectedName => setState(selectedName)}
              placeholder={
                state ? state : statesLoading ? 'Loading US states...' : 'Select your state'
              }
              disabled={statesLoading}
              onLoadMore={loadMoreStates}
              hasMore={statesHasMore}
              loadingMore={loadingMoreStates}
            />

            <Text style={styles.label}>
              Zip code<Text style={{color: '#FF5247'}}>*</Text>
            </Text>
            <InputBox
              placeholder="Enter zip code"
              value={zip}
              setValue={setZip}
              isNumeric={true}
            />

            <View style={{flex: 1, minHeight: 24}} />
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              globalStyles.primaryButton,
              {marginBottom: 8},
              !canContinue && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}>
            <Text
              style={[
                globalStyles.primaryButtonText,
                !canContinue && styles.disabledButtonText,
              ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
    paddingTop: 16,
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#393D43',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#D6F0FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBoxIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoBoxText: {
    color: '#556065',
    fontSize: 14,
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: '#393D43',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default BuyerSignupLocation;
