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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';

const parseSelectionInput = (input) => {
  if (input == null || input === '') return [];
  if (Array.isArray(input)) {
    return input.map((id) => String(id).trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const HubStaffItem = ({ name, avatarUrl, isSelected, onToggle }) => {
  const [imageError, setImageError] = React.useState(false);
  const validAvatarUrl =
    avatarUrl && avatarUrl.trim()
      ? avatarUrl.trim()
      : 'https://gravatar.com/avatar/9ea2236ad96f3746617a5aeea3223515?s=400&d=robohash&r=x';

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isSelected && styles.itemActive]}
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

      <Text style={[styles.itemName, isSelected && styles.itemNameActive]} numberOfLines={1}>
        {name || 'Unknown'}
      </Text>

      <View style={isSelected ? styles.checkboxSelected : styles.checkbox}>
        {isSelected ? <CheckIcon width={16} height={16} fill="#FFFFFF" /> : null}
      </View>
    </TouchableOpacity>
  );
};

const ReceiverFilter = ({
  isVisible,
  onClose,
  onSelectReceiver,
  receivers = [],
  selectedValues,
  currentHubReceiver = null,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllResults, setShowAllResults] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const scrollRef = React.useRef(null);

  const appliedSelectionKey = useMemo(() => {
    const fromProp =
      selectedValues !== undefined
        ? parseSelectionInput(selectedValues)
        : parseSelectionInput(currentHubReceiver);
    return fromProp.join('\u0001');
  }, [selectedValues, currentHubReceiver]);

  useEffect(() => {
    if (isVisible) {
      setSelectedIds(
        selectedValues !== undefined
          ? parseSelectionInput(selectedValues)
          : parseSelectionInput(currentHubReceiver),
      );
    }
  }, [isVisible, appliedSelectionKey, selectedValues, currentHubReceiver]);

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setShowAllResults(false);
    }
  }, [isVisible]);

  const filteredItems = useMemo(() => {
    const list = receivers || [];
    if (!searchQuery || searchQuery.trim().length < 2) {
      return list.slice(0, 50);
    }

    const query = searchQuery.toLowerCase();
    const filtered = list.filter((item) =>
      (item.name || '').toLowerCase().includes(query),
    );

    return showAllResults ? filtered : filtered.slice(0, 5);
  }, [receivers, searchQuery, showAllResults]);

  const isSelected = (id) => selectedIds.includes(id);

  const handleToggle = (item) => {
    const id = item?.id;
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setSelectedIds([]);
  };

  const handleApply = () => {
    onSelectReceiver(selectedIds.length > 0 ? selectedIds : null);
    onClose();
  };

  const hasActiveSearch = searchQuery && searchQuery.trim().length >= 2;
  const canShowMoreSearchResults =
    hasActiveSearch && !showAllResults && filteredItems.length >= 5;

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
                style={{ flex: 1 }}
              >
                <SafeAreaView style={{ flex: 1 }}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Order Receiver</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
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
                        <Text style={styles.showAllLinkText}>Show all matching order receivers</Text>
                      </TouchableOpacity>
                    ) : null}

                    <ScrollView
                      ref={scrollRef}
                      style={styles.listsContainer}
                      showsVerticalScrollIndicator
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      contentContainerStyle={
                        filteredItems.length === 0 ? styles.listContentEmpty : undefined
                      }
                    >
                      {filteredItems.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                          <Text style={styles.emptyStateText}>No order receivers found</Text>
                          <Text style={styles.emptyStateSubtext}>
                            {searchQuery
                              ? 'Try adjusting your search'
                              : 'No order receiver data available for these orders'}
                          </Text>
                        </View>
                      ) : (
                        filteredItems.map((item, index) => (
                          <View key={item.id || `hub-${index}`}>
                            <HubStaffItem
                              name={item.name}
                              avatarUrl={item.avatar}
                              isSelected={isSelected(item.id)}
                              onToggle={() => handleToggle(item)}
                            />
                            {index < filteredItems.length - 1 ? (
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 48,
    paddingVertical: 4,
    gap: 8,
  },
  itemActive: {
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
  itemName: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  itemNameActive: {
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

export default ReceiverFilter;
