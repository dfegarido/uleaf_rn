import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import IconPlus from '../../assets/icons/greylight/plus-regular.svg';
import IconEx from '../../assets/icons/white/x-regular.svg';

const SelectableItemList = ({
  options = [],
  selectedValues = [],
  onSelectionChange,
}) => {
  const toggleSelection = value => {
    const updated = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];

    onSelectionChange?.(updated); // notify parent
  };

  return (
    <View style={styles.container}>
      <View style={styles.itemContainer}>
        {options.map(opt => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => toggleSelection(opt.value)}
              style={[styles.item, isSelected && styles.selectedItem]}>
              {isSelected ? (
                <>
                  <Text style={{color: '#fff', fontSize: 14}}>{opt.label}</Text>
                  <IconEx width={20} height={20} color="#393D40" />
                </>
              ) : (
                <>
                  <Text style={{color: '#393D40', fontSize: 14}}>
                    {opt.label}
                  </Text>
                  <IconPlus width={20} height={20} color="#393D40" />
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default SelectableItemList;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderColor: '#CDD3D4',
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedItem: {
    backgroundColor: '#539461',
  },
});
