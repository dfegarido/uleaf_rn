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

const InputDropdownSearch = ({
  options,
  onSelect,
  selectedOption,
  placeholder,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSelect = option => {
    onSelect(option);
    setVisible(false);
    setSearchText('');
  };

  const filteredOptions = options.filter(item =>
    item.toLowerCase().includes(searchText.toLowerCase()),
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
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            {/* Search bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
            />

            {options.length === 0 ? (
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
