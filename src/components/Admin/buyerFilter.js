import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

const BuyerItem = ({ name, email, username, avatarUrl, onSelect }) => {
  const [imageError, setImageError] = React.useState(false);
  const validAvatarUrl = avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : 'https://via.placeholder.com/40';

  // Show email or username as secondary info
  const getSecondaryInfo = () => {
    if (email) return email;
    if (username) return `@${username}`;
    return null;
  };

  const secondaryInfo = getSecondaryInfo();

  return (
    <TouchableOpacity style={styles.buyerItemContainer} onPress={onSelect}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          {!imageError && validAvatarUrl ? (
            <Image 
              source={{ uri: validAvatarUrl }} 
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.buyerName}>{name || 'Unknown Buyer'}</Text>
        {secondaryInfo && (
          <Text style={styles.buyerSecondaryInfo}>{secondaryInfo}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const BuyerFilter = ({ isVisible, onClose, onSelectBuyer, onReset, buyers = [], onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = React.useRef(null);
  const searchTimeoutRef = React.useRef(null);

  // Track previous search query to detect when it's cleared
  const prevSearchQueryRef = React.useRef(searchQuery);

  // Debounced search - calls API after user stops typing
  React.useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Detect if search was cleared (went from non-empty to empty)
    const wasCleared = prevSearchQueryRef.current && prevSearchQueryRef.current.trim().length >= 2 && 
                       (!searchQuery || searchQuery.trim().length < 2);
    
    // If query is empty or too short
    if (!searchQuery || searchQuery.trim().length < 2) {
      setIsSearching(false);
      // If search was just cleared (was non-empty, now empty), restore full list
      if (wasCleared && onSearch && typeof onSearch === 'function') {
        console.log('[BuyerFilter] Search cleared, restoring full buyer list');
        onSearch(''); // Call with empty string to restore full list
      }
      prevSearchQueryRef.current = searchQuery;
      return;
    }

    // Set searching state
    setIsSearching(true);

    // Debounce: Wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      console.log('[BuyerFilter] Debounced search triggered for:', searchQuery);
      if (onSearch && typeof onSearch === 'function') {
        onSearch(searchQuery.trim());
      }
      setIsSearching(false);
    }, 500);

    // Update previous search query
    prevSearchQueryRef.current = searchQuery;

    // Cleanup timeout on unmount or when query changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  // Debug: Log when component receives props
  React.useEffect(() => {
    if (isVisible) {
      console.log('[BuyerFilter] Modal opened with', buyers.length, 'buyers available');
      if (buyers.length === 0) {
        console.warn('[BuyerFilter] ⚠️ No buyers in prop! This might cause "no buyers found"');
      } else if (buyers.length <= 5) {
        console.log('[BuyerFilter] ⚠️ Only', buyers.length, 'buyers - might be from previous search');
      }
    }
  }, [isVisible, buyers.length]);

  // Reset search when modal closes or opens
  React.useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setIsSearching(false);
    } else {
      // When modal opens, reset search query to show all buyers
      console.log('[BuyerFilter] Modal opened, resetting search query');
      setSearchQuery('');
      setIsSearching(false);
      // Reset previous search query ref
      prevSearchQueryRef.current = '';
    }
  }, [isVisible]);

  // Filter buyers based on the search query (name, email, or username)
  // If search query is empty or less than 2 chars, show all buyers (up to 50 for performance)
  // If searching, filter and limit to 5 results
  const filteredBuyers = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      // Show all buyers when no search query (up to 50 for performance)
      const allBuyers = buyers.slice(0, 50);
      console.log('[BuyerFilter] No search query, showing all buyers:', allBuyers.length, 'of', buyers.length);
      return allBuyers;
    }
    
    // Filter when searching
    const filtered = buyers
      .filter(buyer => {
        const query = searchQuery.toLowerCase();
        const name = (buyer.name || '').toLowerCase();
        const email = (buyer.email || '').toLowerCase();
        const username = (buyer.username || '').toLowerCase();
        
        return name.includes(query) || email.includes(query) || username.includes(query);
      })
      .slice(0, 5); // Limit to 5 suggestions when searching
    
    console.log('[BuyerFilter] Search query:', searchQuery, '| Filtered:', filtered.length, 'of', buyers.length);
    return filtered;
  }, [buyers, searchQuery]);

  // Debug: Log filtered results
  React.useEffect(() => {
    console.log('[BuyerFilter] Search query:', searchQuery, '| Filtered results:', filteredBuyers.length, '(limited to 5)');
  }, [searchQuery, filteredBuyers.length]);

  const handleSelect = (buyer) => {
    onSelectBuyer(buyer?.id || null);
    onClose();
  };

  const handleReset = () => {
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
                  <Text style={styles.titleText}>Buyer</Text>
                  
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
                      placeholder="Search by name, email, or username"
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
                      autoCapitalize="none"
                      allowFontScaling={false}
                      editable={true}
                    />
                    {isSearching && (
                      <ActivityIndicator size="small" color="#539461" />
                    )}
                  </View>

                  {/* Lists */}
                  <ScrollView 
                    ref={scrollRef}
                    style={styles.listsContainer} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.listsContentContainer,
                      filteredBuyers.length === 0 && styles.listsContentContainerEmpty
                    ]}
                  >
                    {filteredBuyers.length === 0 ? (
                      <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No buyers found</Text>
                        <Text style={styles.emptyStateSubtext}>
                          {searchQuery ? 'Try adjusting your search' : 'No buyer data available for these orders'}
                        </Text>
                      </View>
                    ) : (
                      filteredBuyers.map((buyer, index) => (
                        <View key={buyer.id}>
                          {/* Social / Option User List */}
                          <BuyerItem
                            name={buyer.name}
                            email={buyer.email}
                            username={buyer.username}
                            avatarUrl={buyer.avatar}
                            onSelect={() => handleSelect(buyer)}
                          />
                          {/* Divider */}
                          {index < filteredBuyers.length - 1 && (
                            <View style={styles.dividerWrapper}>
                              <View style={styles.divider} />
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  {/* Button View */}
                  <TouchableOpacity 
                    style={styles.buttonView} 
                    onPress={() => {
                      // "View All" should clear the buyer filter and show all orders
                      if (onReset && typeof onReset === 'function') {
                        onReset();
                      } else {
                        // Fallback to just closing if onReset is not provided
                        onClose();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Text */}
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonText}>View All</Text>
                    </View>
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
  // Filter: Buyer
  filterContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: '100%',
    height: 569,
  },
  // Action Sheet
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 620,
    height: '80%',
  },
  // Title
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
    flex: 0,
  },
  // Text
  titleText: {
    width: 287,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    flexGrow: 1,
  },
  // Close
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
  },
  // Icon
  closeIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  // Content
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 415,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Search Field
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
  // Text Field
  textFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Icon: Left
  searchIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  // Placeholder / Text Input
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  // Lists
  listsContainer: {
    width: '100%',
    height: 343,
    flex: 0,
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
  // Empty State
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
  // Social / Option User List
  buyerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    minHeight: 56,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Avatar wrapper
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: 40,
    height: 40,
    flex: 0,
  },
  // Avatar
  avatarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 1000,
    flex: 0,
  },
  // avatar image
  avatar: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 1000,
    flex: 0,
  },
  // avatar placeholder
  avatarPlaceholder: {
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#647276',
  },
  // Details
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 0,
    width: 279,
    flex: 1,
    marginLeft: 8,
  },
  // Text
  buyerName: {
    width: '100%',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
    flex: 0,
    alignSelf: 'stretch',
  },
  buyerSecondaryInfo: {
    width: '100%',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#647276',
    marginTop: 2,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Divider wrapper
  dividerWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 17,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    flex: 0,
    alignSelf: 'stretch',
  },
  // Action
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 60,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flex: 1,
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  // Button View
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
  // Text container
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    gap: 8,
    width: 79,
    height: 16,
    flex: 0,
  },
  // Button text
  buttonText: {
    width: 63,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    flex: 0,
  },
  // System / Home Indicator
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  // Gesture Bar
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default BuyerFilter;