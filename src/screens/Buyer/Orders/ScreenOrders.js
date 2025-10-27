import React from 'react';
import {View, Text, StyleSheet, Modal, TouchableWithoutFeedback} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState, useEffect, useContext} from 'react';
import {ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import CloseIcon from '../../../assets/icons/greylight/x-regular.svg';
import {searchBuyersApi} from '../../../components/Api/searchBuyersApi';
import {useAuth} from '../../../auth/AuthProvider';
import NetInfo from '@react-native-community/netinfo';

// Import the separate screen components
import ScreenReadyToFly from './ScreenReadyToFly';
import ScreenPlantsAreHome from './ScreenPlantsAreHome';
import ScreenJourneyMishap from './ScreenJourneyMishap';
import ScreenPayToBoard from './ScreenPayToBoard';

// Header height constant for safe area calculations
const HEADER_HEIGHT = 140;

const OrdersHeader = ({activeTab, setActiveTab}) => {
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  // Plant Owner dropdown state
  const [plantOwnerModalVisible, setPlantOwnerModalVisible] = useState(false);
  const [selectedPlantOwner, setSelectedPlantOwner] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigation = useNavigation();
  // Local require for reusable Avatar component
  const Avatar = require('../../../components/Avatar/Avatar').default;

  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    plantOwner: null
  });

  // Initialize selectedPlantOwner with buyer's first name
  useEffect(() => {
    if (user?.firstName) {
      setSelectedPlantOwner({
        id: user.id || user.uid,
        name: user.firstName,
        firstName: user.firstName,
        username: user.username
      });
    }
  }, [user]);

  // Plant Owner options (for now, just the current buyer)
  const plantOwnerOptions = user?.firstName ? [{
    id: user.id || user.uid,
    name: user.firstName,
    firstName: user.firstName,
    username: user.username
  }] : [];

  // Check if a filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Plant Owner':
        return activeFilters.plantOwner !== null;
      default:
        return false;
    }
  };

  // Reset specific filter
  const handleResetFilter = (filterLabel) => {
    switch (filterLabel) {
      case 'Plant Owner':
        setActiveFilters(prev => ({ ...prev, plantOwner: null }));
        setSelectedPlantOwner(null);
        break;
      default:
        break;
    }
  };

  const handlePlantOwnerSelect = (owner) => {
    setSelectedPlantOwner(owner);
    setActiveFilters(prev => ({ ...prev, plantOwner: owner }));
    setPlantOwnerModalVisible(false);
  };

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
      console.log('🔍 Starting buyer search for:', searchTerm);

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const searchParams = {
        query: searchTerm,
        limit: 4,
        offset: 0
      };

      const res = await searchBuyersApi(searchParams);

      if (!res?.success) {
        throw new Error(res?.error || 'Failed to search buyers.');
      }

      const buyers = res.data?.buyers || [];
      console.log(`✅ Buyer search completed: found ${buyers.length} buyers for "${searchTerm}"`);
      console.log('📋 First buyer data:', buyers[0]); // Debug buyer structure
      setSearchResults(buyers);
      
    } catch (error) {
      console.error('❌ Error performing buyer search:', error);
      setSearchResults([]);
      
      Alert.alert(
        'Search Error',
        'Could not search for buyers. Please check your connection and try again.',
        [{text: 'OK'}]
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  const tabFilters = [
    {filterKey: 'Pay to Board'},
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
        <View style={[styles.searchResultsContainer, {top: insets.top + 52}]}>
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching buyers...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.map((buyer, index) => (
                <TouchableOpacity
                  key={`${buyer.id}_${index}`}
                  style={styles.searchResultItem}
                  onPress={() => {
                    // Set the selected buyer as the plant owner filter
                    const buyerData = {
                      id: buyer.id,
                      name: buyer.firstName,
                      firstName: buyer.firstName,
                      username: buyer.username
                    };
                    handlePlantOwnerSelect(buyerData);
                    setSearchTerm(''); // Clear search term
                    setIsSearchFocused(false); // Hide search results
                  }}
                >
                  <View style={styles.buyerSearchResult}>
                    <View style={styles.buyerInfo}>
                      <Text style={styles.buyerName} numberOfLines={1}>
                        {buyer.firstName} {buyer.lastName}
                      </Text>
                      <Text style={styles.buyerUsername} numberOfLines={1}>
                        @{buyer.username}
                      </Text>
                    </View>
                    <View style={styles.buyerAvatar}>
                      <Text style={styles.avatarText}>
                        {buyer.firstName?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No buyers found for "{searchTerm}"
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
        style={{flexGrow: 0}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: 12,
        }}>
        {filterOptions.map((option, idx) => {
          const isActive = isFilterActive(option.label);
          
          return (
            <TouchableOpacity
              key={option.label}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isActive ? '#539461' : '#CDD3D4',
                backgroundColor: isActive ? '#F2F7F3' : '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => {
                if (option.label === 'Plant Owner') {
                  // If filter is active and clicked again, reset it
                  if (isActive) {
                    handleResetFilter(option.label);
                  } else {
                    setPlantOwnerModalVisible(true);
                  }
                }
              }}
              activeOpacity={0.7}>
              {option.leftIcon && (
                <option.leftIcon
                  width={20}
                  height={20}
                  style={{marginRight: 4}}
                />
              )}
              <Text style={{
                fontSize: 16, 
                fontWeight: isActive ? '700' : '600', 
                color: isActive ? '#539461' : '#202325'
              }}>
                {option.label === 'Plant Owner' && selectedPlantOwner 
                  ? selectedPlantOwner.name 
                  : option.label}
              </Text>
              {option.rightIcon && (
                <option.rightIcon
                  width={20}
                  height={20}
                  style={{
                    marginLeft: 4,
                    color: isActive ? '#539461' : '#202325'
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Plant Owner Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={plantOwnerModalVisible}
        onRequestClose={() => setPlantOwnerModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPlantOwnerModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.plantOwnerModal}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Plant Owner</Text>
                  <TouchableOpacity
                    onPress={() => setPlantOwnerModalVisible(false)}
                    style={styles.closeButton}>
                    <CloseIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.modalContent}>
                  {/* Reset Option */}
                  <TouchableOpacity
                    style={[
                      styles.ownerItem,
                      !selectedPlantOwner && styles.selectedOwnerItem
                    ]}
                    onPress={() => {
                      setSelectedPlantOwner(null);
                      setActiveFilters(prev => ({ ...prev, plantOwner: null }));
                      setPlantOwnerModalVisible(false);
                    }}>
                    <View style={styles.ownerInfo}>
                      <Text style={styles.ownerName}>All Plant Owners</Text>
                      <Text style={styles.ownerUsername}>Show all orders</Text>
                    </View>
                    {!selectedPlantOwner && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Plant Owner Options */}
                  {plantOwnerOptions.map((owner, index) => (
                    <TouchableOpacity
                      key={owner.id}
                      style={[
                        styles.ownerItem,
                        selectedPlantOwner?.id === owner.id && styles.selectedOwnerItem
                      ]}
                      onPress={() => handlePlantOwnerSelect(owner)}>
                      <View style={styles.ownerInfo}>
                        <Text style={styles.ownerName}>{owner.firstName}</Text>
                        <Text style={styles.ownerUsername}>@{owner.username}</Text>
                      </View>
                      {selectedPlantOwner?.id === owner.id && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
      case 'Pay to Board':
        return <ScreenPayToBoard {...childProps} />;
      case 'Plants are Home':
        return <ScreenPlantsAreHome {...childProps} />;
      case 'Journey Mishap':
        return <ScreenJourneyMishap {...childProps} />;
      default:
        return <ScreenPayToBoard {...childProps} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
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
    marginTop: 100,
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
    left: 13,
    right: 53,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, // Thicker border for better definition
    borderColor: '#d1d5db', // Slightly darker border
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
  // Buyer Search Result Styles
  buyerSearchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  buyerUsername: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter',
  },
  buyerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  // Plant Owner Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  plantOwnerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  ownerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedOwnerItem: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#539461',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  ownerUsername: {
    fontSize: 14,
    color: '#647276',
    fontFamily: 'Inter',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
export default ScreenOrders;
