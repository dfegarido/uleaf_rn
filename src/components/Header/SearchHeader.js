import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';
import { searchPlantsApi } from '../Api/listingBrowseApi';
import PlantItemCard from '../PlantItemCard';

/**
 * Reusable Search Header Component
 * Provides plant search functionality with dropdown results
 */
const SearchHeader = ({
  placeholder = "Search plants...",
  onSearchResults = () => {},
  onPlantSelect = () => {},
  showResults = true,
  maxResults = 5,
  style,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim().length >= 2) {
        performSearch(searchText.trim());
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const performSearch = async (searchTerm) => {
    try {
      setLoadingSearch(true);
      console.log('Searching for plants:', searchTerm);

      const searchParams = {
        query: searchTerm,
        limit: maxResults,
        sortBy: 'relevance',
        sortOrder: 'desc'
      };

      const res = await searchPlantsApi(searchParams);

      if (res.success) {
        const plants = res.data?.plants || [];
        setSearchResults(plants);
        setShowDropdown(plants.length > 0);
        onSearchResults(plants);
        console.log(`Found ${plants.length} plants for "${searchTerm}"`);
      } else {
        console.error('Search failed:', res.error);
        setSearchResults([]);
        setShowDropdown(false);
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Error performing plant search:', error);
      setSearchResults([]);
      setShowDropdown(false);
      onSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePlantPress = (plant) => {
    console.log('Plant selected:', plant);
    setShowDropdown(false);
    setSearchText('');
    onPlantSelect(plant);
  };

  const handleTextChange = (text) => {
    setSearchText(text);
    if (text.trim().length === 0) {
      setShowDropdown(false);
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handlePlantPress(item)}
    >
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultTitle}>
          {item.genus} {item.species}
          {item.variegation ? ` ${item.variegation}` : ''}
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

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <View style={styles.searchField}>
          <View style={styles.textField}>
            <SearchIcon width={24} height={24} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#647276"
              value={searchText}
              onChangeText={handleTextChange}
              multiline={false}
              numberOfLines={1}
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
      {showResults && showDropdown && searchResults.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flex: 1,
    marginRight: 10,
  },
  searchField: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 300,
    zIndex: 1001,
  },
  dropdownList: {
    borderRadius: 15,
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
