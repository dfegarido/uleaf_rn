import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ActionSheet from '../ActionSheet/ActionSheet';
import {RadioButton} from '../RadioButton';
import IconEx from '../../assets/icons/greylight/x-regular.svg';
import {globalStyles} from '../../assets/styles/styles';
import {CheckBoxGroup} from '../CheckBox';
import SelectableItemList from '../SelectableItems/SelectableItems';

const ReusableActionSheet = ({
  code,
  visible,
  onClose,
  sortOptions,
  genusOptions,
  variegationOptions,
  listingTypeOptions,
  sortValue,
  sortChange,
  genusValue,
  genusChange,
  variegationValue,
  variegationChange,
  listingTypeValue,
  listingTypeChange,
  handleSearchSubmit,
}) => {
  const resetSelection = () => variegationChange([]);
  const resetGenusSelection = () => genusChange([]);
  const resetListingTypeSelection = () => listingTypeChange([]);

  const renderSheetContent = () => {
    switch (code) {
      case 'SORT':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Sort</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <RadioButton
              options={sortOptions}
              selected={sortValue}
              onSelect={sortChange}
              containerStyle={{marginTop: 20}}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={handleSearchSubmit}
                style={{
                  paddingHorizontal: 20,
                  alignSelf: 'stretch',
                  width: '100%',
                }}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      case 'GENUS':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Genus</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{marginBottom: 60}}>
              <CheckBoxGroup
                options={genusOptions}
                selectedValues={genusValue}
                onChange={genusChange}
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                }}
              />
            </ScrollView>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
                backgroundColor: '#fff',
              }}>
              <TouchableOpacity
                onPress={resetGenusSelection}
                style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text
                    style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{width: '45%'}}
                onPress={handleSearchSubmit}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      case 'VARIEGATION':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Variegation</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{marginBottom: 60}}>
              <SelectableItemList
                options={variegationOptions}
                selectedValues={variegationValue}
                onSelectionChange={variegationChange}
              />
            </ScrollView>
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

              <TouchableOpacity
                style={{width: '45%'}}
                onPress={handleSearchSubmit}>
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
              selectedValues={listingTypeValue}
              onChange={listingTypeChange}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={resetListingTypeSelection}
                style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text
                    style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{width: '45%'}}
                onPress={handleSearchSubmit}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
