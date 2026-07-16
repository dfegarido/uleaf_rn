import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import CreditsScreen from '../../../components/Credits/CreditsScreen';

export default function AdminCreditsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const buyerUid = route.params?.buyerUid;

  return (
    <CreditsScreen
      buyerUid={buyerUid}
      title="Credits"
      showDebug={true}
      isAdmin={true}
      headerProps={{ showBack: true, navigation }}
    />
  );
}
