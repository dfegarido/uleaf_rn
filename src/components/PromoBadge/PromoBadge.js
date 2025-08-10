import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

// Example: Pass in an SVG icon component as the 'icon' prop
const PromoBadge = ({icon: Icon, label, style, onPress, ...props}) => (
  <TouchableOpacity style={[styles.badge, style]} onPress={onPress} {...props}>
    {Icon && <Icon width={22} height={22} style={styles.icon} />}
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F6',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#393D40',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PromoBadge;
