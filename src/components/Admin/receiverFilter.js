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

// Represents a single selectable receiver in the list
const ReceiverItem = ({ name, avatarUrl, onSelect }) => (
  <TouchableOpacity style={styles.receiverItemContainer} onPress={onSelect}>
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
    <Text style={styles.receiverName}>{name}</Text>
  </TouchableOpacity>
);

const ReceiverFilter = ({ isVisible, onClose, onSelectReceiver, receivers }) => {
  // Mock data for the list of receivers
  const allReceivers = receivers;

  const [searchQuery, setSearchQuery] = useState('');

  // Filter receivers based on the search query
  const filteredReceivers = allReceivers.filter(receiver => {
    const name = receiver.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  });

  const handleSelect = (receiver) => {
    onSelectReceiver(receiver?.id || null);
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
                  <Text style={styles.headerTitle}>Receiver</Text>
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

                  {/* Scrollable List of Receivers */}
                  <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {filteredReceivers.map((receiver, index) => (
                      <View key={receiver.id}>
                        <ReceiverItem
                          name={receiver.name}
                          avatarUrl={receiver.avatar}
                          onSelect={() => handleSelect(receiver)}
                        />
                        {index < filteredReceivers.length - 1 && <View style={styles.divider} />}
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
  receiverItemContainer: {
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
  receiverName: {
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

export default ReceiverFilter;