import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {AuthContext} from '../../auth/AuthProvider';
import {useIsFocused} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../utils/utils';

import {getProfileInfoApi} from '../../components/Api';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ProfileIcon from '../../assets/icons/greydark/profile.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';
import ReportIcon from '../../assets/icons/greydark/question-regular.svg';
import PlantIcon from '../../assets/icons/greydark/plant-regular.svg';
import ChatIcon from '../../assets/icons/greydark/chat-circle-dots-regular.svg';
import EnvelopeIcon from '../../assets/icons/greydark/envelope.svg';
import RightIcon from '../../assets/icons/greydark/caret-right-regular.svg';
import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../assets/images/avatar.svg';

const ScreenProfile = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {logout, userInfo} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [cachedProfilePhoto, setCachedProfilePhoto] = useState('');

  // ✅ Fetch on mount
  const isFocused = useIsFocused();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadListingData();
        // Load cached profile photo URL if available
        try {
          const AsyncStorage =
            require('@react-native-async-storage/async-storage').default;
          const cached = await AsyncStorage.getItem('profilePhotoUrl');
          if (cached) setCachedProfilePhoto(cached);
        } catch (e) {
          console.warn('Failed to read cached profile photo:', e?.message || e);
        }
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused]);

  const loadListingData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getProfileInfoApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }

    console.log(res);
    setData(res);
  };
  // ✅ Fetch on mount

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
      }}>
      <ScrollView
        style={[
          styles.container,
          // {
          //   marginBottom: insets.bottom + 120,
          // },
        ]}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          marginBottom: insets.bottom + 30,
        }}>
        {loading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
        <View
          style={[
            styles.stickyHeader,
            {
              paddingTop: 10,
              paddingBottom: 10,
              backgroundColor: '#DFECDF',
            },
          ]}>
          <View
            style={[
              {
                marginHorizontal: 10,
              },
            ]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,

                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {cachedProfilePhoto || userInfo.profileImage ? (
              <Image
                source={{uri: cachedProfilePhoto || userInfo.profileImage}}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <AvatarIcon width={40} height={40} />
            )}
          </View>
          <View>
            <Text style={globalStyles.textLGGreyDark}>
              {data?.firstName && data?.lastName
                ? `${data.firstName} ${data.lastName}`
                : data?.gardenOrCompanyName || 'User Name'}
            </Text>
            <Text style={styles.status}>
              @{data?.username || data?.email?.split('@')[0] || 'username'}
            </Text>
          </View>
        </View>

        <View style={{backgroundColor: '#fff'}}>
          {/* Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenProfileAccount', data)}>
              <View style={styles.menuLeft}>
                <ProfileIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Account Information
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenProfilePassword')}>
              <View style={styles.menuLeft}>
                <PasswordIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Password
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenProfileProblem')}>
              <View style={styles.menuLeft}>
                <ReportIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Report a Problem
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenProfileRequest')}>
              <View style={styles.menuLeft}>
                <PlantIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Request Genus/Species Name
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenProfileChatAdmin')}>
              <View style={styles.menuLeft}>
                <ChatIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Chat with Us
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenTerms')}>
              <View style={styles.menuLeft}>
                <EnvelopeIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Terms of Use
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ScreenPrivacy')}>
              <View style={styles.menuLeft}>
                <EnvelopeIcon width={20} height={20} />
                <Text style={[globalStyles.textSMGreyDark, {paddingLeft: 5}]}>
                  Privacy Policy
                </Text>
              </View>
              <RightIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFECDF',
    // paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C4C4C4',
  },
  status: {
    color: '#34C759',
    fontSize: 14,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    fontWeight: '500',
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
    marginHorizontal: 20,
  },
  logoutText: {
    color: '#000',
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
});

export default ScreenProfile;
