import React, { useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

// Represents a single selectable seller in the list
const SellerItem = ({ name, avatarUrl, onSelect }) => (
  <TouchableOpacity style={styles.sellerItemContainer} onPress={onSelect}>
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
    <Text style={styles.sellerName}>{name}</Text>
  </TouchableOpacity>
);

const SellerFilter = ({ isVisible, onClose, onSelectSeller }) => {
  // Mock data for the list of sellers
  const allSellers = [
    { id: '1', name: 'Kristin Watson', avatar: 'https://i.imgur.com/L6SHd3S.jpeg' },
    { id: '2', name: 'Jane Cooper', avatar: 'https://i.imgur.com/81DNp2c.jpeg' },
    { id: '3', name: 'Esther Howard', avatar: 'https://i.imgur.com/s21bC37.jpeg' },
    { id: '4', name: 'Cameron Williamson', avatar: 'https://i.imgur.com/LMD0A6T.jpeg' },
    { id: '5', name: 'Brooklyn Simmons', avatar: 'https://i.imgur.com/cE1aDBo.jpeg' },
  ];

  const [searchQuery, setSearchQuery] = useState('');

  // Filter sellers based on the search query
  const filteredSellers = allSellers.filter(seller =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (seller) => {
    onSelectSeller(seller);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <SafeAreaView>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Seller</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon />
                  </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View style={styles.contentContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Search"
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Scrollable List of Sellers */}
                  <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {filteredSellers.map((seller, index) => (
                      <View key={seller.id}>
                        <SellerItem
                          name={seller.name}
                          avatarUrl={seller.avatar}
                          onSelect={() => handleSelect(seller)}
                        />
                        {index < filteredSellers.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Action Button */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity style={styles.viewAllButton} onPress={onClose}>
                    <Text style={styles.viewAllButtonText}>Update Schedule</Text>
                  </TouchableOpacity>
                </View>

              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 569, // As per Figma
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  closeIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIconText: {
    fontSize: 18,
    color: '#7F8D91',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  listContainer: {
    height: 343,
    marginTop: 16,
  },
  sellerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  viewAllButton: {
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
});

export default SellerFilter;