import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';
import CloseIcon from '../../../assets/icons/greylight/x-regular.svg';

const InputSearch = ({
  placeholder,
  value,
  onChangeText,
  onSubmitEditing,
  returnKeyType = 'search',
  onBlur,
  showClear = false,
}) => {
  const handleClear = () => {
    const clearedText = '';
    onChangeText(clearedText);
    Keyboard.dismiss();
    if (onSubmitEditing) {
      onSubmitEditing({nativeEvent: {text: clearedText}}); // Pass empty text as expected
    }
  };

  const handleSearch = () => {
    if (onSubmitEditing) {
      onSubmitEditing({nativeEvent: {text: value}}); // Pass current input value
    } else {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity onPress={handleSearch}>
        <SearchIcon width={20} height={20} style={styles.icon} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing || Keyboard.dismiss}
        returnKeyType={returnKeyType}
        onBlur={onBlur}
      />

      {showClear && value.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <CloseIcon width={18} height={18} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  clearIcon: {
    marginLeft: 8,
  },
});

export default InputSearch;
