import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {globalStyles} from '../../../../assets/styles/styles';

const StatusBadge = ({statusCode}) => {
  let badgeStyle = {};
  let text = '';

  switch (statusCode) {
    case 'LS1':
      badgeStyle = styles.active;
      text = 'Active';
      break;
    case 'LS2':
      badgeStyle = styles.inactive;
      text = 'In Active';
      break;
    default:
      badgeStyle = styles.unknown;
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
    backgroundColor: '#FFB323',
  },
  unknown: {
    backgroundColor: '#ccc',
  },
});

export default StatusBadge;
