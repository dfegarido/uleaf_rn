/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable react/no-unstable-nested-components */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../firebase';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessageCount';

// Import buyer screens
import { ScreenCart } from '../../screens/Buyer/Cart';
import CheckoutScreen from '../../screens/Buyer/Checkout/CheckoutScreen';
import { BuyerLiveStreamScreen } from '../../screens/Buyer/Live';
import LiveScreen from '../../screens/Buyer/Live/LiveScreen'; // Disabled for now
import OngoingLiveListScreen from '../../screens/Buyer/Live/OngoingLiveListScreen';
import UpcomingLiveListScreen from '../../screens/Buyer/Live/UpcomingLiveListScreen';
import { OrderDetailsScreen } from '../../screens/Buyer/Orders';
import InvoiceViewScreen from '../../screens/Buyer/Orders/InvoiceViewScreen';
import RequestCredit from '../../screens/Buyer/Orders/ScreenRequestCredit';
import AccountInformationScreen from '../../screens/Buyer/Profile/AccountInformationScreen';
import AddNewAddressScreen from '../../screens/Buyer/Profile/AddNewAddressScreen';
import AddRequestChangePlantFlightScreen from '../../screens/Buyer/Profile/AddRequestChangePlantFlightScreen';
import AddressBookScreen from '../../screens/Buyer/Profile/AddressBookScreen';
import BuyerProfileScreen from '../../screens/Buyer/Profile/BuyerProfileScreen';
import InviteFriendsScreen from '../../screens/Buyer/Profile/InviteFriendsScreen';
import PrivacyPolicyScreen from '../../screens/Buyer/Profile/PrivacyPolicyScreen';
import ReportAProblemScreen from '../../screens/Buyer/Profile/ReportAProblemScreen';
import RequestChangePlantFlightScreen from '../../screens/Buyer/Profile/RequestChangePlantFlightScreen';
import MyShippingBuddiesRouter from '../../screens/Buyer/Profile/ShippingBuddies/MyShippingBuddiesRouter';
import BuyerPlantCreditsScreen from '../../screens/Buyer/Profile/BuyerPlantCreditsScreen';
import ShoppingPoliciesScreen from '../../screens/Buyer/Profile/ShoppingPoliciesScreen';
import TermsOfUseScreen from '../../screens/Buyer/Profile/TermsOfUseScreen';
import UpdateAddressScreen from '../../screens/Buyer/Profile/UpdateAddressScreen';
import UpdatePasswordScreen from '../../screens/Buyer/Profile/UpdatePasswordScreen';
import ScreenGenusPlants from '../../screens/Buyer/Shop/ScreenGenusPlants';
import ScreenPlantDetail from '../../screens/Buyer/Shop/ScreenPlantDetail';
import ScreenPlantDetailPurge from '../../screens/Buyer/Shop/ScreenPlantDetailPurge';
import ScreenShop from '../../screens/Buyer/Shop/ScreenShop';
import ScreenWishlist from '../../screens/Buyer/Shop/ScreenWishlist';
import ChatScreen from '../../screens/ChatScreen/ChatScreen';
import ChatSettingsScreen from '../../screens/ChatScreen/ChatSettingsScreen';
import LivePurgeScreen from '../../screens/Live/LivePurgeScreen';

import { LiveBroadcastScreen } from '../../screens/Live';

import MessagesScreen from '../../screens/MessagesScreen/MessagesScreen';

// Import tab icons (you can reuse existing icons or create new ones)

import BuyerIcon from '../../assets/icontabs/buyer-tabs/buyer.svg';
import CartIconSelected from '../../assets/icontabs/buyer-tabs/cart-icon-selected.svg';
import CartIcon from '../../assets/icontabs/buyer-tabs/cart-solid.svg';
import ChatIconSelected from '../../assets/icontabs/buyer-tabs/chat-icon-selected.svg';
import ChatIcon from '../../assets/icontabs/buyer-tabs/chat-solid.svg';
import LiveIconSelected from '../../assets/icontabs/buyer-tabs/live-icon-selected.svg';
import LiveIcon from '../../assets/icontabs/buyer-tabs/live-solid.svg';
import OrderIconSelected from '../../assets/icontabs/clipboard-text-solid.svg';
import OrderIcon from '../../assets/icontabs/order.svg';

import { ScreenOrders } from '../../screens/Buyer/Orders';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Animated Live Icon Component
const AnimatedLiveIcon = ({ focused, size }) => {
  const [isLive, setIsLive] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const liveCollectionRef = collection(db, 'live');
    const q = query(liveCollectionRef, where('status', '==', 'live'));

    const unsubscribe = onSnapshot(q, snapshot => {
      setIsLive(!snapshot.empty);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    if (isLive && !focused) {
      animation.start();
    } else {
      animation.stop();
      blinkAnim.setValue(1);
    }

    return () => animation.stop();
  }, [isLive, focused, blinkAnim]);

  if (isLive) {
    return ( 
    <Animated.View style={{ opacity: blinkAnim }}>
      <LiveIconSelected width={size} height={size} />
    </Animated.View>
    );
  }

  return (
    <LiveIcon width={size} height={size} />
  );
};

// Placeholder component for Live tab
const LivePlaceholder = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F3F5'}}>
    <Text style={{fontSize: 18, color: '#666', textAlign: 'center'}}>
      🎥{'\n\n'}Live Streaming{'\n'}Coming Soon!
    </Text>
  </View>
);

// Create a Shop Stack Navigator to include shop-related screens
function ShopStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        lazy: false, // Disable lazy loading to keep screens mounted
        detachPreviousScreen: false, // Keep previous screens in memory
      }}
    >
      <Stack.Screen
        name="ScreenShop"
        component={ScreenShop}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenGenusPlants"
        component={ScreenGenusPlants}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenWishlist"
        component={ScreenWishlist}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function BuyerTabNavigator() {
  return (
      <Stack.Navigator>
        <Stack.Screen
          name="BuyerTabs"
          component={BuyerTabs}
          options={{headerShown: false}}
        />
      <Stack.Screen
        name="ScreenPlantDetail"
        component={ScreenPlantDetail}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenPlantDetailPurge"
        component={ScreenPlantDetailPurge}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenProfile"
        component={BuyerProfileScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="AddressBookScreen"
        component={AddressBookScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="AddNewAddressScreen"
        component={AddNewAddressScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="UpdateAddressScreen"
        component={UpdateAddressScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="AccountInformationScreen"
        component={AccountInformationScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="UpdatePasswordScreen"
        component={UpdatePasswordScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="RequestChangePlantFlightScreen"
        component={RequestChangePlantFlightScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="AddRequestChangePlantFlightScreen"
        component={AddRequestChangePlantFlightScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="BuyerLiveStreamScreen"
        component={BuyerLiveStreamScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="LivePurgeScreen"
        component={LivePurgeScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="OngoingLiveListScreen"
        component={OngoingLiveListScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="UpcomingLiveListScreen"
        component={UpcomingLiveListScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="LiveScreen"
        component={LiveScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="LiveBroadcastScreen"
        component={LiveBroadcastScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="InviteFriendsScreen"
        component={InviteFriendsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="MyShippingBuddiesScreen"
        component={MyShippingBuddiesRouter}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="BuyerPlantCreditsScreen"
        component={BuyerPlantCreditsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="TermsOfUseScreen"
        component={TermsOfUseScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ShoppingPoliciesScreen"
        component={ShoppingPoliciesScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ReportAProblemScreen"
        component={ReportAProblemScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ChatSettingsScreen"
        component={ChatSettingsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenRequestCredit"
        component={RequestCredit}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InvoiceViewScreen"
        component={InvoiceViewScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenCart"
        component={ScreenCart}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

// Badge component for displaying unread message count
const UnreadBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

function BuyerTabs() {
  const navigation = useNavigation();
  const { unreadCount } = useUnreadMessageCount();
  
  return (
    <Tab.Navigator
      initialRouteName="Shop"
      screenOptions={({route}) => ({
        tabBarStyle: [styles.tabBar],
        tabBarActiveTintColor: '#539461',
        tabBarLabel: ({focused, color}) => {
          let labelStyle = focused
            ? styles.focusedLabel
            : styles.unfocusedLabel;
          return (
            <Text style={[{color}, labelStyle, styles.customLabel]}>
              {route.name}
            </Text>
          );
        },
        tabBarIcon: ({color, size, focused}) => {
          switch (route.name) {
            case 'Live': return <AnimatedLiveIcon focused={focused} size={size} />;
            case 'Cart':
              return focused ? (
                <CartIconSelected width={size} height={size} />
              ) : (
                <CartIcon width={size} height={size} />
              );
            case 'Shop':
              return (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    width: 70,
                    height: 70,
                    backgroundColor: 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <BuyerIcon width={80} height={80} />
                </View>
              );
            case 'Orders':
              return focused ? (
                <OrderIconSelected width={size} height={size} />
              ) : (
                <OrderIcon width={size} height={size} />
              );
            case 'Chat':
              return (
                <View style={styles.chatIconContainer}>
                  {focused ? (
                    <ChatIconSelected width={size} height={size} />
                  ) : (
                    <ChatIcon width={size} height={size} />
                  )}
                  <UnreadBadge count={unreadCount} />
                </View>
              );
          }
        },
        headerShown: false,
      })}>
      <Tab.Screen
        listeners={({navigation}) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('LiveScreen');
          },
        })}
        name="Live"
        component={LiveScreen}
      />
      <Tab.Screen
        name="Cart"
        component={ScreenShop} // Use a placeholder component
        listeners={({navigation}) => ({
          tabPress: e => {
            e.preventDefault();
            // Navigate to cart screen as a separate screen
            navigation.navigate('ScreenCart');
          },
        })}
      />
      <Tab.Screen name="Shop" component={ShopStackNavigator} />
      <Tab.Screen name="Orders" component={ScreenOrders} />

      <Tab.Screen
        listeners={({navigation}) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('MessagesScreen');
          },
        })}
        name="Chat"
        component={MessagesScreen}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  focusedLabel: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  unfocusedLabel: {
    fontWeight: 'normal',
    fontSize: 10,
  },
  customLabel: {
    marginTop: -4,
  },
  tabBar: {
    paddingBottom: 30,
    height: 80,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  chatIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#E7522F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

export default BuyerTabNavigator;
