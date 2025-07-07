import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const InfoCard = ({
  title,
  subtitle,
  IconComponent,
  backgroundColor,
  onPress,
}) => (
  <TouchableOpacity style={[styles.card, {backgroundColor}]} onPress={onPress}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
    <View style={styles.iconWrapper}>
      {IconComponent && <IconComponent width={70} height={70} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 2,
    marginHorizontal: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  iconWrapper: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});

export default InfoCard;
