import React, { useContext } from 'react';
import { AuthContext } from '../../../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import CreditsScreen from '../../../components/Credits/CreditsScreen';

export default function BuyerCreditsScreen() {
  const { userInfo } = useContext(AuthContext);
  const navigation = useNavigation();

  return (
    <CreditsScreen
      buyerUid={userInfo?.uid}
      title="Credits"
      showDebug={false}
      headerProps={{ showBack: true, navigation }}
    />
  );
}
