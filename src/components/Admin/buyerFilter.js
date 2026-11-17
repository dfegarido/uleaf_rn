import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
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
import Animated, { FadeIn, FadeInUp, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../../screens/Admin/Home/AdminUserUi';
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

// Placeholder-service URLs draw a grey "40 x 40" box; treat them as no photo so the
// coloured initials show instead.
const realPhoto = (url) => {
  const value = String(url || '').trim();
  if (!value || /placeholder\.com|placehold\.co/i.test(value)) return null;
  return value;
};

const BuyerItem = ({ id, name, email, username, avatarUrl, isSelected, onToggle }) => {
  const secondaryInfo = email || (username ? `@${username}` : null);

  return (
    <TouchableOpacity
      style={[styles.buyerItemContainer, isSelected && styles.buyerItemActive]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!isSelected }}
    >
      <View style={styles.avatarWrapper}>
        <UserAvatar user={{ id, profileImage: realPhoto(avatarUrl) }} title={name} size={40} />
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
        {isSelected ? (
          // Small spring pop each time a buyer is ticked.
          <Animated.View entering={ZoomIn.springify().damping(14).stiffness(260)}>
            <CheckIcon width={16} height={16} fill="#FFFFFF" />
          </Animated.View>
        ) : null}
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
  embedded = false,
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
      return buyers;
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

  const sheet = (
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInDown.duration(280)}
              style={styles.actionSheetContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
                style={{ flex: 1 }}
              >
                {/* Plain View, not SafeAreaView: the sheet never reaches the notch, and the
                    safe-area top inset left a large empty gap above the title. The bottom
                    inset is applied once, on the buttons row. */}
                <View style={{ flex: 1 }}>
                  <View style={styles.grabber} />
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
                          <Animated.View
                            key={buyer.id || `buyer-${index}`}
                            entering={FadeInUp.duration(240).delay(120 + Math.min(index, 8) * 40)}>
                            <BuyerItem
                              id={buyer.id}
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
                          </Animated.View>
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
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
  );

  if (embedded) {
    if (!isVisible) return null;
    return <View style={{flex: 1}}>{sheet}</View>;
  }

  return (
    <Modal
      animationType="none"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      {sheet}
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
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    backgroundColor: '#D5D9D4',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
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
    // Same inset on every row, so the selected highlight sits evenly around it.
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  buyerItemActive: {
    backgroundColor: '#F0F7F1',
  },
  avatarWrapper: {
    marginRight: 8,
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
