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
                index === 2 && {width: 70}, // Pin column - matches data
                index === 6 && {width: 250, minWidth: 250}, // Quantity column
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
              <StatusBadge statusCode={
                (parseInt(listing.availableQty) || 0) === 0 ? 'Out of Stock' : listing.status
              } />
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
              {(() => {
                // Initialize an empty array
                let finalPotSizes = [];

                // Priority 1: Try from variations
                if (
                  Array.isArray(listing.variations) &&
                  listing.variations.length > 0
                ) {
                  const variation = listing.variations[0];

                  if (Array.isArray(variation.potSize)) {
                    finalPotSizes = variation.potSize;
                  } else if (typeof variation.potSize === 'string') {
                    finalPotSizes = [variation.potSize];
                  }
                }

                // Priority 2: Fallback to listing.potSize
                if (
                  finalPotSizes.length === 0 &&
                  (Array.isArray(listing.potSize) ||
                    typeof listing.potSize === 'string')
                ) {
                  finalPotSizes = Array.isArray(listing.potSize)
                    ? listing.potSize
                    : [listing.potSize];
                }

                return finalPotSizes.map((parsePotSize, index2) => (
                  <View
                    key={`${index}-${index2}`}
                    style={[
                      styles.badgeContainer,
                      {
                        marginRight: 4,
                        marginBottom: 4,
                        alignSelf: 'flex-start',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.badge,
                        globalStyles.textMDGreyDark,
                        {backgroundColor: '#E4E7E9', paddingHorizontal: 10},
                      ]}>
                      {parsePotSize}
                    </Text>
                  </View>
                ));
              })()}
            </View>

            {/* Available Quantity */}
            {(() => {
              let totalLocalPrice = 0;
              let totalLocalPriceNew = 0;
              let hasNewPrice = false;
              let finalCurrencySymbol = listing.localCurrencySymbol || '';

              const parseSafeFloat = val => {
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
              };

              const isNonEmpty = val =>
                val !== null &&
                val !== undefined &&
                (typeof val === 'number' ||
                  (typeof val === 'string' && val.trim() !== ''));

              if (
                Array.isArray(listing.variations) &&
                listing.variations.length > 0
              ) {
                listing.variations.forEach(variation => {
                  const localPrice = parseSafeFloat(variation.localPrice);
                  const localPriceNew = isNonEmpty(variation.localPriceNew)
                    ? parseSafeFloat(variation.localPriceNew) !=
                      parseSafeFloat(variation.localPrice)
                      ? parseSafeFloat(variation.localPriceNew)
                      : 0
                    : 0;

                  totalLocalPrice += localPrice;

                  if (localPriceNew > 0) {
                    totalLocalPriceNew += localPriceNew;
                    hasNewPrice = true;
                  } else {
                    totalLocalPriceNew += localPrice;
                  }

                  if (variation.localCurrencySymbol) {
                    finalCurrencySymbol = variation.localCurrencySymbol;
                  }
                });
              } else {
                const localPrice = parseSafeFloat(listing.localPrice);
                const localPriceNew = isNonEmpty(listing?.localPriceNew)
                  ? parseSafeFloat(listing.localPriceNew) !=
                    parseSafeFloat(listing.localPrice)
                    ? parseSafeFloat(listing.localPriceNew)
                    : 0
                  : 0;

                totalLocalPrice = localPrice;
                totalLocalPriceNew = localPriceNew;
                localPriceNew > 0 ? localPriceNew : localPrice;
                hasNewPrice = localPriceNew > 0;

                if (listing.localCurrencySymbol) {
                  finalCurrencySymbol = listing.localCurrencySymbol;
                }
              }

              return (
                <View style={[styles.cell, {flexDirection: 'row'}]}>
                  {hasNewPrice ? (
                    <>
                      <Text
                        style={[globalStyles.textMDAccent, {paddingRight: 10}]}>
                        {finalCurrencySymbol}
                        {totalLocalPriceNew.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.strikeText,
                          globalStyles.textMDGreyLight,
                        ]}>
                        {finalCurrencySymbol}
                        {totalLocalPrice.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text style={globalStyles.textMDGreyLight}>
                      {finalCurrencySymbol}
                      {totalLocalPrice.toFixed(2)}
                    </Text>
                  )}
                </View>
              );
            })()}
            {/* {listing.discountPrice && listing.discountPrice !== '' ? (
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
            )} */}

            {/* Available Quantity */}
            <View style={[styles.cell, {width: 250, minWidth: 250}]}>
              {(parseInt(listing.availableQty) || 0) === 0 ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#E7522F',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 4,
                    flexShrink: 0,
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>i</Text>
                  </View>
                  <Text style={{
                    fontFamily: 'Inter',
                    fontStyle: 'normal',
                    fontWeight: '600',
                    fontSize: 16,
                    lineHeight: 22,
                    color: '#E7522F',
                    flex: 1,
                    flexShrink: 1,
                  }}>
                    This plant has been sold.
                  </Text>
                </View>
              ) : (
                <Text style={globalStyles.textSMGreyDark}>
                  {listing.availableQty}
                </Text>
              )}
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
