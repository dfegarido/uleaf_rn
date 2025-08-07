/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable react/no-unstable-nested-components */
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

// Import buyer screens
import {BuyerLiveStreamScreen} from '../../screens/Buyer/Live';
// import LiveScreen from '../../screens/Buyer/Live/LiveScreen'; // Disabled for now
import AccountInformationScreen from '../../screens/Buyer/Profile/AccountInformationScreen';
import AddNewAddressScreen from '../../screens/Buyer/Profile/AddNewAddressScreen';
import AddressBookScreen from '../../screens/Buyer/Profile/AddressBookScreen';
import BuyerProfileScreen from '../../screens/Buyer/Profile/BuyerProfileScreen';
import UpdateAddressScreen from '../../screens/Buyer/Profile/UpdateAddressScreen';
import UpdatePasswordScreen from '../../screens/Buyer/Profile/UpdatePasswordScreen';
import InviteFriendsScreen from '../../screens/Buyer/Profile/InviteFriendsScreen';
import TermsOfUseScreen from '../../screens/Buyer/Profile/TermsOfUseScreen';
import ReportAProblemScreen from '../../screens/Buyer/Profile/ReportAProblemScreen';
import PrivacyPolicyScreen from '../../screens/Buyer/Profile/PrivacyPolicyScreen';
import ChatScreen from '../../screens/ChatScreen/ChatScreen';
import ChatSettingsScreen from '../../screens/ChatScreen/ChatSettingsScreen';
import ScreenShop from '../../screens/Buyer/Shop/ScreenShop';
import ScreenGenusPlants from '../../screens/Buyer/Shop/ScreenGenusPlants';
import ScreenPlantDetail from '../../screens/Buyer/Shop/ScreenPlantDetail';
import ScreenWishlist from '../../screens/Buyer/Shop/ScreenWishlist';
import RequestCredit from '../../screens/Buyer/Orders/ScreenRequestCredit';
import {ScreenCart} from '../../screens/Buyer/Cart';
import CheckoutScreen from '../../screens/Buyer/Checkout/CheckoutScreen';

import {LiveBroadcastScreen} from '../../screens/Live';

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
import {ScreenOrders} from '../../screens/Buyer/Orders';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
    <Stack.Navigator>
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
        name="BuyerLiveStreamScreen"
        component={BuyerLiveStreamScreen}
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
        name="TermsOfUseScreen"
        component={TermsOfUseScreen}
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
        name="ScreenCart"
        component={ScreenCart}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function BuyerTabs() {
  const navigation = useNavigation();
  return (
    <Tab.Navigator
      initialRouteName="Shop"
      screenOptions={({route}) => ({
        tabBarStyle: styles.tabBar,
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
            case 'Live':
              return focused ? (
                <LiveIconSelected width={size} height={size} />
              ) : (
                <LiveIcon width={size} height={size} />
              );
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
                    shadowColor: '#000',
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
              return focused ? (
                <ChatIconSelected width={size} height={size} />
              ) : (
                <ChatIcon width={size} height={size} />
              );
          }
        },
        headerShown: false,
      })}>
      <Tab.Screen
        name="Live"
        component={LivePlaceholder}
        listeners={({navigation}) => ({
          tabPress: e => {
            // Don't prevent default - let it navigate to placeholder
            // Just log the press
            console.log('Live tab pressed - feature coming soon!');
          },
        })}
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
    paddingBottom: 10,
  },
});

export default BuyerTabNavigator;
