import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import ArrowLeftIcon from '../../../assets/admin-icons/arrow-right.svg';
import SkeletonRow from './SkeletonRow';
import ListingRow from './ListingRow';
import TableHeader from './TableHeader';
import { IMAGE_CELL_TOTAL, IMAGE_CELL_WIDTH, IMAGE_CONTENT_GAP } from './constants';
import EmptyState from './EmptyState';
import SearchIcon from '../../../assets/admin-icons/search.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
// Import badge icons from buyer-icons following buyer shop pattern
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import HeartIcon from '../../../assets/buyer-icons/heart.svg';
// Import API
import { getAdminListingsApi } from '../../../components/Api/getAdminListingsApi';

const ListingsViewer = ({ navigation }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    sort: null,
    status: null,
    genus: null,
    variegation: null,
    listingType: null,
    garden: null,
    country: null,
    plantFlight: null,
    shippingIndex: null,
    acclimationIndex: null,
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  });
  const [error, setError] = useState(null);

  // Filter tabs configuration - following buyer shop pattern
  const filterTabs = [
    { label: 'Sort', leftIcon: SortIcon },
    { label: 'Status', rightIcon: DownIcon },
    { label: 'Genus', rightIcon: DownIcon },
    { label: 'Variegation', rightIcon: DownIcon },
    { label: 'Listing Type', rightIcon: DownIcon },
    { label: 'Garden', rightIcon: DownIcon },
    { label: 'Country', rightIcon: DownIcon },
    { label: 'Plant Flight', rightIcon: DownIcon },
    { label: 'Shipping Index', rightIcon: DownIcon },
    { label: 'Acclimation Index', rightIcon: DownIcon },
  ];

  // Badge filter options - following buyer shop badge pattern
  const badgeFilters = [
    { id: 'latest', label: 'Latest Nursery Drop', icon: LeavesIcon },
    { id: 'below20', label: 'Below 20', icon: PriceTagIcon },
    { id: 'unicorn', label: 'Unicorn', icon: UnicornIcon },
    { id: 'wishlist', label: 'Top 5 Buyer Wish List', icon: Top5Icon },
    { id: 'sellers-fave', label: 'Sellers Fave', icon: HeartIcon },
  ];

  // Table columns configuration
  const tableColumns = [
  { key: 'image', label: 'Image', width: IMAGE_CELL_WIDTH },
    { key: 'code', label: 'Code + Status', width: 120 },
    { key: 'name', label: 'Name', width: 200 },
    { key: 'listingType', label: 'Listing Type', width: 140 },
    { key: 'size', label: 'Size', width: 90 },
    { key: 'quantity', label: 'Quantity', width: 100 },
    { key: 'localPrice', label: 'Local Price', width: 120 },
  { key: 'usdPrice', label: 'USD Price', width: 120 },
  { key: 'discount', label: 'Discount', width: 120 },
  { key: 'garden', label: 'Garden', width: 200 },
    { key: 'country', label: 'Country', width: 100 },
    { key: 'plantFlight', label: 'Plant Flight', width: 140 },
    { key: 'shippingIndex', label: 'Shipping Index', width: 120 },
    { key: 'acclimationIndex', label: 'Acclimation Index', width: 120 },
  ];

  useEffect(() => {
    loadListings();
  }, [selectedBadgeFilter, selectedFilters, pagination.currentPage]);

  // Use a columns array without 'image' for header/rows alignment
  const filteredColumns = tableColumns.filter(c => c.key !== 'image');

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filters for API call
      const filters = {
        ...selectedFilters,
        search: searchTerm || undefined,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      };

      // Add badge filter mappings
      if (selectedBadgeFilter) {
        switch (selectedBadgeFilter) {
          case 'latest':
            filters.sort = 'latest';
            break;
          case 'below20':
            filters.priceMax = 20;
            break;
          case 'unicorn':
            filters.rarity = 'unicorn';
            break;
          case 'wishlist':
            filters.isWishlist = true;
            break;
          case 'sellers-fave':
            filters.isSellersFave = true;
            break;
        }
      }

      const response = await getAdminListingsApi(filters);

      if (response.success) {
        setListings(response.data.listings || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 50,
        });
      } else {
        setError(response.error || 'Failed to load listings');
        setListings([]);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('An error occurred while loading listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#23C16B';
      case 'reserved':
        return '#48A7F8';
      case 'unicorn':
        return '#6B4EFF';
      case 'pending':
        return '#FFB323';
      case 'unavailable':
        return '#E7522F';
      default:
        return '#23C16B';
    }
  };

  const handleFilterTabPress = (filterLabel) => {
    // TODO: Open filter modal/action sheet for this filter
    // For now, just log the action
    console.log('Filter pressed:', filterLabel);
  };

  const handleSearch = () => {
    // Trigger search with current searchTerm
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1
    loadListings();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleBadgeFilterPress = (badgeId) => {
    // Toggle badge filter - if same badge clicked, deselect it
    if (selectedBadgeFilter === badgeId) {
      setSelectedBadgeFilter(null);
    } else {
      setSelectedBadgeFilter(badgeId);
    }
  };

  const handleListingPress = (listing) => {
    // Log the full listing object when a row is clicked (debugging/inspection)
    console.log('Listing clicked:', listing);
  };

  // Helper function to check if a filter is active
  const isFilterActive = (filterLabel) => {
    switch (filterLabel) {
      case 'Sort':
        return selectedFilters.sort !== null;
      case 'Status':
        return selectedFilters.status !== null;
      case 'Genus':
        return selectedFilters.genus !== null;
      case 'Variegation':
        return selectedFilters.variegation !== null;
      case 'Listing Type':
        return selectedFilters.listingType !== null;
      case 'Garden':
        return selectedFilters.garden !== null;
      case 'Country':
        return selectedFilters.country !== null;
      case 'Plant Flight':
        return selectedFilters.plantFlight !== null;
      case 'Shipping Index':
        return selectedFilters.shippingIndex !== null;
      case 'Acclimation Index':
        return selectedFilters.acclimationIndex !== null;
      default:
        return false;
    }
  };

  // Filter Tab Button Component - following buyer shop pattern exactly
  const FilterTab = ({ filter }) => {
    const isActive = isFilterActive(filter.label);
    
    return (
      <TouchableOpacity
        onPress={() => handleFilterTabPress(filter.label)}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isActive ? '#23C16B' : '#CDD3D4',
          backgroundColor: isActive ? '#E8F5E9' : '#FFFFFF',
          padding: 8,
          marginTop: 5,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.7}
      >
        {filter.leftIcon && (
          <filter.leftIcon
            width={20}
            height={20}
            style={{ marginRight: 4 }}
          />
        )}
        <Text style={{
          fontSize: 14,
          fontWeight: isActive ? '600' : '500',
          color: isActive ? '#23C16B' : '#393D40'
        }}>
          {filter.label}
        </Text>
        {filter.rightIcon && (
          <filter.rightIcon
            width={20}
            height={20}
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Badge Filter Chip Component - following buyer shop PromoBadge pattern
  const BadgeFilterChip = ({ item, isSelected }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        style={[styles.badgeFilterChip, isSelected && styles.badgeFilterChipSelected]}
        onPress={() => handleBadgeFilterPress(item.id)}
        activeOpacity={0.7}
      >
        {IconComponent && <IconComponent width={22} height={22} style={styles.badgeFilterIcon} />}
        <Text style={styles.badgeFilterText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    const canGoPrev = pagination.currentPage > 1;
    const canGoNext = pagination.currentPage < pagination.totalPages;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, !canGoPrev && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!canGoPrev}
        >
          <Text style={[styles.paginationButtonText, !canGoPrev && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </Text>
          <Text style={styles.paginationSubtext}>
            {pagination.totalItems} total listings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, !canGoNext && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!canGoNext}
        >
          <Text style={[styles.paginationButtonText, !canGoNext && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon width={24} height={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listings Viewer</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by plant code, name, species, or garden..."
          placeholderTextColor="#647276"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchIconButton} onPress={handleSearch}>
          <SearchIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - following buyer shop pattern */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, paddingVertical: 4 }}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          paddingHorizontal: 10,
        }}
      >
        {filterTabs.map((filter) => (
          <FilterTab key={filter.label} filter={filter} />
        ))}
      </ScrollView>

      {/* Badge Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.badgeFilterContainer}
        contentContainerStyle={styles.badgeFilterContent}
      >
        {badgeFilters.map((filter) => (
          <BadgeFilterChip
            key={filter.id}
            item={filter}
            isSelected={selectedBadgeFilter === filter.id}
          />
        ))}
      </ScrollView>

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tableScrollContainer}
      >
        <View style={styles.tableContainer}>
          <TableHeader columns={tableColumns} imageWidth={IMAGE_CELL_TOTAL} />
          {loading ? (
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
            </View>
          ) : error ? (
            <EmptyState message={`Error: ${error}`} />
          ) : listings.length === 0 ? (
            <EmptyState message="No listings found" />
          ) : (
            <ScrollView style={styles.tableContent}>
              {listings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} onPress={handleListingPress} columns={filteredColumns} />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Pagination Controls */}
      <PaginationControls />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F6F7F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#202325',
  },
  searchIconButton: {
    position: 'absolute',
    right: 24,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  // Badge Filter Styles (following buyer shop PromoBadge pattern exactly)
  badgeFilterContainer: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    flexGrow: 0,
    paddingVertical: 1,
  },
  badgeFilterContent: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  badgeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F6',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 5,
    flexShrink: 0,
  },
  badgeFilterChipSelected: {
    backgroundColor: '#C0DAC2',
  },
  badgeFilterIcon: {
    marginRight: 8,
  },
  badgeFilterText: {
    color: '#393D40',
    fontSize: 16,
    fontWeight: '600',
  },
  // Table Styles
  tableScrollContainer: {
    flex: 1,
  },
  tableContainer: {
    minWidth: 1992,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#E4E7E9',
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    height: 36,
  },
  headerCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  headerTextBold: {
    fontWeight: '700',
    color: '#202325',
  },
  tableContent: {
    flex: 1,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
  },
  plantImage: {
    width: IMAGE_CELL_WIDTH,
    height: IMAGE_CELL_WIDTH,
    borderRadius: 12,
    backgroundColor: '#F5F6F6',
    overflow: 'hidden',
  },
  plantImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    color: '#647276',
  },
  contentContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  columnCell: {
    justifyContent: 'flex-start',
    gap: 6,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  plantName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  plantVariegation: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  listingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#202325',
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sizeCard: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
    minHeight: 28,
    minWidth: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    gap: 4,
  },
  discountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  gardenName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  infoText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  skeletonContainer: {
    paddingVertical: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    backgroundColor: '#FFFFFF',
  },
  skeletonImage: {
    width: IMAGE_CELL_WIDTH,
    height: IMAGE_CELL_WIDTH,
    borderRadius: 12,
    backgroundColor: '#ECEFF0',
  },
  skeletonCells: {
    flex: 1,
  },
  skeletonLineShort: {
    width: '30%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#ECEFF0',
    marginBottom: 8,
  },
  skeletonLineLong: {
    width: '60%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F3F5F5',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#23C16B',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#23C16B',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#E4E7E9',
  },
  paginationButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3A6',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  paginationSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#647276',
  },
});

export default ListingsViewer;
