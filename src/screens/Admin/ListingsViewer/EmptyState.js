import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState = ({ message }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  emptyState: { padding: 24, alignItems: 'center' },
  emptyStateText: { color: '#777' },
});

export default EmptyState;
