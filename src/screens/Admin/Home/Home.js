import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvatarIcon from '../../../assets/admin-icons/avatar.svg';
import DiscountsIcon from '../../../assets/admin-icons/discounts.svg';
import ForShippingIcon from '../../../assets/admin-icons/for-shipping.svg';
import HappeningsIcon from '../../../assets/admin-icons/happenings.svg';
import JungleAccessIcon from '../../../assets/admin-icons/jungle-access.svg';
import LeafPointsIcon from '../../../assets/admin-icons/leaf-points.svg';
import LiveIcon from '../../../assets/admin-icons/live-icon.svg';
import LiveSetupIcon from '../../../assets/admin-icons/live-setup.svg';
import OrderSummaryIcon from '../../../assets/admin-icons/order-summary.svg';
import PackingIcon from '../../../assets/admin-icons/packing.svg';
import PayoutsIcon from '../../../assets/admin-icons/payouts.svg';
import ReceivingIcon from '../../../assets/admin-icons/receiving.svg';
import SalesReportIcon from '../../../assets/admin-icons/sales-report.svg';
import ScanQrIcon from '../../../assets/admin-icons/scan-qr.svg';
import ScheduleIcon from '../../../assets/admin-icons/schedule.svg';
import ShippedIcon from '../../../assets/admin-icons/shipped.svg';
import SortingIcon from '../../../assets/admin-icons/sorting.svg';
import TaxonomyIcon from '../../../assets/admin-icons/taxonomy-book.svg';
import UserManagementIcon from '../../../assets/admin-icons/user-management.svg';
import { globalStyles } from '../../../assets/styles/styles';
import { useAuth } from '../../../auth/AuthProvider';


const AdminHeader = ({onPressLive = () => {}, onPressProfile = () => {}}) => {
  const {userInfo} = useAuth();
  const firstName = userInfo?.user?.firstName || userInfo?.firstName || 'Admin';
  const canGoLive = userInfo?.liveFlag !== 'No';
  const profileImage = userInfo?.profileImage || userInfo?.profilePhotoUrl || '';

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{`Welcome ${firstName}`}</Text>

      <View style={styles.headerActions}>
        {canGoLive && (
          <TouchableOpacity onPress={onPressLive} style={styles.liveButton}>
            <LiveIcon width={40} height={39} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onPressProfile} activeOpacity={0.8}>
          {profileImage ? (
            <Image
              source={{uri: profileImage}}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <AvatarIcon width={32} height={32} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BusinessPerformance = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>Business Performance</Text>
  
        <View style={styles.cardRow}>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]}>
            <View style={styles.badge}>
              <Text style={[globalStyles.textXSWhite, {fontWeight: '700'}]}>9</Text>
            </View>
            <SalesReportIcon width={40} height={40} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Sales Report</Text>
          </TouchableOpacity>
  
          <TouchableOpacity  style={[globalStyles.cardLightAccent, styles.card]}>
            <OrderSummaryIcon width={40} height={40} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Order Summary</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const LeafTrailGreenhouse = ({navigation}) => {
    return (
      <View style={[styles.sectionContainer, {paddingTop: 24}]}> 
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>Leaf Trail / Greenhouse</Text>

        <View style={styles.grid}>
          <IconTile title="Scan QR" onPress={() => navigation.navigate('ScanQR')}>
            <ScanQrIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Receiving" onPress={() => navigation.navigate('LeafTrailReceivingScreenAdminScreen')}>
            <ReceivingIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Sorting" onPress={() => navigation.navigate('LeafTrailSortingAdminScreen')}> 
            <SortingIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Packing" onPress={() => navigation.navigate('LeafTrailPackingAdminScreen')}> 
            <PackingIcon width={48} height={48} />
          </IconTile> 
          <IconTile title="For Shipping" onPress={() => navigation.navigate('LeafTrailShippingAdminScreen')}>
            <ForShippingIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Shipped">
            <ShippedIcon width={48} height={48} />
          </IconTile>
        </View>
      </View>
    );
  };
  
  const IconTile = ({title, children, onPress}) => {
    return (
      <TouchableOpacity style={[globalStyles.cardLightAccent, styles.tile]} onPress={onPress}> 
        {children}
        <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>{title}</Text>
      </TouchableOpacity>
    );
  };
  
  const BehindTheJungle = () => {
    const navigation = useNavigation();
  
    return (
      <View style={[styles.sectionContainer, {paddingTop: 24}]}> 
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>Behind the Jungle</Text>
  
        <View style={styles.grid}>
          <IconTile title="Live Setup">
            <LiveSetupIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Payouts">
            <PayoutsIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Schedule">
            <ScheduleIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Jungle Acces...">
            <JungleAccessIcon width={48} height={48} />
          </IconTile>
          <IconTile title="User Mgmt" onPress={() => navigation.navigate('UserManagement')}>
            <UserManagementIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Taxonomy">
            <TaxonomyIcon width={48} height={48} />
          </IconTile>
        </View>
      </View>
    );
  };
  
  const NewsEventsRewards = () => {
    return (
      <View style={[styles.sectionContainer, {paddingTop: 24}]}> 
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>News, Events and Rewards</Text>
  
        <View style={styles.cardRow}>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]}> 
            <HappeningsIcon width={48} height={48} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Happenings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]}> 
            <DiscountsIcon width={48} height={48} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Discounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]}> 
            <LeafPointsIcon width={48} height={48} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Leaf Points</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  

const Home = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: '#fff'}}>
        <AdminHeader
          onPressLive={() => navigation.navigate('LiveBroadcastScreen')}
          onPressProfile={() => navigation.navigate('AdminProfile')}
        />
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: 85}}>
          <BusinessPerformance />
          <LeafTrailGreenhouse navigation={navigation} />
          <BehindTheJungle />
          <NewsEventsRewards />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveButton: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#699E73',
    backgroundColor: '#EAF2EC',
  },

  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tile: {
    width: '32%',
    minHeight: 110,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    position: 'absolute',
    top: 9,
    left: 7,
    backgroundColor: '#FF5247',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

