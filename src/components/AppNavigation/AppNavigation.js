import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import ScreenDelivery from '../../screens/Delivery/ScreenDelivery';
import ScreenHome from '../../screens/Home/ScreenHome';
import ScreenListing from '../../screens/Listing/ScreenListing';
import ScreenLogin from '../../screens/Login';
import ScreenOrder from '../../screens/Order/ScreenOrder';
import ScreenSell from '../../screens/Sell/ScreenSell';
import ScreenSignup from '../../screens/Singup/ScreenSignup';

import HomeIcon from '../../assets/icontabs/home.svg';
import DeliveryIcon from '../../assets/icontabs/delivery.svg';
import ListingIcon from '../../assets/icontabs/listing.svg';
import OrderIcon from '../../assets/icontabs/order.svg';
import SellIcon from '../../assets/icontabs/sell.svg';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* <Stack.Screen
          name="Login"
          component={ScreenLogin}
          options={{headerShown: false, animation: 'slide_from_right'}}
        />
        <Stack.Screen
          name="Signup"
          component={ScreenSignup}
          options={{headerShown: false, animation: 'slide_from_right'}}
        /> */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{headerShown: false, animation: 'slide_from_right'}}
        />
        {/* <Stack.Screen
          name="SettingsEditProfile"
          component={SettingsEditProfile}
          options={{
            headerShown: true,
            title: 'Edit Profile',
            animation: 'slide_from_right',
          }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Tab navigator containing Home, Vote, Community, and Store screens
function MainTabNavigator() {
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
        // tabBarIcon: ({color, size, focused}) => {
        //   return <HomeIcon style={{color: color}}>{route.name}</HomeIcon>;
        // },
        tabBarIcon: ({color, size, focused}) => {
          // Determine the icon based on the route name
          switch (route.name) {
            case 'Home':
              Icon = HomeIcon;
              return (
                <HomeIcon
                  width={size}
                  height={size}
                  fill={color} // Icon color will follow focus state
                />
              );
              break;
            case 'Listings':
              return (
                <ListingIcon
                  width={size}
                  height={size}
                  fill={color} // Icon color will follow focus state
                />
              );
              break;
            case 'Sell':
              return (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 2,
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
                  <SellIcon width={80} height={80} />
                </View>
              );
              break;
            case 'Order':
              return (
                <OrderIcon
                  width={size}
                  height={size}
                  fill={color} // Icon color will follow focus state
                />
              );
              break;
            case 'Delivery':
              return (
                <DeliveryIcon
                  width={size}
                  height={size}
                  fill={color} // Icon color will follow focus state
                />
              );
              break;
          }
        },

        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={ScreenHome} />
      <Tab.Screen name="Listings" component={ScreenListing} />
      <Tab.Screen name="Sell" component={ScreenSell} />
      <Tab.Screen name="Order" component={ScreenOrder} />
      <Tab.Screen name="Delivery" component={ScreenDelivery} />
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
    marginTop: -10,
  },
  tabBar: {
    paddingBottom: 5,
  },
});

export default AppNavigation;
