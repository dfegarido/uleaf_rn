import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import StatusBadge from './ListingStatusBadge';
import {globalStyles} from '../../../../assets/styles/styles';
import {BadgeWithTransparentNotch} from '../../../../components/DiscountBadge';
import {InputCheckBox} from '../../../../components/Input';

import IconPin from '../../../../assets/icons/greylight/pin-light.svg';
import IconAccentPin from '../../../../assets/icons/accent/pin.svg';
import IconMenu from '../../../../assets/icons/greylight/dots-three-vertical-regular.svg';
import IconDiscountList from '../../../../assets/icons/accent/discount-list.svg';

const COLUMN_WIDTH = 150;

const ListingTable = ({
  headers = [],
  data = [{}],
  onEditPressFilter,
  onPressDiscount,
  module,
  navigateToListAction,
  onPressTableListPin,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleCheckbox = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  return (
    <ScrollView horizontal>
      <View>
        {/* Header */}
        <View style={[styles.row, {backgroundColor: '#E4E7E9'}]}>
          {headers.map((header, index) => {
            if (index === 0) {
              return (
                <View
                  key={index}
                  style={{
                    width: 100,
                    padding: 10,
                    borderColor: '#ccc',
                    borderBottomWidth: 1,
                  }}>
                  <Text
                    style={[
                      globalStyles.textSMGreyDark,
                      globalStyles.textBold,
                    ]}>
                    {header}
                  </Text>
                </View>
              );
            }
            if (index === 2) {
              return (
                <View
                  key={index}
                  style={{
                    width: 80,
                    padding: 10,
                    borderColor: '#ccc',
                    borderBottomWidth: 1,
                  }}>
                  <Text style={globalStyles.textSMGreyDark}>{header}</Text>
                </View>
              );
            }
            if (index === 7) {
              return (
                <View
                  key={index}
                  style={{
                    width: 180,
                    padding: 10,
                    borderColor: '#ccc',
                    borderBottomWidth: 1,
                  }}>
                  <Text style={globalStyles.textSMGreyDark}>{header}</Text>
                </View>
              );
            }
            return (
              <View key={index} style={styles.cell}>
                <Text style={globalStyles.textSMGreyDark}>{header}</Text>
              </View>
            );
          })}
        </View>

        {/* Rows */}
        {data.map((dataparse, index) => (
          <View style={styles.row} key={index}>
            <View
              style={{
                width: 100,
                padding: 10,
                borderColor: '#ccc',
                borderBottomWidth: 1,
              }}>
              <Image
                style={styles.image}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
              <View style={{position: 'absolute', top: 15, left: 15}}>
                {module === 'MAIN' ? (
                  <InputCheckBox
                    label=""
                    checked={selectedIds.includes(dataparse.id)}
                    onChange={() => navigateToListAction()}
                  />
                ) : (
                  <InputCheckBox
                    label=""
                    checked={selectedIds.includes(dataparse.id)}
                    onChange={() => toggleCheckbox(dataparse.id)}
                  />
                )}
              </View>
            </View>

            <View style={styles.cell}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  globalStyles.textBold,
                  {paddingBottom: 5},
                ]}>
                {dataparse.plantName}
              </Text>
              <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}>
                {dataparse.subPlantName}
                {dataparse.statusCode}
              </Text>
              <StatusBadge statusCode={dataparse.statusCode} />
            </View>

            <TouchableOpacity
              style={{
                width: 70,
                padding: 10,
                borderColor: '#ccc',
                borderBottomWidth: 1,
              }}
              onPress={() => onPressTableListPin('')}>
              {dataparse.isPin == 0 ? (
                <IconPin width={20} height={20} />
              ) : (
                <IconAccentPin width={20} height={20} />
              )}
            </TouchableOpacity>

            {dataparse.listingCode !== 'L1' ? (
              <View style={styles.cell}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: '#000',
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                    },
                  ]}>
                  <Text style={{color: '#fff'}}>{dataparse.listingType}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.cell}></View>
            )}

            <View style={styles.cell}>
              {dataparse.potSize.map((parsePotSize, indexPot) => (
                <View
                  key={parsePotSize}
                  style={[
                    styles.badge,
                    {
                      backgroundColor: '#E4E7E9',
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                      marginBottom: 10,
                    },
                  ]}>
                  <Text style={{color: '#000'}}>{parsePotSize}</Text>
                </View>
              ))}
            </View>

            {dataparse.discountPrice !== '' ? (
              <View style={[styles.cell, {flexDirection: 'row'}]}>
                <Text style={[globalStyles.textMDAccent, {paddingRight: 10}]}>
                  {dataparse.price}
                </Text>
                <Text style={[styles.strikeText, globalStyles.textMDGreyLight]}>
                  {dataparse.price}
                </Text>
              </View>
            ) : (
              <View style={[styles.cell, {flexDirection: 'row'}]}>
                <Text style={globalStyles.textMDGreyLight}>
                  {dataparse.price}
                </Text>
              </View>
            )}

            <View style={styles.cell}>
              <Text>{dataparse.quantity}</Text>
              {dataparse.listingCode !== 'L1' && (
                <TouchableOpacity>
                  <Text style={{color: 'red', marginTop: 10}}>Add Stock</Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                width: 180,
                padding: 10,
                borderColor: '#ccc',
                borderBottomWidth: 1,
              }}>
              {dataparse.discountPercentage !== '' ? (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <BadgeWithTransparentNotch
                      borderRadius={10}
                      text={dataparse.discountPercentage}
                      height={30}
                      width={80}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        onEditPressFilter({
                          pressCode: dataparse.listingCode,
                          id: dataparse.id,
                        })
                      }>
                      <IconMenu width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{paddingTop: 10}}>
                    <Text style={globalStyles.textMDAccent}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <TouchableOpacity style={{flexDirection: 'row'}}>
                    <IconDiscountList width={20} height={20} />
                    <TouchableOpacity
                      onPress={() => onPressDiscount({id: dataparse.id})}>
                      <Text style={globalStyles.textSMAccent}>
                        Apply Discount
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      onEditPressFilter({
                        pressCode: dataparse.listingCode,
                        id: dataparse.id,
                      })
                    }>
                    <IconMenu width={20} height={20} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: COLUMN_WIDTH,
    padding: 10,
    borderColor: '#ccc',
    borderBottomWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  badge: {
    top: -5,
    right: -10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: 'black',
  },
});

export default ListingTable;
