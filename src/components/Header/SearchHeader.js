import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';

/**
 * Reusable Search Header Component
 * Provides plant search functionality
 */
const SearchHeader = ({
  placeholder = "Search ileafU ",
  style,
  // Controlled search text (optional)
  searchText: controlledSearchText,
  onSearchTextChange,
  // Navigation handling
  onFocus,
  onBlur,
  isNavigatingFromSearch: externalIsNavigatingFromSearch,
  setIsNavigatingFromSearch: externalSetIsNavigatingFromSearch,
  // Navigation prop for search icon click
  navigation,
  // Custom handler for search icon press (overrides default navigation behavior)
  onSearchIconPress,
  // Container style override
  containerStyle,
  searchContainerStyle,
}) => {
  // Internal state (used if not controlled)
  const [internalSearchText, setInternalSearchText] = useState('');
  const [internalIsNavigatingFromSearch, setInternalIsNavigatingFromSearch] = useState(false);
  
  // Ref for TextInput to programmatically focus
  const textInputRef = useRef(null);

  // Use controlled or internal state
  const searchText = controlledSearchText !== undefined ? controlledSearchText : internalSearchText;
  const isNavigatingFromSearch = externalIsNavigatingFromSearch !== undefined 
    ? externalIsNavigatingFromSearch 
    : internalIsNavigatingFromSearch;
  const setIsNavigatingFromSearch = externalSetIsNavigatingFromSearch || setInternalIsNavigatingFromSearch;

  const handleTextChange = (text) => {
    if (onSearchTextChange) {
      onSearchTextChange(text);
    } else {
      setInternalSearchText(text);
    }
  };

  const handleFocus = () => {
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
    }
  };

  const handleBlur = () => {
    // Use a short delay only if navigating, otherwise close immediately
    if (isNavigatingFromSearch) {
      // If navigating, wait a bit then reset
      setTimeout(() => {
        setIsNavigatingFromSearch(false);
      }, 500);
    }
    if (onBlur) {
      onBlur();
    }
  };

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
          </View>
        </View>
      </View>
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
});

export default SearchHeader;
