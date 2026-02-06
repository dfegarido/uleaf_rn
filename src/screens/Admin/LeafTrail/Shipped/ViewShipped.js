import moment from 'moment';
import React, { useEffect, useState } from 'react';
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
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import BarcodeIcon from '../../../../assets/admin-icons/big-tracking.svg';
import CalendarIcon from '../../../../assets/admin-icons/calendar.svg';
import ClockIcon from '../../../../assets/admin-icons/clock.svg';
import CopyIcon from '../../../../assets/admin-icons/Copy.svg';
import MapPinIcon from '../../../../assets/admin-icons/map-pin.svg';
import QuestionMarkTooltip from '../../../../assets/admin-icons/question-mark.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import { addLeafTrailShippingDetails, getOrdersByTrackingNumber } from '../../../../components/Api/getAdminLeafTrail';
import CheckBox from '../../../../components/CheckBox/CheckBox';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';

const Header = ({ title, navigation }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <BackSolidIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={{ width: 24 }} />
  </View>
);

const TrackingInfo = ({ trackingNumber, label }) => (
  <View style={Platform.OS === 'android' ? styles.trackingInfoContainer : styles.trackingInfoContainerIos}>
    <View style={styles.trackingIconCircle}>
      <BarcodeIcon />
    </View>
    <View style={styles.trackingDetails}>
      <View style={styles.trackingNumberRow}>
        <Text style={styles.trackingNumber} numberOfLines={1} ellipsizeMode="tail">{trackingNumber}</Text>
        <TouchableOpacity>
          <CopyIcon />
        </TouchableOpacity>
      </View>
      <Text style={styles.trackingLabel}>{label}</Text>
    </View>
  </View>
);

const DeliveryDateTimeInput = ({ setIsDelayed, isDelayed, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime, onSave, isLoading }) => {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleDateConfirm = (date) => {
        setDeliveryDate(moment(date).format('YYYY-MM-DD'));
        hideDatePicker();
    };

    const showTimePicker = () => setTimePickerVisibility(true);
    const hideTimePicker = () => setTimePickerVisibility(false);
    const handleTimeConfirm = (time) => {
        setDeliveryTime(moment(time).format('HH:mm'));
        hideTimePicker();
    };

    return (
        <View style={styles.deliveryActionSection}>
            <TouchableOpacity onPress={showDatePicker} style={styles.textInputWrapper}>
                <CalendarIcon style={styles.inputIcon} />
                <Text style={deliveryDate ? styles.textInput : styles.placeholderText}>
                    {deliveryDate ? moment(deliveryDate).format('MMMM DD, YYYY') : 'UPS Delivery Date'}
                </Text>
            </TouchableOpacity>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
                //minimumDate={new Date()}
            />

            <TouchableOpacity onPress={showTimePicker} style={styles.textInputWrapper}>
                <ClockIcon style={styles.inputIcon} />
                <Text style={deliveryTime ? styles.textInput : styles.placeholderText}>
                    {deliveryTime ? moment(deliveryTime, 'HH:mm').format('hh:mm A') : 'UPS Delivery Time'}
                </Text>
            </TouchableOpacity>
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleTimeConfirm}
                onCancel={hideTimePicker}
            />

            {/* add a checkbox here label is "Delayed UPS Delivery" */}
            <View style={styles.checkboxRow}>
                <CheckBox
                    isChecked={isDelayed}
                    onToggle={() => setIsDelayed(!isDelayed)}
                    checkedColor="#539461"
                />
                <Text style={styles.checkboxLabel}>Delayed UPS Delivery</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{deliveryDate && deliveryTime ? 'Update' : 'Add'}</Text>}
            </TouchableOpacity>
        </View>
    );
};

const UserInfo = ({ user }) => (
  <View style={styles.userCard}>
    <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
    <View style={styles.userDetails}>
      <View style={styles.userNameRow}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userHandle}>@{user.username}</Text>
      </View>
      <Text style={styles.userRole}>{user.role}</Text>
    </View>
  </View>
);

const AddressInfo = ({ address }) => (
    <View style={styles.addressCard}>
        <View style={styles.addressIconCircle}>
            <MapPinIcon />
        </View>
        <View style={styles.addressDetails}>
            <Text style={styles.addressText}>{address}</Text>
        </View>
    </View>
);

const ShippingInfo = ({ upsShipping, plantFlight }) => (
  <View style={styles.shippingInfoContainer}>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>UPS Shipping</Text>
      <Text style={styles.infoValue}>{upsShipping}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Plant Flight</Text>
      <Text style={styles.infoValue}>{plantFlight}</Text>
    </View>
  </View>
);

const BoxSpecs = ({ boxNumber, dimensions, weight }) => (
    <View style={styles.boxSpecsContainer}>
        <Text style={styles.sectionTitle}>Box Specification</Text>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Box Number</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Text style={styles.infoValue}>{boxNumber}</Text>
                <TouchableOpacity><CopyIcon /></TouchableOpacity>
            </View>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dimension</Text>
            <Text style={styles.infoValue}>{dimensions}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{weight}</Text>
        </View>
    </View>
);

const PlantCard = ({ plant }) => {
  return (
  <View style={styles.plantCardContainer}>
    {plant?.isJoinerOrder && (
      <View style={styles.joinerUserRow}>
        <Image source={{ uri: plant?.joinerProfileImage || '' }} style={styles.joinerAvatar} />
        <View>
          <View style={styles.joinerUserNameRow}>
            <Text style={styles.joinerUserName}>{(plant?.joinerInfo?.joinerFirstName || '') + ' ' + (plant?.joinerInfo?.joinerLastName || '')}</Text>
            <Text style={styles.joinerUserHandle}>@{plant?.joinerInfo?.joinerUsername || ''}</Text>
          </View>
          <Text style={styles.joinerUserRole}>Joiner</Text>
        </View>
      </View>
    )}
    <View style={styles.plantCard}>
      <View>
        <Image source={{ uri: plant.imagePrimary }} style={styles.plantImage} />
      </View>
      <View style={styles.plantDetails}>
        <View>
          <View style={styles.plantHeader}>
            <View style={styles.plantCodeContainer}>
              <Text style={styles.plantCode}>{plant.plantCode}</Text>
              <QuestionMarkTooltip />
            </View>
            <View style={styles.countryContainer}>
              <Text style={styles.countryText}>{plant.plantSourceCountry}</Text>
              <CountryFlagIcon code={plant.plantSourceCountry} width={24} height={16} />
            </View>
          </View>
          <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
          <Text style={styles.plantSubtext}>{plant.variegation} • {plant.potSizeVariation}</Text>
        </View>
        <View style={styles.plantFooter}>
          {plant.listingType && (
            <View style={styles.typeChip}>
              <Text style={styles.typeText}>{plant.listingType}</Text>
            </View>
          )}
          <Text style={styles.quantity}>{plant.orderQty}X</Text>
        </View>
      </View>
    </View>
  </View>
)};

const ViewShippedScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const [plantList, setPlantList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shippedDetails, setShippedDetails] = useState(item);
  const [deliveryDate, setDeliveryDate] = useState(item?.deliveryDate || null);
  const [deliveryTime, setDeliveryTime] = useState(item?.deliveryTime || null);
  const [isDelayed, setIsDelayed] = useState(item?.isDelayedUPSDelivery || false);

  const fetchData = async () => {
      setIsLoading(true);
      try {
          const response = await getOrdersByTrackingNumber(item.trackingNumber);
          setPlantList(response.data.filter(p => p?.shippingData?.trackingNumber === item.trackingNumber));
      } catch (e) {
          console.error("Failed to fetch plant data:", e);
          Alert.alert("Error", "Failed to fetch plant data.");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [item]);

  const handleSaveDeliveryDetails = async () => {
    if (!deliveryDate || !deliveryTime) {
        Alert.alert("Validation Error", "Please select both delivery date and time.");
        return;
    }
    setIsSaving(true);
    try {
        const orderIds = plantList.map(p => p.id);
        const response = await addLeafTrailShippingDetails({ orderIds, deliveryDate, deliveryTime, isDelayed });
        if (response.success) {
            setShippedDetails(prev => ({...prev, deliveryDate, deliveryTime}));
            Alert.alert("Success", "Delivery details updated successfully.");
        } else {
            throw new Error(response.error || "Failed to update delivery details.");
        }
    } catch (error) {
        Alert.alert("Error", error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const fullAddress = [
      shippedDetails.deliveryDetails?.address?.street,
      shippedDetails.deliveryDetails?.address?.city,
      shippedDetails.deliveryDetails?.address?.state,
      shippedDetails.deliveryDetails?.address?.zipCode
  ].filter(Boolean).join(', ');

  const dimensions = shippedDetails?.packingData?.dimensions;
  const weight = shippedDetails?.packingData?.weight;

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Shipping Details" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TrackingInfo trackingNumber={shippedDetails.trackingNumber} label="Tracking Number" />

        <DeliveryDateTimeInput 
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
            isDelayed={isDelayed}
            setIsDelayed={setIsDelayed}
            onSave={handleSaveDeliveryDetails}
            isLoading={isSaving}
        />

        <View style={styles.deliveryDetailsSection}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={{paddingHorizontal: 12, paddingTop: 12}}>
            <UserInfo user={{
                name: shippedDetails.name,
                username: shippedDetails.username,
                avatar: shippedDetails.avatar,
                role: 'Receiver'
            }} />
          </View>
          <View style={{paddingHorizontal: 12, paddingTop: 12}}>
            <AddressInfo address={fullAddress || 'No address provided'} />
          </View>
          <ShippingInfo
            upsShipping={shippedDetails.upsShippingDate ? moment(shippedDetails.upsShippingDate).format('MMM DD, YYYY') : 'Date TBD'}
            plantFlight={shippedDetails.flightDateFormatted || 'Date TBD'}
          />
        </View>

        <BoxSpecs 
            boxNumber={shippedDetails.packingData?.boxNumber || ''}
            dimensions={dimensions ? `${dimensions.length}x${dimensions.width}x${dimensions.height} in` : 'N/A'}
            weight={weight ? `${weight.value} ${weight.unit}` : 'N/A'}
        />

        <View style={styles.divider} />

        <View style={styles.plantListSection}>
            <View style={styles.plantListHeader}>
                <Text style={styles.sectionTitle}>Plant List</Text>
                <Text style={styles.plantListCount}>{plantList.length} plant(s)</Text>
            </View>
            {isLoading ? (
                <ActivityIndicator size="large" color="#699E73" style={{marginTop: 20}}/>
            ) : (
                <FlatList
                    data={plantList}
                    keyExtractor={(plant) => plant.id.toString()}
                    renderItem={({ item: plant }) => <PlantCard plant={plant} />}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{height: 6}} />}
                />
            )}
        </View>
      </ScrollView>
      {(isLoading || isSaving) && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#FFFFFF', height: 106, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 18, color: '#202325' },
  scrollContent: { paddingTop: 40, paddingBottom: 34 },
  trackingInfoContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, gap: 12, marginTop: 60 },
  trackingInfoContainerIos: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, gap: 12 },
  trackingIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center' },
  trackingDetails: { flex: 1, gap: 4 },
  trackingNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackingNumber: { fontFamily: 'Inter', fontWeight: '700', fontSize: 20, color: '#202325', flexShrink: 1 },
  trackingLabel: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#7F8D91' },
  deliveryActionSection: { paddingHorizontal: 15, paddingBottom: 20, gap: 12 },
  textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CDD3D4', borderRadius: 12, height: 48, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#202325', height: '100%', marginTop: 20 },
  placeholderText: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  saveButton: { backgroundColor: '#539461', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  saveButtonText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 16 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
  },
  deliveryDetailsSection: { backgroundColor: '#F5F6F6', paddingVertical: 16, gap: 12 },
  sectionTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 18, color: '#202325', paddingHorizontal: 15 },
  userCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#539461' },
  userDetails: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  userName: { fontFamily: 'Inter', fontWeight: '700', fontSize: 18, color: '#202325' },
  userHandle: { fontFamily: 'Inter', fontWeight: '500', fontSize: 16, color: '#7F8D91' },
  userRole: { fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#647276' },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12 },
  addressIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE7E2', justifyContent: 'center', alignItems: 'center' },
  addressDetails: { flex: 1, justifyContent: 'center' },
  addressText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#202325', lineHeight: 22.4 },
  shippingInfoContainer: { paddingHorizontal: 15, paddingTop: 4, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  infoValue: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#202325' },
  boxSpecsContainer: { paddingVertical: 16, paddingHorizontal: 15, gap: 8 },
  divider: { height: 12, backgroundColor: '#F5F6F6', marginVertical: 8 },
  plantListSection: { paddingVertical: 16 },
  plantListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 12 },
  plantListCount: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, color: '#202325' },
  plantCardContainer: { backgroundColor: '#F5F6F6', paddingHorizontal: 12, paddingVertical: 6 },
  plantCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12 },
  plantImage: { width: 96, height: 128, borderRadius: 8 },
  plantDetails: { flex: 1, justifyContent: 'space-between', gap: 8 },
  plantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plantCodeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plantCode: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  countryContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countryText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#556065' },
  plantName: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, color: '#202325', marginVertical: 4 },
  plantSubtext: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  plantFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeChip: { backgroundColor: '#202325', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 12 },
  quantity: { fontFamily: 'Inter', fontWeight: '600', fontSize: 16, color: '#393D40' },
  joinerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  joinerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#539461',
  },
  joinerUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinerUserName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  joinerUserHandle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#7F8D91',
  },
  joinerUserRole: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#647276',
  },
});

export default ViewShippedScreen;
