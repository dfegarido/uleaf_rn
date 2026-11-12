import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import TruckIcon from '../../assets/buyer-icons/truck-gray.svg';
import NextDayTruckIcon from '../../assets/buyer-icons/truck-next-day-green.svg';

// Next Day Air Saver is priced at 2nd Day x 1.3 by checkout-shipping (upsNextDayUpgrade = 30%);
// domestic US plants use the flat in-house rate instead.
const NEXT_DAY_MULTIPLIER = 1.3;
const DOMESTIC_NEXT_DAY_COST = 50;

const roundToCents = (n) => Math.round(n * 100) / 100;
const formatPrice = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export const getNextDayRates = ({ cost, addOnCost, domestic = false }) =>
  domestic
    ? { cost: DOMESTIC_NEXT_DAY_COST, addOnCost }
    : {
        cost: roundToCents(cost * NEXT_DAY_MULTIPLIER),
        addOnCost: roundToCents(addOnCost * NEXT_DAY_MULTIPLIER),
      };

const PriceLine = ({ cost, addOnCost }) => (
  <Text style={styles.priceLine}>
    <Text style={styles.price}>{formatPrice(cost)}</Text>, add-on plant{' '}
    <Text style={styles.price}>{formatPrice(addOnCost)}</Text> each
  </Text>
);

const LiveArrivalBadge = () => (
  <View style={styles.badge}>
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12.5l5 5L20 6.5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <Text style={styles.badgeText}>{'Live Arrival\nGuarantee'}</Text>
  </View>
);

/** Plant detail "UPS Shipping Details": 2nd Day and Next Day Air Saver rates side by side. */
const UpsShippingOptions = ({ cost, addOnCost, domestic = false }) => {
  const nextDay = getNextDayRates({ cost, addOnCost, domestic });

  return (
    <View style={styles.container}>
      <View style={[styles.option, styles.secondDay]}>
        <View style={styles.iconSlot}>
          <TruckIcon width={34} height={24} />
        </View>
        <View style={styles.divider} />
        <View style={styles.copy}>
          <Text style={styles.title}>2nd Day Shipping</Text>
          <PriceLine cost={cost} addOnCost={addOnCost} />
        </View>
      </View>

      <View style={[styles.option, styles.nextDay]}>
        <View style={styles.iconSlot}>
          <NextDayTruckIcon width={40} height={28} />
        </View>
        <View style={[styles.divider, styles.dividerGreen]} />
        <View style={styles.copy}>
          <Text style={styles.title}>Next Day Air Saver Shipping</Text>
          <PriceLine cost={nextDay.cost} addOnCost={nextDay.addOnCost} />
        </View>
        <LiveArrivalBadge />
      </View>

      <Text style={styles.footnote}>UPS is available at checkout.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignSelf: 'stretch',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  secondDay: {
    backgroundColor: '#F7F4EE',
  },
  nextDay: {
    backgroundColor: '#EAF4EC',
    borderWidth: 1,
    borderColor: '#CFE5D3',
  },
  iconSlot: {
    width: 42,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 10,
    backgroundColor: '#D9D4CA',
  },
  dividerGreen: {
    backgroundColor: '#B9D9BF',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 21,
    color: '#202325',
  },
  priceLine: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  price: {
    fontWeight: '800',
    color: '#2E7D32',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
  },
  footnote: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#7F8D91',
  },
});

export default UpsShippingOptions;
