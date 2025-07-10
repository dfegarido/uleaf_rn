/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text, View, StyleSheet} from 'react-native';

// Import buyer screens
import ScreenShop from '../../screens/Buyer/Shop/ScreenShop';
import ScreenCart from '../../screens/Buyer/Cart/ScreenCart';
import {ScreenWishlist} from '../../screens/Buyer/Shop';
import {ScreenProfile} from '../../screens/Profile';

// Import tab icons (you can reuse existing icons or create new ones)

import OrderIcon from '../../assets/icontabs/order.svg';
import OrderIconSelected from '../../assets/icontabs/clipboard-text-solid.svg';
import CartIcon from '../../assets/icontabs/buyer-tabs/cart-solid.svg';
import CartIconSelected from '../../assets/icontabs/buyer-tabs/cart-icon-selected.svg';
import LiveIcon from '../../assets/icontabs/buyer-tabs/live-solid.svg';
import LiveIconSelected from '../../assets/icontabs/buyer-tabs/live-icon-selected.svg';
import ChatIcon from '../../assets/icontabs/buyer-tabs/chat-solid.svg';
import ChatIconSelected from '../../assets/icontabs/buyer-tabs/chat-icon-selected.svg';
import BuyerIcon from '../../assets/icontabs/buyer-tabs/buyer.svg';
import {ScreenOrders} from '../../screens/Buyer/Orders';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({title}) => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 20, fontWeight: 'bold'}}>{title}</Text>
    <Text style={{marginTop: 10, color: '#666'}}>Coming Soon</Text>
  </View>
);

function BuyerTabNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BuyerTabs"
        component={BuyerTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenWishlist"
        component={ScreenWishlist}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScreenProfile"
        component={ScreenProfile}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator
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
        component={() => <PlaceholderScreen title="Lives" />}
      />
      <Tab.Screen name="Cart" component={ScreenCart} />
      <Tab.Screen name="Shop" component={ShopStackScreen} />
      <Tab.Screen name="Orders" component={ScreenOrders} />
      <Tab.Screen
        name="Chat"
        component={() => <PlaceholderScreen title="Chat" />}
      />
    </Tab.Navigator>
  );
}

const ShopStack = createNativeStackNavigator();

function ShopStackScreen() {
  return (
    <ShopStack.Navigator>
      <ShopStack.Screen
        name="ScreenShop"
        component={ScreenShop}
        options={{headerShown: false}}
      />
      <ShopStack.Screen
        name="ScreenWishlist"
        component={ScreenWishlist}
        options={{headerShown: false}}
      />
    </ShopStack.Navigator>
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
