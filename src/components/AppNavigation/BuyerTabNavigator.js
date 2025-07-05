/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet} from 'react-native';

// Import buyer screens
import ScreenShop from '../../screens/Buyer/Shop/ScreenShop';

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

const Tab = createBottomTabNavigator();

// Temporary placeholder screens for development
const PlaceholderScreen = ({title}) => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 20, fontWeight: 'bold'}}>{title}</Text>
    <Text style={{marginTop: 10, color: '#666'}}>Coming Soon</Text>
  </View>
);

function BuyerTabNavigator() {
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
                    backgroundColor: 'transparent', // Adjust background color if needed
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    // shadowOffset: {width: 0, height: 4},
                    // shadowOpacity: 0.3,
                    // shadowRadius: 4,
                    // elevation: 5,
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
      <Tab.Screen
        name="Cart"
        component={() => <PlaceholderScreen title="Shopping Cart" />}
      />
      <Tab.Screen name="Shop" component={ScreenShop} />
      <Tab.Screen
        name="Orders"
        component={() => <PlaceholderScreen title="My Orders" />}
      />
      <Tab.Screen
        name="Chat"
        component={() => <PlaceholderScreen title="Chat" />}
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
