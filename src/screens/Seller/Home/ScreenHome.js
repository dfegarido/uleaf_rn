import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../auth/AuthProvider';
import { CustomSalesChart } from '../../../components/Charts';
import { formatCurrency, formatNumberWithCommas } from '../../../utils/formatCurrency';
import { getCurrencySymbol } from '../../../utils/getCurrencySymbol';
import { roundNumber } from '../../../utils/roundNumber';
import { retryAsync } from '../../../utils/utils';
import BusinessPerformance from './components/BusinessPerformance';
import HomeDurationDropdown from './components/HomeDurationDropdown';

import {
  getDateFilterApi,
  getHomeBusinessPerformanceApi,
  getHomeEventsApi,
  getHomeSummaryApi,
} from '../../../components/Api';


import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import LiveIcon from '../../../assets/images/live.svg';
import MessageIcon from '../../../assets/images/messages.svg';
import MyStoreIcon from '../../../assets/images/mystore.svg';
import PayoutsIcon from '../../../assets/images/payouts.svg';
import { globalStyles } from '../../../assets/styles/styles';

const screenHeight = Dimensions.get('window').height;

// const chartData = [
//   {week: 'MAR 24\nMAR 30', total: 60, sold: 15, amount: 75},
//   {week: 'MAR 17\nMAR 23', total: 60, sold: 30, amount: 80},
//   {week: 'MAR 10\nMAR 16', total: 80, sold: 40, amount: 95},
//   {week: 'MAR 03\nMAR 09', total: 65, sold: 35, amount: 80},
// ];

const ScreenHome = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const {userInfo} = useContext(AuthContext);

  // Add state to force image refresh
  const [profileImageKey, setProfileImageKey] = useState(0);
  const [cacheBustTimestamp, setCacheBustTimestamp] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#DFECDF');
      }
      
      // Refresh profile image when screen is focused
      // This ensures the image updates after profile photo upload
      const newTimestamp = Date.now();
      setCacheBustTimestamp(newTimestamp);
      setProfileImageKey(prev => prev + 1);
    }, [])
  );

  const handlePressMyStore = () => {
    navigation.navigate('ScreenMyStore');
  };

  // Fetch on mount
  const isFocused = useIsFocused();
  useEffect(() => {
    
    let isMounted = true;

    const fetchData = async () => {
      try {
        const netState = await NetInfo.fetch();
        // Use a tolerant check for network availability. On some emulators
        // `isInternetReachable` can be unreliable; prefer it when defined,
        // otherwise fall back to `isConnected`.
        const isNetworkAvailable = (state) => {
          if (!state) return false;
          if (typeof state.isInternetReachable === 'boolean') return state.isInternetReachable;
          return !!state.isConnected;
        };

        if (!isNetworkAvailable(netState)) {
          Alert.alert('Network Information', 'No internet connection.');
          return;
        }

        if (!isMounted) return;
        setLoading(true);

        await Promise.all([
          loadSalesData(),
          loadEventsData(),
          loadDurationDropdownData(),
          loadSalesPerformanceData('Weekly'),
        ]);
      } catch (error) {
        console.log('Error loading data:', error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isFocused) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  // Sales summary
  const [totalSales, setTotalSales] = useState();
  const [plantSold, setPlantSold] = useState();
  const [plantListed, setPlantListed] = useState();
  const loadSalesData = async () => {
    const res = await retryAsync(() => getHomeSummaryApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load summary API.');
    }

    // console.log(res);
    setTotalSales(res.stats.currency);
    setPlantSold(res.stats.plantsSold);
    setPlantListed(res.stats.listingsCreated);
  };
  // Sales summary

  // Events
  const [eventData, setEventData] = useState();
  const loadEventsData = async () => {
    const res = await retryAsync(() => getHomeEventsApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load events API.');
    }

    // console.log(res);
    setEventData(res?.data);
  };
  // Events

  // Sales Performance
  const [businessPerformanceTable, setBusinessPerformanceTable] = useState([]);
  const [chartData, setChartData] = useState([]);

  const loadSalesPerformanceData = async duration => {
    const res = await retryAsync(
      () => getHomeBusinessPerformanceApi(duration),
      3,
      1000,
    );

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load events API.');
    }

    const localChartData = res.data.map(item => ({
      week: item.rangeLabel, // or convert to "MMM DD\nMMM DD" format if needed
      total: item.totalListed,
      sold: item.sold,
      amount: item.earnings?.amount || 0,
    }));
    setChartData(localChartData);

    const mapped = res.data.map(item => ({
      header: item.rangeLabel,
      earnings: item.earnings?.amount || 0,
      sold: item.sold,
      totalListed: item.totalListed,
      sellThroughRate:
        item.totalListed > 0
          ? ((item.sold / item.totalListed) * 100).toFixed(2) + '%'
          : '0.00%',
    }));

    const businessPerformanceData = {
      headers: mapped.map(i => i.header),
      rows: [
        {
          label: 'Total Sales',
          values: mapped.map(i => formatCurrency(i.earnings)),
        },
        {
          label: 'Plants Sold',
          values: mapped.map(i => String(i.sold)),
        },
        {
          label: 'Plants Listed',
          values: mapped.map(i => String(i.totalListed)),
        },
        {
          label: 'Sell-through Rate',
          values: mapped.map(i => i.sellThroughRate),
        },
      ],
    };
    setBusinessPerformanceTable(businessPerformanceData);

    console.log(localChartData);
    // console.log(res.data);
    // setEventData(res?.data);
  };
  // Sales Performance

  // Dropdown
  const [dropdownDurationOption, setDropdownDurationOption] = useState([]);
  const [dropdownDuration, setDropdownDuration] = useState('Weekly');

  const handleDropdownDuration = value => {
    // setBusinessPerformanceTable([]);
    // setChartData([]);
    setDropdownDuration(value);
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadSalesPerformanceData(value);
      } catch (error) {
        console.error('Error loading data:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  const loadDurationDropdownData = async () => {
    const netState = await NetInfo.fetch();

    // Reuse tolerant check here as well
    const isNetworkAvailable = (state) => {
      if (!state) return false;
      if (typeof state.isInternetReachable === 'boolean') return state.isInternetReachable;
      return !!state.isConnected;
    };

    if (!isNetworkAvailable(netState)) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getDateFilterApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load events API.');
    }

    let localDropdownVal = res.data.map(item => item.name);
    setDropdownDurationOption(localDropdownVal);
    // console.log(res);
  };
  // Dropdown

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}

      {/* Search and Icons */}
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            style={{flex: 1}}
            onPress={() => navigation.navigate('ScreenSearchListing')}>
            {/* <InputGroupLeftIcon
                IconLeftComponent={SearchIcon}
                placeholder={'Search ileafU'}
              /> */}
            <View
              style={{
                justifyContent: 'center',
                // alignItems: 'center',
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                height: 48,
                backgroundColor: '#fff',
              }}>
              <View style={{flexDirection: 'row'}}>
                <SearchIcon width={20} height={20} />
                <Text style={[globalStyles.textMDGreyLight, {paddingLeft: 10}]}>
                  Search ileafU
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerIcons}>
            {userInfo?.liveFlag === 'Yes'  && (
              <TouchableOpacity
                onPress={ () => navigation.navigate('CreateLiveSession')}
                style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              {userInfo?.profileImage != '' &&
              userInfo?.profileImage != null ? (
                <Image
                  key={profileImageKey}
                  source={{
                    uri: `${userInfo?.profileImage}${userInfo?.profileImage?.includes('?') ? '&' : '?'}t=${cacheBustTimestamp}`
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <AvatarIcon width={40} height={40} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Search and Icons */}
      <ScrollView
        // style={[styles.container, {paddingTop: insets.top}]}
        style={[styles.container]}
        // stickyHeaderIndices={[0]}
      >
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.topNavItem}
            onPress={handlePressMyStore}>
            <MyStoreIcon width={40} height={40} />
            <Text
              style={[globalStyles.textSMGreyLight, globalStyles.textSemiBold]}>
              My Store
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topNavItem}
            onPress={() => navigation.navigate('ScreenPayout')}>
            <PayoutsIcon width={40} height={40} />
            <Text
              style={[globalStyles.textSMGreyLight, globalStyles.textSemiBold]}>
              Payouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topNavItem}
            onPress={() => {
              // Disable navigation for suppliers
              if (userInfo?.user?.userType !== 'supplier') {
                navigation.navigate('MessagesScreen');
              }
            }}>
            <View style={styles.msgIcon}>
              <MessageIcon width={40} height={40} />
              <View style={styles.msgBadge}>
                {/* <Text style={styles.msgBadgeText}>23</Text> */}
              </View>
            </View>
            <Text
              style={[globalStyles.textSMGreyLight, globalStyles.textSemiBold]}>
              Messages
            </Text>
          </TouchableOpacity>
        </View>
        {/* Top Navigation */}

        <View
          style={{
            backgroundColor: '#fff',
            minHeight: screenHeight * 0.8,
            paddingTop: 20,
            paddingHorizontal: 20,
          }}>
          {/* Stats Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{flexGrow: 0}} // ✅ prevents extra vertical space
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            <View style={styles.cardBlack}>
              <Text
                style={[
                  globalStyles.textSMWhite,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                Total Sales
              </Text>
              <Text
                style={[
                  globalStyles.textXXLWhite,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                {(totalSales?.symbol || getCurrencySymbol(userInfo))}
                {formatNumberWithCommas(Number(totalSales?.thisWeek || 0))}
              </Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[globalStyles.textSMWhite, globalStyles.textSemiBold]}>
                  {(totalSales?.symbol || getCurrencySymbol(userInfo))}{formatNumberWithCommas(Number(totalSales?.lastWeek || 0))}
                </Text>
                <Text
                  style={[
                    globalStyles.textSMGreyLight,
                    globalStyles.textSemiBold,
                  ]}>
                  from previous week
                </Text>
              </View>

              <Text style={styles.greenTag}>
                {roundNumber(totalSales?.percentChange) ?? '0'}%
              </Text>
            </View>

            <View style={styles.cardWhite}>
              <Text
                style={[
                  globalStyles.textSMGreyLight,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                Plants Sold
              </Text>
              <Text
                style={[
                  globalStyles.textXXLGreyDark,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                {plantSold?.thisWeek ?? 0}
              </Text>

              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[
                    globalStyles.textSMGreyDark,
                    globalStyles.textSemiBold,
                  ]}>
                  {plantSold?.difference ?? 0}
                </Text>
                <Text
                  style={[
                    globalStyles.textSMGreyLight,
                    globalStyles.textSemiBold,
                  ]}>
                  from previous week
                </Text>
              </View>

              <Text style={styles.redPercentTag}>
                {roundNumber(plantSold?.percentChange) ?? 0}%
              </Text>
            </View>

            <View style={styles.cardWhite}>
              <Text
                style={[
                  globalStyles.textSMGreyLight,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                Plants Listed
              </Text>
              <Text
                style={[
                  globalStyles.textXXLGreyDark,
                  globalStyles.textBold,
                  {paddingBottom: 10},
                ]}>
                {(plantListed?.lastWeek ?? 0) + (plantListed?.thisWeek ?? 0)}
              </Text>

              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[
                    globalStyles.textSMGreyDark,
                    globalStyles.textSemiBold,
                  ]}>
                  {plantListed?.thisWeek ?? 0}
                </Text>
                <Text
                  style={[
                    globalStyles.textSMGreyLight,
                    globalStyles.textSemiBold,
                  ]}>
                  added this week
                </Text>
              </View>
            </View>
          </ScrollView>
          {/* Stats Cards */}

          {/* News Section */}
          <View style={styles.section}>
            <Text
              style={[
                globalStyles.textMDGreyDark,
                globalStyles.textBold,
                {paddingBottom: 10},
              ]}>
              Latest News & Events
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{flexGrow: 0}}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            {(eventData || [])
              // Hide buyer-only referral items
              .filter(item => {
                const name = String(item?.name || '').trim().toLowerCase();
                if (!name) return true;
                // Common variations
                if (name.includes('refer your friends')) return false;
                if (name.includes('refer to your friends')) return false;
                // Generic guard: titles starting with "refer" and containing "friend"
                if (name.startsWith('refer') && name.includes('friend')) return false;
                return true;
              })
              .map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  // Optional: handle link navigation
                  // Linking.openURL(item.link);
                }}
                style={{width: 316}}>
                <Image
                  style={styles.banner}
                  source={{uri: item.image}}
                  resizeMode="cover"
                />
                <Text
                  style={[
                    globalStyles.textSMGreyDark,
                    globalStyles.textSemiBold,
                    {paddingTop: 10},
                  ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* News Section */}

          {/* Business Performance */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 20,
            }}>
            <Text style={[globalStyles.textMDGreyDark, globalStyles.textBold]}>
              {dropdownDuration + ' Sales Performance'}
            </Text>
            <HomeDurationDropdown
              options={dropdownDurationOption}
              selectedOption={dropdownDuration}
              onSelect={handleDropdownDuration}
              placeholder="Choose an option"
            />
          </View>

          <BusinessPerformance data={businessPerformanceTable} />
          <View style={{marginBottom: 30}}>
            {(() => {
              const chartCurrency = getCurrencySymbol(userInfo);
              
              console.log('💰 Home Screen Currency Info:', {
                userInfoCurrency: userInfo?.currencySymbol,
                userCountry: userInfo?.country,
                finalCurrency: chartCurrency,
                hasCurrencySymbol: !!userInfo?.currencySymbol,
                derivedFromCountry: !userInfo?.currencySymbol && !!userInfo?.country
              });
              
              return (
                <CustomSalesChart 
                  data={chartData} 
                  isMonthly={false} 
                  currencySymbol={chartCurrency} 
                />
              );
            })()}
          </View>
          {/* Business Performance */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreenHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#DFECDF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  liveTag: {
    color: 'red',
    fontSize: 10,
    marginTop: -4,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    // paddingVertical: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  topNavItem: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: 80,
  },
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  msgIcon: {
    position: 'relative',
  },
  msgBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  msgBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  cardBlack: {
    height: 135,
    width: 224,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 16,
    flex: 1,
    marginRight: 8,
  },
  cardWhite: {
    backgroundColor: '#f7f7f7',
    borderColor: '#CDD3D4',
    borderWidth: 1,
    height: 135,
    width: 224,
    borderRadius: 10,
    padding: 16,
    flex: 1,
  },
  greenTag: {
    backgroundColor: '#23C16B',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redPercentTag: {
    backgroundColor: '#FF5247',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redTag: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  stickyHeader: {
    backgroundColor: '#DFECDF',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: '#C0DAC2',
    borderColor: '#539461',
  },
});
