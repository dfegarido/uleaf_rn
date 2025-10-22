// CheckBoxGroup.js
import React, {useCallback, memo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';

const CheckBoxGroup = ({
  options = [],
  selectedValues = [],
  onChange,
  containerStyle,
  optionStyle,
  boxStyle,
  checkStyle,
  labelStyle,
}) => {
  const toggleSelection = useCallback((value) => {
    if (selectedValues && selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...(selectedValues || []), value]);
    }
  }, [selectedValues, onChange]);

  const renderItem = useCallback(({item}) => (
    <OptionRow
      item={item}
      selected={Array.isArray(selectedValues) && selectedValues.includes(item.value)}
      onToggle={toggleSelection}
      optionStyle={optionStyle}
      boxStyle={boxStyle}
      checkStyle={checkStyle}
      labelStyle={labelStyle}
    />
  ), [selectedValues, toggleSelection, optionStyle, boxStyle, checkStyle, labelStyle]);

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        data={options}
        keyExtractor={(item) => String(item.value)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        // Allow this FlatList to be nested inside ScrollViews used by
        // various action-sheet/modal wrappers. This avoids the common
        // runtime warning about VirtualizedLists nested in plain ScrollViews
        // while preserving native nested scrolling behavior.
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </View>
  );
};

const OptionRow = memo(({item, selected, onToggle, optionStyle, boxStyle, checkStyle, labelStyle}) => {
  return (
    <TouchableOpacity
      style={[styles.optionContainer, optionStyle]}
      onPress={() => onToggle(item.value)}
      activeOpacity={0.7}
    >
      <Text style={[globalStyles.textMDGreyDark, labelStyle]} numberOfLines={1}>
        {item.label}
      </Text>
      <View style={[styles.checkBox, boxStyle]}>
        {selected && (
          <View style={[styles.checked, checkStyle]} />
        )}
      </View>
    </TouchableOpacity>
  );
});

export default CheckBoxGroup;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkBox: {
    height: 20,
    width: 20,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: '#539461',
  },
});
