import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import ArrowDownIcon from '../../assets/icons/greylight/caret-down-regular.svg';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular.svg';

const InputDropdownPaginated = ({
  options,
  onSelect,
  selectedOption,
  placeholder,
  disabled = false,
  onLoadMore = null, // Function to call when user scrolls to bottom
  hasMore = false, // Whether there are more items to load
  loadingMore = false, // Whether currently loading more items
  onSearch = null, // Optional: Function to call for server-side search
  enableServerSearch = false, // Whether to use server-side search instead of client-side filtering
  autoSearch = true, // Whether to auto-search as user types (default: true for better UX)
  searchDebounceMs = 500, // Debounce delay in milliseconds (default: 500ms)
}) => {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const loadingRef = useRef(false); // Prevent duplicate calls
  const searchTimeoutRef = useRef(null); // For debouncing auto-search

  const handleSelect = option => {
    onSelect(option);
    setVisible(false);
    setSearchQuery(''); // Clear search when closing
  };

  // Handle search input changes (typing only). For server-side search, the
  // actual API call is performed manually by pressing the Search button.
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  // Execute server-side search manually when user presses the Search button
  const handleSearchExecute = useCallback(() => {
    if (enableServerSearch && onSearch) {
      console.log(`🔍 Manual server search executed for "${searchQuery}"`);
      onSearch(searchQuery);
    }
  }, [enableServerSearch, onSearch, searchQuery]);

  // Auto-search effect: Trigger search automatically as user types (with debounce)
  useEffect(() => {
    if (!enableServerSearch || !autoSearch || !onSearch) {
      return; // Only for server-side search with auto-search enabled
    }

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, trigger search immediately to show all results
    if (!searchQuery.trim()) {
      console.log('🔄 Search cleared - loading all cities');
      onSearch('');
      return;
    }

    // Debounce: Wait for user to stop typing before searching
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`🔍 Auto-search triggered for: "${searchQuery}"`);
      onSearch(searchQuery);
    }, searchDebounceMs);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, enableServerSearch, autoSearch, onSearch, searchDebounceMs]);

  // Filter options based on search query (client-side only)
  const filteredOptions = useMemo(() => {
    // If server-side search is enabled, return options as-is (already filtered by server)
    if (enableServerSearch) {
      return options;
    }
    
    // Client-side filtering
    if (!searchQuery.trim()) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, enableServerSearch]);

  const handleEndReached = useCallback(() => {
    // Prevent multiple concurrent calls
    if (loadingRef.current) {
      console.log('⏭️ Already loading, skipping...');
      return;
    }
    
    if (hasMore && !loadingMore && onLoadMore) {
      console.log('📜 End reached - loading more items...');
      loadingRef.current = true;
      
      // Call onLoadMore and reset flag after a delay
      Promise.resolve(onLoadMore()).finally(() => {
        setTimeout(() => {
          loadingRef.current = false;
        }, 500); // Prevent rapid consecutive calls
      });
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const renderOption = ({item, index}) => (
    <TouchableOpacity
      style={[
        styles.option,
        index === options.length - 1 && styles.lastOption
      ]}
      onPress={() => handleSelect(item)}>
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdown, disabled && styles.dropdownDisabled]}
        onPress={() => {
          if (!disabled) setVisible(true);
        }}
        activeOpacity={disabled ? 1 : 0.7}>
        <Text
          style={[
            styles.dropdownText,
            disabled && styles.dropdownTextDisabled,
          ]}>
          {selectedOption || placeholder || 'Select an option'}
        </Text>
        <ArrowDownIcon
          width={20}
          height={20}
          style={[styles.icon, disabled && styles.iconDisabled]}
        />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => {
          setVisible(false);
          setSearchQuery('');
        }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => {
            setVisible(false);
            setSearchQuery('');
          }}
          activeOpacity={1}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {/* Manual Search Button for server-side search - only show if auto-search is disabled */}
                {enableServerSearch && !autoSearch && (
                  <TouchableOpacity
                    style={styles.searchIconButton}
                    onPress={handleSearchExecute}
                    disabled={!onSearch}
                  >
                    <SearchIcon width={18} height={18} style={styles.searchIcon} />
                  </TouchableOpacity>
                )}
              </View>
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchQuery('');
                  }}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results Count */}
            {searchQuery.trim() && (
              <View style={styles.resultsCount}>
                <Text style={styles.resultsCountText}>
                  {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}

            {/* Options List */}
            {filteredOptions.length === 0 ? (
              <Text style={styles.noResults}>
                {searchQuery.trim() ? 'No results found' : 'No options available'}
              </Text>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderOption}
                onEndReached={searchQuery.trim() ? null : handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={searchQuery.trim() ? null : renderFooter}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              />
            )}
            
            {/* Load More Button - only show when not searching */}
            {!searchQuery.trim() && hasMore && !loadingMore && (
              <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={handleEndReached}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {width: '100%'},
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dropdownDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  dropdownText: {
    color: '#333',
  },
  dropdownTextDisabled: {
    color: '#aaa',
  },
  icon: {},
  iconDisabled: {
    tintColor: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 10,
    padding: 10,
    maxHeight: 400, // Increased for better pagination experience
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  noResults: {
    paddingVertical: 20,
    textAlign: 'center',
    color: '#888',
  },
  footerLoader: {
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  loadMoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 5,
  },
  loadMoreText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    paddingBottom: 5,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#333',
  },
  searchIconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    tintColor: '#007AFF',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  resultsCount: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
    marginBottom: 10,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default InputDropdownPaginated;
