import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';

import ArrowDownIcon from '../../assets/icons/greylight/caret-down-regular.svg';
import CloseIcon from '../../assets/icons/greylight/x-regular.svg';

const InputDropdownSearch = ({
  options,
  onSelect,
  selectedOption,
  placeholder,
  disabled = false,
  clearable = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSelect = option => {
    onSelect(option);
    setVisible(false);
    setSearchText('');
  };

  const handleClear = () => {
    onSelect('');
    setSearchText('');
    setVisible(false);
  };

  const optionLabel = item => {
    if (typeof item === 'string') return item;
    if (item == null) return '';
    return String(item.name ?? item.label ?? item.value ?? '');
  };

  const optionList = Array.isArray(options) ? options : [];
  const filteredOptions = optionList
    .map(optionLabel)
    .filter(
      label => label && label.toLowerCase().includes(searchText.toLowerCase()),
    );
  const showClear = clearable && Boolean(selectedOption) && !disabled;

  return (
    <View style={styles.container}>
      <View style={[styles.dropdown, disabled && styles.dropdownDisabled]}>
        <TouchableOpacity
          style={styles.dropdownMain}
          onPress={() => {
            if (!disabled) setVisible(true);
          }}
          activeOpacity={disabled ? 1 : 0.7}>
          <Text
            style={[
              styles.dropdownText,
              disabled && styles.dropdownTextDisabled,
            ]}
            numberOfLines={1}>
            {selectedOption || placeholder || 'Select an option'}
          </Text>
        </TouchableOpacity>
        {showClear ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Clear selection">
            <CloseIcon width={18} height={18} />
          </TouchableOpacity>
        ) : (
          <ArrowDownIcon
            width={20}
            height={20}
            style={[styles.icon, disabled && styles.iconDisabled]}
          />
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
            />

            {optionList.length === 0 ? (
              <Text style={styles.noResults}>No options available</Text>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => handleSelect(item)}>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResults}>No results found</Text>
                }
                keyboardShouldPersistTaps="handled"
              />
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
  dropdownMain: {
    flex: 1,
    paddingRight: 8,
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
  clearBtn: {
    padding: 2,
  },
  icon: {},
  iconDisabled: {
    tintColor: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    maxHeight: 350,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    color: '#000',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
});

export default InputDropdownSearch;
