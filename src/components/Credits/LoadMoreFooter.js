import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadMoreFooter({ loading, hasMore, onPress }) {
  if (!hasMore) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>End of statement</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#2E90FA" />
      ) : (
        <Text style={styles.buttonText}>Load More</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    color: '#98A2B3',
  },
  button: {
    marginVertical: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E90FA',
  },
});
