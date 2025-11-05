import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import JoinerCard from './JoinerCard';
import styles from './styles/JoinerListStyles';

/**
 * JoinerList - Displays a list of joiners for the receiver
 */
const JoinerList = ({
  joiners,
  loading,
  onApprove,
  onReject,
  formatExpirationDate,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#539461" />
      </View>
    );
  }

  if (!joiners || joiners.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <View style={styles.joinersListContainer}>
      <View style={styles.joinersContainer}>
        {joiners.map((joiner, index) => (
          <JoinerCard
            key={joiner.requestId || index}
            joiner={joiner}
            onApprove={onApprove}
            onReject={onReject}
            formatExpirationDate={formatExpirationDate}
          />
        ))}
      </View>
    </View>
  );
};

export default JoinerList;

