import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

const SellerItem = ({ name, email, onSelect }) => {
  return (
    <TouchableOpacity style={styles.sellerItemContainer} onPress={onSelect}>
      {/* Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sellerName}>{name || email || 'Unknown Seller'}</Text>
        {name && email && (
          <Text style={styles.sellerEmail}>{email}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const SellerNameFilter = ({ isVisible, onClose, onSelectSellerName, onReset, currentSellerName = '', sellers = [], onSearch }) => {
  const [searchQuery, setSearchQuery] = useState(currentSellerName);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedSellers, setSearchedSellers] = useState([]);
  const scrollRef = React.useRef(null);
  const searchTimeoutRef = React.useRef(null);

  // Debug: Log when component receives props
  React.useEffect(() => {
    if (isVisible) {
      console.log('[SellerNameFilter] Modal opened with:', {
        sellersCount: sellers.length,
        searchedSellersCount: searchedSellers.length,
        currentSellerName,
      });
    }
  }, [isVisible, sellers.length, searchedSellers.length, currentSellerName]);

  // Debounced search - calls API after user stops typing
  React.useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty or too short, don't call API (just show all sellers from prop)
    if (!searchQuery || searchQuery.trim().length < 2) {
      setIsSearching(false);
      // Clear search results when query is empty
      setSearchedSellers([]);
      return;
    }

    // Set searching state
    setIsSearching(true);

    // Debounce: Wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      console.log('[SellerNameFilter] Debounced search triggered for:', searchQuery);
      if (onSearch && typeof onSearch === 'function') {
        onSearch(searchQuery.trim());
      }
      setIsSearching(false);
    }, 500);

    // Cleanup timeout on unmount or when query changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  // Reset search when modal closes or opens
  React.useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setIsSearching(false);
      setSearchedSellers([]);
    } else {
      // When modal opens, reset search query to show all sellers
      console.log('[SellerNameFilter] Modal opened, resetting search query');
      setSearchQuery(currentSellerName || '');
      setIsSearching(false);
      setSearchedSellers([]);
    }
  }, [isVisible, currentSellerName]);

  // Use searched sellers if available, otherwise use prop sellers
  // If search query is empty or less than 2 chars, show all sellers (up to 50 for performance)
  // If searching, show search results (limited to 5)
  const filteredSellers = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      // Show all sellers when no search query (up to 50 for performance)
      const allSellers = sellers.slice(0, 50);
      console.log('[SellerNameFilter] No search query, showing all sellers:', allSellers.length, 'of', sellers.length);
      return allSellers;
    }
    
    // Show search results when searching
    const results = searchedSellers.slice(0, 5);
    console.log('[SellerNameFilter] Search query:', searchQuery, '| Search results:', results.length);
    return results;
  }, [sellers, searchedSellers, searchQuery]);

  // Update searched sellers when sellers prop changes (from parent API call)
  // This happens when onSearch callback triggers and parent updates sellerNameOptions
  React.useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      // If we have a search query and sellers prop is updated, it's from API search
      if (sellers.length > 0) {
        console.log('[SellerNameFilter] Received search results from parent:', sellers.length);
        setSearchedSellers(sellers);
      } else {
        // No results from search
        console.log('[SellerNameFilter] No search results from parent');
        setSearchedSellers([]);
      }
    }
  }, [sellers, searchQuery]);

  const handleSelect = (seller) => {
    const name = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email;
    if (onSelectSellerName && typeof onSelectSellerName === 'function') {
      onSelectSellerName(name);
    }
    onClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
              >
                <SafeAreaView>
                  {/* Title */}
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Seller Name</Text>
                    
                    {/* Close */}
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={onClose}
                      activeOpacity={0.7}
                    >
                      <CloseIcon width={24} height={24} style={styles.closeIcon} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <View style={styles.contentContainer}>
                    {/* Search Field */}
                    <View style={styles.searchFieldContainer}>
                      <SearchIcon width={24} height={24} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search seller by name or email"
                        placeholderTextColor="#647276"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => {
                          setTimeout(() => {
                            try {
                              if (scrollRef && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                                scrollRef.current.scrollTo({ y: 0, animated: true });
                              }
                            } catch (e) {
                              // ignore
                            }
                          }, 120);
                        }}
                        caretColor="#539461"
                        selectionColor="#539461"
                        autoCorrect={false}
                        autoCapitalize="words"
                        allowFontScaling={false}
                        editable={true}
                      />
                      {isSearching && (
                        <ActivityIndicator size="small" color="#539461" style={styles.loadingIndicator} />
                      )}
                    </View>

                    {/* Lists */}
                    <ScrollView 
                      ref={scrollRef}
                      style={styles.listsContainer} 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={[
                        styles.listsContentContainer,
                        filteredSellers.length === 0 && styles.listsContentContainerEmpty
                      ]}
                    >
                      {filteredSellers.length === 0 && !isSearching ? (
                        <View style={styles.emptyStateContainer}>
                          <Text style={styles.emptyStateText}>No sellers found</Text>
                          <Text style={styles.emptyStateSubtext}>
                            {searchQuery ? 'Try adjusting your search' : 'Start typing to search for sellers'}
                          </Text>
                        </View>
                      ) : (
                        filteredSellers.map((seller, index) => {
                          const name = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim();
                          return (
                            <View key={seller.id || seller.uid || index}>
                              <SellerItem
                                name={name}
                                email={seller.email}
                                onSelect={() => handleSelect(seller)}
                              />
                              {/* Divider */}
                              {index < filteredSellers.length - 1 && (
                                <View style={styles.dividerWrapper}>
                                  <View style={styles.divider} />
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </ScrollView>
                  </View>

                  {/* Action */}
                  <View style={styles.actionContainer}>
                    {/* Button View */}
                    <TouchableOpacity 
                      style={styles.buttonView} 
                      onPress={() => {
                        if (onReset && typeof onReset === 'function') {
                          onReset();
                        } else {
                          onClose();
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.buttonText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 620,
    height: '80%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    width: 287,
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flexGrow: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 415,
    alignSelf: 'stretch',
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  listsContainer: {
    width: '100%',
    height: 343,
    alignSelf: 'stretch',
  },
  listsContentContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 0,
    gap: 6,
  },
  listsContentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  sellerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    minHeight: 39,
    alignSelf: 'stretch',
  },
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    flex: 1,
  },
  sellerName: {
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
  },
  sellerEmail: {
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#647276',
    marginTop: 2,
  },
  dividerWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 17,
    alignSelf: 'stretch',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    alignSelf: 'stretch',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 60,
    alignSelf: 'stretch',
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

export default SellerNameFilter;

