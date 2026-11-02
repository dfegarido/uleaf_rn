import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {globalStyles} from '../assets/styles/styles';
import BuyerPickerSheet, {buyerName} from './BuyerPickerSheet';
import ArrowDownIcon from '../assets/icons/greylight/caret-down-regular.svg';
import CloseIcon from '../assets/icons/greylight/x-regular.svg';

/**
 * Optional buyer picker, shown with genus / species / variegation.
 * The stored value is the buyer's username. Leaving it blank publishes
 * the listing with no reservation.
 */
const ReserveForBuyerField = ({value, onChange}) => {
  const [visible, setVisible] = useState(false);
  const [chosen, setChosen] = useState(null);

  const closedLabel =
    value && chosen && chosen.username === value
      ? buyerName(chosen) || chosen.username
      : value;

  const selectBuyer = buyer => {
    if (!buyer.username) return;
    setChosen(buyer);
    onChange(buyer.username);
    setVisible(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
        Reserve for buyer
      </Text>
      <View style={styles.dropdown}>
        <TouchableOpacity
          style={styles.dropdownMain}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}>
          <Text
            style={[styles.dropdownText, !value && styles.placeholder]}
            numberOfLines={1}>
            {closedLabel || 'Choose a buyer (optional)'}
          </Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity
            onPress={() => {
              setChosen(null);
              onChange('');
            }}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Clear buyer">
            <CloseIcon width={18} height={18} />
          </TouchableOpacity>
        ) : (
          <ArrowDownIcon width={20} height={20} />
        )}
      </View>
      <Text style={[globalStyles.textXSGreyDark, {paddingTop: 5}]}>
        Optional. The plant shows as reserved for this buyer.
      </Text>

      <BuyerPickerSheet
        visible={visible}
        title="Reserve for buyer"
        purpose="listing-reserve"
        selectedUsername={value}
        onSelect={selectBuyer}
        onClose={() => setVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {paddingBottom: 20},
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownMain: {flex: 1, paddingRight: 8},
  dropdownText: {color: '#333', fontSize: 16},
  placeholder: {color: '#999'},
});

export default ReserveForBuyerField;
