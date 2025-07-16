import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import MapPinIcon from '../../../assets/HeartPinIcon';
import EditIcon from '../../../assets/EditIcon';

const AddressBookScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Book</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddNewAddressScreen')}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <Path d="M12 5V19" stroke="#393D40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M5 12H19" stroke="#393D40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.addressSection}>
          {/* Address List 1 */}
          <View style={styles.addressList}>
            <View style={styles.addressListContent}>
              <View style={styles.iconCircle}>
                <View style={styles.iconBg}>
                  <MapPinIcon width={24} height={24} />
                </View>
              </View>
              <View style={styles.details}>
                <View style={styles.addressActionRow}>
                  <Text style={styles.addressText} numberOfLines={2}>
                    123 Main Street, Springfield, IL 62704, United States
                  </Text>
                  <View style={styles.action}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('UpdateAddressScreen')}>
                      <EditIcon width={24} height={24} fill="#7F8D91" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.setDefaultRow}>
                  <View style={styles.setDefaultContent}>
                    <Text style={styles.setDefaultLabel}>Default address</Text>
                  </View>
                  <View style={styles.switchWrap}>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
            </View>
          </View>
          {/* Address List 2 (example) */}
          <View style={styles.addressList}>
            <View style={styles.addressListContent}>
              <View style={styles.iconCircle}>
                <View style={styles.iconBg}>
                  <MapPinIcon width={24} height={24} />
                </View>
              </View>
              <View style={styles.details}>
                <View style={styles.addressActionRow}>
                  <Text style={styles.addressText} numberOfLines={2}>
                    5678 Oak Avenue Dallas, TX 75201
                  </Text>
                  <View style={styles.action}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('UpdateAddressScreen')}>
                      <EditIcon width={24} height={24} fill="#7F8D91" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.setDefaultRow}>
                  <View style={styles.setDefaultContent}>
                    <Text style={styles.setDefaultLabel}>Set as default address</Text>
                  </View>
                  <View style={[styles.switchWrap, { backgroundColor: '#CDD3D4', opacity: 0.5, justifyContent: 'flex-start' }] }>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Address List 3 */}
          <View style={styles.addressList}>
            <View style={styles.addressListContent}>
              <View style={styles.iconCircle}>
                <View style={styles.iconBg}>
                  <MapPinIcon width={24} height={24} />
                </View>
              </View>
              <View style={styles.details}>
                <View style={styles.addressActionRow}>
                  <Text style={styles.addressText} numberOfLines={2}>
                    789 Birchwood Lane, Austin, TX 78701
                  </Text>
                  <View style={styles.action}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('UpdateAddressScreen')}>
                      <EditIcon width={24} height={24} fill="#7F8D91" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.setDefaultRow}>
                  <View style={styles.setDefaultContent}>
                    <Text style={styles.setDefaultLabel}>Set as default address</Text>
                  </View>
                  <View style={[styles.switchWrap, { backgroundColor: '#CDD3D4', opacity: 0.5, justifyContent: 'flex-start' }] }>
                    <View style={styles.switchKnob} />
                  </View>
                </View>
              </View>
            </View>
          </View>
          
        </View>
      </ScrollView>
      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
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
    marginRight: 15, // Align with address list icons
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
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: '100%',
    alignSelf: 'center',
  },
  addressList: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 12,
    width: '95%',
    minHeight: 124,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    marginBottom: 12,
  },
  addressListContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 12,
    gap: 12,
    width: '100%',
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  iconCircle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8.33,
    width: 40,
    height: 60,
  },
  iconBg: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFE7E2',
    borderRadius: 1000,
  },
  details: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 0,
    gap: 4,
    width: '85%',
    flex: 1,
    height: 72,
  },
  addressActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    width: 269,
    height: 44,
  },
  addressText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlignVertical: 'center',
  },
  action: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    width: 24,
    height: 44,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  setDefaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    width: 269,
    height: 24,
  },
  setDefaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 213,
    height: 22,
  },
  setDefaultLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#539461',
    width: 213,
    height: 22,
    
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
