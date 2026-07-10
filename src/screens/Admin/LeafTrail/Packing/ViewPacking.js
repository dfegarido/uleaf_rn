import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CopyIcon from '../../../../assets/admin-icons/Copy.svg';
import OptionsIcon from '../../../../assets/admin-icons/options.svg';
import ScanQrIcon from '../../../../assets/admin-icons/qr.svg';
import QuestionMarkTooltip from '../../../../assets/admin-icons/question-mark.svg';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import {
  addLeafTrailBoxNumber,
  getOrdersBySortingTray,
  updateLeafTrailStatus,
  updatePlantsToNeedsToStay,
} from '../../../../components/Api/getAdminLeafTrail';
import LeafTrailDetailHeader from '../../../../components/Admin/LeafTrailDetailHeader';
import { isLeafTrailHubSpecEnabled } from '../../../../config/featureFlags';
import { useLeafTrailThermalPrint } from '../../../../hooks/useLeafTrailThermalPrint';
import { LEAF_TRAIL_SCAN_PARAMS } from '../../../../utils/leafTrailScanNav';
import CheckBox from '../../../../components/CheckBox/CheckBox';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import AssignBoxModal from './AssignBoxModal';
import PackingSelectionFooter from './PackingSelectionFooter';
import PackingTraySummary from './PackingTraySummary';
import TagAsOptions from './TagAs';
import { computePackingTrayMetrics } from '../../../../utils/packingTrayMetrics';
import { resolveCanonicalReceiverBoxNumber } from '../../../../utils/receiverBoxNumber';

const isAssignableForBox = (plant) =>
  !String(plant?.packingData?.boxNumber || '').trim();

const Header = ({ title, navigation, scanQrParams }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <BackSolidIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity
      style={styles.headerAction}
      onPress={() =>
        navigation.navigate('LeafTrailScanQRAdminScreen', scanQrParams || { leafTrailStatus: 'packed' })
      }>
             <ScanQrIcon />
    </TouchableOpacity>
  </View>
);

const TrayInfo = ({ trayNumber, label }) => (
  <View style={Platform.OS === 'android' ? styles.trayInfoContainer : styles.trayInfoContainerIos}>
    <View style={styles.trayIconCircle}>
      <TrayIcon width={32} height={32} />
    </View>
    <View style={styles.trayDetails}>
      <View style={styles.trayNumberRow}>
        <Text style={styles.trayNumber}>{trayNumber}</Text>
        <TouchableOpacity>
          <CopyIcon />
        </TouchableOpacity>
      </View>
      <Text style={styles.trayLabel}>{label}</Text>
    </View>
  </View>
);

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

const PlantCard = ({ plant, isSelected, onSelect, openTagAs, canSelect }) => {
  const boxNumber = String(plant?.packingData?.boxNumber || '').trim();
  const setTags = () => {
    openTagAs(boxNumber || null, plant.id);
  };

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
        {plant?.leafTrailStatus === 'packed' && !boxNumber ? (
          <View style={styles.packedBadgeContainer}>
            <View style={styles.packedBadge}>
              <Text style={styles.packedBadgeText}>PACKED</Text>
            </View>
          </View>
        ) : null}
        {canSelect ? (
          <View style={styles.checkboxContainer}>
            <CheckBox
              isChecked={isSelected}
              onToggle={() => onSelect(plant.id)}
            />
          </View>
        ) : null}
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
              <TouchableOpacity onPress={setTags}>
                <OptionsIcon />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
          <Text style={styles.plantSubtext}>{plant.variegation} • {plant.potSizeVariation}</Text>
        </View>
        <View style={styles.plantFooter}>
          <View style={styles.plantFooterLeft}>
            {plant.listingType ? (
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>{plant.listingType}</Text>
              </View>
            ) : null}
            {boxNumber ? (
              <View style={styles.boxChip}>
                <Text style={styles.boxChipText}>{boxNumber}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.quantity}>{plant.orderQty}X</Text>
        </View>
      </View>
    </View>
  </View>
)};

const ViewPackingScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const hubSpecEnabled = isLeafTrailHubSpecEnabled();
  const { item } = route.params;
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [plantList, setPlantList] = useState([]);
  const [isTagAsVisible, setTagAsVisible] = useState(false);
  const [hasBoxNumber, setHasBoxNumber] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignBoxVisible, setIsAssignBoxVisible] = useState(false);

  const trayScanParams = useMemo(
    () => LEAF_TRAIL_SCAN_PARAMS.packingTray({ sortingTrayNumber: item?.sortingTrayNumber }),
    [item?.sortingTrayNumber],
  );

  const trayMetrics = useMemo(
    () => computePackingTrayMetrics(plantList),
    [plantList],
  );

  const canonicalReceiverBoxNumber = useMemo(
    () =>
      resolveCanonicalReceiverBoxNumber(item) ||
      resolveCanonicalReceiverBoxNumber(plantList[0]) ||
      String(item?.sortingTrayNumber || '').trim(),
    [item, plantList],
  );

  const assignablePlants = useMemo(
    () => plantList.filter(isAssignableForBox),
    [plantList],
  );

  const isAllSelected =
    assignablePlants.length > 0 &&
    assignablePlants.every((p) => selectedPlants.includes(p.id));

  const openTagAs = (hasBox, id) => {
    setHasBoxNumber(!!hasBox);
    setTagAsVisible(!isTagAsVisible);
    setOrderId(id)
  }

  const setTagAs = async (status) => {
    if (status === 'packing') {
      setSelectedPlants(orderId ? [orderId] : []);
      setIsAssignBoxVisible(true);
      setTagAsVisible(false);
    } else {
      setIsLoading(true);
      setTagAsVisible(!isTagAsVisible);
      const response = await updateLeafTrailStatus(orderId, status);
      if (response.success) {
        await fetchData();
        setIsLoading(false)
        Alert.alert('Success', 'Order status updated successfully!');
      } else {
        setIsLoading(false)
        Alert.alert('Error', error.message);
      }  
    }
  }

  const stay = async () => {
    if (!selectedPlants.length) return;
    setIsLoading(true);

    try {
      const response = await updatePlantsToNeedsToStay({ orderIds: selectedPlants });
      if (response.success) {
        await fetchData();
        setSelectedPlants([]);
        Alert.alert('Success', 'Plants tagged as Needs to Stay');
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBox = async (boxDetails) => {
    const ids =
      selectedPlants.length > 0
        ? selectedPlants
        : orderId
          ? [orderId]
          : [];
    if (!ids.length) {
      Alert.alert('No plants selected', 'Select at least one plant to assign a box number.');
      return;
    }

    setIsLoading(true);
    setIsAssignBoxVisible(false);

    try {
      const response = await addLeafTrailBoxNumber({ orderIds: ids, boxDetails });
      if (response.success) {
        await fetchData();
        setOrderId(null);
        setSelectedPlants([]);
        Alert.alert('Success', `Box #${boxDetails.boxNumber} assigned with dimensions and weight.`);
      } else {
        Alert.alert('Error', response?.message || 'Could not assign box.');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not assign box.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlant = (plantId) => {
    setSelectedPlants((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlants([]);
    } else {
      setSelectedPlants(assignablePlants.map((p) => p.id));
    }
  };

  const openAssignSheet = () => {
    if (!selectedPlants.length) {
      Alert.alert('Select plants', 'Check one or more plants without a box number first.');
      return;
    }
    setIsAssignBoxVisible(true);
  };

  const fetchData = useCallback(async () => {
    if (!item?.sortingTrayNumber) return;
    setIsLoading(true);
    try {
      const response = await getOrdersBySortingTray(item.sortingTrayNumber);
      setPlantList(response.data || []);
    } catch (e) {
      console.error('Failed to fetch plant data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [item?.sortingTrayNumber]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const packingDetails = {
    ...item,
    plants: item.sortedPlantsData || [],
  };

  const { printOrderIds, LabelViewer } = useLeafTrailThermalPrint('Tray labels');

  const handlePrintBarcodes = () => {
    const ids =
      selectedPlants.length > 0
        ? selectedPlants
        : plantList.map((p) => p.id).filter(Boolean);
    printOrderIds(ids, { emptyMessage: 'No plants in this tray to print.' });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LabelViewer />
      {hubSpecEnabled ? (
        <LeafTrailDetailHeader
          title="Tray Details"
          navigation={navigation}
          scanQrParams={trayScanParams}
          exportLines={plantList}
          exportStageLabel="packing-tray"
          onPrintPress={handlePrintBarcodes}
        />
      ) : (
        <Header title="Tray Details" navigation={navigation} scanQrParams={trayScanParams} />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          selectedPlants.length > 0 && { paddingBottom: 200 + insets.bottom },
        ]}>
        <TrayInfo
          trayNumber={canonicalReceiverBoxNumber || packingDetails.sortingTrayNumber}
          label={hubSpecEnabled ? 'Receiver Box Number' : 'Tray Number'}
        />
        <PackingTraySummary metrics={trayMetrics} />

        <View style={styles.deliveryDetailsSection}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={{padding: 12, backgroundColor: '#F5F6F6'}}>
            <UserInfo user={{
                name: packingDetails.name,
                username: packingDetails.username,
                avatar: packingDetails.avatar,
                role: 'Receiver'
            }} />
          </View>
          <ShippingInfo
            upsShipping={packingDetails.upsShippingDate ? moment(packingDetails.upsShippingDate).format('MMM DD, YYYY') : 'Date TBD'}
            plantFlight={packingDetails.flightDate || 'Date TBD'}
          />
        </View>

        <View style={styles.plantListSection}>
            <View style={styles.plantListHeader}>
                <Text style={styles.sectionTitle}>Plant List</Text>
                <Text style={styles.plantListCount}>
                  {plantList.length} plant(s)
                  {assignablePlants.length < plantList.length
                    ? ` · ${assignablePlants.length} need box`
                    : ''}
                </Text>
            </View>
            <FlatList
                data={plantList}
                keyExtractor={(plant) => plant.id.toString()}
                renderItem={({ item: plant }) => (
                    <PlantCard
                        openTagAs={openTagAs}
                        plant={plant}
                        isSelected={selectedPlants.includes(plant.id)}
                        onSelect={handleSelectPlant}
                        canSelect={isAssignableForBox(plant)}
                    />
                )}
                scrollEnabled={false} // Disable FlatList's own scrolling
                ItemSeparatorComponent={() => <View style={{height: 6}} />}
            />
        </View>
      </ScrollView>
      <TagAsOptions visible={isTagAsVisible}
        setTagAs={setTagAs}
        hasBox={hasBoxNumber}
        boxActionTitle={hubSpecEnabled ? 'Box details' : 'Assign a box'}
        onClose={() => setTagAsVisible(false)}/>

      {isLoading && (
                <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => {}}
          statusBarTranslucent={Platform.OS === 'android'}
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
              )}
      <PackingSelectionFooter
        selectedCount={selectedPlants.length}
        assignableCount={assignablePlants.length}
        isAllSelected={isAllSelected}
        onSelectAll={handleSelectAll}
        onClear={() => setSelectedPlants([])}
        onAssignBox={openAssignSheet}
        onNeedsToStay={stay}
        assignBoxLabel={hubSpecEnabled ? 'Box details' : 'Assign box #'}
      />
      <AssignBoxModal
        visible={isAssignBoxVisible}
        onClose={() => setIsAssignBoxVisible(false)}
        onSave={handleSaveBox}
        selectedCount={selectedPlants.length || (orderId ? 1 : 0)}
        defaultBoxNumber={canonicalReceiverBoxNumber}
        lockBoxNumber={hubSpecEnabled && Boolean(canonicalReceiverBoxNumber)}
        title={hubSpecEnabled ? 'Box details' : 'Assign box #'}
        saveLabel={hubSpecEnabled ? 'Save box details' : 'Save box assignment'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    height: 106,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  scrollContent: {
    paddingTop: 40, // Height of the header
    paddingBottom: 34,
  },
  trayInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
    marginTop: 60,
  },
  trayInfoContainerIos: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
  },
  trayIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFB323',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trayDetails: {
    flex: 1,
    gap: 4,
  },
  trayNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trayNumber: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    color: '#202325',
  },
  trayLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#7F8D91',
  },
  deliveryDetailsSection: {
    backgroundColor: '#F5F6F6',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  userHandle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#7F8D91',
  },
  userRole: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
  },
  shippingInfoContainer: {
    paddingHorizontal: 15,
    paddingTop: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
  },
  infoValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
  },
  plantListSection: {
    paddingVertical: 16,
  },
  plantListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  plantListCount: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  plantCardContainer: {
    backgroundColor: '#F5F6F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  plantImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 1,
    left: 2,
    backgroundColor: 'transparent',
  },
  plantDetails: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#556065',
  },
  plantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    marginVertical: 4,
  },
  plantSubtext: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
  },
  plantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantFooterLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  boxChip: {
    backgroundColor: '#EAF7EF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#B8DFC4',
  },
  boxChipText: {
    color: '#1B7A43',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
  },
  typeChip: {
    backgroundColor: '#202325',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
  },
  quantity: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
  },
  packedBadgeContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  packedBadge: {
    backgroundColor: '#FFE7E2',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  packedBadgeText: {
    color: '#E7522F',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
  },
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

export default ViewPackingScreen;
