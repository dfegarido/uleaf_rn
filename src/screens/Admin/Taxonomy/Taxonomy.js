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
import { getVariegationApi } from '../../../components/Api/getVariegationApi';
import { getShippingIndexApi, getAcclimationIndexApi } from '../../../components/Api/dropdownApi';
import { getSpeciesFromPlantCatalogApi } from '../../../components/Api/getSpeciesFromPlantCatalogApi';
import EditTaxonomyModal from './EditTaxonomyModal';
import TaxonomySkeletonList from './TaxonomySkeletonList';
import TaxonomyOptionsModal from './TaxonomyOptionsModal';
import RequestActionModal from './RequestActionModal';
import BatchUpdateModal from './BatchUpdateModal';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {CheckBoxGroup} from '../../../components/CheckBox';
import SelectableItemList from '../../../components/SelectableItems/SelectableItems';
import {globalStyles} from '../../../assets/styles/styles';

// No more mock data - using only real API data

const FILTER_OPTIONS = [
  { 
    id: 1, 
    label: 'Variegation',
    type: 'dropdown',
    values: []  // Will be populated from API
  },
  { 
    id: 2, 
    label: 'Shipping Index',
    type: 'dropdown', 
    values: []  // Will be populated from API
  },
  { 
    id: 3, 
    label: 'Acclimation Index',
    type: 'dropdown',
    values: []  // Will be populated from API
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

// Filter Modal Component using buyer-side design
const FilterModal = ({ visible, onClose, filterType, onSelect, activeFilters, filterOptions }) => {
  if (!filterType) return null;

  // Get current selected values for this filter (convert to array for multi-select)
  const getCurrentSelectedValues = () => {
    if (filterType.label === 'Variegation') {
      return Array.isArray(activeFilters.variegation) ? activeFilters.variegation : 
             (activeFilters.variegation && activeFilters.variegation !== 'All') ? [activeFilters.variegation] : [];
    }
    if (filterType.label === 'Shipping Index') {
      return Array.isArray(activeFilters.shippingIndex) ? activeFilters.shippingIndex : 
             (activeFilters.shippingIndex && activeFilters.shippingIndex !== 'All') ? [activeFilters.shippingIndex] : [];
    }
    if (filterType.label === 'Acclimation Index') {
      return Array.isArray(activeFilters.acclimationIndex) ? activeFilters.acclimationIndex : 
             (activeFilters.acclimationIndex && activeFilters.acclimationIndex !== 'All') ? [activeFilters.acclimationIndex] : [];
    }
    return [];
  };

  // Get options for this filter type
  const getFilterOptions = () => {
    console.log('🔍 getFilterOptions called for:', filterType.label);
    console.log('🔍 filterOptions received:', filterOptions);
    
    if (filterType.label === 'Variegation' && filterOptions.variegation) {
      console.log('🔍 Variegation options raw:', filterOptions.variegation);
      const options = filterOptions.variegation
        .filter(opt => opt !== 'Choose the most suitable variegation.')
        .map(opt => ({ label: opt, value: opt }));
      console.log('🔍 Variegation options processed:', options);
      return options;
    }
    if (filterType.label === 'Shipping Index' && filterOptions.shippingIndex) {
      console.log('🔍 Shipping Index options raw:', filterOptions.shippingIndex);
      // Options are already sorted in loadFilterOptions
      const options = filterOptions.shippingIndex.map(opt => ({ label: opt, value: opt }));
      console.log('🔍 Shipping Index options processed:', options);
      return options;
    }
    if (filterType.label === 'Acclimation Index' && filterOptions.acclimationIndex) {
      console.log('🔍 Acclimation Index options raw:', filterOptions.acclimationIndex);
      // Options are already sorted in loadFilterOptions
      const options = filterOptions.acclimationIndex.map(opt => ({ label: opt, value: opt }));
      console.log('🔍 Acclimation Index options processed:', options);
      return options;
    }
    console.log('🔍 No options found, returning empty array');
    return [];
  };

  // Handle selection change for multi-select filters
  const handleSelectionChange = (selectedValues) => {
    // Convert array back to single value or 'All' for our filter system
    const value = selectedValues.length > 0 ? selectedValues : 'All';
    onSelect(filterType, value);
  };

  // Reset selection
  const resetSelection = () => {
    onSelect(filterType, 'All');
  };

  // Handle View button press
  const handleViewPress = () => {
    onClose();
  };

  const renderFilterContent = () => {
    const options = getFilterOptions();
    const selectedValues = getCurrentSelectedValues();

    if (filterType.label === 'Variegation') {
      return (
        <ActionSheet
          visible={visible}
          onClose={onClose}
          heightPercent={'35%'}>
          <View style={styles.sheetTitleContainer}>
            <Text style={styles.sheetTitle}>Variegation</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{marginBottom: 60}}>
            {options.length === 0 ? (
              <Text style={{padding: 20, color: '#7F8D91'}}>
                No options available
              </Text>
            ) : (
              <SelectableItemList
                options={options}
                selectedValues={selectedValues}
                onSelectionChange={handleSelectionChange}
              />
            )}
          </ScrollView>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity onPress={resetSelection} style={{width: '45%'}}>
              <View style={[globalStyles.lightGreenButton]}>
                <Text style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                  Reset
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{width: '45%'}} onPress={handleViewPress}>
              <View style={globalStyles.primaryButton}>
                <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      );
    } else {
      // Shipping Index and Acclimation Index use CheckBoxGroup
      return (
        <ActionSheet
          visible={visible}
          onClose={onClose}
          heightPercent={'35%'}>
          <View style={styles.sheetTitleContainer}>
            <Text style={styles.sheetTitle}>{filterType.label}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{paddingBottom: 95}}>
            {options.length === 0 ? (
              <Text style={{padding: 20, color: '#7F8D91'}}>
                No options available
              </Text>
            ) : (
              <CheckBoxGroup
                options={options}
                selectedValues={selectedValues}
                onChange={handleSelectionChange}
                checkboxPosition="right"
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
                labelStyle={{textAlign: 'left'}}
              />
            )}
          </ScrollView>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity onPress={resetSelection} style={{width: '45%'}}>
              <View style={[globalStyles.lightGreenButton]}>
                <Text style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                  Reset
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{width: '45%'}} onPress={handleViewPress}>
              <View style={globalStyles.primaryButton}>
                <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      );
    }
  };

  return renderFilterContent();
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
  
  // Filter states - support both single values and arrays for multi-select
  const [activeFilters, setActiveFilters] = useState({
    variegation: [],  // Array for multi-select
    shippingIndex: [], // Array for multi-select  
    acclimationIndex: [] // Array for multi-select
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter options from APIs
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [shippingIndexOptions, setShippingIndexOptions] = useState([]);
  const [acclimationIndexOptions, setAcclimationIndexOptions] = useState([]);
  const [selectedFilterType, setSelectedFilterType] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [batchUpdateModalVisible, setBatchUpdateModalVisible] = useState(false);
  const [requestActionModalVisible, setRequestActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [apiError, setApiError] = useState(null);
  
  // Species data for variegation filtering
  const [speciesData, setSpeciesData] = useState([]);
  const [speciesDataLoading, setSpeciesDataLoading] = useState(true);

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

  // Load filter options from APIs
  useEffect(() => {
    loadFilterOptions();
    // Species data is now loaded in fetchAllData, but load it here too as backup
    // in case the component mounts without calling fetchAllData
    loadSpeciesData();
  }, []);

  // Load species data for variegation filtering
  const loadSpeciesData = async () => {
    try {
      setSpeciesDataLoading(true);
      console.log('🌿 Loading species data for variegation filtering...');
      const response = await getSpeciesFromPlantCatalogApi();
      
      if (response?.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Species data loaded:', response.data.length, 'items');
        setSpeciesData(response.data);
        setSpeciesDataLoading(false);
        
        // Log sample species with variegation
        const samplesWithVariegation = response.data
          .filter(s => s.variegation && s.genus)
          .slice(0, 5);
        console.log('🔍 Sample species with variegation:', samplesWithVariegation.map(s => ({
          genus: s.genus,
          name: s.name,
          variegation: s.variegation
        })));
        
        // Log sample species with shipping/acclimation indexes
        const samplesWithIndexes = response.data
          .filter(s => (s.shipping_index || s.shippingIndex || s.acclimation_index || s.acclimationIndex) && s.genus)
          .slice(0, 5);
        console.log('🔍 Sample species with indexes:', samplesWithIndexes.map(s => ({
          genus: s.genus || s.genus_name,
          name: s.name || s.species_name,
          shipping_index: s.shipping_index || s.shippingIndex,
          acclimation_index: s.acclimation_index || s.acclimationIndex,
          allFields: Object.keys(s)
        })));
        
        // Log count of species with shipping/acclimation indexes
        const withShippingIndex = response.data.filter(s => {
          const idx = s.shippingIndex ?? s.shipping_index;
          return idx !== undefined && idx !== null && !isNaN(parseInt(idx));
        }).length;
        const withAcclimationIndex = response.data.filter(s => {
          const idx = s.acclimationIndex ?? s.acclimation_index;
          return idx !== undefined && idx !== null && !isNaN(parseInt(idx));
        }).length;
        console.log(`📊 Species with shipping index: ${withShippingIndex}/${response.data.length}`);
        console.log(`📊 Species with acclimation index: ${withAcclimationIndex}/${response.data.length}`);
        
        return response.data;
      } else {
        console.log('⚠️ Species API returned unexpected format');
        setSpeciesData([]);
        setSpeciesDataLoading(false);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load species data:', error);
      setSpeciesData([]);
      setSpeciesDataLoading(false);
      return [];
    }
  };

  // Helper function to sort index options in descending order
  const sortIndexOptions = (options) => {
    // Define the correct order
    const orderMap = {
      'Best (7-10)': 1,
      'Better (4-6)': 2,
      'Good (1-3)': 3
    };
    
    return options.sort((a, b) => {
      const orderA = orderMap[a] || 999;
      const orderB = orderMap[b] || 999;
      return orderA - orderB;
    });
  };

  const loadFilterOptions = async () => {
    console.log('🌿 Loading filter options...');
    
    // Set default fallback options immediately with proper order
    const defaultVariegation = ['Standard', 'Variegated', 'Albo', 'Aurea', 'Thai Sunrise'];
    const defaultShipping = ['Best (7-10)', 'Better (4-6)', 'Good (1-3)'];
    const defaultAcclimation = ['Best (7-10)', 'Better (4-6)', 'Good (1-3)'];
    
    setVariegationOptions(defaultVariegation);
    setShippingIndexOptions(defaultShipping);
    setAcclimationIndexOptions(defaultAcclimation);
    
    try {
      // Try to load variegation options from API
      console.log('📥 Loading variegation options from API...');
      try {
        const variegationResponse = await getVariegationApi();
        console.log('📥 Variegation response:', variegationResponse);
        
        if (variegationResponse?.success && variegationResponse.data && Array.isArray(variegationResponse.data)) {
          const variegationList = variegationResponse.data.map(item => 
            item.name || item.variegation || item.label || String(item)
          ).filter(Boolean); // Remove empty values
          
          if (variegationList.length > 0) {
            console.log('✅ Variegation options loaded from API:', variegationList);
            setVariegationOptions(variegationList);
          }
        }
      } catch (varError) {
        console.log('❌ Failed to load variegation from API, using defaults:', varError.message);
      }

      // Try to load shipping index options from API
      console.log('🚢 Loading shipping index options from API...');
      try {
        const shippingResponse = await getShippingIndexApi();
        console.log('🚢 Shipping response:', shippingResponse);
        
        if (shippingResponse?.success && shippingResponse.data && Array.isArray(shippingResponse.data)) {
          const shippingList = shippingResponse.data.map(item => 
            item.name || item.shippingIndex || item.label || String(item)
          ).filter(Boolean); // Remove empty values
          
          if (shippingList.length > 0) {
            console.log('✅ Shipping index options loaded from API:', shippingList);
            // Sort to ensure correct order: Best (7-10), Better (4-6), Good (1-3)
            const sortedShipping = sortIndexOptions(shippingList);
            console.log('✅ Shipping index options sorted:', sortedShipping);
            setShippingIndexOptions(sortedShipping);
          }
        }
      } catch (shipError) {
        console.log('❌ Failed to load shipping index from API, using defaults:', shipError.message);
      }

      // Try to load acclimation index options from API
      console.log('🌡️ Loading acclimation index options from API...');
      try {
        const acclimationResponse = await getAcclimationIndexApi();
        console.log('🌡️ Acclimation response:', acclimationResponse);
        
        if (acclimationResponse?.success && acclimationResponse.data && Array.isArray(acclimationResponse.data)) {
          const acclimationList = acclimationResponse.data.map(item => 
            item.name || item.acclimationIndex || item.label || String(item)
          ).filter(Boolean); // Remove empty values
          
          if (acclimationList.length > 0) {
            console.log('✅ Acclimation index options loaded from API:', acclimationList);
            // Sort to ensure correct order: Best (7-10), Better (4-6), Good (1-3)
            const sortedAcclimation = sortIndexOptions(acclimationList);
            console.log('✅ Acclimation index options sorted:', sortedAcclimation);
            setAcclimationIndexOptions(sortedAcclimation);
          }
        }
      } catch (acclError) {
        console.log('❌ Failed to load acclimation index from API, using defaults:', acclError.message);
      }
      
      console.log('🏁 Filter options loading completed');
    } catch (error) {
      console.error('🚫 General error loading filter options:', error);
      // Fallback options are already set above
    }
  };

  // Memoized filtered data (replaces state + effect)
  const filteredData = useMemo(() => {
    try {
      const sourceData = activeTab === 'genus' ? taxonomyData : requestsData;
      let filtered = Array.isArray(sourceData) ? sourceData : [];

      console.log('🔍 Filtering data with:', {
        activeFilters,
        sourceDataLength: filtered.length,
        sampleData: filtered.length > 0 ? filtered[0] : null
      });

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
        console.log('🔍 Applying genus filters...');
        
        // Variegation filter - Use species collection to find genus with selected variegation
        if (activeFilters.variegation && activeFilters.variegation.length > 0) {
          console.log('🔍 Applying variegation filter via species collection:', activeFilters.variegation);
          const beforeCount = filtered.length;
          
          if (speciesData && speciesData.length > 0) {
            // Find species that match the selected variegation
            const matchingSpecies = speciesData.filter(species => {
              if (!species.variegation || !species.genus) return false;
              
              return activeFilters.variegation.some(filterVariegation => {
                const speciesVar = (species.variegation || '').toUpperCase().trim();
                const filterVar = filterVariegation.toUpperCase().trim();
                
                // Exact match or contains match
                return speciesVar === filterVar || 
                       speciesVar.includes(filterVar) || 
                       filterVar.includes(speciesVar);
              });
            });
            
            // Extract unique genus names from matching species
            const genusWithVariegation = [...new Set(
              matchingSpecies
                .map(s => s.genus?.toUpperCase().trim())
                .filter(Boolean)
            )];
            
            console.log(`🔍 Found ${matchingSpecies.length} species with variegation:`, activeFilters.variegation);
            console.log(`🔍 Genus with matching species:`, genusWithVariegation);
            
            if (genusWithVariegation.length > 0) {
              // Filter genus list to only show genus that have species with selected variegation
              filtered = filtered.filter(genus => {
                const genusName = (genus.name || '').toUpperCase().trim();
                const matches = genusWithVariegation.includes(genusName);
                
                if (matches) {
                  console.log(`✅ Genus ${genus.name} has species with variegation:`, activeFilters.variegation);
                }
                
                return matches;
              });
            } else {
              console.log('⚠️ No species found with selected variegation');
              filtered = []; // No genus to show if no species match
            }
          } else {
            console.log('⚠️ Species data not loaded yet, cannot filter by variegation');
            // Don't filter if species data not loaded
          }
          
          console.log(`🔍 Variegation filter: ${beforeCount} → ${filtered.length} items`);
        }

        // Shipping Index filter - Use species collection to find genus with selected shipping index
        if (activeFilters.shippingIndex && activeFilters.shippingIndex.length > 0) {
          console.log('🔍 Applying shipping index filter via species collection:', activeFilters.shippingIndex);
          const beforeCount = filtered.length;
          
          if (speciesData && speciesData.length > 0) {
            console.log(`🔍 Starting filter with ${speciesData.length} species, checking for:`, activeFilters.shippingIndex);
            
            // Find species that match the selected shipping index ranges
            const matchingSpecies = speciesData.filter(species => {
              // Check for both field name variations (camelCase first since API returns camelCase)
              const shippingIndex = species.shippingIndex ?? species.shipping_index;
              
              // Check for genus in multiple possible fields
              const genusName = species.genus || species.genus_name;
              
              // Must have genus and a valid shipping index
              if (!genusName || shippingIndex === undefined || shippingIndex === null) {
                return false;
              }
              
              const speciesShippingIndex = parseInt(shippingIndex);
              if (isNaN(speciesShippingIndex)) {
                return false;
              }
              // Allow 0 values (some species might have 0 as a valid index)
              
              // Check if the species index falls within any selected range
              return activeFilters.shippingIndex.some(filterLabel => {
                // Parse range from label like "Better (4-6)" or "Better (4-7)" -> [4, 6] or [4, 7]
                const rangeMatch = filterLabel.match(/\((\d+)-(\d+)\)/);
                if (rangeMatch) {
                  const min = parseInt(rangeMatch[1]);
                  const max = parseInt(rangeMatch[2]);
                  const isInRange = speciesShippingIndex >= min && speciesShippingIndex <= max;
                  if (isInRange) {
                    console.log(`  ✅ Species match: ${species.name || species.species_name || 'unknown'} (genus: ${genusName}), shipping_index=${speciesShippingIndex}, range ${min}-${max}`);
                  }
                  return isInRange;
                } else {
                  console.log(`  ⚠️ Could not parse range from filter label: ${filterLabel}`);
                }
                return false;
              });
            });
            
            console.log(`🔍 Found ${matchingSpecies.length} matching species out of ${speciesData.length} total`);
            
            // Extract unique genus names from matching species
            const genusWithShippingIndex = [...new Set(
              matchingSpecies
                .map(s => {
                  const genusName = s.genus_name?.toUpperCase().trim() || s.genus?.toUpperCase().trim();
                  return genusName;
                })
                .filter(Boolean)
            )];
            
            console.log(`🔍 Genus with matching species (${genusWithShippingIndex.length}):`, genusWithShippingIndex.slice(0, 10));
            
            if (genusWithShippingIndex.length > 0) {
              // Filter genus list to only show genus that have species with selected shipping index
              filtered = filtered.filter(genus => {
                const genusName = (genus.name || genus.genus_name || '').toUpperCase().trim();
                const matches = genusWithShippingIndex.includes(genusName);
                if (matches) {
                  console.log(`✅ Genus ${genus.name} matches shipping index filter`);
                }
                return matches;
              });
            } else {
              console.log('⚠️ No species found with selected shipping index - showing empty list');
              filtered = []; // No genus to show if no species match
            }
          } else {
            if (speciesDataLoading) {
              console.log('⏳ Species data is still loading, waiting before applying shipping index filter');
              // Keep current filtered data (don't apply filter yet) - will re-run when speciesData loads
            } else {
              console.log('⚠️ Species data not available (may be empty or failed to load)');
              // No species data available - show empty results
              filtered = [];
            }
          }
          
          console.log(`🔍 Shipping index filter: ${beforeCount} → ${filtered.length} items`);
        }

        // Acclimation Index filter - Use species collection to find genus with selected acclimation index
        if (activeFilters.acclimationIndex && activeFilters.acclimationIndex.length > 0) {
          console.log('🔍 Applying acclimation index filter via species collection:', activeFilters.acclimationIndex);
          const beforeCount = filtered.length;
          
          if (speciesData && speciesData.length > 0) {
            console.log(`🔍 Starting filter with ${speciesData.length} species, checking for:`, activeFilters.acclimationIndex);
            
            // Find species that match the selected acclimation index ranges
            const matchingSpecies = speciesData.filter(species => {
              // Check for both field name variations (camelCase first since API returns camelCase)
              const acclimationIndex = species.acclimationIndex ?? species.acclimation_index;
              
              // Check for genus in multiple possible fields
              const genusName = species.genus || species.genus_name;
              
              // Must have genus and a valid acclimation index
              if (!genusName || acclimationIndex === undefined || acclimationIndex === null) {
                return false;
              }
              
              const speciesAcclimationIndex = parseInt(acclimationIndex);
              if (isNaN(speciesAcclimationIndex)) {
                return false;
              }
              // Allow 0 values (some species might have 0 as a valid index)
              
              // Check if the species index falls within any selected range
              return activeFilters.acclimationIndex.some(filterLabel => {
                // Parse range from label like "Better (4-6)" or "Better (4-7)" -> [4, 6] or [4, 7]
                const rangeMatch = filterLabel.match(/\((\d+)-(\d+)\)/);
                if (rangeMatch) {
                  const min = parseInt(rangeMatch[1]);
                  const max = parseInt(rangeMatch[2]);
                  const isInRange = speciesAcclimationIndex >= min && speciesAcclimationIndex <= max;
                  if (isInRange) {
                    console.log(`  ✅ Species match: ${species.name || species.species_name || 'unknown'} (genus: ${genusName}), acclimation_index=${speciesAcclimationIndex}, range ${min}-${max}`);
                  }
                  return isInRange;
                } else {
                  console.log(`  ⚠️ Could not parse range from filter label: ${filterLabel}`);
                }
                return false;
              });
            });
            
            console.log(`🔍 Found ${matchingSpecies.length} matching species out of ${speciesData.length} total`);
            
            // Extract unique genus names from matching species
            const genusWithAcclimationIndex = [...new Set(
              matchingSpecies
                .map(s => {
                  const genusName = s.genus_name?.toUpperCase().trim() || s.genus?.toUpperCase().trim();
                  return genusName;
                })
                .filter(Boolean)
            )];
            
            console.log(`🔍 Genus with matching species (${genusWithAcclimationIndex.length}):`, genusWithAcclimationIndex.slice(0, 10));
            
            if (genusWithAcclimationIndex.length > 0) {
              // Filter genus list to only show genus that have species with selected acclimation index
              filtered = filtered.filter(genus => {
                const genusName = (genus.name || genus.genus_name || '').toUpperCase().trim();
                const matches = genusWithAcclimationIndex.includes(genusName);
                if (matches) {
                  console.log(`✅ Genus ${genus.name} matches acclimation index filter`);
                }
                return matches;
              });
            } else {
              console.log('⚠️ No species found with selected acclimation index - showing empty list');
              filtered = []; // No genus to show if no species match
            }
          } else {
            if (speciesDataLoading) {
              console.log('⏳ Species data is still loading, waiting before applying acclimation index filter');
              // Keep current filtered data (don't apply filter yet) - will re-run when speciesData loads
            } else {
              console.log('⚠️ Species data not available (may be empty or failed to load)');
              // No species data available - show empty results
              filtered = [];
            }
          }
          
          console.log(`🔍 Acclimation index filter: ${beforeCount} → ${filtered.length} items`);
        }
      }

      console.log('🏁 Final filtered results:', filtered.length, 'items');
      return filtered;
    } catch (e) {
      console.error('🌿 Error deriving filteredData:', e);
      return [];
    }
  }, [activeTab, taxonomyData, requestsData, debouncedQuery, activeFilters, speciesData, speciesDataLoading]);

  const fetchAllData = async (showLoading = true) => {
    console.log('🌿 fetchAllData called, showLoading:', showLoading);
    console.log('🌿 Current requestsData length:', requestsData.length);
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // Fetch genus data, requests data, and species data in parallel
      const [genusResult, requestsResult, speciesResult] = await Promise.allSettled([
        fetchGenusData(),
        fetchRequestsData(),
        loadSpeciesData()
      ]);
      
      // Log results
      if (genusResult.status === 'fulfilled') {
        console.log('✅ Genus data fetch completed successfully');
        console.log('✅ Genus data length:', genusResult.value?.length || 0);
      } else {
        console.error('❌ Genus data fetch failed:', genusResult.reason);
      }
      
      if (speciesResult.status === 'fulfilled') {
        console.log('✅ Species data fetch completed successfully');
      } else {
        console.error('❌ Species data fetch failed:', speciesResult.reason);
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
        
        // Debug: Check what fields are available in the genus data
        if (response.data.length > 0) {
          const sampleItem = response.data[0];
          console.log('🔍 Available fields in genus data:', Object.keys(sampleItem));
          console.log('🔍 Shipping index field:', sampleItem.shipping_index || sampleItem.shippingIndex || 'NOT FOUND');
          console.log('🔍 Acclimation index field:', sampleItem.acclimation_index || sampleItem.acclimationIndex || 'NOT FOUND');
        }
        
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
    console.log('🌿 Current filter options state:');
    console.log('  - variegationOptions:', variegationOptions);
    console.log('  - shippingIndexOptions:', shippingIndexOptions);
    console.log('  - acclimationIndexOptions:', acclimationIndexOptions);
    setSelectedFilterType(filter);
    setFilterModalVisible(true);
  };

  const handleFilterSelect = (filterType, value) => {
    console.log('🌿 Filter selected:', filterType.label, '=', value);
    
    const filterKey = filterType.label === 'Variegation' ? 'variegation' :
                     filterType.label === 'Shipping Index' ? 'shippingIndex' :
                     filterType.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    if (filterKey) {
      const newFilterValue = value === 'All' ? [] : (Array.isArray(value) ? value : [value]);
      
      console.log('🌿 Setting filter:', {
        filterKey,
        oldValue: activeFilters[filterKey],
        newValue: newFilterValue
      });
      
      setActiveFilters(prev => {
        const updated = {
          ...prev,
          [filterKey]: newFilterValue
        };
        console.log('🌿 Updated activeFilters:', updated);
        return updated;
      });
    }
    
    setFilterModalVisible(false);
    setSelectedFilterType(null);
  };

  const handleClearFilters = () => {
    console.log('🌿 Clearing all filters');
    setActiveFilters({
      variegation: [],
      shippingIndex: [],
      acclimationIndex: []
    });
  };

  const getFilterDisplayValue = (filter) => {
    const filterKey = filter.label === 'Variegation' ? 'variegation' :
                     filter.label === 'Shipping Index' ? 'shippingIndex' :
                     filter.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    if (filterKey && activeFilters[filterKey] && activeFilters[filterKey].length > 0) {
      // Show first selected item or count if multiple
      const selected = activeFilters[filterKey];
      return selected.length === 1 ? selected[0] : `${selected.length} selected`;
    }
    return filter.label;
  };

  const isFilterActive = (filter) => {
    const filterKey = filter.label === 'Variegation' ? 'variegation' :
                     filter.label === 'Shipping Index' ? 'shippingIndex' :
                     filter.label === 'Acclimation Index' ? 'acclimationIndex' : null;
    
    return filterKey && activeFilters[filterKey] && activeFilters[filterKey].length > 0;
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
    // Open batch update modal instead of navigating
    console.log('🌿 Opening batch update modal');
    setBatchUpdateModalVisible(true);
  };

  const handleBatchUpdateSuccess = (data) => {
    console.log('✅ Batch update completed successfully:', data);
    // Refresh all taxonomy data
    fetchAllData(false);
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

  const renderEmptyComponent = useCallback(() => {
    // Check if there are active filters
    const hasActiveFilters = activeFilters && (
      (activeFilters.variegation && activeFilters.variegation.length > 0) ||
      (activeFilters.shippingIndex && activeFilters.shippingIndex.length > 0) ||
      (activeFilters.acclimationIndex && activeFilters.acclimationIndex.length > 0)
    );

    // Check if there's a search query
    const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

    let message = 'No data available';
    let subtitle = '';

    if (activeTab === 'genus') {
      if (hasActiveFilters && hasSearchQuery) {
        message = 'No genus found';
        subtitle = 'Try adjusting your filters or search query';
      } else if (hasActiveFilters) {
        message = 'No genus match your filters';
        subtitle = 'Try selecting different filter options';
      } else if (hasSearchQuery) {
        message = 'No genus found';
        subtitle = `No results for "${searchQuery}"`;
      } else {
        message = 'No genus available';
        subtitle = 'Add a new plant taxonomy to get started';
      }
    } else {
      if (hasSearchQuery) {
        message = 'No requests found';
        subtitle = `No results for "${searchQuery}"`;
      } else {
        message = 'No pending requests';
        subtitle = 'New genus requests will appear here';
      }
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <Text style={styles.emptyStateTitle}>{message}</Text>
          <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
          {hasActiveFilters && (
            <TouchableOpacity 
              onPress={handleClearFilters}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [activeTab, activeFilters, searchQuery, handleClearFilters]);

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
            {((activeFilters.variegation && activeFilters.variegation.length > 0) || 
              (activeFilters.shippingIndex && activeFilters.shippingIndex.length > 0) || 
              (activeFilters.acclimationIndex && activeFilters.acclimationIndex.length > 0)) && (
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
              ListEmptyComponent={renderEmptyComponent}
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
      
      <BatchUpdateModal
        visible={batchUpdateModalVisible}
        onClose={() => setBatchUpdateModalVisible(false)}
        onSuccess={handleBatchUpdateSuccess}
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
        filterOptions={{
          variegation: variegationOptions,
          shippingIndex: shippingIndexOptions,
          acclimationIndex: acclimationIndexOptions
        }}
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
  },
  // Buyer-side modal styles
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  closeIcon: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
    paddingHorizontal: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyStateTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#7F8D91',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#699E73',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  clearFiltersButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default Taxonomy;
