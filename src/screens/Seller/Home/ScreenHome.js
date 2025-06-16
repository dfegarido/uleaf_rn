import React, {useCallback} from 'react';
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import BusinessPerformance from './components/BusinessPerformance';
import {CustomSalesChart} from '../../../components/Charts';

import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import MyStoreIcon from '../../../assets/images/mystore.svg';
import PayoutsIcon from '../../../assets/images/payouts.svg';
import MessageIcon from '../../../assets/images/messages.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import {globalStyles} from '../../../assets/styles/styles';

const screenHeight = Dimensions.get('window').height;

const chartData = [
  {week: 'MAR 24\nMAR 30', total: 60, sold: 15, amount: 75},
  {week: 'MAR 17\nMAR 23', total: 60, sold: 30, amount: 80},
  {week: 'MAR 10\nMAR 16', total: 80, sold: 40, amount: 95},
  {week: 'MAR 03\nMAR 09', total: 65, sold: 35, amount: 80},
];

const ScreenHome = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#DFECDF');
    }
  });

  const handlePressMyStore = () => {
    navigation.navigate('ScreenMyStore');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
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
                $53,753
              </Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[globalStyles.textSMWhite, globalStyles.textSemiBold]}>
                  +12,492
                </Text>
                <Text
                  style={[
                    globalStyles.textSMGreyLight,
                    globalStyles.textSemiBold,
                  ]}>
                  from previous week
                </Text>
              </View>

              <Text style={styles.greenTag}>+36%</Text>
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
                2,384
              </Text>

              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[
                    globalStyles.textSMGreyDark,
                    globalStyles.textSemiBold,
                  ]}>
                  -243
                </Text>
                <Text
                  style={[
                    globalStyles.textSMGreyLight,
                    globalStyles.textSemiBold,
                  ]}>
                  from previous week
                </Text>
              </View>

              <Text style={styles.redPercentTag}>-12%</Text>
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
                8,034
              </Text>

              <View style={{flexDirection: 'row', gap: 10}}>
                <Text
                  style={[
                    globalStyles.textSMGreyDark,
                    globalStyles.textSemiBold,
                  ]}>
                  645
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
            style={{flexGrow: 0}} // ✅ prevents extra vertical space
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}>
            <View style={{width: 316}}>
              <Image
                style={styles.banner}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  globalStyles.textSemiBold,
                  {paddingTop: 10},
                ]}>
                News or Event Title Here
              </Text>
            </View>
            <View style={{width: 316}}>
              <Image
                style={styles.banner}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  globalStyles.textSemiBold,
                  {paddingTop: 10},
                ]}>
                News or Event Title Here
              </Text>
            </View>
            <View style={{width: 316}}>
              <Image
                style={styles.banner}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  globalStyles.textSemiBold,
                  {paddingTop: 10},
                ]}>
                News or Event Title Here
              </Text>
            </View>
          </ScrollView>
          {/* News Section */}

          {/* Business Performance */}
          <BusinessPerformance />
          <View style={{marginBottom: 30}}>
            <CustomSalesChart chartData={chartData} />
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
});
