import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import {ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {searchPlantsApi} from '../../../components/Api/listingBrowseApi';
import NetInfo from '@react-native-community/netinfo';

// Import the separate screen components
import ScreenReadyToFly from './ScreenReadyToFly';
import ScreenPlantsAreHome from './ScreenPlantsAreHome';
import ScreenJourneyMishap from './ScreenJourneyMishap';

// Header height constant for safe area calculations
const HEADER_HEIGHT = 140;

const OrdersHeader = ({activeTab, setActiveTab}) => {
  const insets = useSafeAreaInsets();
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigation = useNavigation();
  // Local require for reusable Avatar component
  const Avatar = require('../../../components/Avatar/Avatar').default;

  // Debounced search effect - triggers after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        console.log('🔍 Orders search triggered for:', searchTerm);
        performSearch(searchTerm.trim());
      } else if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        setLoadingSearch(false);
      }
    }, 800); // 800ms delay for "finished typing" detection

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('🔍 Starting orders search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 4,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search plants.');
      }

      const plants = res.data?.plants || [];
      console.log(`✅ Orders search completed: found ${plants.length} plants for "${searchTerm}"`);
      console.log('📋 First plant data:', plants[0]); // Debug plant structure
      setSearchResults(plants);
      
    } catch (error) {
      console.error('❌ Error performing orders search:', error);
      setSearchResults([]);
      
      Alert.alert(
        'Search Error',
        'Could not search for plants. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };

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
    <View style={[styles.stickyHeader, {paddingTop: insets.top + 12}]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plant, invoice #, buddy"
                placeholderTextColor="#647276"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Close search results when input loses focus
                  setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 150); // Small delay to allow for result tap
                }}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // Wishlist feature temporarily disabled
              console.log('Wishlist feature is temporarily disabled');
            }}>
            <Wishicon width={40} height={40} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenProfile')}>
            <Avatar size={40} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results */}
      {isSearchFocused && searchTerm.trim().length >= 2 && (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching plants...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.map((plant, index) => (
                <TouchableOpacity
                  key={`${plant.id}_${index}`}
                  style={styles.searchResultItem}
                  onPress={() => {
                    if (plant.plantCode) {
                      navigation.navigate('ScreenPlantDetail', {
                        plantCode: plant.plantCode
                      });
                    } else {
                      console.error('❌ Missing plantCode for plant:', plant);
                      Alert.alert('Error', 'Unable to view plant details. Missing plant code.');
                    }
                  }}
                >
                  <Text style={styles.searchResultName} numberOfLines={2}>
                    {plant.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No plants found for "{searchTerm}"
              </Text>
            </View>
          )}
        </View>
      )}

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
        style={{flexGrow: 0, paddingVertical: 8}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          paddingHorizontal: 10,
        }}>
        {filterOptions.map((option, idx) => (
          <View
            key={option.label}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#CDD3D4',
              paddingHorizontal: 12,
              paddingVertical: 8,
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
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Ready to Fly');

  // Pass through route params to child screens for refresh functionality
  const getChildScreenProps = () => ({
    route: {
      params: route.params
    }
  });

  const renderActiveScreen = () => {
    const childProps = getChildScreenProps();
    
    switch (activeTab) {
      case 'Ready to Fly':
        return <ScreenReadyToFly {...childProps} />;
      case 'Plants are Home':
        return <ScreenPlantsAreHome {...childProps} />;
      case 'Journey Mishap':
        return <ScreenJourneyMishap {...childProps} />;
      default:
        return <ScreenReadyToFly {...childProps} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: HEADER_HEIGHT }]}>
      <OrdersHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Content area with dynamic screen based on active tab */}
      <View style={[styles.contentContainer]}>
        {renderActiveScreen()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: 1000,
  },
  contentContainer: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Lower than search results
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 209,
    height: 40,
    flex: 1,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 40,
    flex: 0,
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
  },
  searchInput: {
    width: 145,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
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
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 52,
    left: 13,
    right: 53,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    opacity: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  searchResultsList: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#FFFFFF',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Inter',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
});
export default ScreenOrders;
