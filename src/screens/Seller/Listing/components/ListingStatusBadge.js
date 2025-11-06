import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { globalStyles } from '../../../../assets/styles/styles';

const StatusBadge = ({statusCode}) => {
  let badgeStyle = {};
  let text = '';

  switch (statusCode) {
    case 'Active':
      badgeStyle = styles.active;
      text = 'Active';
      break;
    case 'Inactive':
      badgeStyle = styles.inactive;
      text = 'Inactive';
      break;
    case 'Scheduled':
      badgeStyle = styles.scheduled;
      text = 'Scheduled';
      break;
    case 'Expired':
      badgeStyle = styles.expired;
      text = 'Scheduled';
      break;
    case 'Live':
      badgeStyle = styles.expired;
      text = 'Live';
      break;
    case 'SetToActive':
      badgeStyle = styles.scheduled;
      text = 'ToActive';
      break;
    default:
      badgeStyle = styles.expired;
      text = 'Out of Stock';
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={globalStyles.textSMWhite}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start', // This makes the badge wrap tightly around the text
  },
  active: {
    backgroundColor: '#23C16B',
  },
  inactive: {
    backgroundColor: '#E7522F',
  },
  scheduled: {
    backgroundColor: '#48A7F8',
  },
  expired: {
    backgroundColor: '#6B4EFF',
  },
  unknown: {
    backgroundColor: '#E7522F',
  },
});

export default StatusBadge;
