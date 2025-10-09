import React from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
import Options from '../../../../assets/admin-icons/options.svg';
import QuestionMarkTooltip from '../../../../assets/admin-icons/question-mark.svg';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';

// --- Mock Data for Demonstration ---
const mockUser = {
  name: 'Esther Howard',
  username: '@esther.h',
  avatar: 'https://i.imgur.com/s21bC37.jpeg',
};

const mockDelivery = {
  flightDate: 'May-30-2024',
  receivedDate: 'June-01-2024',
};

const receivedPlantsData = [
  { id: 'p1', code: 'TH0023-45', country: 'TH', genus: 'Monstera', species: 'Albo', variegation: 'Inner Variegated', size: '2"', quantity: '1', listingType: '', image: 'https://i.imgur.com/Av8F42U.jpeg' },
  { id: 'p2', code: 'EC0987-12', country: 'EC', genus: 'Philodendron', species: 'Gloriosum', variegation: 'Aurea Variegated', size: '4"', quantity: '10', listingType: '', image: 'https://i.imgur.com/7s1mGzt.jpeg' },
  { id: 'p3', code: 'TH0023-45', country: 'TH', genus: 'Monstera', species: 'Albo', variegation: 'Inner Variegated', size: '2"', quantity: '1', listingType: '', image: 'https://i.imgur.com/Av8F42U.jpeg' },
  { id: 'p4', code: 'EC0987-12', country: 'EC', genus: 'Philodendron', species: 'Gloriosum', variegation: 'Aurea Variegated', size: '4"', quantity: '10', listingType: 'Wholesale', image: 'https://i.imgur.com/7s1mGzt.jpeg' },
  { id: 'p5', code: 'TH0023-45', country: 'TH', genus: 'Monstera', species: 'Albo', variegation: 'Inner Variegated', size: '2"', quantity: '1', listingType: '', image: 'https://i.imgur.com/Av8F42U.jpeg' },
  { id: 'p6', code: 'EC0987-12', country: 'EC', genus: 'Philodendron', species: 'Gloriosum', variegation: 'Aurea Variegated', size: '4"', quantity: '10', listingType: '', image: 'https://i.imgur.com/7s1mGzt.jpeg' },
  { id: 'p7', code: 'TH0023-45', country: 'TH', genus: 'Monstera', species: 'Albo', variegation: 'Inner Variegated', size: '2"', quantity: '1', listingType: '', image: 'https://i.imgur.com/Av8F42U.jpeg' },
  { id: 'p8', code: 'EC0987-12', country: 'EC', genus: 'Philodendron', species: 'Gloriosum', variegation: 'Aurea Variegated', size: '4"', quantity: '10', listingType: '', image: 'https://i.imgur.com/7s1mGzt.jpeg' },
  { id: 'p9', code: 'TH0023-45', country: 'TH', genus: 'Monstera', species: 'Albo', variegation: 'Inner Variegated', size: '2"', quantity: '1', listingType: '', image: 'https://i.imgur.com/Av8F42U.jpeg' },
  { id: 'p10', code: 'EC0987-12', country: 'EC', genus: 'Philodendron', species: 'Gloriosum', variegation: 'Aurea Variegated', size: '4"', quantity: '10', listingType: '', image: 'https://i.imgur.com/7s1mGzt.jpeg' },
];

const missingPlantsData = [
  { id: 'p1', status: 'Missing', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p2', status: 'Missing', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p3', status: 'Damaged', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p4', status: 'Damaged', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p5', status: 'Missing', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p6', status: 'Missing', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p7', status: 'Damaged', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p8', status: 'Damaged', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
  { id: 'p9', status: 'Damaged', code: 'TH0023-55', country: 'TH', genus: 'Anthurium', species: 'Papillilaminum', variegation: 'Ecuagenera', size: '2"', quantity: 'x2', listingType: '', image: 'https://i.imgur.com/r6HqY1B.jpeg' },
];

// --- Reusable Child Components (defined in the same file) ---

const Header = ({ title, navigation }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <BackSolidIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
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

const GreenhouseInputs = () => (
    <View style={styles.inputsContainer}>
        <View style={styles.inputWrapper}>
            <TrayIcon />
            <TextInput
                placeholder="Tray Number"
                placeholderTextColor="#647276"
                style={styles.input}
            />
        </View>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
    </View>
);

const DeliveryDetails = ({ details }) => (
    <View style={styles.deliveryContainer}>
        <Text style={styles.deliveryTitle}>Delivery Details</Text>
        <View style={styles.detailsBox}>
            <View style={styles.infoRow}>
                <Text style={styles.label}>UPS Shipping</Text>
                <Text style={styles.value}>{details.flightDate}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.label}>Plant Flight</Text>
                <Text style={styles.value}>{details.receivedDate}</Text>
            </View>
        </View>
    </View>
);

const PlantCard = ({ plant }) => (
    <View style={styles.card}>
        <Image source={{ uri: plant.image }} style={styles.plantImage} />
        <View style={styles.details}>
            <View>
                <View style={styles.cardRow}>
                    <View style={styles.plantNameRow}>
                      <Text style={styles.code}>{plant.code}</Text>
                      <QuestionMarkTooltip />
                    </View>
                    <View style={styles.countryContainer}>
                        <Text style={styles.countryText}>{plant.country}</Text>
                        <CountryFlagIcon code={'PH'} width={24} height={16} />
                        <Options />
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
);

const MishapPlantCard = ({ plant }) => (
    <View style={styles.listSection}>
        <Text style={styles.mishapStatus}>{plant.status}</Text>
      <View style={styles.card}>
          <Image source={{ uri: plant.image }} style={styles.plantImage} />
          <View style={styles.details}>
              <View>
                  <View style={styles.cardRow}>
                      <View style={styles.plantNameRow}>
                        <Text style={styles.code}>{plant.code}</Text>
                        <QuestionMarkTooltip />
                      </View>
                      <View style={styles.countryContainer}>
                          <Text style={styles.countryText}>{plant.country}</Text>
                          <CountryFlagIcon code={'PH'} width={24} height={16} />
                          <Options />
                      </View>
                  </View>
                  <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
                  <Text style={styles.subtext}>{plant.variegation} • {plant.size}</Text>
              </View>
              <View style={styles.cardRow}>
                  <View style={plant?.listingType ? styles.typeChip : styles.typeChipNoBackground}>
                      <Text style={styles.typeText}>{plant.listingType}</Text>
                  </View>
                  <Text style={styles.quantity}>{plant.quantity}</Text>
              </View>
          </View>
      </View>
    </View>
);

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
const ReceivedPlantsTab = () => (
  <FlatList
    data={receivedPlantsData}
    renderItem={({ item }) => <PlantCard plant={item} />}
    keyExtractor={item => item.id}
    style={styles.listContainer}
    contentContainerStyle={styles.listContent}
  />
);

const MissingPlantsTab = () => (
  <FlatList
    data={missingPlantsData}
    renderItem={({ item }) => <MishapPlantCard plant={item} />}
    keyExtractor={item => item.id}
    style={styles.listContainer}
    contentContainerStyle={styles.listContent}
  />
);

// --- Main Screen Component ---
const SortingDetailsScreen = ({ navigation }) => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'received', title: 'Received Plants', count: receivedPlantsData.length },
    { key: 'missing', title: 'Journey Mishap', count: missingPlantsData.length },
  ]);

  const renderScene = SceneMap({
    received: ReceivedPlantsTab,
    missing: MissingPlantsTab,
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Receiver's Details" navigation={navigation} />
      {/* The main content that scrolls behind the tabs */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <UserProfile user={mockUser} />
        <GreenhouseInputs />
        <DeliveryDetails details={mockDelivery} />
      </ScrollView>

      {/* The TabView is positioned absolutely to float over the ScrollView */}
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={props => <CustomTabBar {...props} />}
        />
      </View>
    </SafeAreaView>
  );
};

// --- Styles for All Components ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 400 }, // Add padding to bottom to ensure it can scroll past the tabs
  // Header
  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', height: 106, paddingTop: 48,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10,
  },
  backButton: { position: 'absolute', left: 16, top: 64 },
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
  tabItem: { alignItems: 'center', paddingTop: 8, marginRight: 24, minWidth: 100 },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24, marginBottom: 12 },
  tabText: { fontFamily: 'Inter', fontSize: 18, color: '#647276' },
  tabTextFocused: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', color: '#202325' },
  badgeContainer: {
    backgroundColor: '#E7522F', borderRadius: 10, paddingHorizontal: 6,
    marginLeft: 8, minWidth: 22, height: 18, justifyContent: 'center', alignItems: 'center',
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