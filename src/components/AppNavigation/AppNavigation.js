/* eslint-disable react/no-unstable-nested-components */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../auth/AuthProvider';
import BuyerTabNavigator from './BuyerTabNavigator';

import { ChatScreen } from '../../screens/ChatScreen';
import ChatSettingsScreen from '../../screens/ChatScreen/ChatSettingsScreen';

import MessagesScreen from '../../screens/MessagesScreen/MessagesScreen';

import { LiveBroadcastScreen } from '../../screens/Live';
import CreateLiveSessionScreen from '../../screens/Live/CreateLiveSessionScreen';
import LiveSellerScreen from '../../screens/Live/LiveScreen';
import MyLiveSessionsScreen from '../../screens/Live/MyLiveSessionsScreen';
import ScreenMyPurges from '../../screens/Live/ScreenMyPurges';
import SetUpListingsPurgeScreen from '../../screens/Live/SetUpListingsPurgeScreen';

import ScanQRSellerScreen from '../../screens/Seller/Delivery/ScanQR/SellerScanQR';

import { ScreenPrivacy, ScreenTerms } from '../../screens/Legal';
import {
  ScreenForgotPassword,
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
  ScreenForDelivery
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
import OrderScreen from '../../screens/Seller/Order/OrderScreen';
import {
  ScreenDraftSell,
  ScreenDuplicateSell,
  ScreenGrowersSell,
  ScreenSell,
  ScreenSingleSell,
  ScreenSingleSellGroupChat,
  ScreenSingleSellLive,
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
import ScreenRequestCredit from '../../screens/Buyer/Orders/ScreenRequestCredit';
import PrivacyPolicyScreen from '../../screens/Buyer/Profile/PrivacyPolicyScreen';
import TermsOfUseScreen from '../../screens/Buyer/Profile/TermsOfUseScreen';
import {
  BuyerCompleteYourAccount,
  BuyerGettingToKnow,
} from '../../screens/BuyerSignup';
import BuyerSignup from '../../screens/BuyerSignup/BuyerSignup';
import BuyerSignupLocation from '../../screens/BuyerSignup/BuyerSignupLocation';
import AdminTabNavigator from './AdminTabNavigator';

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
    <Stack.Screen
      name="ScreenForDelivery"
      component={ScreenForDelivery}
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
        name="ForgotPassword"
        component={ScreenForgotPassword}
        options={{headerShown: false, animation: 'slide_from_right'}}
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
        name="ScreenSingleSellGroupChat"
        component={ScreenSingleSellGroupChat}
        options={({navigation}) => ({
          headerShown: false, // Ensure the header is shown
          title: 'Live Plant', // Optionally hide the header title
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
        name="ScreenSingleSellLive"
        component={ScreenSingleSellLive}
        options={({navigation}) => ({
          headerShown: false, // Ensure the header is shown
          title: 'Live Plant', // Optionally hide the header title
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
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ScanQRSellerScreen"
        component={ScanQRSellerScreen}
        options={{headerShown: false}}
      />
      
      <Stack.Screen
        name="CreateLiveSession"
        component={CreateLiveSessionScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="SetUpListingsPurgeScreen"
        component={SetUpListingsPurgeScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="ScreenMyPurges"
        component={ScreenMyPurges}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="MyLiveSessionsScreen"
        component={MyLiveSessionsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="LiveSellerScreen"
        component={LiveSellerScreen}
        options={{headerShown: false}}
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
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic bottom padding for Android
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 20) 
    : 20;
  
  const dynamicTabBarStyle = {
    ...styles.tabBar,
    paddingBottom: bottomPadding,
    height: 60 + (Platform.OS === 'android' ? Math.max(insets.bottom - 20, 0) : 0),
  };
  
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarStyle:
          route.name === 'ChatScreen' || route.name === 'MessagesScreen'
            ? {display: 'none'}
            : dynamicTabBarStyle,
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
                  }}>
                  <SellIcon width={80} height={80} />
                </View>
              );
            case 'Orders':
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
  <Tab.Screen name="Orders" component={OrderScreen} />
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
  const {isLoggedIn, isLoading, userInfo, setIsLoggedIn, setUserInfo} = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  // Get userInfo and userType from AsyncStorage
  useEffect(() => {
    const getUserInfoFromStorage = async () => {
      // Try to get userInfo first
      const storedUserInfo = await AsyncStorage.getItem('userInfo');

      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        setAsyncUserInfo(parsed);
      }
    };

    if (isLoggedIn) {
      getUserInfoFromStorage();
    } else {
      setAsyncUserInfo(null);
    }
  }, [isLoggedIn]);

  // Determine navigation based on user type
  // Use context userInfo first, fallback to AsyncStorage userInfo
  const currentUserInfo = userInfo || asyncUserInfo;

  // Extract userType safely; do NOT default to 'seller' as that causes unauthenticated users
  const userType = currentUserInfo?.user?.userType ?? null;
  const isBuyer = userType === 'buyer';
  const isAdmin = userType === 'admin' || userType === 'sub_admin';

  // Create a stable navigation key that changes when login state or user type changes
  // This forces NavigationContainer to remount when switching between auth and app navigators
  const navKey = isLoggedIn && currentUserInfo 
    ? `loggedIn_${userType || 'unknown'}` 
    : 'loggedOut';
  const shouldShowAuth = !isLoggedIn || fallbackTriggered;

  // Log navigation state changes for debugging (must be before any early returns)
  useEffect(() => {
    console.log('🧭 [AppNavigation] State changed:', {
      isLoggedIn,
      userType,
      isBuyer,
      isAdmin,
      hasUserInfo: !!currentUserInfo,
      hasContextUserInfo: !!userInfo,
      hasAsyncUserInfo: !!asyncUserInfo,
      shouldShowAuth,
      fallbackTriggered,
      navKey
    });
  }, [isLoggedIn, userType, currentUserInfo, fallbackTriggered, navKey, userInfo, asyncUserInfo, isBuyer, isAdmin, shouldShowAuth]);

  // If we are logged in but userInfo hasn't loaded yet, show a loader instead of guessing navigation
  // Start a timeout fallback: if logged in but profile doesn't arrive in time, fall back to login
  useEffect(() => {
    let timer;
    if (isLoggedIn && !currentUserInfo && !fallbackTriggered) {
      // Wait 5 seconds for profile to load, then fallback to login
      timer = setTimeout(() => {
        console.warn('Profile did not load within timeout; falling back to login.');
        setFallbackTriggered(true);
        (async () => {
          try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userInfo');
          } catch (e) {
            console.warn('Error clearing AsyncStorage during fallback:', e);
          }

          try {
            setUserInfo(null);
          } catch (e) {
            console.error('Error clearing userInfo during fallback:', e);
          }

          try {
            setIsLoggedIn(false);
          } catch (e) {
            console.error('Error clearing isLoggedIn fallback:', e);
          }
        })();
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoggedIn, currentUserInfo, setIsLoggedIn, fallbackTriggered, setUserInfo]);

  // Render loading indicator while we're checking auth status initially
  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If we are logged in but userInfo hasn't loaded yet, show a loader instead of guessing navigation
  // But if fallback has triggered, go straight to login
  if (isLoggedIn && !currentUserInfo && !fallbackTriggered) {
    console.log('⏳ [AppNavigation] Waiting for userInfo: isLoggedIn=', isLoggedIn, 'userInfo=', !!userInfo, 'asyncUserInfo=', !!asyncUserInfo);
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}} edges={[]}>
      <NavigationContainer key={navKey}>
        {isLoggedIn && !fallbackTriggered ? (
          isBuyer ? (
            <BuyerTabNavigator />
          ) : isAdmin ? (
            <AdminTabNavigator />
          ) : (
            <MainStack />
          )
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    // </SafeAreaView>
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
});

export default AppNavigation;
