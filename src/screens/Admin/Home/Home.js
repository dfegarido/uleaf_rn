// Add IconTile component for use in LeafTrailGreenhouse and other sections
const IconTile = ({title, children, onPress}) => {
  return (
    <TouchableOpacity style={[globalStyles.cardLightAccent, styles.tile]} onPress={onPress}>
      {children}
      <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>{title}</Text>
    </TouchableOpacity>
  );
};
import { useNavigation } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarIcon from '../../../assets/admin-icons/avatar.svg';
import DiscountsIcon from '../../../assets/admin-icons/discounts.svg';
import ForShippingIcon from '../../../assets/admin-icons/for-shipping.svg';
import HappeningsIcon from '../../../assets/admin-icons/happenings.svg';
import JungleAccessIcon from '../../../assets/admin-icons/jungle-access.svg';
import LeafPointsIcon from '../../../assets/admin-icons/leaf-points.svg';
import ListingViewIcon from '../../../assets/admin-icons/listing-view.svg';
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


const AdminHeader = ({onPressProfile = () => {}, insets}) => {
  const {userInfo} = useAuth();
  const firstName = userInfo?.user?.firstName || userInfo?.firstName || 'Admin';
  const canGoLive = false;
  const profileImage = userInfo?.profileImage || userInfo?.profilePhotoUrl || '';

  return (
    <View style={[styles.headerContainer, {paddingTop: insets.top}]}>
      <Text style={styles.headerTitle}>{`Welcome ${firstName}`}</Text>

      <View style={styles.headerActions}>
        {canGoLive && (
          <TouchableOpacity style={styles.liveButton}>
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

const QuickLinkCard = ({title, icon, badgeCount, onPress}) => {
  return (
    <TouchableOpacity
      style={styles.quickLinkCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickLinkContent}>
        {badgeCount > 0 && (
          <View style={styles.quickLinkBadge}>
            <Text style={styles.quickLinkBadgeText}>{badgeCount}</Text>
          </View>
        )}
        <View style={styles.quickLinkIconContainer}>
          {icon}
        </View>
        <Text style={styles.quickLinkTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const BusinessPerformance = ({ navigation }) => {
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

          <TouchableOpacity  style={[globalStyles.cardLightAccent, styles.card]} onPress={() => navigation.navigate('OrderSummary')}>
            <OrderSummaryIcon width={40} height={40} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Orders</Text>
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
        <IconTile title="Scan QR" onPress={() => navigation.navigate('LeafTrailScanQRAdminScreen')}>
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
          <IconTile title="Jungle Acces..." onPress={() => navigation.navigate('JungleAccess')}>
            <JungleAccessIcon width={48} height={48} />
          </IconTile>
          <IconTile title="User Mgmt" onPress={() => navigation.navigate('UserManagement')}>
            <UserManagementIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Taxonomy" onPress={() => navigation.navigate('Taxonomy')}>
            <TaxonomyIcon width={48} height={48} />
          </IconTile>
        </View>
      </View>
    );
  };

  const NewsEventsRewards = () => {
    const navigation = useNavigation();
    return (
      <View style={[styles.sectionContainer, {paddingTop: 24}]}>
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>News, Events and Rewards</Text>

        <View style={styles.cardRow}>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]}>
            <HappeningsIcon width={48} height={48} />
            <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>Happenings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.cardLightAccent, styles.card]} onPress={() => navigation.navigate('AdminDiscounts')}>
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
  const insets = useSafeAreaInsets();

  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60; // Standard admin tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 16); // At least 16px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <AdminHeader
        onPressProfile={() => navigation.navigate('AdminProfile')}
        insets={insets}
      />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: totalBottomPadding}}
        showsVerticalScrollIndicator={false}>
        {/* Listings Viewer quick link directly under header */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickLinksRow}>
            <QuickLinkCard
              title="Listings Viewer"
              icon={<ListingViewIcon width={200} height={40} />}
              badgeCount={0}
              onPress={() => navigation.navigate('ListingsViewer')}
            />
          </View>
        </View>
        <BusinessPerformance navigation={navigation} />
        <LeafTrailGreenhouse navigation={navigation} />
        <BehindTheJungle />
        <NewsEventsRewards />
      </ScrollView>
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

  // Quick Link Card Styles
  quickLinksRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  quickLinkCard: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    height: 88,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  quickLinkContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  quickLinkIconContainer: {
    width: 200,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#556065',
  },
  quickLinkBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF5247',
    width: 24,
    height: 24,
    borderRadius: 1000,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    display: 'none', // Hidden by default as per design
  },
  quickLinkBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    color: '#FFFFFF',
  },
});

