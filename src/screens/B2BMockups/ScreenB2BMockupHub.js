import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';

const CARDS = [
  {
    key: 'buyer',
    title: 'US Customer account',
    subtitle: 'Maya Chen · San Francisco, CA · buys in USD, cannot sell yet',
    route: 'ScreenB2BUsBuyerAccount',
    audience: 'Buyer',
  },
  {
    key: 'switch',
    title: 'Business registration / switch',
    subtitle: 'US Customer → US Business · Asia Seller → Asia Business',
    route: 'ScreenB2BBusinessSwitch',
    audience: 'Buyer / Seller',
  },
  {
    key: 'approval',
    title: 'Admin business approval',
    subtitle: 'Pending requests, approve or reject, keep history',
    route: 'ScreenB2BAdminApproval',
    audience: 'Admin',
  },
  {
    key: 'payout',
    title: 'Admin B2B payouts',
    subtitle:
      'Partial 70–80%, full after hub receive, scan required, 3.5% missing/damaged fee',
    route: 'ScreenB2BPayoutSummary',
    params: {audience: 'admin'},
    audience: 'Admin',
  },
  {
    key: 'listing',
    title: 'Listing inline + bulk edit',
    subtitle: 'Edit price, pot size, height, status, pin, listing type',
    route: 'ScreenB2BListingEdit',
    audience: 'Seller',
  },
  {
    key: 'fees',
    title: 'Admin fee & commission settings',
    subtitle: 'Default, country, and per-business rates',
    route: 'ScreenB2BFeeConfig',
    audience: 'Admin',
  },
];

const ScreenB2BMockupHub = ({navigation}) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="B2B Asia Mockups" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[globalStyles.textMDGreyDark, styles.intro]}>
          Walkthrough screens for client review. All numbers are sample data from
          the signed-off Trello rules.
        </Text>
        {CARDS.map(card => (
          <TouchableOpacity
            key={card.key}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(card.route, card.params)}>
            <Text style={styles.audience}>{card.audience}</Text>
            <Text style={[globalStyles.textLGGreyDark, styles.cardTitle]}>
              {card.title}
            </Text>
            <Text style={styles.cardSub}>{card.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  intro: {marginBottom: 16, lineHeight: 22},
  card: {
    backgroundColor: '#f2f7f3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  audience: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardTitle: {fontWeight: '700', marginBottom: 4},
  cardSub: {color: '#556065', fontSize: 14, lineHeight: 20},
});

export default ScreenB2BMockupHub;
