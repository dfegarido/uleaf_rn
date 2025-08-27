import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { retryAsync } from '../../../utils/utils';
import {
  getAddressBookEntriesApi,
  updateAddressBookEntryApi,
  deleteAddressBookEntryApi,
} from '../../../components/Api';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import MapPinIcon from '../../../assets/HeartPinIcon';
import EditIcon from '../../../assets/EditIcon';
import AddressBookSkeleton from './AddressBookSkeleton';

const AddressBookScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadAddresses();
    }
  }, [isFocused]);

  const loadAddresses = async () => {
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await retryAsync(() => getAddressBookEntriesApi(), 3, 1000);

      if (res?.success && res?.data) {
        setAddresses(res.data);
        console.log('Addresses loaded:', res.data);
        console.log('First address structure:', res.data[0]);
      } else {
        console.log('Failed to load addresses:', res?.message);
      }
    } catch (error) {
      console.log('Error loading addresses:', error);
      Alert.alert(
        'Error',
        'Failed to load addresses. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAddresses();
    } catch (error) {
      console.log('Error refreshing addresses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleDefaultAddress = async (addressId, currentDefault) => {
    try {
      console.log('Toggling default address - ID:', addressId, 'Current default:', currentDefault);
      
      // Validate addressId
      if (!addressId) {
        throw new Error('Address ID is missing');
      }

      // First, if setting as default, unset all other defaults
      if (!currentDefault) {
        const updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: addr.entryId === addressId || addr.id === addressId,
        }));
        setAddresses(updatedAddresses);
      }

      const res = await updateAddressBookEntryApi(addressId, {
        isDefault: !currentDefault,
      });

      if (res?.success) {
        await loadAddresses(); // Refresh the list
      } else {
        throw new Error(res?.message || 'Failed to update address');
      }
    } catch (error) {
      console.log('Error updating default address:', error);
      Alert.alert('Error', 'Failed to update default address');
      // Revert the optimistic update
      await loadAddresses();
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAddress(addressId),
        },
      ]
    );
  };

  const deleteAddress = async (addressId) => {
    try {
      const res = await deleteAddressBookEntryApi(addressId);
      
      if (res?.success) {
        await loadAddresses(); // Refresh the list
        Alert.alert('Success', 'Address deleted successfully');
      } else {
        throw new Error(res?.message || 'Failed to delete address');
      }
    } catch (error) {
      console.log('Error deleting address:', error);
      Alert.alert('Error', 'Failed to delete address');
    }
  };

  const formatAddress = (address) => {
    const parts = [
      address.address,
      address.city,
      address.state,
      address.zipCode,
    ].filter(Boolean);
    return parts.join(', ');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top }]}>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <LeftIcon width={24} height={24} fill="#393D40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Address Book</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddNewAddressScreen')}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <Path d="M12 5V19" stroke="#556065" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M5 12H19" stroke="#556065" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <AddressBookSkeleton />
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#699E73']}
              tintColor="#699E73"
            />
          }
        >
          <View style={styles.addressSection}>
            {addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No addresses yet</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't added any addresses yet
                </Text>
              </View>
            ) : (
              addresses.map((address) => (
                <View key={address.entryId || address.id} style={styles.addressList}>
                  <View style={styles.addressListContent}>
                    <View style={styles.iconCircle}>
                      <View style={styles.iconBg}>
                        <MapPinIcon width={24} height={24} />
                      </View>
                    </View>
                    <View style={styles.details}>
                      <View style={styles.addressActionRow}>
                        <Text style={styles.addressText} numberOfLines={2}>
                          {formatAddress(address)}
                        </Text>
                        <View style={styles.action}>
                          <TouchableOpacity 
                            style={styles.editBtn} 
                            onPress={() => navigation.navigate('UpdateAddressScreen', { address })}
                          >
                            <EditIcon width={24} height={24} fill="#7F8D91" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.setDefaultRow}>
                        <View style={styles.setDefaultContent}>
                          <Text style={styles.setDefaultLabel}>
                            {address.isDefault ? 'Default address' : 'Set as default address'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const addressId = address.entryId || address.id;
                            console.log('Toggle button pressed - Address:', address);
                            console.log('Using address ID:', addressId);
                            toggleDefaultAddress(addressId, address.isDefault);
                          }}
                        >
                          <View style={[
                            styles.switchWrap,
                            address.isDefault 
                              ? styles.switchActive 
                              : styles.switchInactive
                          ]}>
                            <View style={[
                              styles.switchKnob,
                              address.isDefault && styles.switchKnobActive
                            ]} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
      
      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    width: '100%',
    flex: 0,
    order: 1,
    minHeight: 100,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  headerControls: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    flex: 1,
    alignSelf: 'stretch',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0,
    order: 0,
    flexGrow: 0,
    zIndex: 0,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    marginHorizontal: 16,
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  addButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  addressSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 6,
    width: '100%',
    flex: 0,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  addressList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  addressListContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flex: 0,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  iconCircle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8.33,
    width: 40,
    height: 60,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  iconBg: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    width: 40,
    height: 40,
    backgroundColor: '#FFE7E2',
    borderRadius: 1000,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  details: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
    minHeight: 72,
    order: 1,
    flexGrow: 1,
  },
  addressActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    minHeight: 44,
    flex: 0,
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  addressText: {
    flex: 1,
    minHeight: 44,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    color: '#202325',
    order: 0,
    flexGrow: 1,
  },
  action: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 24,
    height: 44,
    flex: 0,
    order: 1,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
    order: 0,
    flexGrow: 0,
  },
  setDefaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    minHeight: 24,
  },
  setDefaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 22,
  },
  setDefaultLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#539461',
    flex: 1,
    minHeight: 22,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    width: 44,
    height: 24,
    backgroundColor: '#539461',
    borderRadius: 32,
    justifyContent: 'flex-end',
  },
  switchKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
  },
  // Empty states
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#556065',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#539461',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  // Address item styles
  recipientName: {
    fontSize: 14,
    color: '#556065',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: '#556065',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  // Switch styles
  switchActive: {
    backgroundColor: '#539461',
    justifyContent: 'flex-end',
  },
  switchInactive: {
    backgroundColor: '#CDD3D4',
    justifyContent: 'flex-start',
  },
  switchKnobActive: {
    backgroundColor: '#FFFFFF',
  },
  homeIndicator: {
    position: 'absolute',
    width: 375,
    height: 34,
    left: 0,
    bottom: 0,
    zIndex: 1,
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default AddressBookScreen;
