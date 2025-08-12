/* eslint-disable react/no-unstable-nested-components */
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useContext, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {AuthContext} from '../../auth/AuthProvider';
import BuyerTabNavigator from './BuyerTabNavigator';

import {ChatScreen} from '../../screens/ChatScreen';
import ChatSettingsScreen from '../../screens/ChatScreen/ChatSettingsScreen';

import MessagesScreen from '../../screens/MessagesScreen/MessagesScreen';

import {LiveBroadcastScreen} from '../../screens/Live';

import {ScreenPrivacy, ScreenTerms} from '../../screens/Legal';
import {
  ScreenLogin,
  ScreenLoginForm,
  ScreenLoginOtp,
} from '../../screens/Login';
import {
  ScreenProfile,
  ScreenProfileAccount,
  ScreenProfileChatAdmin,
  ScreenProfilePassword,
  ScreenProfileProblem,
  ScreenProfileRequest,
} from '../../screens/Profile';
import {
  ScreenDelivery,
  ScreenDeliveryAction,
  ScreenDeliveryCasualty,
  ScreenDeliveryHub,
  ScreenDeliveryMissing,
  ScreenDeliveryReceived,
  ScreenExportQR,
} from '../../screens/Seller/Delivery';
import {
  ScreenHome,
  ScreenMyStore,
  ScreenMyStoreDetail,
  ScreenPayout,
  ScreenPayoutDetails,
} from '../../screens/Seller/Home';
import {
  ScreenListing,
  ScreenListingAction,
  ScreenListingDetail,
  ScreenSearchListing,
} from '../../screens/Seller/Listing/';
import ScreenOrder from '../../screens/Seller/Order/ScreenOrder';
import {
  ScreenDraftSell,
  ScreenDuplicateSell,
  ScreenGrowersSell,
  ScreenSell,
  ScreenSingleSell,
  ScreenWholesaleSell,
} from '../../screens/Seller/Sell';
import {
  ScreenSignup,
  ScreenSignupActivationCode,
  ScreenSignupActivationCodeNext,
  ScreenSignupNext,
} from '../../screens/Singup';

import DeliveryIconSelected from '../../assets/icontabs/box-solid.svg';
import OrderIconSelected from '../../assets/icontabs/clipboard-text-solid.svg';
import DeliveryIcon from '../../assets/icontabs/delivery.svg';
import HomeIconSelected from '../../assets/icontabs/home-solid.svg';
import HomeIcon from '../../assets/icontabs/home.svg';
import ListingIconSelected from '../../assets/icontabs/leaf-solid.svg';
import ListingIcon from '../../assets/icontabs/listing.svg';
import OrderIcon from '../../assets/icontabs/order.svg';
import SellIcon from '../../assets/icontabs/sell.svg';

import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';

import AsyncStorage from '@react-native-async-storage/async-storage';
import BuyerSignupActivationCode from '../../screens/BuyerSignup/BuyerSignupLocation';
import BuyerSignup from '../../screens/BuyerSignup/BuyerSignup';
import BuyerSignupLocation from '../../screens/BuyerSignup/BuyerSignupLocation';
import {
  BuyerCompleteYourAccount,
  BuyerGettingToKnow,
} from '../../screens/BuyerSignup';
import TermsOfUseScreen from '../../screens/Buyer/Profile/TermsOfUseScreen';
import PrivacyPolicyScreen from '../../screens/Buyer/Profile/PrivacyPolicyScreen';
import AdminTabNavigator from './AdminTabNavigator';
import ScreenRequestCredit from '../../screens/Buyer/Orders/ScreenRequestCredit';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DeliveryStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ScreenDelivery"
      component={ScreenDelivery}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
    <Stack.Screen
      name="ScreenDeliveryHub"
      component={ScreenDeliveryHub}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
    <Stack.Screen
      name="ScreenDeliveryReceived"
      component={ScreenDeliveryReceived}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
    <Stack.Screen
      name="ScreenDeliveryMissing"
      component={ScreenDeliveryMissing}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
    <Stack.Screen
      name="ScreenDeliveryCasualty"
      component={ScreenDeliveryCasualty}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
    <Stack.Screen
      name="ScreenExportQR"
      component={ScreenExportQR}
      options={{headerShown: false, animation: 'slide_from_right'}}
    />
  </Stack.Navigator>
);

const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={ScreenLogin}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="LoginForm"
        component={ScreenLoginForm}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: '', // Optionally hide the header title
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="BuyerTabs"
        component={BuyerTabNavigator}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabNavigator}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="LoginOtp"
        component={ScreenLoginOtp}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: '', // Optionally hide the header title
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="Signup"
        component={ScreenSignup}
        options={({navigation}) => ({
          headerShown: true,
          title: '',
          animation: 'slide_from_right',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="ScreenSignupNext"
        component={ScreenSignupNext}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: '', // Optionally hide the header title
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="ScreenSignupActivationCode"
        component={ScreenSignupActivationCode}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: '', // Optionally hide the header title
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="ScreenSignupActivationCodeNext"
        component={ScreenSignupActivationCodeNext}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: '', // Optionally hide the header title
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenTerms"
        component={ScreenTerms}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Terms of Use', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenPrivacy"
        component={ScreenPrivacy}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Privacy Policy', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="BuyerAuthStack"
        component={BuyerAuthStack}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="TermsOfUseScreen"
        component={TermsOfUseScreen}
        options={({navigation}) => ({
          headerShown: false,
          title: 'Terms of Use',
          headerTitleAlign: 'center',
          animation: 'slide_from_right',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={({navigation}) => ({
          headerShown: false,
          title: 'Privacy Policy',
          headerTitleAlign: 'center',
          animation: 'slide_from_right',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name="ScreenRequestCredit"
        component={ScreenRequestCredit}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const BuyerAuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BuyerSignup"
        component={BuyerSignup}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="BuyerSignupLocation"
        component={BuyerSignupLocation}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="BuyerGettingToKnow"
        component={BuyerGettingToKnow}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="BuyerCompleteYourAccount"
        component={BuyerCompleteYourAccount}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenSingleSell"
        component={ScreenSingleSell}
        options={({navigation}) => ({
          headerShown: false, // Ensure the header is shown
          title: 'Single Plant', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="ScreenWholesaleSell"
        component={ScreenWholesaleSell}
        options={({navigation}) => ({
          headerShown: false, // Ensure the header is shown
          title: 'Wholesale', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
      <Stack.Screen
        name="ScreenGrowersSell"
        component={ScreenGrowersSell}
        options={({navigation}) => ({
          headerShown: false, // Ensure the header is shown
          title: "Grower's Choice", // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenDuplicateSell"
        component={ScreenDuplicateSell}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Existing Listing', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenDraftSell"
        component={ScreenDraftSell}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Draft Listing', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenMyStore"
        component={ScreenMyStore}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenMyStoreDetail"
        component={ScreenMyStoreDetail}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfile"
        component={ScreenProfile}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfileAccount"
        component={ScreenProfileAccount}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfileProblem"
        component={ScreenProfileProblem}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfilePassword"
        component={ScreenProfilePassword}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfileRequest"
        component={ScreenProfileRequest}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenProfileChatAdmin"
        component={ScreenProfileChatAdmin}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenListingAction"
        component={ScreenListingAction}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenListingDetail"
        component={ScreenListingDetail}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenSearchListing"
        component={ScreenSearchListing}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenDeliveryHub"
        component={ScreenDeliveryHub}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="ScreenDeliveryReceived"
        component={ScreenDeliveryReceived}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="ScreenDeliveryMissing"
        component={ScreenDeliveryMissing}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="ScreenDeliveryCasualty"
        component={ScreenDeliveryCasualty}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="ScreenDeliveryAction"
        component={ScreenDeliveryAction}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenPayout"
        component={ScreenPayout}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ChatSettingsScreen"
        component={ChatSettingsScreen}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="LiveBroadcastScreen"
        component={LiveBroadcastScreen}
      />

      <Stack.Screen
        name="ScreenPayoutDetails"
        component={ScreenPayoutDetails}
        options={{headerShown: false, animation: 'slide_from_right'}}
      />

      <Stack.Screen
        name="ScreenTerms"
        component={ScreenTerms}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Terms of Use', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />

      <Stack.Screen
        name="ScreenPrivacy"
        component={ScreenPrivacy}
        options={({navigation}) => ({
          headerShown: true, // Ensure the header is shown
          title: 'Privacy Policy', // Optionally hide the header title
          headerTitleAlign: 'center',
          animation: 'slide_from_right', // Screen transition animation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : null
              }>
              <BackSolidIcon width={20} height={20} />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // For Android
            shadowOpacity: 0, // For iOS
            borderBottomWidth: 0, // For iOS
          },
          headerShadowVisible: false, // ✅ React Navigation 6.1+ (Android/iOS)
        })}
      />
    </Stack.Navigator>
  );
};

// Tab navigator containing Home, Vote, Community, and Store screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarStyle:
          route.name === 'ChatScreen' || route.name === 'MessagesScreen'
            ? {display: 'none'}
            : styles.tabBar,
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
              return focused ? (
                <HomeIconSelected width={size} height={size} />
              ) : (
                <HomeIcon width={size} height={size} />
              );
            case 'Listings':
              return focused ? (
                <ListingIconSelected width={size} height={size} />
              ) : (
                <ListingIcon width={size} height={size} />
              );
            case 'Sell':
              return (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    width: 70,
                    height: 70,
                    backgroundColor: 'transparent', // Adjust background color if needed
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                  }}>
                  <SellIcon width={80} height={80} />
                </View>
              );
            case 'Order':
              return focused ? (
                <OrderIconSelected width={size} height={size} />
              ) : (
                <OrderIcon width={size} height={size} />
              );
            case 'Delivery':
              return focused ? (
                <DeliveryIconSelected width={size} height={size} />
              ) : (
                <DeliveryIcon width={size} height={size} />
              );
          }
        },

        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={ScreenHome} />
      <Tab.Screen name="Listings" component={ScreenListing} />
      <Tab.Screen name="Sell" component={ScreenSell} />
      <Tab.Screen name="Order" component={ScreenOrder} />
      <Tab.Screen name="Delivery" component={DeliveryStack} />
    </Tab.Navigator>
  );
}

// const AppNavigation = () => {
//   const {isLoggedIn, isLoading} = useContext(AuthContext);
//
//   if (isLoading) {
//     return (
//       <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }
//   return (
//     <NavigationContainer>
//       {isLoggedIn ? <MainStack /> : <AuthStack />}
//     </NavigationContainer>
//   );
// };

const AppNavigation = () => {
  const {isLoggedIn, isLoading, userInfo} = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);

  // Get userInfo and userType from AsyncStorage
  useEffect(() => {
    const getUserInfoFromStorage = async () => {
      console.log('Reading userInfo from AsyncStorage...');

      // Try to get userInfo first
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      console.log('Raw stored userInfo:', storedUserInfo);

      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        setAsyncUserInfo(parsed);
        console.log(
          'AsyncStorage userInfo parsed:',
          JSON.stringify(parsed, null, 2),
        );
      }
    };

    if (isLoggedIn) {
      console.log('User is logged in, fetching userInfo from AsyncStorage');
      getUserInfoFromStorage();
    } else {
      console.log('User is not logged in, skipping AsyncStorage fetch');
      setAsyncUserInfo(null);
    }
  }, [isLoggedIn]);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine navigation based on user type
  // Use context userInfo first, fallback to AsyncStorage userInfo
  const currentUserInfo = userInfo || asyncUserInfo;

  // Extract userType from currentUserInfo with multiple fallbacks
  const userType = currentUserInfo?.user?.userType || 'seller'; // Default to seller if no userType found
  const isBuyer = userType === 'buyer';

  // Debug logging
  console.log('=== NAVIGATION DECISION ===');
  console.log('currentUserInfo:', currentUserInfo);
  console.log('userType:', userType);
  console.log('isBuyer:', isBuyer);
  console.log('isLoggedIn:', isLoggedIn);
  console.log('========================');

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        isBuyer ? (
          <BuyerTabNavigator />
        ) : (
          <MainStack />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

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
    // paddingBottom: 20,
  },
});

export default AppNavigation;
