import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const PayoutPlantCard = ({plant}) => {
  return (
    <View style={styles.card}>
      <Image source={{uri: plant.image}} style={styles.image} />
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={globalStyles.textSMGreyDark}>
            Plant genus species name
          </Text>

          <Text style={globalStyles.textSMGreyDark}>
            ${plant.price.toLocaleString()}
          </Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.subText}>{plant.code}</Text>
          <Text style={styles.subText}>{plant.quantity}x</Text>
        </View>

        <View style={styles.bottomRow}>
          {plant.tag && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{plant.tag}</Text>
            </View>
          )}
          <Text style={styles.size}>{plant.size}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 5,
    marginHorizontal: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  subText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#202325',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
  },
  size: {
    fontSize: 13,
    color: '#333',
  },
});

export default PayoutPlantCard;
