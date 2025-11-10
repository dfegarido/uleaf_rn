import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { globalStyles } from '../../../../assets/styles/styles';

const StatusBadge = ({statusCode}) => {
  let badgeStyle = {};
  let text = '';
  const textStyle = [globalStyles.textSMWhite];

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
    case 'SoldOut':
      badgeStyle = styles.scheduled;
      text = 'Sold Out';
      break;
    case 'Expired':
      badgeStyle = styles.expired;
      text = 'Expired';
      break;
    case 'Out of Stock':
      badgeStyle = styles.outOfStock;
      text = 'Out of Stock';
      textStyle.push(styles.textDark);
      break;
    case 'Sold':
      badgeStyle = styles.sold;
      text = 'SOLD';
      textStyle.push(styles.textDark);
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
      badgeStyle = styles.outOfStock;
      text = 'Out of Stock';
      textStyle.push(styles.textDark);
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={textStyle}>{text}</Text>
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
    backgroundColor: '#FACC15',
  },
  scheduled: {
    backgroundColor: '#48A7F8',
  },
  expired: {
    backgroundColor: '#6B4EFF',
  },
  outOfStock: {
    backgroundColor: '#FFE7E2',
  },
  sold: {
    backgroundColor: '#FFE7E2',
  },
  unknown: {
    backgroundColor: '#E7522F',
  },
  textDark: {
    color: '#000000',
  },
});

export default StatusBadge;
