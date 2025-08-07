import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {ScrollView, TouchableOpacity, TextInput} from 'react-native';
import SearchIcon from '../../../assets/iconnav/search.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {OrderItemCard} from '../../../components/OrderItemCard';
import BrowseMorePlants from '../../../components/BrowseMorePlants';

const OrdersHeader = ({activeTab, setActiveTab}) => {
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  const tabFilters = [
    {filterKey: 'Ready to Fly'},
    {filterKey: 'Plants are Home'},
    {filterKey: 'Journey Mishap'},
  ];

  const filterOptions =
    activeTab === 'Plants are Home' || activeTab === 'Journey Mishap'
      ? [
          {label: 'Plant Owner', rightIcon: DownIcon},
          {label: 'Plant Flight', rightIcon: DownIcon},
        ]
      : [{label: 'Plant Owner', rightIcon: DownIcon}];

  const onPressTab = ({pressTab}) => {
    setActiveTab(pressTab);
  };

  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plant, invoice #, buddy"
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.profileContainer}>
          <View style={styles.avatar}>
            <AvatarIcon width={32} height={32} />
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 20,
            alignItems: 'flex-start',
            paddingHorizontal: 16,
          }}>
          {tabFilters.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onPressTab({pressTab: tab.filterKey})}
              style={[
                styles.tabButton,
                activeTab === tab.filterKey && styles.activeTabButton,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.filterKey && styles.activeTabText,
                ]}>
                {tab.filterKey}
              </Text>
              {activeTab === tab.filterKey && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0, paddingVertical: 4}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          paddingHorizontal: 10,
        }}>
        {filterOptions.map((option, idx) => (
          <View
            key={option.label}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#CDD3D4',
              padding: 8,
              marginTop: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            {option.leftIcon && (
              <option.leftIcon
                width={20}
                height={20}
                style={{marginRight: 4}}
              />
            )}
            <Text style={{fontSize: 16, fontWeight: '600', color: '#202325'}}>
              {option.label}
            </Text>
            {option.rightIcon && (
              <option.rightIcon
                width={20}
                height={20}
                style={{marginLeft: 4}}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const ScreenOrders = () => {
  const [activeTab, setActiveTab] = useState('Ready to Fly');

  // Different order items for each tab
  const getOrderItems = tab => {
    switch (tab) {
      case 'Ready to Fly':
        return Array.from({length: 10}).map((_, i) => ({
          id: i,
          status: 'Ready to Fly',
          image: require('../../../assets/images/plant1.png'),
          name: 'Spinacia Oleracea',
          subtitle: 'Inner Variegated • 2"',
          price: '65.27',
          flightInfo: 'Plant Flight May-30',
          shippingInfo: 'UPS 2nd Day $50, add-on plant $5',
          flagIcon: <Text style={{fontSize: 18}}>🇹🇭</Text>,
        }));

      case 'Plants are Home':
        return Array.from({length: 8}).map((_, i) => ({
          id: i + 100,
          status: 'Plants are Home',
          image: require('../../../assets/images/plant1.png'),
          name: 'Monstera Deliciosa',
          subtitle: 'Variegated • 4"',
          price: '89.99',
          flightInfo: 'Delivered May-25',
          shippingInfo: 'Successfully delivered to your home',
          flagIcon: <Text style={{fontSize: 18}}>🇺🇸</Text>,
          showRequestCredit: true,
          requestDeadline: 'May-31 12:00 AM',
        }));

      case 'Journey Mishap':
        const plantStatuses = ['Damaged', 'Missing', 'Dead on Arrival'];
        return Array.from({length: 6}).map((_, i) => ({
          id: i + 200,
          status: 'Journey Mission',
          image: require('../../../assets/images/plant1.png'),
          name: 'Philodendron Brasil',
          subtitle: 'Trailing • 6"',
          price: '45.50',
          flightInfo: 'In Transit - May-28',
          shippingInfo: 'FedEx Ground - Expected delivery June-2',
          flagIcon: <Text style={{fontSize: 18}}>🇧🇷</Text>,
          plantStatus: plantStatuses[i % plantStatuses.length],
          creditApproved: i % 3 === 0, // Show credit approved for every 3rd item
        }));

      default:
        return [];
    }
  };

  const orderItems = getOrderItems(activeTab);

  return (
    <>
      <OrdersHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        contentContainerStyle={{paddingHorizontal: 1}}>
        {orderItems.map(item => (
          <OrderItemCard key={item.id} {...item} />
        ))}
        
        {/* Browse More Plants Component */}
        <BrowseMorePlants 
          title="Discover More Plants to Order"
          initialLimit={6}
          loadMoreLimit={6}
          showLoadMore={true}
          containerStyle={{marginTop: 24, paddingHorizontal: 15}}
        />
      </ScrollView>
    </>
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
  },
  header: {
    width: '100%',
    height: 168,
    minHeight: 168,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
    width: '100%',
    height: 58,
  },
  searchContainer: {
    flex: 1,
    height: 40,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  profileContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 1000,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 50,
    backgroundColor: '#E7522F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartCard: {
    backgroundColor: '#F5F6F6',
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cartTopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cartImageContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    width: 96,
    height: 128,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,

    borderRadius: 10,
    padding: 2,
    zIndex: 2,
  },
  cartName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  cartSubtitle: {
    color: '#647276',
    fontSize: 14,
    marginVertical: 2,
  },
  cartPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 2,
  },
  cartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  cartFooterText: {
    color: '#647276',
    fontWeight: 'bold',
  },
  tabContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    paddingVertical: 2,
    paddingBottom: 1,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F8D91',
    fontFamily: 'Inter',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#202325',
    fontFamily: 'Inter',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '100%',
    backgroundColor: '#202325',
  },
  dropdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202325',
    fontFamily: 'Inter',
  },
  dropdownArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 12,
    color: '#647276',
  },
});
export default ScreenOrders;
