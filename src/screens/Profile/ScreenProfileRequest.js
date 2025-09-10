import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';
import NetInfo from '@react-native-community/netinfo';

import {postProfileRequestGenusApi} from '../../components/Api/postProfileRequestGenusApi';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../assets/images/avatar.svg';

const ScreenProfileRequest = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const [genus, setGenus] = useState('');
  const [species, setSpecies] = useState('');

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  // Form validation
  const validateForm = () => {
    let errors = [];

    if (!genus) errors.push('Genus is required.');
    if (!species) errors.push('Species is required.');

    return errors;
  };
  // Form validation

  // // Update
  const onPressUpdate = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation', errors.join('\n'));
      return;
    }
    setLoading(true);

    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Network', 'No internet connection.');
        throw new Error('No internet connection.');
      }

      const response = await postProfileRequestGenusApi(genus, species);

      if (!response?.success) {
        throw new Error(response?.message || 'Request plant name failed.');
      }

      Alert.alert('Request plant name', 'Submitted successfully!');
      setGenus('');
      setSpecies('');
    } catch (error) {
      console.log('Request plant name:', error.message);
      Alert.alert('Request plant name', error.message);
    } finally {
      setLoading(false);
    }
  };
  // // Update

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Request Plant Name
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}
        <View style={{marginHorizontal: 20}}>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Genus <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} value={genus} setValue={setGenus} />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Species <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} value={species} setValue={setSpecies} />
          </View>
        </View>
        {/* Main Content */}
      </ScrollView>
      {/* Button always at the bottom */}
      <View style={{padding: 20, backgroundColor: '#fff'}}>
        <TouchableOpacity
          style={[globalStyles.primaryButton]}
          onPress={() => onPressUpdate()}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenProfileRequest;
