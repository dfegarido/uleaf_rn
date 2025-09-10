import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import ArrowDownIcon from '../../assets/icons/greylight/caret-down-regular.svg';

const InputDropdownPaginated = ({
  options,
  onSelect,
  selectedOption,
  placeholder,
  disabled = false,
  onLoadMore = null, // Function to call when user scrolls to bottom
  hasMore = false, // Whether there are more items to load
  loadingMore = false, // Whether currently loading more items
}) => {
  const [visible, setVisible] = useState(false);

  const handleSelect = option => {
    onSelect(option);
    setVisible(false);
  };

  const handleEndReached = () => {
    if (hasMore && !loadingMore && onLoadMore) {
      console.log('📜 Loading more items...');
      onLoadMore();
    }
  };

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
        onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}>
          <View style={styles.modalContent}>
            {options.length === 0 ? (
              <Text style={styles.noResults}>No options available</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderOption}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.1} // Trigger when 10% from bottom
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              />
            )}
            
            {hasMore && !loadingMore && (
              <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={handleEndReached}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
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
});

export default InputDropdownPaginated;
