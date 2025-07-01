import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';
import {InputCheckBox} from '../../../../components/Input';

import IconMenu from '../../../../assets/icons/greylight/dots-three-vertical-regular.svg';

const COLUMN_WIDTH = 120;

const DeliverTableList = ({
  headers = [],
  orders = [],
  module,
  navigateToListAction,
  selectedIds = [],
  setSelectedIds,
  onEditPressFilter,
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
            <View key={index} style={styles.cell}>
              <Text
                style={[
                  index === 0
                    ? globalStyles.textMDGreyDark
                    : globalStyles.textMDGreyLight,
                  index === 0 && globalStyles.textBold,
                ]}>
                {header}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {orders.map((order, index) => {
          const {
            id,
            trxNumber,
            orderQty,
            plantCode,
            genus,
            species,
            variegation,
            listingType,
            potSizeVariation,
            localPrice,
            localPriceCurrencySymbol,
            imagePrimary,
          } = order;

          const totalPrice = `${localPriceCurrencySymbol || ''}${
            localPrice?.toLocaleString() || '0'
          }`;
          const imageSource = imagePrimary
            ? {uri: imagePrimary}
            : {uri: 'https://via.placeholder.com/80'};

          return (
            <View style={styles.row} key={index}>
              <View style={styles.cell}>
                <Image style={styles.image} source={imageSource} />

                <View style={{position: 'absolute', top: 15, left: 15}}>
                  {module === 'MAIN' ? (
                    <InputCheckBox
                      label=""
                      checked={selectedIds.includes(id)}
                      onChange={() => navigateToListAction()}
                    />
                  ) : (
                    module === 'ACTION' && (
                      <InputCheckBox
                        label=""
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleCheckbox(id)}
                      />
                    )
                  )}
                </View>
              </View>

              <View style={styles.cell}>
                <Text
                  style={[globalStyles.textSMGreyDark, {paddingBottom: 10}]}>
                  {trxNumber || '--'}
                </Text>
                <Text style={globalStyles.textSMGreyLight}>
                  Ordered: {orderQty || 0}
                </Text>
              </View>

              <View style={styles.cell}>
                <Text
                  style={[globalStyles.textSMGreyDark, {paddingBottom: 10}]}>
                  {plantCode || '--'}
                </Text>
              </View>

              <View style={styles.cell}>
                <Text
                  style={[globalStyles.textSMGreyDark, {paddingBottom: 10}]}>
                  {`${genus || ''} ${species || ''}`.trim()}
                </Text>
                <Text>{variegation || ''}</Text>
              </View>

              <View style={styles.cell}>
                <View style={[styles.badge, {backgroundColor: '#000'}]}>
                  <Text style={{color: '#fff'}}>{listingType || '--'}</Text>
                </View>
              </View>

              <View style={styles.cell}>
                <View style={[styles.potSizeBadge]}>
                  <Text style={globalStyles.textMDGreyDark}>
                    {potSizeVariation || '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.cell}>
                <Text style={globalStyles.textMDGreyDark}>{orderQty || 0}</Text>
              </View>

              <View style={[styles.cell, {flexDirection: 'row'}]}>
                <Text style={globalStyles.textMDGreyDark}>{totalPrice}</Text>

                {module === 'MAIN' && (
                  <TouchableOpacity
                    style={{paddingLeft: 20}}
                    onPress={() =>
                      onEditPressFilter({
                        trxNumber: trxNumber,
                        id: id,
                      })
                    }>
                    <IconMenu width={20} height={20} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  potSizeBadge: {
    alignSelf: 'baseline',
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#E4E7E9',
  },
});

export default DeliverTableList;
