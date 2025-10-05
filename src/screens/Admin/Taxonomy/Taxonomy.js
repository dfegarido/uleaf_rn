import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  FlatList,
  StatusBar,
  RefreshControl,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import eventBus from '../../../utils/eventBus';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/iconnav/search.svg';
import FilterIcon from '../../../assets/admin-icons/plus.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import ThreeDotsIcon from '../../../assets/admin-icons/three-dots.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';

// Import API
import { getGenusListApi } from '../../../components/Api';
import { getGenusRequestsApi } from '../../../auth/getGenusRequestsApi';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import EditTaxonomyModal from './EditTaxonomyModal';
import TaxonomySkeletonList from './TaxonomySkeletonList';
import TaxonomyOptionsModal from './TaxonomyOptionsModal';
import RequestActionModal from './RequestActionModal';

// No more mock data - using only real API data

const FILTER_OPTIONS = [
  { 
    id: 1, 
    label: 'Acuminata',
    type: 'dropdown',
    values: ['All', 'Yes', 'No']
  },
  { 
    id: 2, 
    label: 'Shipping Index',
    type: 'dropdown', 
    values: ['All', '1-2', '3-4', '5-6', '7-8', '9-10']
  },
  { 
    id: 3, 
    label: 'Acclimation Index',
    type: 'dropdown',
    values: ['All', '1-2', '3-4', '5-6', '7-8', '9-10']
  },
];

const TaxonomyHeader = ({ insets, searchQuery, onSearchChange, activeTab, onTabChange, onPlusPress, requestsData = [] }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 24 }]}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Top Row - Search Controls */}
      <View style={[
        styles.topRow,
        activeTab === 'requests' && { paddingRight: 0 } // Remove right padding when expanded
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={[
          styles.searchContainerWrapper,
          activeTab === 'requests' && styles.searchContainerWrapperExpanded
        ]}>
          <View style={styles.searchContainer}>
            <SearchIcon width={20} height={20} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'genus' ? "Search genus..." : "Search requests..."}
              placeholderTextColor="#647276"
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => onSearchChange('')}
                style={styles.clearSearchButton}
              >
                <Text style={styles.clearSearchText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {activeTab === 'genus' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={onPlusPress}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsContent}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'genus' && styles.activeTab]}
            onPress={() => onTabChange('genus')}
          >
            <View style={styles.tabContentWrapper}>
              <View style={styles.tabTitle}>
                <Text style={[styles.tabText, activeTab === 'genus' && styles.activeTabText]}>
                  Genus List
                </Text>
              </View>
            </View>
            {activeTab === 'genus' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => onTabChange('requests')}
          >
            <View style={styles.tabContentWrapper}>
              <View style={styles.tabTitle}>
                <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                  Requests
                </Text>
              </View>
                            {requestsData.length > 0 && (
                <View style={styles.requestsBadge}>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{requestsData.length}</Text>
                  </View>
                </View>
              )}
            </View>
            {activeTab === 'requests' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TaxonomyCard = React.memo(({ item, onEdit }) => {
  // Add null checks to prevent crashes
  if (!item) {
    return null;
  }

  const genusName = item.name || 'Unknown Genus';
  const receivedPlants = item.receivedPlants || 0;

  return (
    <View style={styles.taxonomyCard}>
      <View style={styles.cardContent}>
        <View style={styles.nameSection}>
          <Text style={styles.genusName}>{genusName.toUpperCase()}</Text>
        </View>
        <View style={styles.receivedPlantsSection}>
          <Text style={styles.receivedPlantsLabel}>Specie Count</Text>
          <Text style={styles.receivedPlantsNumber}>{receivedPlants}</Text>
        </View>
      </View>
      <View style={styles.actionSection}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.editAction}>
          <EditIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const TaxonomyRequestCard = React.memo(({ item, onAction }) => {
  // Add null checks to prevent crashes
  if (!item) {
    return null;
  }

  // Don't render if essential data is missing - this prevents showing "Unknown" data
  if (!item.genusName && !item.species && !item.user) {
    return null;
  }

  const user = item.user || {};
  const genusName = item.genusName || '';
  const speciesName = item.species || '';
  const userName = user.name || '';
  const gardenName = user.gardenName || '';
  const userRole = user.role || '';
  
  // Don't render if all essential fields are empty
  if (!genusName && !speciesName && !userName) {
    return null;
  }
  
  // Handle avatar with fallback to default image
  const avatarSource = user.avatar ? { uri: user.avatar } : require('../../../assets/images/AvatarBig.png');

  return (
    <View style={styles.requestListItem}>
      {/* Taxonomy Card */}
      <View style={styles.requestTaxonomyCard}>
        <View style={styles.requestCardContent}>
          <View style={styles.requestNameSection}>
            <Text style={styles.requestGenusName}>{genusName}</Text>
          </View>
          <View style={styles.requestVariegationSection}>
            <Text style={styles.requestVariegationText}>
              {speciesName}
            </Text>
          </View>
        </View>
        <View style={styles.requestActionSection}>
          <TouchableOpacity onPress={() => onAction(item)} style={styles.requestOptionButton}>
            <ThreeDotsIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Details */}
      <View style={styles.requestDetails}>
        <View style={styles.requestUserContainer}>
          <View style={styles.requestUserInfo}>
            <View style={styles.requestAvatar}>
              <Image 
                source={avatarSource} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.requestUserContent}>
              <View style={styles.requestUserNameRow}>
                <Text style={styles.requestUserName}>{gardenName}</Text>
              </View>
              <View style={styles.requestUserRoleRow}>
                <Text style={styles.requestRoleLabel}>{userRole}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

// Filter Modal Component
const FilterModal = ({ visible, onClose, filterType, onSelect, activeFilters }) => {
  if (!filterType) return null;
  
  // Get the current value of this filter
  const getCurrentFilterValue = () => {
    if (filterType.label === 'Acuminata') return activeFilters.accuminata;
    if (filterType.label === 'Shipping Index') return activeFilters.shippingIndex;
    if (filterType.label === 'Acclimation Index') return activeFilters.acclimationIndex;
    return 'All';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.filterModalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.filterModalContent}>
              <Text style={styles.filterModalTitle}>{filterType.label}</Text>
              
              <ScrollView style={styles.filterOptionsContainer}>
                {filterType.values?.map((value, index) => {
                  const isSelected = value === getCurrentFilterValue();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterOption,
                        isSelected && styles.filterOptionSelected
                      ]}
                      onPress={() => onSelect(filterType, value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected
                      ]}>
                        {value}
                      </Text>
                      {isSelected && (
                        <View style={styles.filterOptionCheckmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <TouchableOpacity
                style={styles.filterCancelButton}
                onPress={onClose}
              >
                <Text style={styles.filterCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const Taxonomy = () => {
  console.log('🌿 Taxonomy component rendered');
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomyData, setTaxonomyData] = useState([]);
  const [requestsData, setRequestsData] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  // derived filtered data below via useMemo
  const [loading, setLoading] = useState(true); // Start with loading true
  const [requestsLoading, setRequestsLoading] = useState(false); // Separate loading for requests
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('genus');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    accuminata: 'All',
    shippingIndex: 'All',
    acclimationIndex: 'All'
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [requestActionModalVisible, setRequestActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60;
  const safeBottomPadding = Math.max(insets.bottom, 16);
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 20;

  useEffect(() => {
    // Fetch real data on component mount
    console.log('🌿 useEffect: Fetching all data on mount');
    console.log('🌿 Component mounted - forcing fresh API call');
    
    // Clear any existing data first
    setRequestsData([]);
    setTaxonomyData([]);
    
    // Fetch fresh data
    fetchAllData(true);
  }, []);

  // Debounce the search input (200ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Listen for species deletion events to adjust counts immediately
  useEffect(() => {
    const unsubscribe = eventBus.on('speciesDeleted', ({ genusId, genusName, delta }) => {
      if (!genusId && !genusName) return;
      setTaxonomyData(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(item => {
          const match = (genusId && item.id === genusId) || (genusName && item.name === genusName);
          if (!match) return item;
          const current = Number(item.receivedPlants || 0);
          return { ...item, receivedPlants: Math.max(0, current + Number(delta || 0)) };
        });
      });
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Listen for genus list updates (e.g., after genus deletion)
  useEffect(() => {
    const unsubscribe = eventBus.on('genusListUpdate', () => {
      console.log('🔄 Genus list update event received - refreshing data');
      fetchGenusData();
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Refresh genus list when returning to this screen (after edits)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Taxonomy screen focused: refreshing genus list');
      fetchGenusData();
    });
    return unsubscribe;
  }, [navigation]);

  // Memoized filtered data (replaces state + effect)
  const filteredData = useMemo(() => {
    try {
      const sourceData = activeTab === 'genus' ? taxonomyData : requestsData;
      let filtered = Array.isArray(sourceData) ? sourceData : [];

      // Apply search query filter
      const term = debouncedQuery.trim().toLowerCase();
      if (term) {
        filtered = filtered.filter(item => {
          if (!item) return false;
          if (activeTab === 'genus') {
            const genusName = (item.name || '').toLowerCase();
            const genusNameAlt = (item.genusName || '').toLowerCase();
            const source = (item.source || '').toLowerCase();
            return genusName.includes(term) || genusNameAlt.includes(term) || source.includes(term);
          } else {
            const genusName = (item.genusName || '').toLowerCase();
            const species = (item.species || '').toLowerCase();
            const userName = (item.user?.name || '').toLowerCase();
            const username = (item.user?.username || '').toLowerCase();
            const userRole = (item.user?.role || '').toLowerCase();
            return (
              genusName.includes(term) ||
              species.includes(term) ||
              userName.includes(term) ||
              username.includes(term) ||
              userRole.includes(term)
            );
          }
        });
      }

      // Apply additional filters for genus tab
      if (activeTab === 'genus') {
        // Acuminata filter
        if (activeFilters.accuminata !== 'All') {
          filtered = filtered.filter(item => {
            const genusName = item.name?.toLowerCase() || '';
            const hasAcuminata =
              genusName.includes('accuminata') || // spellings across sources
              genusName === 'musa' ||
              genusName === 'banana';
            return activeFilters.accuminata === 'Yes' ? hasAcuminata : !hasAcuminata;
          });
        }

        // Shipping Index filter
        if (activeFilters.shippingIndex !== 'All') {
          filtered = filtered.filter(item => {
            const speciesCount = item.receivedPlants || 0;
            const source = item.source || '';
            let shippingValue;
            if (source.includes('plant_catalog')) {
              if (speciesCount <= 2) shippingValue = '9-10';
              else if (speciesCount <= 5) shippingValue = '7-8';
              else if (speciesCount <= 10) shippingValue = '5-6';
              else if (speciesCount <= 20) shippingValue = '3-4';
              else shippingValue = '1-2';
            } else {
              if (speciesCount <= 1) shippingValue = '9-10';
              else if (speciesCount <= 3) shippingValue = '7-8';
              else if (speciesCount <= 7) shippingValue = '5-6';
              else if (speciesCount <= 15) shippingValue = '3-4';
              else shippingValue = '1-2';
            }
            return shippingValue === activeFilters.shippingIndex;
          });
        }

        // Acclimation Index filter
        if (activeFilters.acclimationIndex !== 'All') {
          filtered = filtered.filter(item => {
            const genusName = item.name || '';
            const speciesCount = item.receivedPlants || 0;
            const source = item.source || '';
            let acclimationScore = 0;
            acclimationScore += Math.min(5, Math.floor(speciesCount / 3));
            if (genusName.length <= 7) acclimationScore += 3;
            else if (genusName.length <= 10) acclimationScore += 1;
            const easyGenera = [
              'monstera',
              'philodendron',
              'pothos',
              'epipremnum',
              'dracaena',
              'sansevieria',
              'zamioculcas',
              'ficus',
              'calathea',
              'alocasia',
            ];
            if (easyGenera.includes(genusName.toLowerCase())) {
              acclimationScore += 4;
            }
            if (source.includes('plant_catalog')) {
              acclimationScore += 2;
            }
            let acclimationValue;
            if (acclimationScore >= 8) acclimationValue = '1-2';
            else if (acclimationScore >= 6) acclimationValue = '3-4';
            else if (acclimationScore >= 4) acclimationValue = '5-6';
            else if (acclimationScore >= 2) acclimationValue = '7-8';
            else acclimationValue = '9-10';
            return acclimationValue === activeFilters.acclimationIndex;
          });
        }
      }

      return filtered;
    } catch (e) {
      console.error('🌿 Error deriving filteredData:', e);
      return [];
    }
  }, [activeTab, taxonomyData, requestsData, debouncedQuery, activeFilters]);

  const fetchAllData = async (showLoading = true) => {
    console.log('🌿 fetchAllData called, showLoading:', showLoading);
    console.log('🌿 Current requestsData length:', requestsData.length);
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // Fetch both genus data and requests data in parallel
      const [genusResult, requestsResult] = await Promise.allSettled([
        fetchGenusData(),
        fetchRequestsData()
      ]);
      
      // Log results
      if (genusResult.status === 'fulfilled') {
        console.log('✅ Genus data fetch completed successfully');
        console.log('✅ Genus data length:', genusResult.value?.length || 0);
      } else {
        console.error('❌ Genus data fetch failed:', genusResult.reason);
      }
      
      if (requestsResult.status === 'fulfilled') {
        console.log('✅ Requests data fetch completed successfully');
        console.log('✅ Requests data length:', requestsResult.value?.length || 0);
        console.log('✅ First request sample:', requestsResult.value?.[0]);
      } else {
        console.error('❌ Requests data fetch failed:', requestsResult.reason);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchAllData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      
      // Log final state
      console.log('🔍 Final requestsData state will be updated in next render');
    }
  };

  const fetchGenusData = async () => {
    console.log('🌿 fetchGenusData called');
    
    try {
      setApiError(null); // Clear any previous errors
      
      // Call the real API for genus list
      console.log('🌿 Calling getGenusListApi...');
      const response = await getGenusListApi();
      
      if (response && response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Successfully fetched genus data:', response.data.length, 'items');
        console.log('✅ Data source:', response.source);
        console.log('✅ Sample data:', response.data.slice(0, 3));
        
        setTaxonomyData(response.data);
        setApiError(null);
        return response.data;
      } else {
        const errorMsg = 'Invalid genus API response format';
        console.error('❌ Genus API response invalid:', {
          hasResponse: !!response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
          isArray: Array.isArray(response?.data),
          dataLength: response?.data?.length
        });
        setApiError(errorMsg);
        setTaxonomyData([]);
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchGenusData:', error.message);
      
      const errorMsg = error.message || 'Failed to fetch genus data';
      setApiError(errorMsg);
      setTaxonomyData([]);
      throw error;
    }
  };

  const fetchRequestsData = async () => {
    console.log('🌿 fetchRequestsData called');
    
    setRequestsLoading(true);
    
    try {
      // Resolve auth token explicitly (pattern used in other scripts)
      let authToken = null;
      try {
        authToken = await getStoredAuthToken();
        console.log('🔑 fetchRequestsData token:', authToken ? 'retrieved' : 'not available');
      } catch (tokenErr) {
        console.warn('⚠️ Failed to retrieve auth token in fetchRequestsData:', tokenErr?.message || tokenErr);
      }

      // Call the requests API with auth - filter for pending (non-approved) requests only
      console.log('🌿 Calling getGenusRequestsApi for pending requests...');
      const response = await getGenusRequestsApi({
        limit: 50,
        status: 'pending', // Only show pending (non-approved) requests
        sortBy: 'createdAt',
        sortOrder: 'desc',
        authToken
      });
      
      // Light logging (trimmed)
      console.log('🔍 Requests response - success:', response?.success, 'len:', response?.data?.length ?? 0);
      
      if (response && response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Successfully fetched requests data:', response.data.length, 'items');
        console.log('✅ Setting real API data to requestsData state');
        
        setRequestsData(response.data);
        return response.data;
      } else {
        const errorMsg = 'Invalid requests API response format';
        console.error('❌ Requests API response invalid:', {
          hasResponse: !!response,
          responseType: typeof response,
          hasSuccess: response?.success,
          successValue: response?.success,
          hasData: !!response?.data,
          dataType: typeof response?.data,
          isArray: Array.isArray(response?.data),
          dataLength: response?.data?.length,
          // fullResponse omitted to reduce log size
        });
        
        // Set empty array instead of any mock data
        console.log('🚫 Setting empty requests data due to API error');
        setRequestsData([]);
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchRequestsData:', error.message);
      
      // Always set empty array on error - no mock data fallback
      console.log('🚫 Setting empty requests data due to error');
      setRequestsData([]);
      throw error;
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchTaxonomyData = async (showLoading = true) => {
    // Redirect to fetchAllData for backward compatibility
    return fetchAllData(showLoading);
  };
  // filterData removed; replaced with useMemo filteredData

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData(false);
  };

  const handleEditGenus = (genus) => {
    console.log('🌿 Edit genus:', genus);
    navigation.navigate('EditTaxonomy', { taxonomyData: genus });
  };

  const handleRequestAction = (request) => {
    console.log('🌿 Handle request action for:', request.genusName);
    setSelectedRequest(request);
    setRequestActionModalVisible(true);
  };

  // Filter handling functions
  const handleFilterPress = (filter) => {
    console.log('🌿 Filter pressed:', filter.label);
    setSelectedFilterType(filter);
    setFilterModalVisible(true);
  };

  const handleFilterSelect = (filterType, value) => {
    console.log('🌿 Filter selected:', filterType.label, '=', value);
    
    const filterKey = filterType.label === 'Acuminata' ? 'accuminata' :
                     filterType.label === 'Shipping Index' ? 'shippingIndex' :
                     filterType.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    if (filterKey) {
      setActiveFilters(prev => ({
        ...prev,
        [filterKey]: value
      }));
    }
    
    setFilterModalVisible(false);
    setSelectedFilterType(null);
  };

  const getFilterDisplayValue = (filter) => {
    const filterKey = filter.label === 'Acuminata' ? 'accuminata' :
                     filter.label === 'Shipping Index' ? 'shippingIndex' :
                     filter.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    if (filterKey && activeFilters[filterKey] !== 'All') {
      return activeFilters[filterKey];
    }
    return filter.label;
  };

  const isFilterActive = (filter) => {
    const filterKey = filter.label === 'Acuminata' ? 'accuminata' :
                     filter.label === 'Shipping Index' ? 'shippingIndex' :
                     filter.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    return filterKey && activeFilters[filterKey] !== 'All';
  };

  const handleApproveRequest = (request) => {
    console.log('✅ Request approved, refreshing data for:', request.genusName);
    // Refresh both requests and genus data after approval
    fetchAllData(false);
  };

  const handleRejectRequest = (request) => {
    console.log('❌ Request rejected, refreshing data for:', request.genusName);
    // Refresh requests data after rejection
    fetchRequestsData();
  };

  const handleSaveEdit = (updatedItem) => {
    console.log('🌿 Save edit:', updatedItem);
    
    // Update the taxonomy data with the edited item
    const updatedData = taxonomyData.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    setTaxonomyData(updatedData);
    
    // Close modal and clear selection
    setModalVisible(false);
    setSelectedItem(null);
    
    // Optionally refresh data from server to ensure consistency
    setTimeout(() => {
      fetchAllData(false);
    }, 500);
  };

  const handlePlusButtonPress = () => {
    setOptionsModalVisible(true);
  };

  const handleTabChange = (newTab) => {
    console.log('🔄 Tab changing from', activeTab, 'to', newTab);
    
    // Clear search when switching tabs for better UX
    if (activeTab !== newTab && searchQuery.trim()) {
      console.log('🧹 Clearing search query when switching tabs');
      setSearchQuery('');
    }
    
    setActiveTab(newTab);
  };

  const handleNewPlantTaxonomy = () => {
    setOptionsModalVisible(false);
    // Navigate to new plant taxonomy form
    console.log('🌿 Navigate to new plant taxonomy form');
    navigation.navigate('AddTaxonomy');
  };

  const handleImportTaxonomy = () => {
    setOptionsModalVisible(false);
    // Navigate to import taxonomy screen
    console.log('🌿 Navigate to import taxonomy');
    navigation.navigate('ImportTaxonomyScreen');
  };

  // Stable key extractor for FlatList
  const keyExtractor = useCallback(
    (item, index) => {
      if (activeTab === 'genus') {
        return item?.id?.toString?.() || (item?.name ? `genus:${item.name}` : `genus:${index}`);
      }
      // requests
      const genus = item?.genusName || 'genus';
      const species = item?.species || 'species';
      return item?.id?.toString?.() || `${genus}|${species}|${index}`;
    },
    [activeTab]
  );

  // Memoized content container style per tab
  const listContentContainerStyle = useMemo(() => {
    return {
      paddingBottom: totalBottomPadding,
      ...(activeTab === 'genus'
        ? { paddingHorizontal: 12, paddingTop: 8 }
        : { paddingHorizontal: 0, paddingTop: 0 }),
    };
  }, [activeTab, totalBottomPadding]);

  const renderItem = useCallback(({ item }) => (
    activeTab === 'genus' ? (
      <TaxonomyCard item={item} onEdit={handleEditGenus} />
    ) : (
      <TaxonomyRequestCard item={item} onAction={handleRequestAction} />
    )
  ), [activeTab, handleEditGenus, handleRequestAction]);

  const renderSeparator = useCallback(() => (
    activeTab === 'genus' ? <View style={{ height: 8 }} /> : <View style={{ height: 6 }} />
  ), [activeTab]);

  // removed unused renderHeader

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <TaxonomyHeader 
          insets={insets} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPlusPress={handlePlusButtonPress}
          requestsData={requestsData}
        />
        <FlatList 
          style={styles.taxonomyList}
          data={Array(8).fill()}
          renderItem={({index}) => <TaxonomySkeletonList key={index} />}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.taxonomyListContent,
            { paddingBottom: totalBottomPadding }
          ]}
        />
      </SafeAreaView>
    );
  }

  // Show error state if there's an API error and no data
  if (apiError && filteredData.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <TaxonomyHeader 
          insets={insets} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPlusPress={handlePlusButtonPress}
          requestsData={requestsData}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorMessage}>{apiError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchAllData(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <TaxonomyHeader 
        insets={insets} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPlusPress={handlePlusButtonPress}
        requestsData={requestsData}
      />
      
      {/* Navigation Area with White Background */}
      <View style={styles.navigationSection}>
        {/* Filter Tabs - Only show for Genus List */}
        {activeTab === 'genus' && (
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {FILTER_OPTIONS.map((filter) => (
                <TouchableOpacity 
                  key={filter.id} 
                  style={[
                    styles.filterButton,
                    isFilterActive(filter) && styles.filterButtonActive
                  ]}
                  onPress={() => handleFilterPress(filter)}
                >
                  <View style={styles.filterButtonText}>
                    <Text style={[
                      styles.filterText,
                      isFilterActive(filter) && styles.filterTextActive
                    ]}>
                      {getFilterDisplayValue(filter)}
                    </Text>
                  </View>
                  <DownIcon 
                    width={16} 
                    height={16} 
                    style={[
                      styles.filterIcon,
                      isFilterActive(filter) && styles.filterIconActive
                    ]} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Count - Only show for Genus List */}
        {activeTab === 'genus' && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {searchQuery.trim() ? (
                `${filteredData?.length || 0} ${filteredData?.length === 1 ? 'genus' : 'genera'} found for "${searchQuery}"`
              ) : (
                `${filteredData?.length || 0} ${filteredData?.length === 1 ? 'genus' : 'genera'}`
              )}
            </Text>
            {/* Show filter indicator if any filters are active */}
            {(activeFilters.accuminata !== 'All' || 
              activeFilters.shippingIndex !== 'All' || 
              activeFilters.acclimationIndex !== 'All') && (
              <View style={styles.activeFiltersIndicator}>
                <Text style={styles.activeFiltersText}>Filtered</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={[
        styles.contentContainer,
        { backgroundColor: activeTab === 'genus' ? '#F5F6F6' : '#FFFFFF' }
      ]}>
        {/* List */}
        <View style={styles.listContainer}>

          {/* List Items */}
          {(loading || (activeTab === 'requests' && requestsLoading)) ? (
            <TaxonomySkeletonList />
          ) : filteredData && filteredData.length === 0 && debouncedQuery.trim() ? (
            // Show empty search results
            <View style={styles.emptySearchContainer}>
              <SearchIcon width={48} height={48} style={styles.emptySearchIcon} />
              <Text style={styles.emptySearchTitle}>No results found</Text>
              <Text style={styles.emptySearchMessage}>
                No {activeTab === 'genus' ? 'genera' : 'requests'} found for "{debouncedQuery}"
              </Text>
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton2}
              >
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredData || []}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ItemSeparatorComponent={renderSeparator}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={listContentContainerStyle}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          )}
        </View>
      </View>

      <EditTaxonomyModal 
        visible={modalVisible}
        taxonomyItem={selectedItem}
        onClose={() => setModalVisible(false)}
        onUpdate={handleSaveEdit}
      />
      
      <TaxonomyOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        onNewPlantTaxonomy={handleNewPlantTaxonomy}
        onImportTaxonomy={handleImportTaxonomy}
      />
      
      <RequestActionModal
        visible={requestActionModalVisible}
        onClose={() => setRequestActionModalVisible(false)}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        request={selectedRequest}
      />
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filterType={selectedFilterType}
        onSelect={handleFilterSelect}
        activeFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 106,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 12,
    gap: 10,
    height: 58,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  searchContainerWrapper: {
    flex: 1,
  },
  searchContainerWrapperExpanded: {
    flex: 1,
    paddingRight: 0, // Remove any padding
    marginRight: 0,  // Extend to the full available width
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    padding: 0,
    height: '100%',
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E4E7E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#647276',
    fontWeight: '400',
    lineHeight: 16,
  },
  // Empty search state styles
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptySearchIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySearchMessage: {
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  clearSearchButton2: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: '#202325',
  },
  plusIcon: {
    fontSize: 24,
    fontWeight: '400',
    color: '#202325',
    lineHeight: 24,
  },
  // Tab styles
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 24,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 24,
    height: 40,
  },
  tab: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    height: 40,
    minHeight: 40,
    width: 140,
    minWidth: 100,
    borderRadius: 1000,
  },
  activeTab: {
    // Active tab styling handled by indicator
  },
  tabContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    height: 24,
    minWidth: 40,
  },
  tabTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: 24,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#647276',
    textAlign: 'center',
    lineHeight: 22,
  },
  activeTabText: {
    fontWeight: '600',
    color: '#202325',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    width: 24,
    height: 24,
    borderRadius: 1000,
  },
  badge: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: 18,
    minWidth: 18,
    height: 18,
    minHeight: 18,
    backgroundColor: '#E7522F',
    borderRadius: 1000,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 17,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    maxHeight: 3,
    backgroundColor: '#202325',
    borderRadius: 1.5,
    width: 140,
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  // Navigation Section (White Background for Filters and Count)
  navigationSection: {
    backgroundColor: '#FFFFFF',
  },

  // Filter styles (Navigation / Filter)
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 0,
    gap: 8,
    width: '100%',
    height: 66,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
    height: 34,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  filterButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
    height: 16,
  },
  filterText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  filterIcon: {
    width: 16,
    height: 16,
  },
  // Content Container - matching Figma specifications
  contentContainer: {
    flex: 1,
    // Background color will be set dynamically based on active tab
  },
  // List Container - matching Figma "List"
  listContainer: {
    flex: 1,
    gap: 6, // Gap between list items for requests
  },
  // List styles
  taxonomyList: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  taxonomyListContent: {
    padding: 0,
  },
  listContent: {
    padding: 0,
    gap: 0,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    gap: 12,
    width: '100%',
    height: 36,
  },
  countText: {
    flex: 1,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20, // 140%
    textAlign: 'right',
    color: '#647276',
  },
  activeFiltersIndicator: {
    backgroundColor: '#699E73',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  // Taxonomy Card (matches Figma "Taxonomy")
  taxonomyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    minHeight: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  // Content (matches Figma "Content")
  cardContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
    minHeight: 50,
    marginRight: 24,
  },
  // Name (matches Figma "Name")
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    minHeight: 24,
    alignSelf: 'stretch',
  },
  genusName: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  // Received Plants (matches Figma "Received Plants")
  receivedPlantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    minHeight: 22,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  receivedPlantsLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  receivedPlantsNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  // Action (matches Figma "Action")
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 24,
    minHeight: 50,
  },
  // Edit (matches Figma "Edit")
  editAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },
  // Request card styles - matching Figma "Admin / Taxonomy List"
  requestListItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    minHeight: 158,
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    alignSelf: 'stretch',
  },
  // Taxonomy section within request - matching Figma "Taxonomy"
  requestTaxonomyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  // Content section - matching Figma "Content"
  requestCardContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    width: 291,
    height: 50,
    flex: 1,
  },
  // Name section - matching Figma "Name"
  requestNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 291,
    height: 24,
    alignSelf: 'stretch',
  },
  requestGenusName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  // Variegation section - matching Figma "Variegation"
  requestVariegationSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: 291,
    height: 22,
    alignSelf: 'stretch',
  },
  requestVariegationText: {
    width: 291,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    flex: 1,
  },
  // Action section - matching Figma "Action"
  requestActionSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 24,
    height: 50,
    alignSelf: 'stretch',
  },
  // Option button - matching Figma "Option"
  requestOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },
  // Details section - matching Figma "Details"
  requestDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    paddingHorizontal: 6,
    gap: 8,
    width: '100%',
    height: 44,
    alignSelf: 'stretch',
  },
  // User container - matching Figma "Basic / User"
  requestUserContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: '100%',
    height: 44,
    borderRadius: 12,
  },
  // User info - matching Figma "User"
  requestUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 44,
    alignSelf: 'stretch',
  },
  // Avatar - matching Figma "Avatar"
  requestAvatar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 1000,
  },
  // Avatar image - matching Figma "avatar"
  avatarImage: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 1000,
    backgroundColor: '#F5F6F6', // Fallback background
  },
  // User content - matching Figma "Content"
  requestUserContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 297,
    height: 44,
    flex: 1,
  },
  // Name row - matching Figma "Name"
  requestUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 297,
    height: 24,
    alignSelf: 'stretch',
  },
  requestUserName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  requestUsername: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    flex: 1,
  },
  // Role row - matching Figma "Role"
  requestUserRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 297,
    height: 20,
    alignSelf: 'stretch',
  },
  requestRoleLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#647276',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#699E73',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#647276',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#647276',
    textAlign: 'center',
  },
  
  // Filter styles
  filterButtonActive: {
    backgroundColor: '#699E73',
    borderColor: '#699E73',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterIconActive: {
    tintColor: '#FFFFFF',
  },
  
  // Filter modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContainer: {
    width: '80%',
    maxWidth: 300,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  filterOptionsContainer: {
    maxHeight: 300,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterOptionText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  filterOptionSelected: {
    backgroundColor: '#F3FFF5',
    borderColor: '#699E73',
    borderWidth: 1,
    borderRadius: 8,
  },
  filterOptionTextSelected: {
    color: '#699E73',
    fontWeight: '600',
  },
  filterOptionCheckmark: {
    position: 'absolute',
    right: 16,
  },
  checkmarkText: {
    fontSize: 16,
    color: '#699E73',
    fontWeight: 'bold',
  },
  filterCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  filterCancelText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default Taxonomy;
