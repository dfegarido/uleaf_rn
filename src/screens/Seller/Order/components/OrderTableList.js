import React from 'react';
import {View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, FlatList, ActivityIndicator} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const COLUMN_WIDTH = 120;
const WINDOW_HEIGHT = Dimensions.get('window').height;

const OrderTableList = ({headers = [], orders = [], rowsHeight, refreshing, onRefresh}) => {
  // Default rows container max height (can be overridden via rowsHeight prop)
  const maxRowsHeight = rowsHeight || Math.max(300, Math.floor(WINDOW_HEIGHT * 0.5));

  return (
    // Horizontal scroll for columns only. Header stays outside the vertical scroll so it remains visible
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Header (fixed) */}
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

        {/* Rows container: use FlatList for virtualization and onEndReached (infinite scroll) */}
        <View style={{maxHeight: maxRowsHeight}}>
          <FlatList
            data={orders}
            keyExtractor={(item, idx) => item.id || String(idx)}
            renderItem={({item: order, index}) => {
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

            // Helper: resolve a date object from a variety of possible fields (Firestore timestamps, strings)
            const resolveDate = val => {
              if (!val) return null;
              // Firestore timestamp object with _seconds/_nanoseconds
              if (typeof val === 'object') {
                if (val._seconds || val._seconds === 0) {
                  const secs = Number(val._seconds || 0);
                  const nanos = Number(val._nanoseconds || 0);
                  return new Date(secs * 1000 + Math.floor(nanos / 1e6));
                }
                // Some Firestore SDKs expose toDate()
                if (typeof val.toDate === 'function') {
                  try {
                    return val.toDate();
                  } catch (e) {
                    // fallthrough
                  }
                }
              }
              // String or number
              try {
                const d = new Date(val);
                if (!isNaN(d.getTime())) return d;
              } catch (e) {
                // ignore
              }
              return null;
            };

            // Preferred fields for the 'Ordered' date (in order)
            const preferredDateFields = [
              order?.orderDate,
              order?.orderDateObj,
              order?.dateCreated,
              order?.createdAt,
              order?.soldDate,
            ];

            let createdDateObj = null;
            for (const f of preferredDateFields) {
              const d = resolveDate(f);
              if (d) {
                createdDateObj = d;
                break;
              }
            }

            const formatDateMonDayYear = d => {
              if (!d) return null;
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const m = months[d.getMonth()] || '';
              const day = d.getDate();
              const year = d.getFullYear();
              return `${m} ${day} ${year}`;
            };

            const createdDateStr = createdDateObj
              ? formatDateMonDayYear(createdDateObj)
              : null;

            const qtyVal = Number(order.orderQty || order.qty || order.quantity || 0) || 0;
            const totalVal = Number(order.totalPlantCost ?? (localPrice * qtyVal) ?? 0) || 0;
            const totalPrice = `${localPriceCurrencySymbol || ''}${totalVal.toLocaleString()}`;
            const imageSource = imagePrimary
              ? {uri: imagePrimary}
              : {uri: 'https://via.placeholder.com/80'};

            return (
              <TouchableOpacity key={index} activeOpacity={0.8}>
                <View style={styles.row}>
                <View style={styles.cell}>
                  <Image style={styles.image} source={imageSource} />
                </View>

                <View style={[styles.cell, {width: 200}]}> 
                  <Text style={[globalStyles.textSMGreyDark, {paddingBottom: 5}]}> 
                    {trxNumber || '--'}
                  </Text>
                  <Text
                    style={[globalStyles.textSMGreyLight, {paddingBottom: 5}]}> 
                    Ordered: {createdDateStr || '--'}
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
              </TouchableOpacity>
            );
          }}
          refreshing={!!refreshing}
          onRefresh={typeof onRefresh === 'function' ? onRefresh : undefined}
          />
        </View>
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
