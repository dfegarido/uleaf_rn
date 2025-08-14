import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import {AuthContext} from '../../../auth/AuthProvider';
import {useIsFocused} from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import {getAdminInfoApi} from '../../../components/Api';

// Import icons
import ProfileIcon from '../../../assets/icons/greydark/profile.svg';
import PasswordIcon from '../../../assets/icons/greydark/lock-key-regular.svg';
import RightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/admin-icons/avatar.svg';

// Custom Header Component
const ProfileHeader = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <LeftIcon width={24} height={24} fill="#393D40" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Admin Profile</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
};

// Menu Item Component
const MenuItem = ({icon, title, onPress, showArrow = true}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      {icon}
      <Text style={styles.menuItemText}>{title}</Text>
    </View>
    {showArrow && <RightIcon width={16} height={16} fill="#556065" />}
  </TouchableOpacity>
);

// Skeleton Loading Component
const SkeletonLoader = () => {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      </View>
      <View style={styles.profileInfo}>
        <Animated.View style={[styles.skeletonName, { opacity }]} />
        <Animated.View style={[styles.skeletonEmail, { opacity }]} />
      </View>
    </View>
  );
};

// Profile Info Component
const ProfileInfo = ({adminData, userInfo}) => {
  // Use API data if available, fallback to userInfo
  const data = adminData || userInfo;
  const firstName = data?.user?.firstName || data?.firstName || 'Admin';
  const lastName = data?.user?.lastName || data?.lastName || 'User';
  const email = data?.user?.email || data?.email || 'admin@ileafu.com';
  
  return (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <AvatarIcon width={80} height={80} />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{`${firstName} ${lastName}`}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>
    </View>
  );
};

// Divider Component
const Divider = () => <View style={styles.divider} />;

const AdminProfileScreen = () => {
  const navigation = useNavigation();
  const {userInfo, logout} = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch admin info from API
  const fetchAdminInfo = async (showInitialLoading = false) => {
    try {
      if (showInitialLoading) {
        setInitialLoading(true);
      }
      
      const response = await getAdminInfoApi();
      if (response && response.success && response.data) {
        setAdminData(response.data);
      }
    } catch (error) {
      console.error('Error fetching admin info:', error);
      // Silently fail and use userInfo as fallback
    } finally {
      if (showInitialLoading) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAdminInfo(true);
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminInfo(false);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  console.log('Admin Profile - UserInfo:', userInfo);

  return (
    <View style={styles.container}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />
      
      <ProfileHeader />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Information */}
        {initialLoading ? (
          <SkeletonLoader />
        ) : (
          <ProfileInfo adminData={adminData} userInfo={userInfo} />
        )}

        <Divider />

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Account Information"
            onPress={() => navigation.navigate('AdminAccountInformation')}
          />

          <MenuItem
            icon={<PasswordIcon width={24} height={24} fill="#556065" />}
            title="Update Password"
            onPress={() => navigation.navigate('AdminUpdatePassword')}
          />
        </View>

        <Divider />

        {/* Legal Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Terms of Use"
            onPress={() => navigation.navigate('AdminTermsOfUse')}
          />

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Privacy Policy"
            onPress={() => navigation.navigate('AdminPrivacyPolicy')}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#DFECDF',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#393D40',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#DFECDF',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#393D40',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#556065',
    textAlign: 'center',
  },
  // Skeleton Loading Styles
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
  },
  skeletonName: {
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  skeletonEmail: {
    width: 180,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  divider: {
    height: 8,
    backgroundColor: '#F5F6F6',
  },
  settingsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8F9AA3',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#393D40',
    marginLeft: 16,
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#E4E7E9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 327,
    height: 48,
    minHeight: 48,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminProfileScreen;
