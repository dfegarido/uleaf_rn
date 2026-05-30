import React, { useState, useMemo, useEffect } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';

const parseSellerSelectionInput = (input) => {
  if (input == null || input === '') return [];
  if (Array.isArray(input)) {
    return input.map((id) => String(id).trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const SellerItem = ({ name, avatarUrl, isSelected, onToggle }) => {
  const [imageError, setImageError] = React.useState(false);
  const validAvatarUrl =
    avatarUrl && avatarUrl.trim()
      ? avatarUrl.trim()
      : 'https://gravatar.com/avatar/9ea2236ad96f3746617a5aeea3223515?s=400&d=robohash&r=x';

  return (
    <TouchableOpacity
      style={[styles.sellerItemContainer, isSelected && styles.sellerItemActive]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!isSelected }}
    >
      <View style={styles.avatarWrapper}>
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

      <Text style={[styles.sellerName, isSelected && styles.sellerNameActive]} numberOfLines={1}>
        {name || 'Unknown Seller'}
      </Text>

      <View style={isSelected ? styles.checkboxSelected : styles.checkbox}>
        {isSelected ? <CheckIcon width={16} height={16} fill="#FFFFFF" /> : null}
      </View>
    </TouchableOpacity>
  );
};

const SellerFilter = ({
  isVisible,
  onClose,
  onSelectSeller,
  sellers = [],
  selectedValues,
  currentSeller = null,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllResults, setShowAllResults] = useState(false);
  const [selectedSellerIds, setSelectedSellerIds] = useState([]);
  const scrollRef = React.useRef(null);

  const appliedSelectionKey = useMemo(() => {
    const fromProp =
      selectedValues !== undefined
        ? parseSellerSelectionInput(selectedValues)
        : parseSellerSelectionInput(currentSeller);
    return fromProp.join('\u0001');
  }, [selectedValues, currentSeller]);

  useEffect(() => {
    if (isVisible) {
      setSelectedSellerIds(
        selectedValues !== undefined
          ? parseSellerSelectionInput(selectedValues)
          : parseSellerSelectionInput(currentSeller),
      );
    }
  }, [isVisible, appliedSelectionKey, selectedValues, currentSeller]);

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setShowAllResults(false);
    }
  }, [isVisible]);

  const filteredSellers = useMemo(() => {
    const list = sellers || [];
    if (!searchQuery || searchQuery.trim().length < 2) {
      return list.slice(0, 50);
    }

    const query = searchQuery.toLowerCase();
    const filtered = list.filter((seller) => {
      const name = (seller.name || '').toLowerCase();
      return name.includes(query);
    });

    return showAllResults ? filtered : filtered.slice(0, 5);
  }, [sellers, searchQuery, showAllResults]);

  const isSellerSelected = (sellerId) => selectedSellerIds.includes(sellerId);

  const handleToggle = (seller) => {
    const id = seller?.id;
    if (!id) return;
    setSelectedSellerIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setSelectedSellerIds([]);
  };

  const handleApply = () => {
    onSelectSeller(selectedSellerIds.length > 0 ? selectedSellerIds : null);
    onClose();
  };

  const hasActiveSearch = searchQuery && searchQuery.trim().length >= 2;
  const canShowMoreSearchResults =
    hasActiveSearch && !showAllResults && filteredSellers.length >= 5;

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
            <View style={[styles.actionSheetContainer, { paddingBottom: Math.max(insets.bottom, 0) }]}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
                style={{ flex: 1 }}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Seller</Text>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                      <CloseIcon width={24} height={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contentContainer, { flex: 1 }]}>
                    <View style={styles.searchFieldContainer}>
                      <SearchIcon width={24} height={24} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search by name"
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
                    </View>

                    {canShowMoreSearchResults ? (
                      <TouchableOpacity
                        style={styles.showAllLink}
                        onPress={() => setShowAllResults(true)}
                      >
                        <Text style={styles.showAllLinkText}>Show all matching sellers</Text>
                      </TouchableOpacity>
                    ) : null}

                    <ScrollView
                      ref={scrollRef}
                      style={styles.listContainer}
                      showsVerticalScrollIndicator
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={
                        filteredSellers.length === 0 ? styles.listContentEmpty : undefined
                      }
                    >
                      {filteredSellers.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                          <Text style={styles.emptyStateText}>No sellers found</Text>
                          <Text style={styles.emptyStateSubtext}>
                            {searchQuery
                              ? 'Try adjusting your search'
                              : 'No seller data available for these orders'}
                          </Text>
                        </View>
                      ) : (
                        filteredSellers.map((seller, index) => (
                          <View key={seller.id || `seller-${index}`}>
                            <SellerItem
                              name={seller.name}
                              avatarUrl={seller.avatar}
                              isSelected={isSellerSelected(seller.id)}
                              onToggle={() => handleToggle(seller)}
                            />
                            {index < filteredSellers.length - 1 ? (
                              <View style={styles.divider} />
                            ) : null}
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewButton} onPress={handleApply}>
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
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
  listContainer: {
    flex: 1,
    minHeight: 200,
  },
  listContentEmpty: {
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
  sellerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 48,
    paddingVertical: 4,
    gap: 8,
  },
  sellerItemActive: {
    backgroundColor: '#F0F7F1',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
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
  sellerName: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  sellerNameActive: {
    color: '#539461',
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
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
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

export default SellerFilter;
