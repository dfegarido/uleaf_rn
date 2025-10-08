import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const PayoutCard = ({item}) => {
  // 💰 Payout Card Data Validation
  console.log('💰 PayoutCard Received Item:', {
    hasItem: !!item,
    status: item?.status,
    payOutDate: item?.payOutDate,
    salesPeriod: item?.salesPeriod,
    currencySymbol: item?.totalReceivableAmountCurrencySymbol,
    amount: item?.totalReceivableAmountLocal,
    referenceNumber: item?.referenceNumber,
    allKeys: Object.keys(item || {})
  });

  const statusStyles = {
    Receivable: styles.receivable,
    Paid: styles.paid,
  };

  return (
    <View style={styles.card}>
      <View style={[styles.statusTag, statusStyles[item?.status || 'Receivable']]}>
        <Text style={styles.statusText}>{item?.status || 'Unknown'}</Text>
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View>
          <Text style={[globalStyles.textSMGreyDark]}>
            {item?.payOutDate ?? ''}
          </Text>
          <Text style={styles.label}>Payout date</Text>

          <Text style={[globalStyles.textSMGreyDark]}>{item?.salesPeriod || 'N/A'}</Text>
          <Text style={styles.label}>Sales period</Text>
        </View>
        <View style={styles.headerRight}>
          {item.referenceNumber && (
            <Text style={globalStyles.textMDGreyLight}>
              Ref # {item?.referenceNumber ?? ''}
            </Text>
          )}
          <Text style={[globalStyles.textLGGreyDark, globalStyles.textBold]}>
            {item?.totalReceivableAmountCurrencySymbol || '$'}
            {item?.totalReceivableAmountLocal?.toLocaleString() || '0.00'}
          </Text>
          <Text style={styles.label}>Total amount</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    borderColor: '#E4E7E9',
    borderWidth: 1,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  receivable: {
    backgroundColor: '#48A7F8',
  },
  paid: {
    backgroundColor: '#23C16B',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});

export default PayoutCard;
