import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../../assets/styles/styles';
import {InputBox} from '../../../components/Input';
import PayoutPlantCard from './components/PayoutPlantCard';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';

const DATA = [
  {
    id: '1',
    image: 'https://via.placeholder.com/60',
    price: 1234,
    quantity: 1,
    code: 'AA#####',
    size: '2"',
    tag: null,
  },
  {
    id: '2',
    image: 'https://via.placeholder.com/60',
    price: 2236,
    quantity: 20,
    code: 'AA#####',
    size: '2"–4"',
    tag: 'Wholesale',
  },
  {
    id: '3',
    image: 'https://via.placeholder.com/60',
    price: 833,
    quantity: 3,
    code: 'AA#####',
    size: '5"–8"',
    tag: "Grower's Choice",
  },
  {
    id: '4',
    image: 'https://via.placeholder.com/60',
    price: 1234,
    quantity: 1,
    code: 'AA#####',
    size: '2"',
    tag: null,
  },
];

const ScreenPayoutDetails = ({navigation, route}) => {
  const statusStyles = {
    Receivable: styles.receivable,
    Paid: styles.paid,
  };
  const insets = useSafeAreaInsets();

  const {status} = route.params;

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
  });
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Payout Details
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}
        <View style={{}}>
          <View
            style={{
              backgroundColor: '#fff',
              paddingVertical: 20,
              paddingHorizontal: 10,
              borderRadius: 10,
              flexDirection: 'column',
              marginBottom: 20,
              marginHorizontal: 20,
            }}>
            <Text style={globalStyles.textMDGrayDark}>Total Receivable</Text>

            <Text style={[globalStyles.textXXLGrayDark, {paddingTop: 10}]}>
              $10000000
            </Text>

            <View
              style={[styles.statusTag, statusStyles[status], {marginTop: 10}]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: '#F5F6F6',
              padding: 20,
              flexDirection: 'row',
            }}>
            <View style={{flexDirection: 'column', width: '30%'}}>
              <Text style={globalStyles.textSMGreyLight}>Payout date</Text>
              <Text style={globalStyles.textMDGrayDark}>Payout date</Text>
            </View>
            <View style={{flexDirection: 'column', width: '70%'}}>
              <Text style={globalStyles.textSMGreyLight}>Sales period</Text>
              <Text style={globalStyles.textMDGrayDark}>
                Jun-22-2025 to Jun-28-2025
              </Text>
            </View>
          </View>
          <View style={{marginHorizontal: 20, marginVertical: 20}}>
            <Text style={globalStyles.textMDGrayDark}>Order Summary</Text>
          </View>
          <FlatList
            scrollEnabled={false}
            data={DATA}
            keyExtractor={item => item.id}
            renderItem={({item}) => <PayoutPlantCard plant={item} />}
          />
        </View>
        {/* Main Content */}
      </ScrollView>
      {/* Button always at the bottom */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  receivable: {
    backgroundColor: '#E0F0FF',
  },
  paid: {
    backgroundColor: '#D1FAD7',
  },
  statusText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default ScreenPayoutDetails;
