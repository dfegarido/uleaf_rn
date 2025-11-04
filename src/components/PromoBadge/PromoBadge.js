import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

// Example: Pass in an SVG icon component as the 'icon' prop
const PromoBadge = ({icon: Icon, label, style, onPress, isActive = false, ...props}) => (
  <TouchableOpacity 
    style={[
      styles.badge, 
      isActive && styles.badgeActive,
      style
    ]} 
    onPress={onPress} 
    {...props}
  >
    {Icon && <Icon width={22} height={22} style={styles.icon} />}
    <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#23C16B',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#393D40',
    fontSize: 16,
    fontWeight: '600',
  },
  labelActive: {
    color: '#23C16B',
    fontWeight: '600',
  },
});

export default PromoBadge;
