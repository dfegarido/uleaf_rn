import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';
import {InputDropdown} from '../../../../components/Input';

const BusinessPerformance = ({data}) => {
  const hasValidData =
    data &&
    Array.isArray(data.headers) &&
    data.headers.length > 0 &&
    Array.isArray(data.rows) &&
    data.rows.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {hasValidData ? (
          <>
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
                      row.label === 'Percent Sold' &&
                        globalStyles.textXSGreyLight,
                    ]}>
                    {val}
                  </Text>
                ))}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.footer}>No data available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
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
