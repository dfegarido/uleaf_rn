import React from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BoxIcon from '../../../assets/admin-icons/box-white.svg';
import OptionsIcon from '../../../assets/admin-icons/options.svg';
import QuestionMarkTooltip from '../../../assets/admin-icons/question-mark.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';

const SelectionHeader = ({ onBack, selectedCount, onSelectAll, isAllSelected, generate }) => (
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
      <TouchableOpacity style={styles.actionButton} onPress={generate}>
        <BoxIcon fill="#FFFFFF" />
        <Text style={styles.actionText}>Send QR Codes via Email</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

const PlantCard = ({ plant, isSelected, onSelect, openTagAs }) => {

    const setTags = () => {
      openTagAs(plant?.packingData?.boxNumber || null, plant.id)
    }
    
    return (
    <View style={styles.plantCardContainer}>
      <View style={styles.plantCard}>
        <View>
          <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
          <View style={styles.checkboxContainer}>
              <CheckBox
                  isChecked={isSelected}
                  onToggle={() => onSelect(plant.id)}
                  containerStyle={{padding: 0, margin: 0}}
                  checkedColor="#539461"
              />
          </View>
        </View>
        <View style={styles.plantDetails}>
          <View>
            <View style={styles.plantHeader}>
              <View style={styles.plantCodeContainer}>
                <Text style={styles.plantCode}>{plant.plantCode}</Text>
                <QuestionMarkTooltip />
              </View>
              <View style={styles.countryContainer}>
                <Text style={styles.countryText}>{plant.countryCode}</Text>
                <CountryFlagIcon code={plant.countryCode} width={24} height={16} />
              </View>
            </View>
            <Text style={styles.plantName}>{plant.genus} {plant.species}</Text>
            <Text style={styles.plantSubtext}>{plant.variegation} • {plant.size}</Text>
          </View>
          <View style={styles.plantFooter}>
            {plant.listingType && (
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>{plant.listingType}</Text>
              </View>
            )}
            {/* <Text style={styles.quantity}>{plant.quantity}X</Text> */}
          </View>
        </View>
      </View>
    </View>
  )};

const SelectionModal = ({
  visible,
  onClose,
  plants,
  selectedPlants,
  onSelectPlant,
  onSelectAll,
  openTagAs,
  generate,
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
          generate={generate}
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
              openTagAs={openTagAs}
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
    paddingTop: 48, // Status bar height
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
    height: 48,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: 'Inter',
    fontSize: 16,
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
});

export default SelectionModal;
