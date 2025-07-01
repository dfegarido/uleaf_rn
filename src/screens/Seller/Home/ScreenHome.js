import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import BusinessPerformance from './components/BusinessPerformance';
import {CustomSalesChart} from '../../../components/Charts';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {useIsFocused} from '@react-navigation/native';
import {roundNumber} from '../../../utils/roundNumber';
import HomeDurationDropdown from './components/HomeDurationDropdown';
import {formatDateMonthDay} from '../../../utils/formatDateMonthDay';
import {formatCurrency} from '../../../utils/formatCurrency';

import {
  getHomeSummaryApi,
  getHomeEventsApi,
  getHomeBusinessPerformanceApi,
  getDateFilterApi,
} from '../../../components/Api';

import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import MyStoreIcon from '../../../assets/images/mystore.svg';
import PayoutsIcon from '../../../assets/images/payouts.svg';
import MessageIcon from '../../../assets/images/messages.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import {globalStyles} from '../../../assets/styles/styles';

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

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#DFECDF');
    }
  });

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

        if (!netState.isConnected || !netState.isInternetReachable) {
          Alert('Network Information', 'No internet connection.');
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

    if (!netState.isConnected || !netState.isInternetReachable) {
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <View style={{flex: 1}}>
              <InputGroupLeftIcon
                IconLeftComponent={SearchIcon}
                placeholder={'Search I Leaf U'}
              />
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <LiveIcon width={40} height={40} />
                {/* <Text style={styles.liveTag}>LIVE</Text> */}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('ScreenProfile')}>
                <AvatarIcon width={40} height={40} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

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
            <Text style={globalStyles.textSMGreyLight}>Payouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topNavItem}>
            <View style={styles.msgIcon}>
              <MessageIcon width={40} height={40} />
              <View style={styles.msgBadge}>
                <Text style={styles.msgBadgeText}>23</Text>
              </View>
            </View>
            <Text style={globalStyles.textSMGreyLight}>Messages</Text>
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
                {totalSales?.symbol ?? 'PHP'} {totalSales?.thisWeek ?? '0'}
              </Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[globalStyles.textSMWhite, globalStyles.textSemiBold]}>
                  {totalSales?.lastWeek ?? '0'}
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
            {eventData?.map(item => (
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
              Business performance
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
            <CustomSalesChart data={chartData} isMonthly={false} />
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
    paddingVertical: 16,
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
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
