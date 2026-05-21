import React from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BoxIcon from '../../../assets/admin-icons/box-white.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';

const SelectionHeader = ({
  onBack,
  selectedCount,
  onSelectAll,
  isAllSelected,
  showQrAction,
  onQrPress,
  onLeafTrailPress,
  onPlantStatusPress,
}) => (
  <View style={styles.selectionHeader}>
    <View style={styles.controls}>
      <TouchableOpacity onPress={onBack}>
        <BackIcon fill="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.selectionText}>{selectedCount} plant(s) selected</Text>
      <View style={styles.selectAllContainer}>
        <CheckBox isChecked={isAllSelected} onToggle={onSelectAll} />
        <Text style={styles.selectAllText}>Select All</Text>
      </View>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.actions}>
      <TouchableOpacity style={styles.actionButton} onPress={onLeafTrailPress}>
        <Text style={styles.actionText}>Change leaf trail status</Text>
      </TouchableOpacity>
      <View style={{ width: 12 }} />
      <TouchableOpacity style={styles.actionButton} onPress={onPlantStatusPress}>
        <Text style={styles.actionText}>Change plant status</Text>
      </TouchableOpacity>
      {showQrAction && (
        <>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={styles.actionButton} onPress={onQrPress}>
            <BoxIcon fill="#FFFFFF" />
            <Text style={styles.actionText}>Send QR Codes via Email</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  </View>
);

const PlantCard = ({ plant, isSelected, onSelect }) => (
  <View style={styles.plantCardContainer}>
    <View style={styles.plantCard}>
      <View>
        <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
        <View style={styles.checkboxContainer}>
          <CheckBox
            isChecked={isSelected}
            onToggle={() => onSelect(plant.id)}
            containerStyle={{ padding: 0, margin: 0 }}
            checkedColor="#539461"
          />
        </View>
      </View>
      <View style={styles.plantDetails}>
        <View>
          <View style={styles.plantHeader}>
            <View style={styles.plantCodeContainer}>
              <Text style={styles.plantCode}>{plant.plantCode}</Text>
            </View>
            {plant.countryCode ? (
              <View style={styles.countryContainer}>
                <Text style={styles.countryText}>{plant.countryCode}</Text>
                <CountryFlagIcon code={plant.countryCode} width={24} height={16} />
              </View>
            ) : null}
          </View>
          <Text style={styles.plantName}>
            {plant.genus} {plant.species}
          </Text>
          {plant.leafTrailStatus ? (
            <Text style={styles.plantSubtext}>Leaf Trail: {plant.leafTrailStatus}</Text>
          ) : null}
          {plant.plantStatus && plant.plantStatus !== '—' ? (
            <Text style={styles.plantSubtext}>Plant Status: {plant.plantStatus}</Text>
          ) : null}
        </View>
      </View>
    </View>
  </View>
);

const SelectionModal = ({
  visible,
  onClose,
  plants,
  selectedPlants,
  onSelectPlant,
  onSelectAll,
  showQrAction,
  generate,
  onLeafTrailPress,
  onPlantStatusPress,
}) => {
  const isAllSelected = plants.length > 0 && selectedPlants.length === plants.length;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <SelectionHeader
          onBack={onClose}
          selectedCount={selectedPlants.length}
          onSelectAll={onSelectAll}
          isAllSelected={isAllSelected}
          showQrAction={showQrAction}
          onQrPress={generate}
          onLeafTrailPress={onLeafTrailPress}
          onPlantStatusPress={onPlantStatusPress}
        />
        <FlatList
          data={plants}
          style={styles.list}
          keyExtractor={(plant) => plant.id.toString()}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              isSelected={selectedPlants.includes(item.id)}
              onSelect={onSelectPlant}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  selectionHeader: {
    backgroundColor: '#202325',
    paddingTop: 48,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    height: 58,
  },
  selectionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  plantCardContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
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
    backgroundColor: '#E4E7E9',
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
    fontSize: 14,
    color: '#647276',
  },
});

export default SelectionModal;
