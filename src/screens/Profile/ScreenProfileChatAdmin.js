import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../assets/images/avatar.svg';

const ScreenProfileChatAdmin = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Chat
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}

        {/* Main Content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default ScreenProfileChatAdmin;
