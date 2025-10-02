import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TaxonomyIconSelected from '../../assets/admin-icons/taxonomy-selected.svg';
import TaxonomyIcon from '../../assets/admin-icons/taxonomy.svg';
import BuyerIcon from '../../assets/icontabs/buyer-tabs/buyer.svg';
import ChatIconSelected from '../../assets/icontabs/buyer-tabs/chat-icon-selected.svg';
import ChatIcon from '../../assets/icontabs/buyer-tabs/chat-solid.svg';
import LiveIconSelected from '../../assets/icontabs/buyer-tabs/live-icon-selected.svg';
import LiveIcon from '../../assets/icontabs/buyer-tabs/live-solid.svg';
import HomeIconSelected from '../../assets/icontabs/home-solid.svg';
import HomeIcon from '../../assets/icontabs/home.svg';
import AdminHomeScreen from '../../screens/Admin/Home/Home';
import ScanQR from '../../screens/Admin/Home/ScanQR';
import UserInformation from '../../screens/Admin/Home/UserInformation';
import UserManagement from '../../screens/Admin/Home/UserManagement';
import JungleAccess from '../../screens/Admin/Home/JungleAccess';
import AddAdmin from '../../screens/Admin/Home/AddAdmin';
import EditAdmin from '../../screens/Admin/Home/EditAdmin';
import EditSubAdmin from '../../screens/Admin/Home/EditSubAdmin';
import EnrollSeller from '../../screens/Admin/LeafTrail/EnrollSeller';
import LeafTrail from '../../screens/Admin/LeafTrail/LeafTrail';
import PackingScreen from '../../screens/Admin/LeafTrail/Packing/Packing';
import ReceivingScreen from '../../screens/Admin/LeafTrail/Receiving/Receiving';
import ShippingScreen from '../../screens/Admin/LeafTrail/Shipping/Shipping';
import SortingScreen from '../../screens/Admin/LeafTrail/Sorting/Sorting';
import LiveSetup from '../../screens/Admin/LiveSetup/LiveSetup';
import {
  AdminAccountInformationScreen,
  AdminPrivacyPolicyScreen,
  AdminProfileScreen,
  AdminTermsOfUseScreen,
  AdminUpdatePasswordScreen
} from '../../screens/Admin/Profile';
// import Taxonomy from '../../screens/Admin/Taxonomy/Taxonomy';
// import SimpleTaxonomy from '../../screens/Admin/Taxonomy/SimpleTaxonomy';
// import TaxonomySimple from '../../screens/Admin/Taxonomy/TaxonomySimple';
import Taxonomy from '../../screens/Admin/Taxonomy/Taxonomy';
import AddTaxonomy from '../../screens/Admin/Taxonomy/AddTaxonomy';
import EditTaxonomy from '../../screens/Admin/Taxonomy/EditTaxonomy';
import EditSpecieScreen from '../../screens/Admin/Taxonomy/EditSpecieScreen';
import AddToTaxonomyScreen from '../../screens/Admin/Taxonomy/AddToTaxonomyScreen';
import AddNewPlantTaxonomyScreen from '../../screens/Admin/Taxonomy/AddNewPlantTaxonomyScreen';
import ImportTaxonomyScreen from '../../screens/Admin/Taxonomy/ImportTaxonomyScreen';
import MessagesScreen from '../../screens/MessagesScreen/MessagesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    return (
      <SafeAreaView style={{flex: 1}} edges={["bottom"]}>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({route}) => ({
            tabBarStyle: [styles.tabBar, {
              paddingBottom: Math.max(insets.bottom, 10),
              height: 60 + Math.max(insets.bottom, 10)
            }],
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
              case 'Home':
                return focused ? (
                  <HomeIconSelected width={size} height={size} />
                ) : (
                  <HomeIcon width={size} height={size} />
                );
              case 'Live Setup':
                return focused ? (
                  <LiveIconSelected width={size} height={size} />
                ) : (
                  <LiveIcon width={size} height={size} />
                );
              case 'Leaf Trail':
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
              case 'Taxonomy':
                return focused ? (
                  <TaxonomyIconSelected width={size} height={size} />
                ) : (
                  <TaxonomyIcon width={size} height={size} />
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
          name="Home"
          component={AdminHomeScreen}
        
        />
        <Tab.Screen
          name="Live Setup"
          component={LiveSetup} // Use a placeholder component
          listeners={({navigation}) => ({
            tabPress: e => {
              e.preventDefault();
              // Navigate to cart screen as a separate screen
              navigation.navigate('Live Setup');
            },
          })}
        />
        <Tab.Screen name="Leaf Trail" component={LeafTrail} />
        <Tab.Screen name="Taxonomy" component={Taxonomy} />
  
        <Tab.Screen
         
          name="Chat"
          component={MessagesScreen}
          listeners={({navigation}) => ({
            tabPress: e => {
              e.preventDefault();
              // Use parent navigation to navigate to Chat screen without tabs
              navigation.getParent()?.navigate('Chat');
            },
          })}
        />
      </Tab.Navigator>
      </SafeAreaView>
    );
  }

  function AdminTabNavigator() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="AdminTabs"
          component={AdminTabs}
          options={{headerShown: false}}
        />
     <Stack.Screen name="EnrollSeller" options={{headerShown: false}} component={EnrollSeller} />
     <Stack.Screen name="UserInformation" options={{headerShown: false}} component={UserInformation} />
     <Stack.Screen name="Chat" options={{headerShown: false}} component={MessagesScreen} />
     <Stack.Screen name="ScanQR" options={{headerShown: false}} component={ScanQR} />
     <Stack.Screen name="LeafTrailSortingAdminScreen" options={{headerShown: false}} component={SortingScreen} />
     <Stack.Screen name="LeafTrailShippingAdminScreen" options={{headerShown: false}} component={ShippingScreen} />
     <Stack.Screen name="LeafTrailPackingAdminScreen" options={{headerShown: false}} component={PackingScreen} />
     <Stack.Screen name="LeafTrailReceivingScreenAdminScreen" options={{headerShown: false}} component={ReceivingScreen} />
      <Stack.Screen name="UserManagement" options={{headerShown: false}} component={UserManagement}/>
      <Stack.Screen name="JungleAccess" options={{headerShown: false}} component={JungleAccess}/>
      <Stack.Screen name="AddAdmin" options={{headerShown: false}} component={AddAdmin}/>
      <Stack.Screen name="EditAdmin" options={{headerShown: false}} component={EditAdmin}/>
      <Stack.Screen name="EditSubAdmin" options={{headerShown: false}} component={EditSubAdmin}/>
      
      {/* Taxonomy Screens */}
      <Stack.Screen name="AddTaxonomy" options={{headerShown: false}} component={AddTaxonomy} />
      <Stack.Screen name="EditTaxonomy" options={{headerShown: false}} component={EditTaxonomy} />
      <Stack.Screen name="EditSpecieScreen" options={{headerShown: false}} component={EditSpecieScreen} />
      <Stack.Screen name="AddToTaxonomyScreen" options={{headerShown: false}} component={AddToTaxonomyScreen} />
      <Stack.Screen name="AddNewPlantTaxonomyScreen" options={{headerShown: false}} component={AddNewPlantTaxonomyScreen} />
      <Stack.Screen name="ImportTaxonomyScreen" options={{headerShown: false}} component={ImportTaxonomyScreen} />
      
      {/* Admin Profile Screens */}
      <Stack.Screen name="AdminProfile" options={{headerShown: false}} component={AdminProfileScreen} />
      <Stack.Screen name="AdminAccountInformation" options={{headerShown: false}} component={AdminAccountInformationScreen} />
      <Stack.Screen name="AdminUpdatePassword" options={{headerShown: false}} component={AdminUpdatePasswordScreen} />
      <Stack.Screen name="AdminTermsOfUse" options={{headerShown: false}} component={AdminTermsOfUseScreen} />
      <Stack.Screen name="AdminPrivacyPolicy" options={{headerShown: false}} component={AdminPrivacyPolicyScreen} />
      </Stack.Navigator>
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

export default  AdminTabNavigator;