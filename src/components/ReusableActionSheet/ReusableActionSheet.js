import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ActionSheet from '../ActionSheet/ActionSheet';
import {RadioButton} from '../RadioButton';
import IconEx from '../../assets/icons/greylight/x-regular.svg';
import {globalStyles} from '../../assets/styles/styles';
import {CheckBoxGroup} from '../CheckBox';
import SelectableItemList from '../SelectableItems/SelectableItems';

const sortOptions = [
  {label: 'Newest', value: 'Newest'},
  {label: 'Oldest', value: 'Oldest'},
  {label: 'Price Low to High', value: 'Price Low to High'},
  {label: 'Price High to Low', value: 'Price High to Low'},
  {label: 'Most Loved', value: 'Most Loved'},
];

const genusOptions = [
  {label: 'Mostera', value: 'Mostera'},
  {label: 'Alocasia', value: 'Alocasia'},
  {label: 'Scindapsus', value: 'Scindapsus'},
  {label: 'Anthurium', value: 'Anthurium'},
  {label: 'Philodendron', value: 'Philodendron'},
  {label: 'Syngonium', value: 'Syngonium'},
  {label: 'Hoya', value: 'Hoya'},
  {label: 'Others', value: 'Others'},
];

const items = [
  {label: 'Albo', value: 'Albo'},
  {label: 'Aurea', value: 'Aurea'},
  {label: 'Caramel Latte', value: 'Caramel Latte'},
  {label: 'Fire', value: 'Fire'},
  {label: 'Galaxy', value: 'Galaxy'},
  {label: 'Green On Green', value: 'Green On Green'},
  {label: 'Inner Variegated', value: 'Inner Variegated'},
];

const listingTypeOptions = [
  {label: 'Single Plant', value: 'Single Plant'},
  {label: 'Wholesale', value: 'Wholesale'},
  {label: "Grower's Choice", value: "Grower's Choice"},
];

const ReusableActionSheet = ({code, visible, onClose}) => {
  const [sort, setSort] = useState('');
  const [selectedGenus, setSelectedGenus] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const resetSelection = () => setSelectedItems([]);

  const handleSelectionChange = newSelected => {
    setSelectedItems(newSelected);
  };

  const renderSheetContent = () => {
    switch (code) {
      case 'SORT':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'50%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Sort</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <RadioButton
              options={sortOptions}
              selected={sort}
              onSelect={setSort}
              containerStyle={{marginTop: 20}}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <TouchableOpacity style={{marginHorizontal: 20}}>
              <View style={globalStyles.primaryButton}>
                <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          </ActionSheet>
        );
      case 'GENUS':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'60%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Genus</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <CheckBoxGroup
              options={genusOptions}
              selectedValues={selectedGenus}
              onChange={setSelectedGenus}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <TouchableOpacity style={{marginHorizontal: 20}}>
              <View style={globalStyles.primaryButton}>
                <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          </ActionSheet>
        );
      case 'VARIEGATION':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'60%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Variegation</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <View>
              <SelectableItemList
                options={items}
                selectedValues={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity onPress={resetSelection} style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text
                    style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{width: '45%'}}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{flex: 1, flexDirection: 'row', gap: 10}}>
              {/*  */}
            </View>
          </ActionSheet>
        );
      case 'LISTINGTYPE':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Listing Type</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <CheckBoxGroup
              options={listingTypeOptions}
              selectedValues={selectedGenus}
              onChange={setSelectedGenus}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <TouchableOpacity style={{marginHorizontal: 20}}>
              <View style={globalStyles.primaryButton}>
                <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          </ActionSheet>
        );
      default:
        return null;
    }
  };

  return <View>{renderSheetContent()}</View>;
};

const styles = StyleSheet.create({
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
  },
});

export default ReusableActionSheet;
