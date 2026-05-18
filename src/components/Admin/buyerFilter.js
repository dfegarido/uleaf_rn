import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';

const parseBuyerSelectionInput = (input) => {
  if (input == null || input === '') return [];
  if (Array.isArray(input)) {
    return input.map((id) => String(id).trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const BuyerItem = ({ name, email, username, avatarUrl, isSelected, onToggle }) => {
  const [imageError, setImageError] = React.useState(false);
  const validAvatarUrl =
    avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : 'https://via.placeholder.com/40';

  const secondaryInfo = email || (username ? `@${username}` : null);

  return (
    <TouchableOpacity
      style={[styles.buyerItemContainer, isSelected && styles.buyerItemActive]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!isSelected }}
    >
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarContainer, isSelected && styles.avatarContainerActive]}>
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

      <View style={styles.detailsContainer}>
        <Text style={[styles.buyerName, isSelected && styles.buyerNameActive]} numberOfLines={1}>
          {name || 'Unknown Buyer'}
        </Text>
        {secondaryInfo ? (
          <Text style={styles.buyerSecondaryInfo} numberOfLines={1}>
            {secondaryInfo}
          </Text>
        ) : null}
      </View>

      <View style={isSelected ? styles.checkboxSelected : styles.checkbox}>
        {isSelected ? <CheckIcon width={16} height={16} fill="#FFFFFF" /> : null}
      </View>
    </TouchableOpacity>
  );
};

const BuyerFilter = ({
  isVisible,
  onClose,
  onSelectBuyer,
  buyers = [],
  onSearch,
  selectedValues,
  currentBuyer = null,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [selectedBuyerIds, setSelectedBuyerIds] = useState([]);
  const scrollRef = React.useRef(null);
  const searchTimeoutRef = React.useRef(null);
  const prevSearchQueryRef = React.useRef(searchQuery);

  const appliedSelectionKey = useMemo(() => {
    const fromProp =
      selectedValues !== undefined
        ? parseBuyerSelectionInput(selectedValues)
        : parseBuyerSelectionInput(currentBuyer);
    return fromProp.join('\u0001');
  }, [selectedValues, currentBuyer]);

  useEffect(() => {
    if (isVisible) {
      setSelectedBuyerIds(
        selectedValues !== undefined
          ? parseBuyerSelectionInput(selectedValues)
          : parseBuyerSelectionInput(currentBuyer),
      );
    }
  }, [isVisible, appliedSelectionKey, selectedValues, currentBuyer]);

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setIsSearching(false);
      setShowAllResults(false);
      prevSearchQueryRef.current = '';
      return;
    }
    setSearchQuery('');
    setIsSearching(false);
    setShowAllResults(false);
    prevSearchQueryRef.current = '';
  }, [isVisible]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const wasCleared =
      prevSearchQueryRef.current &&
      prevSearchQueryRef.current.trim().length >= 2 &&
      (!searchQuery || searchQuery.trim().length < 2);

    if (!searchQuery || searchQuery.trim().length < 2) {
      setIsSearching(false);
      if (wasCleared && onSearch && typeof onSearch === 'function') {
        onSearch('');
      }
      prevSearchQueryRef.current = searchQuery;
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch && typeof onSearch === 'function') {
        onSearch(searchQuery.trim());
      }
      setIsSearching(false);
    }, 500);

    prevSearchQueryRef.current = searchQuery;

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  const filteredBuyers = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return buyers.slice(0, 50);
    }

    const query = searchQuery.toLowerCase();
    const filtered = buyers.filter((buyer) => {
      const name = (buyer.name || '').toLowerCase();
      const email = (buyer.email || '').toLowerCase();
      const username = (buyer.username || '').toLowerCase();
      return name.includes(query) || email.includes(query) || username.includes(query);
    });

    return showAllResults ? filtered : filtered.slice(0, 5);
  }, [buyers, searchQuery, showAllResults]);

  const isBuyerSelected = (buyerId) => selectedBuyerIds.includes(buyerId);

  const handleToggle = (buyer) => {
    const id = buyer?.id;
    if (!id) return;
    setSelectedBuyerIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setSelectedBuyerIds([]);
  };

  const handleApply = () => {
    onSelectBuyer(selectedBuyerIds.length > 0 ? selectedBuyerIds : null);
    onClose();
  };

  const hasActiveSearch = searchQuery && searchQuery.trim().length >= 2;
  const canShowMoreSearchResults =
    hasActiveSearch && !showAllResults && filteredBuyers.length >= 5;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
                style={{ flex: 1 }}
              >
                <SafeAreaView style={{ flex: 1 }}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Buyer</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      activeOpacity={0.7}
                    >
                      <CloseIcon width={24} height={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contentContainer, { flex: 1 }]}>
                    <View style={styles.searchFieldContainer}>
                      <SearchIcon width={24} height={24} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search by name, email, or username"
                        placeholderTextColor="#647276"
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          setShowAllResults(false);
                        }}
                        caretColor="#539461"
                        selectionColor="#539461"
                        autoCorrect={false}
                        autoCapitalize="none"
                        allowFontScaling={false}
                      />
                      {isSearching ? (
                        <ActivityIndicator size="small" color="#539461" />
                      ) : null}
                    </View>

                    {canShowMoreSearchResults ? (
                      <TouchableOpacity
                        style={styles.showAllLink}
                        onPress={() => setShowAllResults(true)}
                      >
                        <Text style={styles.showAllLinkText}>Show all matching buyers</Text>
                      </TouchableOpacity>
                    ) : null}

                    <ScrollView
                      ref={scrollRef}
                      style={styles.listsContainer}
                      showsVerticalScrollIndicator
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={[
                        styles.listsContentContainer,
                        filteredBuyers.length === 0 && styles.listsContentContainerEmpty,
                      ]}
                    >
                      {filteredBuyers.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                          <Text style={styles.emptyStateText}>No buyers found</Text>
                          <Text style={styles.emptyStateSubtext}>
                            {searchQuery
                              ? 'Try adjusting your search'
                              : 'No buyer data available for these orders'}
                          </Text>
                        </View>
                      ) : (
                        filteredBuyers.map((buyer, index) => (
                          <View key={buyer.id || `buyer-${index}`}>
                            <BuyerItem
                              name={buyer.name}
                              email={buyer.email}
                              username={buyer.username}
                              avatarUrl={buyer.avatar}
                              isSelected={isBuyerSelected(buyer.id)}
                              onToggle={() => handleToggle(buyer)}
                            />
                            {index < filteredBuyers.length - 1 ? (
                              <View style={styles.dividerWrapper}>
                                <View style={styles.divider} />
                              </View>
                            ) : null}
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View
                    style={[
                      styles.actionContainer,
                      { paddingBottom: Math.max(insets.bottom, 12) },
                    ]}
                  >
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewButton} onPress={handleApply}>
                      <Text style={styles.viewButtonText}>View</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  titleText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 8,
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
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
  },
  showAllLink: {
    paddingVertical: 4,
  },
  showAllLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  listsContainer: {
    flex: 1,
    minHeight: 200,
  },
  listsContentContainer: {
    paddingVertical: 8,
    gap: 4,
  },
  listsContentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  buyerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 56,
    paddingVertical: 4,
  },
  buyerItemActive: {
    backgroundColor: '#F0F7F1',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  avatarWrapper: {
    marginRight: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarContainerActive: {},
  avatar: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#647276',
  },
  detailsContainer: {
    flex: 1,
    marginRight: 8,
  },
  buyerName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#202325',
  },
  buyerNameActive: {
    color: '#539461',
  },
  buyerSecondaryInfo: {
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerWrapper: {
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default BuyerFilter;
