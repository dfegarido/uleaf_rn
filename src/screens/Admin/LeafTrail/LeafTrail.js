import { useNavigation } from '@react-navigation/native';
import React, { useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../auth/AuthProvider';

// Import icons
import AvatarIcon from '../../../assets/admin-icons/avatar.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';

const HEADER_HEIGHT = 80;

const LeafTrailHeader = ({insets, navigation, userInfo}) => {
  const firstName = userInfo?.user?.firstName || userInfo?.firstName || 'Admin';
  
  return (
    <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle}>Leaf Trail</Text>

        {/* Profile Icon */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('AdminProfile')}>
          <AvatarIcon width={32} height={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LeafTrail = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {userInfo} = useAuth();
  
  // Calculate proper bottom padding for safe area - admin doesn't have bottom tabs by default
  const safeBottomPadding = Math.max(insets.bottom, 16); // At least 16px padding
  
  const mainScrollRef = useRef(null);

  return (
    <SafeAreaView style={styles.container}>
      <LeafTrailHeader 
        insets={insets} 
        navigation={navigation} 
        userInfo={userInfo} 
      />
      
      <ScrollView
        ref={mainScrollRef}
        style={[styles.body, {paddingTop: HEADER_HEIGHT + insets.top}]}
        contentContainerStyle={{paddingBottom: safeBottomPadding}}
        showsVerticalScrollIndicator={false}>
        
        {/* Leaf Trail Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Leaf Trail Management</Text>
          
          {/* Add your leaf trail content here */}
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>
              Leaf trail functionality will be implemented here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    height: HEADER_HEIGHT - 12, // Account for paddingTop in stickyHeader
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 20,
  },
  placeholderContent: {
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#556065',
    textAlign: 'center',
  },
});

export default LeafTrail;