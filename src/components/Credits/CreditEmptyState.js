import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PlantIcon from '../../assets/icons/accent/plant-regular.svg';

export default function CreditEmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <PlantIcon width={40} height={40} fill="#98A2B3" />
      </View>
      <Text style={styles.title}>No Credit History</Text>
      <Text style={styles.subtitle}>
        Credit activity will appear here once credits are earned or used.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 20,
  },
});
