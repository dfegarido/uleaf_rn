import React from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';

const COLUMN_WIDTH = 120;

const OrderTableList = ({headers = [], data = [{}]}) => {
  return (
    <ScrollView horizontal>
      <View>
        {/* Header */}
        <View style={[styles.row, {backgroundColor: '#E4E7E9'}]}>
          {headers.map((header, index) => (
            <View key={index} style={styles.cell}>
              <Text style={styles.headerText}>{header}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((dataparse, index) => (
          <View style={styles.row} key={index}>
            <View style={styles.cell}>
              <Image
                style={styles.image}
                source={{
                  uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                }}
              />
            </View>
            <View style={styles.cell}>
              <Text style={{fontWeight: 'bold', paddingBottom: 10}}>
                {dataparse.transNo}
              </Text>
              <Text>Ordered: {dataparse.ordered}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={{fontWeight: 'bold', paddingBottom: 10}}>
                {dataparse.plantCode}
              </Text>
            </View>
            <View style={styles.cell}>
              <Text style={{fontWeight: 'bold', paddingBottom: 10}}>
                {dataparse.plantName}
              </Text>
              <Text>{dataparse.subPlantName}</Text>
            </View>
            <View style={styles.cell}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#000',
                  },
                ]}>
                <Text style={{color: '#fff'}}>{dataparse.listingType}</Text>
              </View>
            </View>
            <View style={styles.cell}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#E4E7E9',
                  },
                ]}>
                <Text style={{color: '#000'}}>{dataparse.potSize}</Text>
              </View>
            </View>
            <View style={styles.cell}>
              <Text>{dataparse.quantity}</Text>
            </View>
            <View style={styles.cell}>
              <Text>{dataparse.totalPrice}</Text>
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
    // borderRightWidth: 1,
    borderColor: '#ccc',
    borderBottomWidth: 1,
    // justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    // backgroundColor: '#d9e3f0',
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
});

export default OrderTableList;
