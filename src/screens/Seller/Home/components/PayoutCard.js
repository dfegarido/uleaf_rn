import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const PayoutCard = ({item}) => {
  const statusStyles = {
    Receivable: styles.receivable,
    Paid: styles.paid,
  };

  return (
    <View style={styles.card}>
      <View style={[styles.statusTag, statusStyles[item.status]]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>

      {item.reference && (
        <Text style={globalStyles.textMDGreyLight}>Ref # {item.reference}</Text>
      )}

      <Text style={[globalStyles.textLGGreyDark, globalStyles.textBold]}>
        ${item.amount.toLocaleString()}
      </Text>
      <Text style={styles.label}>Total amount</Text>

      <Text style={[globalStyles.textSMGreyDark]}>{item.payoutDate}</Text>
      <Text style={styles.label}>Payout date</Text>

      <Text style={[globalStyles.textSMGreyDark]}>{item.salesPeriod}</Text>
      <Text style={styles.label}>Sales period</Text>
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
  reference: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});

export default PayoutCard;
