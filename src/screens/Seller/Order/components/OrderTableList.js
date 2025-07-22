import React from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const COLUMN_WIDTH = 120;

const OrderTableList = ({headers = [], orders = []}) => {
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
                index === 1
                  ? {width: 200}
                  : index > 1
                  ? {width: COLUMN_WIDTH}
                  : null,
              ]}>
              <Text
                style={[
                  index === 0
                    ? globalStyles.textMDGreyDark
                    : globalStyles.textMDGreyLight,
                  index === 0 && globalStyles.textBold,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {header}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {orders.map((order, index) => {
          const {
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
            orderDate,
            deliveredDate,
            receivedDate,
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
              </View>

              <View style={[styles.cell, {width: 200}]}>
                <Text style={[globalStyles.textSMGreyDark, {paddingBottom: 5}]}>
                  {trxNumber || '--'}
                </Text>
                <Text
                  style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}>
                  Ordered:
                  {orderDate
                    ? new Date(orderDate).toISOString().slice(0, 10)
                    : null}
                </Text>
                {deliveredDate && (
                  <Text
                    style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}>
                    Delivered:
                    {deliveredDate
                      ? new Date(deliveredDate).toISOString().slice(0, 10)
                      : null}
                  </Text>
                )}
                {receivedDate && (
                  <Text
                    style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}>
                    Received:
                    {receivedDate
                      ? new Date(receivedDate).toISOString().slice(0, 10)
                      : null}
                  </Text>
                )}
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
                <View
                  style={[
                    styles.badge,
                    {backgroundColor: '#E4E7E9', alignSelf: 'baseline'},
                  ]}>
                  <Text style={{color: '#000'}}>
                    {potSizeVariation || '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.cell}>
                <Text style={globalStyles.textMDGreyDark}>{orderQty || 0}</Text>
              </View>

              <View style={styles.cell}>
                <Text style={globalStyles.textMDGreyDark}>{totalPrice}</Text>
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
});

export default OrderTableList;
