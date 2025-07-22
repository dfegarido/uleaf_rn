import React from 'react';
import {Pressable, Text, View, StyleSheet} from 'react-native';
import MyCheckIcon from '../../assets/icons/white/check-regular.svg'; // replace with the actual path to your icon

const InputCheckBox = ({label, checked, onChange}) => {
  return (
    <Pressable onPress={() => onChange(!checked)} style={styles.container}>
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <MyCheckIcon width={20} height={20} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#647276',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    // marginRight: 10,
  },
  checked: {
    padding: 10,
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  label: {
    fontSize: 16,
    marginLeft: 5,
    color: '#393D40',
  },
});

export default InputCheckBox;
