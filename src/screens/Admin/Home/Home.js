// Add IconTile component for use in LeafTrailGreenhouse and other sections
const IconTile = ({title, children, onPress, badgeCount = 0}) => {
  const hasBadge = badgeCount > 0;
  return (
    <TouchableOpacity style={[globalStyles.cardLightAccent, styles.tile]} onPress={onPress}>
      <View style={styles.iconTileContainer}>
        {children}
        {hasBadge && (
          <View style={styles.iconTileBadge}>
            <Text style={styles.iconTileBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[{color: '#556065', marginTop: 8, fontWeight: '700'}]}>{title}</Text>
    </TouchableOpacity>
  );
};
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
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
import GenerateQrIcon from '../../../assets/admin-icons/generate-qr.svg';
import ScheduleIcon from '../../../assets/admin-icons/schedule.svg';
import FlightDateIcon from '../../../assets/admin-icons/flight-date.svg';
import ShippedIcon from '../../../assets/admin-icons/shipped.svg';
import SortingIcon from '../../../assets/admin-icons/sorting.svg';
import TaxonomyIcon from '../../../assets/admin-icons/taxonomy-book.svg';
import UserManagementIcon from '../../../assets/admin-icons/user-management.svg';
import ChatShopsIcon from '../../../assets/admin-icons/chat-shops.svg';
import { globalStyles } from '../../../assets/styles/styles';
import { useAuth } from '../../../auth/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdminFlightChangeRequestsApi } from '../../../components/Api/adminOrderApi';
import { getAdminJourneyMishapDataApi } from '../../../components/Api/orderManagementApi';
import NetInfo from '@react-native-community/netinfo';


const AdminHeader = ({onPressProfile = () => {}, insets, profilePhotoUri}) => {
  const {userInfo} = useAuth();
  const firstName = userInfo?.user?.firstName || userInfo?.firstName || 'Admin';
  const canGoLive = false;
  const profileImage = profilePhotoUri || userInfo?.profileImage || userInfo?.profilePhotoUrl || userInfo?.data?.profilePhotoUrl || userInfo?.data?.profileImage || '';

  return (
    <View style={[styles.headerContainer]}>
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

const BusinessPerformance = ({ navigation, pendingWildgoneCount = 0 }) => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={[globalStyles.textXXLGreyDark, {fontWeight: '700'}]}>Business Performance</Text>
        <View style={styles.cardRow}>
          <TouchableOpacity 
            style={[globalStyles.cardLightAccent, styles.card]}
            onPress={() => navigation.navigate('SalesReport')}>
            {pendingWildgoneCount > 0 && (
              <View style={styles.badge}>
                <Text style={[globalStyles.textXSWhite, {fontWeight: '700'}]}>{pendingWildgoneCount}</Text>
              </View>
            )}
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
        <IconTile title="Shipped" onPress={() => navigation.navigate('LeafTrailShippedAdminScreen')}> 
          <ShippedIcon width={48} height={48} />
        </IconTile>
      </View>
    </View>
  );
};
  const BehindTheJungle = () => {
    const navigation = useNavigation();
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    // Fetch pending flight change requests count
    const fetchPendingRequestsCount = useCallback(async () => {
      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          console.log('⚠️ No internet connection, skipping badge count fetch');
          return;
        }

        console.log('🔍 Fetching pending flight change requests for badge...');
        const response = await getAdminFlightChangeRequestsApi({
          status: 'pending',
          limit: 1000,
          offset: 0
        });

        console.log('📦 Full API response:', JSON.stringify(response, null, 2));

        // Check multiple possible response structures
        let count = 0;
        if (response.success) {
          if (response.data?.data?.requests && Array.isArray(response.data.data.requests)) {
            count = response.data.data.requests.length;
          } else if (response.data?.requests && Array.isArray(response.data.requests)) {
            count = response.data.requests.length;
          } else if (Array.isArray(response.data)) {
            count = response.data.length;
          }
        }

        console.log('✅ Pending flight change requests count:', count);
        setPendingRequestsCount(count);
      } catch (error) {
        console.error('❌ Error fetching pending flight change requests:', error);
        // Don't reset to 0 on error, keep previous count
      }
    }, []);

    // Fetch count when screen is focused
    useFocusEffect(
      useCallback(() => {
        fetchPendingRequestsCount();
      }, [fetchPendingRequestsCount])
    );

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
          <IconTile title="Schedule" onPress={() => navigation.navigate('Schedule')}>
            <ScheduleIcon width={48} height={48} />
          </IconTile>
          <IconTile 
            title="Flight Date" 
            onPress={() => {
              console.log('Flight Date button pressed, pendingRequestsCount:', pendingRequestsCount);
              navigation.navigate('FlightDate');
            }}
            badgeCount={pendingRequestsCount}
          >
            <FlightDateIcon width={48} height={48} />
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
          <IconTile title="Generate QR" onPress={() => navigation.navigate('GenerateQR')}>
            <GenerateQrIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Invoice Viewer" onPress={() => navigation.navigate('GenerateInvoice')}>
            <OrderSummaryIcon width={48} height={48} />
          </IconTile>
          <IconTile title="Chat Shops" onPress={() => navigation.navigate('ChatShops')}>
            <ChatShopsIcon width={48} height={48} />
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
  const [pendingWildgoneCount, setPendingWildgoneCount] = useState(0);
  const [cachedProfilePhoto, setCachedProfilePhoto] = useState(null);

  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60; // Standard admin tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 16); // At least 16px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing

  // Load profile photo and fetch data when screen is focused (ensures avatar updates after profile photo change)
  useFocusEffect(
    useCallback(() => {
      const loadProfilePhoto = async () => {
        try {
          const cached = await AsyncStorage.getItem('profilePhotoUrlWithTimestamp') ||
                        await AsyncStorage.getItem('profilePhotoUrl');
          if (cached) {
            // Add cache-bust param so Android fetches fresh image after profile photo update
            const cacheBusted = `${cached}${cached.includes('?') ? '&' : '?'}cb=${Date.now()}`;
            setCachedProfilePhoto(cacheBusted);
          }
        } catch (e) {
          // ignore
        }
      };
      const fetchPendingWildgoneCount = async () => {
        try {
          const response = await getAdminJourneyMishapDataApi({
            limit: 100,
            offset: 0,
          });
          if (response.success && response.data?.data) {
            const creditRequests = response.data.data.creditRequests || [];
            const pendingCount = creditRequests.filter(req => req.status === 'pending').length;
            setPendingWildgoneCount(pendingCount);
          }
        } catch (error) {
          console.error('Error fetching pending wildgone count:', error);
        }
      };
      loadProfilePhoto();
      fetchPendingWildgoneCount();
    }, [])
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <AdminHeader
        onPressProfile={() => navigation.navigate('AdminProfile')}
        insets={insets}
        profilePhotoUri={cachedProfilePhoto}
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
        <BusinessPerformance navigation={navigation} pendingWildgoneCount={pendingWildgoneCount} />
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
    overflow: 'visible', // Allow badge to overflow
  },
  iconTileContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    overflow: 'visible', // Allow badge to overflow
  },
  iconTileBadge: {
    position: 'absolute',
    top: -12,
    right: -24,
    backgroundColor: '#FF5247',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  iconTileBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 20,
    textAlign: 'center',
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

