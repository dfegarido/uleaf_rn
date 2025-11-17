import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { globalStyles } from '../../../../assets/styles/styles';
import { BadgeWithTransparentNotch } from '../../../../components/DiscountBadge';
import { InputCheckBox } from '../../../../components/Input';
import StatusBadge from './ListingStatusBadge';

import IconDiscountList from '../../../../assets/icons/accent/discount-list.svg';
import IconAccentPin from '../../../../assets/icons/accent/pin.svg';
import IconMenu from '../../../../assets/icons/greylight/dots-three-vertical-regular.svg';
import IconPin from '../../../../assets/icons/greylight/pin-light.svg';
import { formatDateMonthDayYear } from '../../../../utils/formatDateMonthDayYear';
import { numberToCurrency } from '../../../../utils/numberToCurrency';

const COLUMN_WIDTH = 150;

// Helper function to calculate expiration date (+14 days from publish or modification date)
const calculateExpirationDate = (listingData) => {
  try {
    // Determine which date to use (updatedAt if exists, otherwise publishDate)
    const baseDateFormatted = listingData?.updatedAtFormatted || listingData?.publishDateFormatted;
    const baseDateRaw = listingData?.updatedAt || listingData?.publishDate;
    
    let dateObj;
    
    // Priority 1: Use formatted date string if available
    if (baseDateFormatted) {
      dateObj = new Date(baseDateFormatted);
    }
    // Priority 2: Use raw Firestore timestamp
    else if (baseDateRaw) {
      if (baseDateRaw.toDate && typeof baseDateRaw.toDate === 'function') {
        // Firestore Timestamp object
        dateObj = baseDateRaw.toDate();
      } else if (baseDateRaw.seconds) {
        // Firestore Timestamp-like object
        dateObj = new Date(baseDateRaw.seconds * 1000);
      } else if (baseDateRaw instanceof Date) {
        dateObj = baseDateRaw;
      } else {
        dateObj = new Date(baseDateRaw);
      }
    } else {
      return 'No Data';
    }
    
    // Add 14 days
    const expirationDate = new Date(dateObj);
    expirationDate.setDate(expirationDate.getDate() + 14);
    
    // Format using the existing formatDateMonthDayYear utility
    return formatDateMonthDayYear(expirationDate.toISOString());
  } catch (error) {
    console.error('Error calculating expiration date:', error);
    return 'No Data';
  }
};

const ListingTable = ({
  headers = [],
  data = [{}],
  onEditPressFilter,
  onPressDiscount,
  onPressUpdateStock,
  module,
  navigateToListAction,
  onPressTableListPin,
  onPressRemoveDiscountPost,
  onNavigateToDetail,
  activeTab,
  onPressSetToActive
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
          {headers.map((header, index) => (
            <View
              key={index + header}
              style={[
                styles.cell,
                index === 0 && {width: 100},
                index === 2 && {width: 70}, // Pin column - matches data
                index === 6 && {width: 250, minWidth: 250}, // Quantity column
                index === 7 && {width: 150}, // Expiration Date column
                index === 8 && {width: 180}, // Discount column
                {padding: 10, borderColor: '#ccc', borderBottomWidth: 1},
              ]}>
              <Text
                style={[
                  globalStyles.textSMGreyDark,
                  index === 0 ? globalStyles.textBold : {},
                ]}>
                {header === 'Pin' && activeTab === 'Live' ? 'Set Active' : header}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((listing, index) => (
          <TouchableOpacity
            style={styles.row}
            key={listing.id + index}
            onPress={() => onNavigateToDetail(listing.plantCode, listing.id)}>
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
                {module === 'MAIN' ? (
                  <InputCheckBox
                    label=""
                    checked={selectedIds.includes(listing.id)}
                    onChange={() => navigateToListAction()}
                  />
                ) : (
                  listing.status != 'Out of Stock' && (
                    <InputCheckBox
                      label=""
                      checked={selectedIds.includes(listing.id)}
                      onChange={() => toggleCheckbox(listing.id)}
                    />
                  )
                )}
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
              {activeTab === 'Live' && listing?.isActiveLiveListing ? (
                <StatusBadge statusCode={'Active'} />
              ) : (
                <StatusBadge
                  statusCode={(function getStatus() {
                    const derivedStatus = (listing._displayStatus || listing.status || '').trim().toLowerCase();
                    if (derivedStatus === 'sold') {
                      return 'Sold';
                    }
                    if (derivedStatus === 'out of stock') {
                      return 'Out of Stock';
                    }

                    const normalizedType = (listing.listingType || '').trim().toLowerCase();
                    const qty = parseInt(listing.availableQty, 10) || 0;
                    const variations = Array.isArray(listing.variations) ? listing.variations : [];
                    const isAllVariationsZero =
                      variations.length > 0 &&
                      variations.every(variation => (parseInt(variation.availableQty, 10) || 0) === 0);
                    const isOutOfStock = qty === 0 && (variations.length === 0 || isAllVariationsZero);

                    if (isOutOfStock && normalizedType.includes('single')) {
                      return 'Sold';
                    }

                    if (
                      isOutOfStock &&
                      (normalizedType.includes('grower') ||
                        normalizedType.includes('choice') ||
                        normalizedType.includes('wholesale'))
                    ) {
                      return 'Out of Stock';
                    }

                    if (isOutOfStock) {
                      return 'Out of Stock';
                    }

                    return listing.status || 'Active';
                  })()}
                />
              )}
            </View>

            {/* Pin Tag */}
            {activeTab === 'Live' ? (
              <TouchableOpacity
                style={{
                  width: 120,
                  padding: 10,
                  borderColor: '#ccc',
                  borderBottomWidth: 1,
                }}
                onPress={() =>
                  onPressSetToActive(listing.plantCode)
                }>
                  {(!(listing?.isActiveLiveListing) && listing.availableQty > 0) && <StatusBadge statusCode={'SetToActive'} />}
                  {(listing.availableQty === 0) && <StatusBadge statusCode={'SoldOut'} />}
              </TouchableOpacity>
            ) : 
            (
              <TouchableOpacity
                style={{
                  width: 70,
                  padding: 10,
                  borderColor: '#ccc',
                  borderBottomWidth: 1,
                }}
                onPress={() =>
                  onPressTableListPin(listing.plantCode, listing.pinTag)
                }>
                {listing.pinTag ? (
                  <IconAccentPin width={20} height={20} />
                ) : (
                  <IconPin width={20} height={20} />
                )}
              </TouchableOpacity>
            )
          }
            

            {/* Listing Type */}
            <View style={[styles.cell, styles.listingTypeCell]}>
              {(() => {
                const rawType = listing.listingType || '';
                const normalizedType = rawType.trim() || 'Single Plant';

                return (
                  <View
                    style={styles.listingTypeBadge}>
                    <Text
                      style={styles.listingTypeText}>
                      {normalizedType}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Pot Size Variation - show all variations in one cell */}
            <View style={styles.cell}>
              {(() => {
                // If listing has variations, show all pot sizes
                if (
                  Array.isArray(listing.variations) &&
                  listing.variations.length > 0
                ) {
                  return listing.variations.map((variation, varIndex) => (
                    <View
                      key={`potsize-${varIndex}`}
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
                        {variation.potSize || 'No Pot Size'}
                      </Text>
                    </View>
                  ));
                }
                
                // For single plant listings (no variations)
                let finalPotSizes = [];
                if (
                  Array.isArray(listing.potSize) ||
                  typeof listing.potSize === 'string'
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

            {/* Price - show all variation prices */}
            <View style={[styles.cell, {flexDirection: 'column'}]}>
              {(() => {
                // If listing has variations, show each variation's price
                if (
                  Array.isArray(listing.variations) &&
                  listing.variations.length > 0
                ) {
                  return listing.variations.map((variation, varIndex) => {
                    const localPrice = parseFloat(variation.localPrice) || 0;
                    const localPriceNew = variation.localPriceNew ? parseFloat(variation.localPriceNew) : null;
                    const hasNewPrice = localPriceNew && localPriceNew !== localPrice;
                    const currencySymbol = variation.localCurrencySymbol || listing.localCurrencySymbol || '';
                    
                    return (
                      <View key={`price-${varIndex}`} style={{flexDirection: 'row', marginBottom: 4}}>
                        {hasNewPrice ? (
                          <>
                            <Text style={[globalStyles.textSMAccent, {paddingRight: 5}]}>
                              {currencySymbol}{numberToCurrency(localPriceNew.toFixed(2))}
                            </Text>
                            <Text style={[styles.strikeText, globalStyles.textSMGreyLight]}>
                              {currencySymbol}{numberToCurrency(localPrice.toFixed(2))}
                            </Text>
                          </>
                        ) : (
                          <Text style={globalStyles.textSMGreyDark}>
                            {currencySymbol}{numberToCurrency(localPrice.toFixed(2))}
                          </Text>
                        )}
                      </View>
                    );
                  });
                }
                
                // For single plant listings (no variations)
                const localPrice = parseFloat(listing.localPrice) || 0;
                const localPriceNew = listing.localPriceNew ? parseFloat(listing.localPriceNew) : null;
                const hasNewPrice = localPriceNew && localPriceNew !== localPrice;
                const currencySymbol = listing.localCurrencySymbol || '';

                return (
                  <View style={{flexDirection: 'row'}}>
                    {hasNewPrice ? (
                      <>
                        <Text style={[globalStyles.textMDAccent, {paddingRight: 10}]}>
                          {currencySymbol}{numberToCurrency(localPriceNew.toFixed(2))}
                        </Text>
                        <Text style={[styles.strikeText, globalStyles.textMDGreyLight]}>
                          {currencySymbol}{numberToCurrency(localPrice.toFixed(2))}
                        </Text>
                      </>
                    ) : (
                      <Text style={globalStyles.textMDGreyLight}>
                        {currencySymbol}{numberToCurrency(localPrice.toFixed(2))}
                      </Text>
                    )}
                  </View>
                );
              })()}
            </View>

            {/* Available Quantity - show all variation quantities */}
            <View style={[styles.cell, {width: 250, minWidth: 250}]}>
              {(() => {
                // If listing has variations, show each variation's quantity
                if (
                  Array.isArray(listing.variations) &&
                  listing.variations.length > 0
                ) {
                  return (
                    <>
                      {listing.variations.map((variation, varIndex) => {
                        const qty = parseInt(variation.availableQty) || 0;
                        if (qty === 0) {
                          return (
                            <TouchableOpacity
                              key={`qty-${varIndex}`}
                              onPress={() =>
                                onPressUpdateStock({
                                  pressCode: listing.listingType,
                                  id: listing.id,
                                })
                              }>
                              <Text
                                style={{
                                  color: 'red',
                                  marginTop: 4,
                                  marginBottom: 4,
                                }}>
                                Add Stock
                              </Text>
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <Text
                            key={`qty-${varIndex}`}
                            style={[
                              globalStyles.textSMGreyDark,
                              {marginBottom: 4},
                            ]}>
                            {qty}
                          </Text>
                        );
                      })}
                    </>
                  );
                }
                
                // For single plant listings (no variations)
                const qty = parseInt(listing.availableQty) || 0;
                
                return (
                  <>
                    {qty === 0 ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: '#E7522F',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 4,
                            flexShrink: 0,
                          }}>
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 14,
                              fontWeight: 'bold',
                            }}>
                            i
                          </Text>
                        </View>
                        <Text
                          style={{
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
                    ) : null}
                    <Text style={globalStyles.textSMGreyDark}>{qty}</Text>
                  </>
                );
              })()}
            </View>

            {/* Expiration Date */}
            <View style={[styles.cell, {width: 150}]}>
              <Text style={globalStyles.textSMGreyDark}>
                {calculateExpirationDate(listing)}
              </Text>
            </View>

            {/* Sold Quantity */}
            {/* <View style={styles.cell}>
              <Text>{listing.soldQty}</Text>
            </View> */}

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
                    <TouchableOpacity
                      onPress={() =>
                        onEditPressFilter({
                          pressCode: listing.listingType,
                          id: listing.id,
                        })
                      }>
                      <IconMenu width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{paddingTop: 10}}
                    onPress={() =>
                      onPressRemoveDiscountPost(listing.plantCode)
                    }>
                    <Text style={globalStyles.textMDAccent}>
                      Remove Discount
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : listing.discountPrice && listing.discountPrice !== '' ? (
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <TouchableOpacity
                      style={{paddingTop: 10}}
                      onPress={() =>
                        onPressRemoveDiscountPost(listing.plantCode)
                      }>
                      <Text style={globalStyles.textMDAccent}>
                        Remove Discount
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        onEditPressFilter({
                          pressCode: listing.listingType,
                          id: listing.id,
                        })
                      }>
                      <IconMenu width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    onPress={() => onPressDiscount({id: listing.id})}>
                    <IconDiscountList width={20} height={20} />
                    <Text style={[globalStyles.textSMAccent, {marginLeft: 5}]}>
                      Apply Discount
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      onEditPressFilter({
                        pressCode: listing.listingType,
                        id: listing.id,
                      })
                    }>
                    <IconMenu width={20} height={20} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
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
  listingTypeCell: {
    alignItems: 'flex-start',
  },
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 1,
    minHeight: 28,
    backgroundColor: '#202325',
    borderRadius: 8,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: 'black',
  },
});

export default ListingTable;
