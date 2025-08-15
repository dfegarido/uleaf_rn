import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';

import ArrowDownIcon from '../../assets/icons/greylight/caret-down-regular.svg';

const InputDropdown = ({
  options,
  onSelect,
  selectedOption,
  placeholder,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  const handleSelect = option => {
    onSelect(option);
    setVisible(false);
  };

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
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => handleSelect(item)}>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
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
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 10,
    padding: 10,
    maxHeight: 300,
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

export default InputDropdown;
