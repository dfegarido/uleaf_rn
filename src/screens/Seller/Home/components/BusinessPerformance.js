import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const BusinessPerformance = () => {
  const data = {
    headers: ['APR 10', 'MAR 10', 'FEB 10', 'JAN 10'],
    rows: [
      {label: 'Total Sales', values: ['45.4k', '60.3k', '55.4k', '80.9k']},
      {label: 'Plants Sold', values: ['146', '278', '317', '212']},
      {label: 'Plants Listed', values: ['389', '451', '463', '468']},
      {
        label: 'Sell-through Rate',
        values: ['37.53%', '61.64%', '68.46%', '45.30%'],
      },
    ],
  };

  return (
    <View style={styles.section}>
      <Text
        style={[
          globalStyles.textMDGreyDark,
          globalStyles.textBold,
          {paddingBottom: 10},
        ]}>
        Sales performance
      </Text>
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.row}>
          <Text style={styles.label}></Text>
          {data.headers.map((h, i) => (
            <Text key={i} style={styles.header}>
              {h}
            </Text>
          ))}
        </View>

        {/* Data Rows */}
        {data.rows.map((row, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.label, globalStyles.textXSGreyLight]}>
              {row.label}
            </Text>
            {row.values.map((val, j) => (
              <Text
                key={j}
                style={[
                  styles.cell,
                  globalStyles.textXSGreyLight,
                  row.label === 'Percent Sold' && globalStyles.textXSGreyLight,
                ]}>
                {val}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    // paddingHorizontal: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#E4E7E9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  label: {
    flex: 1.2,
    // fontWeight: '600',
    // fontSize: 13,
  },
  header: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
    color: '#555',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    // fontSize: 13,
    // color: '#333',
  },
  percent: {
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    color: '#777',
  },
});

export default BusinessPerformance;
