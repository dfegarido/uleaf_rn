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
import PayoutCard from './components/PayoutCard';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';

const payoutData = [
  {
    status: 'Receivable',
    amount: 80177,
    payoutDate: 'Jun-29-2025',
    salesPeriod: 'Jun-22-2025 to Jun 28-2025',
  },
  {
    status: 'Receivable',
    amount: 51753,
    payoutDate: 'Jun-22-2025',
    salesPeriod: 'Jun-15-2025 to Jun 21-2025',
  },
  {
    status: 'Paid',
    reference: 'SK092364',
    amount: 176216,
    payoutDate: 'Mar-15-2025',
    salesPeriod: 'Jun-08-2025 to Jun 14-2025',
  },
];

const ScreenPayout = ({navigation, route}) => {
  const insets = useSafeAreaInsets();

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
                Payouts
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}
        <View style={{marginHorizontal: 20}}>
          <View
            style={{
              backgroundColor: '#202325',
              padding: 20,
              borderRadius: 10,
              flexDirection: 'column',
              marginBottom: 20,
            }}>
            <Text style={globalStyles.textMDWhite}>Total Receivables</Text>

            <Text style={[globalStyles.textXLWhite, {paddingTop: 10}]}>
              $10000000
            </Text>
          </View>

          <FlatList
            scrollEnabled={false}
            data={payoutData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ScreenPayoutDetails', item)
                }>
                <PayoutCard item={item} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{paddingBottom: 20}}
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
});

export default ScreenPayout;
