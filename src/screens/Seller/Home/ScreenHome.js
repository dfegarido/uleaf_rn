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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import BusinessPerformance from './components/BusinessPerformance';

import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';

import LiveIcon from '../../../assets/images/live.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import MyStoreIcon from '../../../assets/images/mystore.svg';
import PayoutsIcon from '../../../assets/images/payouts.svg';
import MessageIcon from '../../../assets/images/messages.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';

const screenHeight = Dimensions.get('window').height;

const ScreenHome = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#DFECDF');
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
                placeholder={'Search'}
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

        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.topNavItem}
            onPress={handlePressMyStore}>
            <MyStoreIcon width={40} height={40} />
            <Text style={styles.topNavText}>My Store</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topNavItem}
            onPress={() => navigation.navigate('ScreenPayout')}>
            <PayoutsIcon width={40} height={40} />
            <Text style={styles.topNavText}>Payouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topNavItem}>
            <View style={styles.msgIcon}>
              <MessageIcon width={40} height={40} />
              <View style={styles.msgBadge}>
                <Text style={styles.msgBadgeText}>23</Text>
              </View>
            </View>
            <Text style={styles.topNavText}>Messages</Text>
          </TouchableOpacity>
        </View>

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
              <Text style={styles.cardLabel}>Total Sales</Text>
              <Text style={styles.cardValue}>$53,753</Text>
              <Text style={styles.cardSubValue}>
                +12,492 from previous week
              </Text>
              <Text style={styles.greenTag}>+36%</Text>
            </View>

            <View style={styles.cardWhite}>
              <Text style={styles.cardLabel}>Plant Sold</Text>
              <Text style={[styles.cardValue, {color: '#202325'}]}>2,384</Text>
              <Text style={styles.redTag}>-243 from previous week</Text>
            </View>

            <View style={styles.cardWhite}>
              <Text style={styles.cardLabel}>Plant Listed</Text>
              <Text style={[styles.cardValue, {color: '#202325'}]}>2,384</Text>
              <Text style={styles.redTag}>-243 from previous week</Text>
            </View>
          </ScrollView>

          {/* News Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest News & Events</Text>
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
              <Text style={styles.bannerCaption}>News or Event Title Here</Text>
            </View>
            <View style={{width: 316}}>
              <Image
                style={styles.banner}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <Text style={styles.bannerCaption}>News or Event Title Here</Text>
            </View>
            <View style={{width: 316}}>
              <Image
                style={styles.banner}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <Text style={styles.bannerCaption}>News or Event Title Here</Text>
            </View>
          </ScrollView>

          {/* Business Performance */}
          <BusinessPerformance />
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardBlack: {
    height: 135,
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
    borderRadius: 10,
    padding: 16,
    flex: 1,
  },
  cardLabel: {
    color: '#202325',
    fontSize: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubValue: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
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
  redTag: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  bannerCaption: {
    marginTop: 8,
    fontSize: 14,
    color: '#444',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  performanceBox: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceDate: {
    fontSize: 12,
    color: '#777',
  },
  stickyHeader: {
    backgroundColor: '#DFECDF',
    zIndex: 10,
    paddingTop: 12,
  },
});
