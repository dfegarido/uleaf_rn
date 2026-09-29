import React, {useContext} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthContext} from '../../auth/AuthProvider';
import B2BBuyerInviteCard from './B2BBuyerInviteCard';
import MockupHeader from './MockupHeader';

const ScreenShareAppToBuyers = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const uid = userInfo?.uid || userInfo?.user?.uid || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Share app to buyers" />
      <ScrollView contentContainerStyle={styles.content}>
        <B2BBuyerInviteCard uid={uid} aboutApp />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
});

export default ScreenShareAppToBuyers;
