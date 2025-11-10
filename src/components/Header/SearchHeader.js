import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';
import { searchPlantsApi } from '../Api/listingBrowseApi';
import NetInfo from '@react-native-community/netinfo';

/**
 * Reusable Search Header Component
 * Provides plant search functionality with dropdown results
 */
const SearchHeader = ({
  placeholder = "Search ileafU ",
  onSearchResults = () => {},
  onPlantSelect = () => {},
  showResults = true,
  style,
  // Controlled search text (optional)
  searchText: controlledSearchText,
  onSearchTextChange,
  // Custom positioning (deprecated - dropdown now positions relative to input)
  dropdownTop,
  // Custom rendering
  renderResultItem,
  // Navigation handling
  onFocus,
  onBlur,
  isNavigatingFromSearch: externalIsNavigatingFromSearch,
  setIsNavigatingFromSearch: externalSetIsNavigatingFromSearch,
  // Navigation prop for search icon click
  navigation,
  // Custom handler for search icon press (overrides default navigation behavior)
  onSearchIconPress,
  // Search API customization
  searchApi = searchPlantsApi,
  searchApiWrapper, // Optional wrapper like retryAsync
  // Debounce timing
  debounceMs = 800,
  // Network check
  checkNetwork = true,
  // Container style override
  containerStyle,
  searchContainerStyle,
  // Loading text
  loadingText = "Searching plants...",
}) => {
  // Internal state (used if not controlled)
  const [internalSearchText, setInternalSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalIsNavigatingFromSearch, setInternalIsNavigatingFromSearch] = useState(false);
  
  // Search pagination state
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);
  
  // Ref for TextInput to programmatically focus
  const textInputRef = useRef(null);

  // Use controlled or internal state
  const searchText = controlledSearchText !== undefined ? controlledSearchText : internalSearchText;
  const isNavigatingFromSearch = externalIsNavigatingFromSearch !== undefined 
    ? externalIsNavigatingFromSearch 
    : internalIsNavigatingFromSearch;
  const setIsNavigatingFromSearch = externalSetIsNavigatingFromSearch || setInternalIsNavigatingFromSearch;

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim().length >= 2) {
        // Reset pagination when search term changes
        setSearchOffset(0);
        setSearchHasMore(false);
        performSearch(searchText.trim(), 0, true);
      } else {
        // Clear results when search text is empty
        setSearchResults([]);
        setSearchOffset(0);
        setSearchHasMore(false);
        setIsFocused(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const performSearch = async (searchTerm, offset = 0, resetResults = false) => {
    try {
      if (resetResults) {
        setLoadingSearch(true);
      } else {
        setLoadingMoreSearch(true);
      }
      console.log('Searching for plants:', searchTerm, 'offset:', offset);

      // Network check if enabled
      if (checkNetwork) {
        let netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          throw new Error('No internet connection.');
        }
      }

      const searchParams = {
        query: searchTerm,
        limit: 10,
        offset: offset,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      // Use wrapper if provided, otherwise call API directly
      const res = searchApiWrapper 
        ? await searchApiWrapper(() => searchApi(searchParams), 3, 1000)
        : await searchApi(searchParams);

      if (res?.success) {
        const plants = res.data?.plants || [];
        const pagination = res.data?.pagination || {};
        
        if (resetResults) {
          setSearchResults(plants);
        } else {
          // Append new results to existing ones
          setSearchResults(prev => [...prev, ...plants]);
        }
        
        // Update pagination state
        setSearchHasMore(pagination.hasMore || false);
        setSearchOffset(offset + plants.length);
        
        onSearchResults(resetResults ? plants : [...searchResults, ...plants]);
        console.log(`Found ${plants.length} plants for "${searchTerm}", hasMore: ${pagination.hasMore}`);
      } else {
        console.error('Search failed:', res?.error || res?.message);
        if (resetResults) {
          setSearchResults([]);
          onSearchResults([]);
          // Show alert if network check is enabled
          if (checkNetwork) {
            Alert.alert(
              'Search Error',
              'Could not search for plants. Please check your connection and try again.',
              [{text: 'OK'}]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error performing plant search:', error);
      if (resetResults) {
        setSearchResults([]);
        setShowDropdown(false);
        onSearchResults([]);
        // Show alert if network check is enabled
        if (checkNetwork) {
          Alert.alert(
            'Search Error',
            'Could not search for plants. Please check your connection and try again.',
            [{text: 'OK'}]
          );
        }
      }
    } finally {
      setLoadingSearch(false);
      setLoadingMoreSearch(false);
    }
  };

  const loadMoreSearchResults = () => {
    if (!loadingMoreSearch && searchHasMore && searchText.trim().length >= 2) {
      performSearch(searchText.trim(), searchOffset, false);
    }
  };

  const handlePlantPress = (plant) => {
    console.log('Plant selected:', plant);
    setIsFocused(false);
    if (onSearchTextChange) {
      onSearchTextChange('');
    } else {
      setInternalSearchText('');
    }
    onPlantSelect(plant);
  };

  const handleTextChange = (text) => {
    if (onSearchTextChange) {
      onSearchTextChange(text);
    } else {
      setInternalSearchText(text);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const handleSearchIconPress = () => {
    // If custom handler is provided, use it
    if (onSearchIconPress) {
      onSearchIconPress(searchText.trim());
      return;
    }
    
    // If navigation is provided and there's any search text, navigate to genus plants screen
    if (navigation && searchText.trim().length > 0) {
      console.log('🔍 [SearchHeader] Navigating to ScreenGenusPlants with search:', searchText.trim());
      navigation.navigate('ScreenGenusPlants', {
        searchQuery: searchText.trim(),
        fromSearch: true,
      });
    } else if (textInputRef.current) {
      // Otherwise, just focus the TextInput
      textInputRef.current.focus();
      // If there's already search text, trigger search and show results
      if (searchText.trim().length >= 2) {
        setIsFocused(true);
        performSearch(searchText.trim(), 0, true);
      }
    }
  };

  const handleBlur = () => {
    // Close search results when input loses focus
    // Use a short delay only if navigating, otherwise close immediately
    if (isNavigatingFromSearch) {
      // If navigating, wait a bit then reset
      setTimeout(() => {
        setIsNavigatingFromSearch(false);
      }, 500);
    } else {
      // Close immediately when clicking outside
      setIsFocused(false);
      setSearchResults([]);
      if (onBlur) {
        onBlur();
      }
    }
  };

  const defaultRenderResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handlePlantPress(item)}
    >
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultTitle}>
          {item.genus} {item.species}
          {item.variegation && item.variegation !== 'Choose the most suitable variegation.' ? ` ${item.variegation}` : ''}
        </Text>
        <Text style={styles.searchResultSubtitle}>
          {item.listingType} • ${item.finalPrice}
          {item.currency !== 'USD' ? ` ${item.currency}` : ''}
        </Text>
        {item.supplierName && (
          <Text style={styles.searchResultSupplier}>
            by {item.supplierName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = renderResultItem || defaultRenderResult;

  // Determine if dropdown should show
  const shouldShowDropdown = showResults && isFocused && searchText.trim().length >= 2 && (loadingSearch || searchResults.length > 0);

  return (
    <View style={[styles.container, containerStyle, style]}>
      <View style={[styles.searchContainer, searchContainerStyle]}>
        <View style={styles.searchField}>
          <View style={styles.textField}>
            <TouchableOpacity onPress={handleSearchIconPress} activeOpacity={0.7}>
              <SearchIcon width={24} height={24} />
            </TouchableOpacity>
            <TextInput
              ref={textInputRef}
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#647276"
              value={searchText}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              multiline={false}
              numberOfLines={1}
              // Disable native autocomplete and suggestions
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              textContentType="none"
              dataDetectorTypes="none"
              keyboardType="default"
            />
            {loadingSearch && (
              <ActivityIndicator
                size="small"
                color="#647276"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </View>
      </View>

      {/* Search Results Dropdown */}
      {shouldShowDropdown && (
        <View 
          style={styles.dropdown}
          onTouchStart={(e) => {
            // Prevent blur when touching the dropdown
            e.stopPropagation();
            setIsNavigatingFromSearch(true);
          }}
        >
          {loadingSearch ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.id || item.plantCode || index}_${index}`}
              style={styles.dropdownList}
              contentContainerStyle={styles.dropdownContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              removeClippedSubviews={false}
              bounces={true}
              onEndReached={loadMoreSearchResults}
              onEndReachedThreshold={0.5}
              onScrollBeginDrag={() => {
                // Prevent blur when scrolling starts
                setIsNavigatingFromSearch(true);
              }}
              onMomentumScrollBegin={() => {
                // Prevent blur during momentum scrolling
                setIsNavigatingFromSearch(true);
              }}
              ListFooterComponent={() => {
                if (loadingMoreSearch) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={styles.loadingMoreText}>Loading more...</Text>
                    </View>
                  );
                }
                return null;
              }}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No plants found for "{searchText}"
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    zIndex: 9999,
    elevation: 9999,
  },
  searchContainer: {
    flex: 1,
    width: '100%',
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
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
    flex: 1,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
    marginLeft: 8,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 400,
    height: 400,
    zIndex: 9999,
    overflow: 'hidden',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  dropdownList: {
    flex: 1,
    borderRadius: 15,
  },
  dropdownContent: {
    paddingBottom: 0,
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
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultSupplier: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SearchHeader;
