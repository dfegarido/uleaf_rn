import moment from 'moment';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { TabView } from 'react-native-tab-view';
import Options from '../../../../assets/admin-icons/options.svg';
import ScanQrIcon from '../../../../assets/admin-icons/qr.svg';
import QuestionMarkTooltip from '../../../../assets/admin-icons/question-mark.svg';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import { addSortingTrayNumber, updateLeafTrailStatus } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import TagAsOptions from './TagAs';

const Header = ({ title, navigation }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <BackSolidIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('LeafTrailScanQRAdminScreen', {leafTrailStatus: 'sorted'})}>
         <ScanQrIcon />
    </TouchableOpacity>
  </View>
);

const UserProfile = ({ user }) => (
  <View style={styles.userContainer}>
    <Image source={{ uri: user.avatar }} style={styles.avatar} />
    <View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.username}>{user.username}</Text>
    </View>
  </View>
);

const GreenhouseInputs = ({addTrayNumber, itemDetails}) => { 
  const [trayNumber, setTrayNumber] = useState(itemDetails?.sortingTrayNumber || '');
  
  const addTray = () => {
    addTrayNumber(trayNumber)
  }
  
  return (
    <View style={styles.inputsContainer}>
        <View style={styles.inputWrapper}>
            <TrayIcon />
            <TextInput
                placeholder="Tray Number"
                placeholderTextColor="#647276"
                style={styles.input}
                value={trayNumber}
                onChangeText={setTrayNumber}
            />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => addTray()}>
            <Text style={styles.buttonText}>{trayNumber ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
    </View>
)};

const DeliveryDetails = ({ details }) => (
    <View style={styles.deliveryContainer}>
        <Text style={styles.deliveryTitle}>Delivery Details</Text>
        <View style={styles.detailsBox}>
            <View style={styles.infoRow}>
                <Text style={styles.label}>UPS Shipping</Text>
                <Text style={styles.value}>{details.upsFlight}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.label}>Plant Flight</Text>
                <Text style={styles.value}>{ details.flightDate
                                      ? moment(details.flightDate).format('MMM DD, YYYY')
                                      : 'Date TBD' }</Text>
            </View>
        </View>
    </View>
);

const PlantCard = ({ plant, openTagAs }) => {

  const setTags = () => {
    let status = {isMissing: true, isDamaged: true};
    if (plant.leafTrailStatus === "missing") {
      status = {isDamaged: true, forShipping: true}
    } else if (plant.leafTrailStatus === "damaged") {
      status = {isMissing: true, forShipping: true}
    }
    openTagAs(status, plant.id)
  }
  
  return (
    <View style={styles.card}>
        <Image source={{ uri: plant.plantImage }} style={styles.plantImage} />
        <View style={styles.details}>
            <View>
                <View style={styles.cardRow}>
                    <View style={styles.plantNameRow}>
                      <Text style={styles.code}>{plant.plantCode}</Text>
                      <QuestionMarkTooltip />
                    </View>
                    <View style={styles.countryContainer}>
                        <Text style={styles.countryText}>{plant.country}</Text>
                        <CountryFlagIcon code={plant.countryCode} width={24} height={16} />
                        <TouchableOpacity onPress={setTags}>
                          <Options />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
                <Text style={styles.subtext}>{plant.variegation} • {plant.size}</Text>
            </View>
            <View style={styles.cardRow}>
                <View style={plant?.listingType ? styles.typeChip : styles.typeChipNoBackground}>
                    <Text style={styles.typeText}>{plant.listingType}</Text>
                </View>
                <Text style={styles.quantity}>{plant.quantity}X</Text>
            </View>
        </View>
    </View>
)};

const MishapPlantCard = ({ plant, openTagAs }) => {
  
  const setTags = () => {
    let status = {isMissing: true, isDamaged: true};
    if ((plant.leafTrailStatus).toLowerCase() === "missing") {
      status = {isDamaged: true, forShipping: true}
    } else if ((plant.leafTrailStatus).toLowerCase() === "damaged") {
      status = {isMissing: true, forShipping: true}
    }
    openTagAs(status, plant.id)
  }
  
  return (
    <View style={styles.listSection}>
        <Text style={styles.mishapStatus}>{plant.leafTrailStatus}</Text>
      <View style={styles.card}>
          <Image source={{ uri: plant.plantImage }} style={styles.plantImage} />
          <View style={styles.details}>
              <View>
                  <View style={styles.cardRow}>
                      <View style={styles.plantNameRow}>
                        <Text style={styles.code}>{plant.plantCode}</Text>
                        <QuestionMarkTooltip />
                      </View>
                      <View style={styles.countryContainer}>
                          <Text style={styles.countryText}>{plant.country}</Text>
                          <CountryFlagIcon code={'PH'} width={24} height={16} />
                          <TouchableOpacity onPress={setTags}>
                            <Options />
                          </TouchableOpacity>
                      </View>
                  </View>
                  <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
                  <Text style={styles.subtext}>{plant.variegation} • {plant.size}</Text>
              </View>
              <View style={styles.cardRow}>
                  <View style={plant?.listingType ? styles.typeChip : styles.typeChipNoBackground}>
                      <Text style={styles.typeText}>{plant.listingType}</Text>
                  </View>
                  <Text style={styles.quantity}>{plant.quantity}X</Text>
              </View>
          </View>
      </View>
    </View>
)};

const CustomTabBar = ({ navigationState, jumpTo }) => (
    <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
            const isFocused = navigationState.index === i;
            return (
                <TouchableOpacity
                    key={route.key}
                    onPress={() => jumpTo(route.key)}
                    style={styles.tabItem}
                >
                    <View style={styles.tabContent}>
                        <Text style={isFocused ? styles.tabTextFocused : styles.tabText}>
                            {route.title}
                        </Text>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{route.count}</Text>
                        </View>
                    </View>
                    <View style={isFocused ? styles.indicator : styles.indicatorHidden} />
                </TouchableOpacity>
            );
        })}
    </View>
);

// --- Tab Scenes ---
const ReceivedPlantsTab = ({itemDetails, openTagAs}) => (
  <FlatList
    data={itemDetails}
    renderItem={({ item }) => <PlantCard plant={item} openTagAs={openTagAs} />}
    keyExtractor={item => item.hubReceiverId}
    style={styles.listContainer}
    contentContainerStyle={styles.listContent}
  />
);

const SortedPlantsTab = ({itemDetails, openTagAs}) => (
  <FlatList
    data={itemDetails}
    renderItem={({ item }) => <PlantCard plant={item} openTagAs={openTagAs} />}
    keyExtractor={item => item.hubReceiverId}
    style={styles.listContainer}
    contentContainerStyle={styles.listContent}
  />
);

const MissingPlantsTab = ({itemDetails, openTagAs}) => (
  <FlatList
    data={itemDetails}
    renderItem={({ item }) => <MishapPlantCard plant={item} openTagAs={openTagAs} />}
    keyExtractor={item => item.hubReceiverId}
    style={styles.listContainer}
    contentContainerStyle={styles.listContent}
  />
);

// --- Main Screen Component ---
const SortingDetailsScreen = ({ navigation, route }) => {
  // const itemDetails = route?.params?.item || {};
  console.log('route?.params?.item', route?.params?.item);
  
  const [index, setIndex] = useState(0);
  const [itemDetails, setItemDetails] = useState(route?.params?.item || {})
  const [journeyMishapCount, setJourneyMishapCount] = useState(itemDetails?.journeyMishapCount || 0);
  const [receivedPlantsCount, setReceivedPlantsCount] = useState(itemDetails?.receivedPlantsCount || 0);
  const [sortedPlantsCount, setsortedPlantsCount] = useState(itemDetails?.sortedPlantsCount || 0);

  const [routes, setRoutes] = useState([
    { key: 'received', title: 'Received Plants', count: receivedPlantsCount },
    { key: 'missing', title: 'Journey Mishap', count: journeyMishapCount },
    { key: 'sorted', title: 'Sorted Plants', count: sortedPlantsCount },
  ]);
  const [receivedPlantsData, setReceivedPlantsData] = useState(itemDetails?.receivedPlantsData || [])
  const [sortedPlantsData, setsortedPlantsData] = useState(itemDetails?.sortedPlantsData || [])
  const [missingPlantsData, setMissingPlantsData] = useState(itemDetails?.missingPlantsData || [])
  const [isTagAsVisible, setTagAsVisible] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [forShipping, setForShipping] = useState(false);
  const [orderId, setOrderId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openTagAs = (status, id) => {
    setIsMissing(status.isMissing);
    setIsDamaged(status.isDamaged);
    setForShipping(status.forShipping);
    setTagAsVisible(!isTagAsVisible);
    setOrderId(id)
  }

  const setTagAs = async (status) => {
    setIsLoading(true);
    setTagAsVisible(!isTagAsVisible);
    const response = await updateLeafTrailStatus(orderId, status);
    if (response.success) {
      setItemDetails(response)
      setRoutes([
         { key: 'received', title: 'Received Plants', count: response.receivedPlantsCount },
         { key: 'missing', title: 'Journey Mishap', count: response.journeyMishapCount },
         { key: 'sorted', title: 'Sorted Plants', count: response.sortedPlantsCount },
       ])
      setReceivedPlantsData(response?.receivedPlantsData || []);
      setMissingPlantsData(response?.missingPlantsData || []);
      setIsLoading(false)
      Alert.alert('Success', 'Order status updated successfully!');
    } else {
      setIsLoading(false)
      Alert.alert('Error', error.message);
    }
  }
  
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'received':
        return <ReceivedPlantsTab itemDetails={receivedPlantsData || []} openTagAs={openTagAs} />;
      case 'missing':
        return <MissingPlantsTab itemDetails={missingPlantsData || []} openTagAs={openTagAs} />;
      case 'sorted':
        return <SortedPlantsTab itemDetails={sortedPlantsData || []} openTagAs={openTagAs} />;
      default:
        return null;
    }
  };

  const addTrayNumber = async (trayNumber) => {
    console.log('trayNumber:', trayNumber);

    try {
      setIsLoading(true);
      const addTrayNumber = await addSortingTrayNumber({
        orderIds: sortedPlantsData.map(i => i.id),
        sortingTrayNumber: trayNumber,
      });

      if (addTrayNumber.success) {
        setIsLoading(false);
        Alert.alert('Success', 'Tray number added successfully!');
      } else {
        setIsLoading(false);
        Alert.alert('Error', addTrayNumber.message || '');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error.message || '');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Receiver's Details" navigation={navigation} />
      {/* The main content that scrolls behind the tabs */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <UserProfile user={{
          name: itemDetails?.name || '',
          username: itemDetails?.username || '',
          avatar: itemDetails?.avatar || '',
        }} />
        <GreenhouseInputs itemDetails={itemDetails} addTrayNumber={addTrayNumber}/>
        <DeliveryDetails details={{upsFlight: itemDetails?.upsShippingDate || '', flightDate: itemDetails?.flightDate || '' }} />
      </ScrollView>

      {/* The TabView is positioned absolutely to float over the ScrollView */}
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene} // Use the new function here
          onIndexChange={setIndex}
          renderTabBar={props => <CustomTabBar {...props} />}
        />
      </View>

      <TagAsOptions visible={isTagAsVisible}
        setTagAs={setTagAs}
        isMissing={isMissing}
        isDamaged={isDamaged}
        forShipping={forShipping}
        onClose={() => setTagAsVisible(false)}/>

        {isLoading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
    </SafeAreaView>
  );
};

// --- Styles for All Components ---
const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 400 }, // Add padding to bottom to ensure it can scroll past the tabs
  // Header
  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', height: 106, paddingTop: 48,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10,
  },
  backIcon: { fontSize: 32, color: '#393D40' },
  headerTitle: {
    flex: 1, textAlign: 'center', fontFamily: 'Inter', fontWeight: '700',
    fontSize: 18, color: '#202325',
  },
  // User Profile
  userContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
    paddingVertical: 12, marginTop: 106,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: '#539461', marginRight: 12,
  },
  name: { fontFamily: 'Inter', fontWeight: '700', fontSize: 20, color: '#202325' },
  username: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#7F8D91' },
  // Greenhouse Inputs
  inputsContainer: {
    flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 20, gap: 8,
  },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#CDD3D4', borderRadius: 12, paddingHorizontal: 16, height: 48,
  },
  icon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#202325' },
  button: {
    backgroundColor: '#539461', borderRadius: 12, height: 48,
    justifyContent: 'center', paddingHorizontal: 20,
  },
  buttonText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 16 },
  // Delivery Details
  deliveryContainer: { backgroundColor: '#F5F6F6', paddingVertical: 16, gap: 12 },
  deliveryTitle: {
    paddingHorizontal: 15, fontFamily: 'Inter', fontWeight: '700',
    fontSize: 18, color: '#202325',
  },
  detailsBox: { paddingHorizontal: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  value: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#202325' },
  // Tab View
  tabViewContainer: {
    position: 'absolute', top: 400, // Adjusted position to be below the static content
    left: 0, right: 0, bottom: 0,
  },
  listContainer: { backgroundColor: '#F5F6F6' },
  listContent: { padding: 12, gap: 12 },
  // Custom Tab Bar
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1,
    borderColor: '#CDD3D4', paddingHorizontal: 15, justifyContent: 'flex-start',
  },
  tabItem: { alignItems: 'center', paddingTop: 8, marginRight: 10, minWidth: 100 },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24, marginBottom: 12 },
  tabText: { fontFamily: 'Inter', fontSize: 11, color: '#647276' },
  tabTextFocused: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: '#202325' },
  badgeContainer: {
    backgroundColor: '#E7522F', borderRadius: 10, paddingHorizontal: 2,
    marginLeft: 2, minWidth: 22, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  indicator: { height: 3, width: '100%', backgroundColor: '#202325' },
  indicatorHidden: { height: 3, width: '100%', backgroundColor: 'transparent' },
  // Plant Mishap Card
  listSection: {
    backgroundColor: '#F5F6F6',
    padding: 12,
    gap: 12,
  },
  mishapStatus: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#E7522F',
    paddingHorizontal: 6,
  },
  // Plant Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    flexDirection: 'row', gap: 12,
  },
  plantImage: { width: 96, height: 128, borderRadius: 8 },
  details: { flex: 1, justifyContent: 'space-between' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plantNameRow: {flexDirection: 'row', alignItems: 'center'}, 
  code: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  countryContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countryText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#556065' },
  plantName: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, color: '#202325', marginVertical: 4 },
  subtext: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  typeChip: {
    backgroundColor: '#202325', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typeChipNoBackground: {
    borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typeText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 12 },
  quantity: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#393D40' },
});

export default SortingDetailsScreen;