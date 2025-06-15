import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {AuthContext} from '../../auth/AuthProvider';

import ProfileIcon from '../../assets/icons/greydark/profile.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';
import ReportIcon from '../../assets/icons/greydark/question-regular.svg';
import PlantIcon from '../../assets/icons/greydark/plant-regular.svg';
import ChatIcon from '../../assets/icons/greydark/chat-circle-dots-regular.svg';
import EnvelopeIcon from '../../assets/icons/greydark/envelope.svg';
import RightIcon from '../../assets/icons/greydark/caret-right-regular.svg';

const ScreenProfile = ({navigation}) => {
  const {logout} = useContext(AuthContext);
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar} />
        </View>
        <View>
          <Text style={globalStyles.textLGGreyDark}>Olla Holic</Text>
          <Text style={styles.status}>● Active</Text>
        </View>
      </View>

      <View style={{backgroundColor: '#fff'}}>
        {/* Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ScreenProfileAccount')}>
            <View style={styles.menuLeft}>
              <ProfileIcon width={20} height={20} />
              <Text style={globalStyles.textSMGreyDark}>
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
              <Text style={globalStyles.textSMGreyDark}>Password</Text>
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
              <Text style={globalStyles.textSMGreyDark}>Report a Problem</Text>
            </View>
            <RightIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ScreenProfileRequest')}>
            <View style={styles.menuLeft}>
              <PlantIcon width={20} height={20} />
              <Text style={globalStyles.textSMGreyDark}>
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
              <Text style={globalStyles.textSMGreyDark}>Chat with Us</Text>
            </View>
            <RightIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <EnvelopeIcon width={20} height={20} />
              <Text style={globalStyles.textSMGreyDark}>Terms of Use</Text>
            </View>
            <RightIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <EnvelopeIcon width={20} height={20} />
              <Text style={globalStyles.textSMGreyDark}>Privacy Policy</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F6',
    // paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 30,
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
});

export default ScreenProfile;
