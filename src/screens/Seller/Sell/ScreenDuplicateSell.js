import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular.svg';

const COLUMN_WIDTH = 150;

const headers = [
  'Listing',
  'Plant Name & Status',
  'Listing Type',
  'Pot Size',
  'Price',
  'Quantity',
];

const data = [
  {
    image: '',
    plantName: 'Ficus Iyrata',
    subPlantName: 'Ficus Iyrata',
    status: '',
    listingCode: 'L1',
    listingType: '',
    potSize: ['2"'],
    price: '$14',
    quantity: '1',
  },
  {
    image: '',
    plantName: 'Monstera deliciosa',
    subPlantName: 'Albo Variegata',
    status: '',
    listingCode: 'L2',
    listingType: "Grower's choice",
    potSize: ['2"-4"', '5"-8"'],
    price: '$14',
    quantity: '1',
  },
  {
    image: '',
    plantName: 'Ficus Iyrata',
    subPlantName: 'Ficus Iyrata',
    status: '',
    listingCode: 'L3',
    listingType: 'Wholesale',
    potSize: ['2"-4"', '5"-8"'],
    price: '$14',
    quantity: '1',
  },
];

const ScreenDuplicateSell = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => alert('Edit Profile')}
          color="#000"
          style={{
            borderColor: '#ccc',
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
          }}>
          <SearchIcon width={20} height={20} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  return (
    <View style={[styles.mainContent, {paddingTop: insets.top}]}>
      <View style={styles.mainContainer}>
        <ScrollView horizontal>
          <View>
            {/* Header */}
            <View
              style={[
                styles.row,
                {
                  backgroundColor: '#E4E7E9',
                },
              ]}>
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
                    {dataparse.plantName}
                  </Text>
                  <Text>{dataparse.subPlantName}</Text>
                </View>
                <View style={styles.cell}>
                  <View style={[styles.badgeContainer]}>
                    {dataparse.listingType && (
                      <Text
                        style={[
                          styles.badge,
                          {color: '#fff', backgroundColor: '#000'},
                        ]}>
                        {dataparse.listingType}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cell}>
                  {dataparse.potSize.map((datapotsize, index) => (
                    <View key={index} style={[styles.badgeContainer]}>
                      {datapotsize && (
                        <Text
                          style={[
                            styles.badge,
                            {color: '#000', backgroundColor: '#E4E7E9'},
                          ]}>
                          {datapotsize}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
                <View style={styles.cell}>
                  <Text>{dataparse.totalPrice}</Text>
                </View>
                <View style={styles.cell}>
                  <Text>{dataparse.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: COLUMN_WIDTH,
    padding: 10,
    borderColor: '#ccc',
    borderBottomWidth: 1,
  },
  headerText: {
    fontWeight: 'bold',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default ScreenDuplicateSell;
