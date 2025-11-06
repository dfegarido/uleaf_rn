import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useShippingBuddiesController } from './controllers/ShippingBuddiesController';
import ReceiverShippingBuddiesScreen from './ReceiverShippingBuddiesScreen';
import JoinerShippingBuddiesScreen from './JoinerShippingBuddiesScreen';

/**
 * MyShippingBuddiesRouter - Routes to the appropriate screen based on user role
 * - If user has joiners (is a receiver) -> ReceiverShippingBuddiesScreen
 * - If user has a receiver request (is a joiner) -> JoinerShippingBuddiesScreen
 * - Otherwise -> JoinerShippingBuddiesScreen with empty state
 */
const MyShippingBuddiesRouter = () => {
  const {
    joiners,
    loadingJoiners,
    myReceiverRequest,
    loadingMyRequest,
  } = useShippingBuddiesController();

  // Show loading while determining user role (show if either is still loading)
  if (loadingJoiners || loadingMyRequest) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#539461" />
      </View>
    );
  }

  // If user has joiners (is a receiver), show receiver screen
  if (joiners && joiners.length > 0) {
    return <ReceiverShippingBuddiesScreen />;
  }

  // Otherwise, show joiner screen (will show empty state if no request)
  return <JoinerShippingBuddiesScreen />;
};

export default MyShippingBuddiesRouter;

