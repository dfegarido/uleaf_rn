import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';

const ComponentHeader = () => {
  return (
    <View style={styles.headerBox}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.welcomeMessage}>Hi Olla!</Text>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <View style={styles.notificationContainer}>
            <Image
              source={require('../../assets/images/avatar-female.png')}
              style={styles.avatar}
            />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#DFECDF',
  },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
    width: 30,
    height: 30,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 50, // half of width/height = circle
    borderWidth: 2,
    borderColor: '#ddd',
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ComponentHeader;
