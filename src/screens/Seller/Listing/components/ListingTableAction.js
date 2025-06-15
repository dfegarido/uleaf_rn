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

const ListingTableAction = ({
  headers = [],
  data = [{}],
  selectedIds = [],
  setSelectedIds,
}) => {
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
          {headers.map((header, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                index === 0 && {width: 100},
                index === 2 && {width: 80},
                index === 7 && {width: 180},
                {padding: 10, borderColor: '#ccc', borderBottomWidth: 1},
              ]}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  index === 0 ? globalStyles.textBold : {},
                ]}>
                {header}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((listing, index) => (
          <View style={styles.row} key={listing.id || index}>
            {/* Image and Checkbox */}
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
                  uri:
                    listing.imagePrimary ||
                    listing.image ||
                    'https://via.placeholder.com/80x80.png?text=No+Image',
                }}
              />
              <View style={{position: 'absolute', top: 15, left: 15}}>
                <InputCheckBox
                  label=""
                  checked={selectedIds.includes(listing.id)}
                  onChange={() => toggleCheckbox(listing.id)}
                />
              </View>
            </View>

            {/* Genus + Species + Status */}
            <View style={styles.cell}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  globalStyles.textBold,
                  {paddingBottom: 5},
                ]}>
                {listing.genus} {listing.species}
              </Text>
              <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}>
                {listing.variegation}
              </Text>
              <StatusBadge statusCode={listing.status} />
            </View>

            {/* Pin Tag */}
            <View
              style={{
                width: 70,
                padding: 10,
                borderColor: '#ccc',
                borderBottomWidth: 1,
              }}>
              {listing.pinTag ? (
                <IconAccentPin width={20} height={20} />
              ) : (
                <IconPin width={20} height={20} />
              )}
            </View>

            {/* Listing Type */}
            {listing.listingType !== 'L1' ? (
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
                  <Text style={{color: '#fff'}}>{listing.listingType}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.cell}></View>
            )}

            {/* Pot Size Variation (single value or null) */}
            <View style={styles.cell}>
              {listing.potSize ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: '#E4E7E9',
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                      marginBottom: 10,
                    },
                  ]}>
                  <Text style={{color: '#000'}}>{listing.potSize}</Text>
                </View>
              ) : (
                <Text style={globalStyles.textSMGreyLight}></Text>
              )}
            </View>

            {/* Available Quantity */}
            {listing.discountPrice && listing.discountPrice !== '' ? (
              <View style={[styles.cell, {flexDirection: 'row'}]}>
                <Text style={[globalStyles.textMDAccent, {paddingRight: 10}]}>
                  {listing.localCurrencySymbol}
                  {listing.discountPrice}
                </Text>
                <Text style={[styles.strikeText, globalStyles.textMDGreyLight]}>
                  {listing.localCurrencySymbol}
                  {listing.localPrice}
                </Text>
              </View>
            ) : (
              <View style={[styles.cell, {flexDirection: 'row'}]}>
                <Text style={globalStyles.textMDGreyLight}>
                  {listing.localCurrencySymbol}
                  {listing.localPrice}
                </Text>
              </View>
            )}

            {/* Available Quantity */}
            <View style={styles.cell}>
              <Text style={globalStyles.textSMGreyDark}>
                {listing.availableQty}
              </Text>
            </View>

            {/* Seller Name */}
            <View
              style={{
                width: 180,
                padding: 10,
                borderColor: '#ccc',
                borderBottomWidth: 1,
              }}>
              {listing.discountPercent && listing.discountPercent !== '' ? (
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <BadgeWithTransparentNotch
                      borderRadius={10}
                      text={listing.discountPercent + '%' + ' OFF'}
                      height={30}
                      width={80}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}></View>
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

export default ListingTableAction;
