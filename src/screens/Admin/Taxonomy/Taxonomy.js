import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/iconnav/search.svg';
import FilterIcon from '../../../assets/admin-icons/plus.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import ThreeDotsIcon from '../../../assets/admin-icons/three-dots.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';

// Import API
import { getAdminTaxonomyApi } from '../../../components/Api';
import { getGenusListApi } from '../../../components/Api';
import { getGenusRequestsApi } from '../../../auth/getGenusRequestsApi';
import EditTaxonomyModal from './EditTaxonomyModal';
import TaxonomySkeletonList from './TaxonomySkeletonList';
import TaxonomyOptionsModal from './TaxonomyOptionsModal';
import RequestActionModal from './RequestActionModal';

// No more mock data - using only real API data

const FILTER_OPTIONS = [
  { id: 1, label: 'Accuminata' },
  { id: 2, label: 'Shipping Index' },
  { id: 3, label: 'Acclimation Index' },
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
              placeholder="Search genus..."
              placeholderTextColor="#647276"
              value={searchQuery}
              onChangeText={onSearchChange}
            />
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

const TaxonomyCard = ({ item, onEdit }) => {
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
};

const TaxonomyRequestCard = ({ item, onAction }) => {
  // Add null checks to prevent crashes
  if (!item) {
    return null;
  }

  const user = item.user || {};
  const genusName = item.genusName || 'Unknown Genus';
  const speciesName = item.species || 'Unknown Species';
  const userName = user.name || 'Unknown User';
  const username = user.username || '@unknown';
  const userRole = user.role || 'User';
  
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
                <Text style={styles.requestUserName}>{userName}</Text>
                <Text style={styles.requestUsername}>{username}</Text>
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
};

const Taxonomy = () => {
  console.log('🌿 Taxonomy component rendered');
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomyData, setTaxonomyData] = useState([]);
  const [requestsData, setRequestsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('genus');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
    setFilteredData([]);
    
    // Fetch fresh data
    fetchAllData(true);
  }, []);

  useEffect(() => {
    console.log('🌿 useEffect: Filter data triggered');
    filterData();
  }, [searchQuery, activeTab, taxonomyData, requestsData]);

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
    
    try {
      // Call the requests API
      console.log('🌿 Calling getGenusRequestsApi...');
      const response = await getGenusRequestsApi({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Enhanced logging to debug the response
      console.log('🔍 Raw response type:', typeof response);
      console.log('🔍 Response success:', response?.success);
      console.log('🔍 Response data length:', response?.data?.length);
      console.log('🔍 Response structure (first 2 items):', JSON.stringify(response?.data?.slice(0, 2), null, 2));
      
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
          fullResponse: response
        });
        
        // Set empty array instead of any mock data
        console.log('🚫 Setting empty requests data due to API error');
        setRequestsData([]);
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchRequestsData:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Always set empty array on error - no mock data fallback
      console.log('🚫 Setting empty requests data due to error');
      setRequestsData([]);
      throw error;
    }
  };

  const fetchTaxonomyData = async (showLoading = true) => {
    // Redirect to fetchAllData for backward compatibility
    return fetchAllData(showLoading);
  };

  const filterData = () => {
    console.log('🌿 filterData called, searchQuery:', searchQuery, 'activeTab:', activeTab);
    try {
      const sourceData = activeTab === 'genus' ? taxonomyData : requestsData;
      console.log('🌿 sourceData length:', sourceData?.length);
      console.log('🌿 sourceData type:', Array.isArray(sourceData) ? 'array' : typeof sourceData);
      
      if (activeTab === 'requests' && sourceData?.length > 0) {
        console.log('🌿 First request item:', JSON.stringify(sourceData[0], null, 2));
      }
      
      if (!searchQuery || !searchQuery.trim()) {
        console.log('🌿 No search query, setting all sourceData');
        setFilteredData(sourceData || []);
      } else {
        const filtered = (sourceData || []).filter(item => {
          if (!item) return false;
          const searchField = activeTab === 'genus' ? (item.name || '') : (item.genusName || '');
          return searchField.toLowerCase().includes(searchQuery.toLowerCase());
        });
        console.log('🌿 Filtered data length:', filtered.length);
        setFilteredData(filtered);
      }
    } catch (error) {
      console.error('🌿 Error in filterData:', error);
      setFilteredData([]);
    }
  };

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
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handlePlusButtonPress = () => {
    setOptionsModalVisible(true);
  };

  const handleNewPlantTaxonomy = () => {
    setOptionsModalVisible(false);
    // Navigate to new plant taxonomy form
    console.log('🌿 Navigate to new plant taxonomy form');
    navigation.navigate('AddTaxonomy');
  };

  const handleImportTaxonomy = () => {
    setOptionsModalVisible(false);
    // Navigate to import taxonomy functionality
    console.log('🌿 Navigate to import taxonomy');
  };

  const renderTaxonomyCard = ({ item }) => (
    <TaxonomyCard item={item} onEdit={handleEditGenus} />
  );

  const renderRequestCard = ({ item }) => (
    <TaxonomyRequestCard item={item} onAction={handleRequestAction} />
  );

  const renderHeader = () => (
    <View style={styles.countContainer}>
      <Text style={styles.countText}>
        {activeTab === 'genus' 
          ? `${filteredData.length} ${filteredData.length === 1 ? 'genus' : 'genera'} found`
          : `${filteredData.length} ${filteredData.length === 1 ? 'request' : 'requests'} found`
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <TaxonomyHeader 
          insets={insets} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
          onTabChange={setActiveTab}
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
        onTabChange={setActiveTab}
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
                <TouchableOpacity key={filter.id} style={styles.filterButton}>
                  <View style={styles.filterButtonText}>
                    <Text style={styles.filterText}>{filter.label}</Text>
                  </View>
                  <DownIcon width={16} height={16} style={styles.filterIcon} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Count - Only show for Genus List */}
        {activeTab === 'genus' && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {`${filteredData?.length || 0} genus`}
            </Text>
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
          {loading ? (
            <TaxonomySkeletonList />
          ) : (
            <FlatList
              data={filteredData || []}
              keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                activeTab === 'genus' ? (
                  <TaxonomyCard item={item} onEdit={handleEditGenus} />
                ) : (
                  <TaxonomyRequestCard item={item} onAction={handleRequestAction} />
                )
              )}
              ItemSeparatorComponent={() => activeTab === 'genus' ? <View style={{ height: 8 }} /> : <View style={{ height: 6 }} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: totalBottomPadding,
                ...(activeTab === 'genus' ? {
                  paddingHorizontal: 12,
                  paddingTop: 8,
                } : {
                  paddingHorizontal: 0,
                  paddingTop: 0,
                })
              }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          )}
        </View>
      </View>

      <EditTaxonomyModal 
        visible={modalVisible}
        item={selectedItem}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveEdit}
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
});

export default Taxonomy;
