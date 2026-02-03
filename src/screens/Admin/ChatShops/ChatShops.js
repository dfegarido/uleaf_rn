import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';

import { db } from '../../../../firebase';
import { useAuth } from '../../../auth/AuthProvider';
import { uploadChatShopPhotoApi } from '../../../components/Api';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const DefaultShopImage = require('../../../assets/images/AvatarBig.png');

const PlusIcon = ({ width = 24, height = 24, color = '#fff' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ width = 20, height = 20, color = '#539461' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeleteIcon = ({ width = 20, height = 20, color = '#FF5247' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ChatShops({ navigation }) {
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();

  const [loading, setLoading] = useState(false);
  const [chatShops, setChatShops] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  
  // Modal form states
  const [shopName, setShopName] = useState('');
  const [shopPhoto, setShopPhoto] = useState(null); // { uri, fileName, type }
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
  const [groupChats, setGroupChats] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showGroupChatPicker, setShowGroupChatPicker] = useState(false);

  const fetchChatShops = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'chatShops'), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatShops(shops);
    } catch (error) {
      console.error('Error fetching chat shops:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroupChats = useCallback(async () => {
    try {
      // IMPORTANT: avoid orderBy() here to prevent Firestore index errors.
      // We'll fetch all group chats and sort in-memory.
      const q = query(collection(db, 'chats'), where('type', '==', 'group'));
      const snapshot = await getDocs(q);
      const allChats = snapshot.docs
        .map((d) => {
          const data = d.data() || {};

          const ts =
            (data.timestamp && typeof data.timestamp.toDate === 'function' && data.timestamp.toDate()) ||
            (data.timestamp instanceof Date ? data.timestamp : null) ||
            (data.createdAt && typeof data.createdAt.toDate === 'function' && data.createdAt.toDate()) ||
            (data.createdAt instanceof Date ? data.createdAt : null) ||
            null;

          return {
            id: d.id,
            ...data,
            name: data.name || 'Unnamed Group',
            _sortTs: ts ? ts.getTime() : 0,
          };
        })
        .sort((a, b) => (b._sortTs || 0) - (a._sortTs || 0));

      console.log(`📊 Fetched ${allChats.length} total group chats`);
      setGroupChats(allChats);
    } catch (error) {
      console.error('Error fetching group chats:', error);
      setGroupChats([]);
    }
  }, []);

  // Filter available group chats based on current chat shops and editing state
  const getAvailableGroupChats = useCallback(() => {
    // Get list of group chat IDs already used by other chat shops
    const usedGroupChatIds = chatShops
      .filter(shop => editingShop ? shop.id !== editingShop.id : true)
      .map(shop => shop.groupChatId)
      .filter(Boolean);

    const availableChats = groupChats.filter(
      chat => !usedGroupChatIds.includes(chat.id)
    );

    console.log(`📊 Group chats: ${groupChats.length} total, ${availableChats.length} available`);
    return availableChats;
  }, [groupChats, chatShops, editingShop]);

  useFocusEffect(
    useCallback(() => {
      fetchChatShops();
    }, [fetchChatShops])
  );

  // Fetch group chats once on mount
  useEffect(() => {
    fetchGroupChats();
  }, [fetchGroupChats]);

  const openAddModal = () => {
    if (chatShops.length >= 8) {
      Alert.alert('Limit Reached', 'You can only create up to 8 chat shops.');
      return;
    }
    setEditingShop(null);
    setShopName('');
    setShopPhoto(null);
    setSelectedGroupChat(null);
    setModalVisible(true);
  };

  const openEditModal = (shop) => {
    setEditingShop(shop);
    setShopName(shop.name || '');
    setShopPhoto(shop.photoUrl ? { uri: shop.photoUrl } : null);
    setSelectedGroupChat(
      groupChats.find(gc => gc.id === shop.groupChatId) || null
    );
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingShop(null);
    setShopName('');
    setShopPhoto(null);
    setSelectedGroupChat(null);
    setShowGroupChatPicker(false);
  };

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      (response) => {
        if (response.didCancel || response.error) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setShopPhoto({
            uri: asset.uri,
            fileName: asset.fileName || `shop_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
        }
      }
    );
  };

  const uploadImage = async (photo) => {
    if (!photo || !photo.uri) return null;
    try {
      console.log('📸 Uploading chat shop photo via backend API...');
      
      // Upload using backend API (same pattern as profile photos)
      const result = await uploadChatShopPhotoApi(photo.uri);
      
      if (!result.success || !result.photoUrl) {
        throw new Error('Upload succeeded but no photo URL returned');
      }

      console.log('✅ Chat shop photo uploaded successfully:', result.photoUrl);
      return result.photoUrl;
    } catch (error) {
      console.error('❌ Error uploading chat shop photo:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Error', 'Shop name is required.');
      return;
    }
    if (!selectedGroupChat) {
      Alert.alert('Error', 'Please select a group chat.');
      return;
    }

    try {
      setUploading(true);

      let photoUrl = editingShop?.photoUrl || null;
      
      // Upload new photo if changed
      if (shopPhoto && shopPhoto.uri && shopPhoto.uri !== editingShop?.photoUrl) {
        photoUrl = await uploadImage(shopPhoto);
      }

      const shopData = {
        name: shopName.trim(),
        photoUrl: photoUrl || null,
        groupChatId: selectedGroupChat.id,
        groupChatName: selectedGroupChat.name,
        updatedAt: new Date(),
      };

      if (editingShop) {
        // Update existing
        await updateDoc(doc(db, 'chatShops', editingShop.id), shopData);
      } else {
        // Create new
        await addDoc(collection(db, 'chatShops'), {
          ...shopData,
          createdAt: new Date(),
        });
      }

      closeModal();
      fetchChatShops();
    } catch (error) {
      console.error('Error saving chat shop:', error);
      Alert.alert('Error', 'Failed to save chat shop. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (shopId) => {
    Alert.alert(
      'Delete Chat Shop',
      'Are you sure you want to delete this chat shop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'chatShops', shopId));
              fetchChatShops();
            } catch (error) {
              console.error('Error deleting chat shop:', error);
              Alert.alert('Error', 'Failed to delete chat shop.');
            }
          },
        },
      ]
    );
  };

  const handleShopPress = async (shop) => {
    try {
      if (!shop.groupChatId) {
        Alert.alert('Error', 'No group chat linked to this shop.');
        return;
      }

      console.log('📱 Opening group chat:', shop.groupChatId);

      // Fetch the group chat data from Firestore
      const chatDocRef = doc(db, 'chats', shop.groupChatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        Alert.alert('Error', 'Group chat not found. It may have been deleted.');
        return;
      }

      const chatData = chatDoc.data();
      
      // Navigate to ChatScreen with the full chat data
      navigation.navigate('ChatScreen', {
        id: shop.groupChatId,
        ...chatData,
      });
    } catch (error) {
      console.error('Error opening group chat:', error);
      Alert.alert('Error', 'Failed to open group chat. Please try again.');
    }
  };

  const renderShopItem = ({ item }) => {
    const imageSource = item.photoUrl ? { uri: item.photoUrl } : DefaultShopImage;
    return (
      <TouchableOpacity 
        style={styles.shopCard}
        onPress={() => handleShopPress(item)}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.shopImage} />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.shopGroupName} numberOfLines={1}>
            {item.groupChatName || 'Group Chat'}
          </Text>
        </View>
        <View style={styles.shopActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            activeOpacity={0.7}
          >
            <EditIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            activeOpacity={0.7}
          >
            <DeleteIcon width={20} height={20} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <BackSolidIcon width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Shops</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addBtn}
          activeOpacity={0.8}
          disabled={chatShops.length >= 8}
        >
          <PlusIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#539461" />
        </View>
      ) : (
        <FlatList
          data={chatShops}
          keyExtractor={(item) => item.id}
          renderItem={renderShopItem}
          contentContainerStyle={chatShops.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No chat shops yet</Text>
              <Text style={styles.emptySubtitle}>
                Create up to 8 chat shops to showcase on the buyer dashboard.
              </Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Chat Shop Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShop ? 'Edit Chat Shop' : 'Add Chat Shop'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Shop Name */}
              <Text style={styles.label}>
                Shop Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="Enter shop name"
                placeholderTextColor="#9AA4A8"
                style={styles.input}
              />

              {/* Shop Photo */}
              <Text style={[styles.label, { marginTop: 16 }]}>Shop Photo (Optional)</Text>
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {shopPhoto?.uri ? (
                  <Image source={{ uri: shopPhoto.uri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoPickerText}>Tap to select photo</Text>
                )}
              </TouchableOpacity>

              {/* Group Chat Selector */}
              <Text style={[styles.label, { marginTop: 16 }]}>
                Group Chat <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowGroupChatPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={selectedGroupChat ? styles.pickerTextSelected : styles.pickerText}>
                  {selectedGroupChat ? selectedGroupChat.name : 'Select Group Chat'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Group Chat Picker Sheet (inside main modal for reliability) */}
          {showGroupChatPicker && (
            <View style={styles.innerPickerOverlay}>
              <Pressable
                style={styles.innerPickerBackdrop}
                onPress={() => setShowGroupChatPicker(false)}
              />
              <View style={styles.innerPickerSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Group Chat</Text>
                  <TouchableOpacity
                    onPress={() => setShowGroupChatPicker(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
            </View>
            <FlatList
              data={getAvailableGroupChats()}
              keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedGroupChat(item);
                        setShowGroupChatPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerItemText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {selectedGroupChat?.id === item.id && (
                        <Text style={styles.pickerItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.pickerList}
                  ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                      <Text style={styles.emptyTitle}>No group chats found</Text>
                      <Text style={styles.emptySubtitle}>
                        Create a group chat first to link it to a chat shop.
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE7',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#D7E6D9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  shopImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EAF2EC',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  shopGroupName: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B777B',
  },
  shopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E6D9',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B777B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6B777B',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
  },
  required: {
    color: '#FF5247',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202325',
  },
  photoPickerBtn: {
    height: 120,
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPickerText: {
    fontSize: 14,
    color: '#6B777B',
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 15,
    color: '#9AA4A8',
  },
  pickerTextSelected: {
    fontSize: 15,
    color: '#202325',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B777B',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Picker sheet (inside main modal)
  innerPickerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
  },
  innerPickerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  innerPickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerList: {
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#202325',
    flex: 1,
  },
  pickerItemCheck: {
    fontSize: 18,
    color: '#539461',
    fontWeight: '700',
  },
});

