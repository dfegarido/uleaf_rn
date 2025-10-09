import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const UserProfile = ({ user }) => (
  <View style={styles.userContainer}>
    <Image source={{ uri: user.avatar }} style={styles.avatar} />
    <View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.username}>{user.username}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 106, // Space for the absolute header
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  name: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    color: '#202325',
  },
  username: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#7F8D91',
  },
});

export default UserProfile;