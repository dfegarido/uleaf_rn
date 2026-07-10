import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';

import { db } from '../../../../firebase';
import { uploadBuyerContentPhotoApi } from '../../../components/Api';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const SECTIONS = [
  { key: 'deals', label: 'Deals' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'news', label: 'News' },
];

const MAX_ITEMS_PER_SECTION = 20;

const PlusIcon = ({ width = 20, height = 20, color = '#fff' }) => (
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

const sortItems = (items) =>
  items.sort((a, b) => {
    const aPriority = a.priority ?? 999;
    const bPriority = b.priority ?? 999;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    const aTime = a.createdAt?.toDate?.() || new Date(0);
    const bTime = b.createdAt?.toDate?.() || new Date(0);
    return aTime - bTime;
  });

export default function BuyerContentManagement({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const requestedSection = route.params?.section || 'deals';
  const activeSection = SECTIONS.some((s) => s.key === requestedSection)
    ? requestedSection
    : 'deals';
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [priority, setPriority] = useState('1');
  const [uploading, setUploading] = useState(false);
  const modalScrollRef = useRef(null);

  const scrollModalToEnd = () => {
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const sectionItems = allItems.filter((item) => item.section === activeSection);
  const sectionLabel = SECTIONS.find((s) => s.key === activeSection)?.label || 'Content';

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'buyerContent'));
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllItems(sortItems(items));
    } catch (error) {
      console.error('Error fetching buyer content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContent();
    }, [fetchContent]),
  );

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setNotes('');
    setPhoto(null);
    setPriority('1');
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setNotes(item.notes || '');
    setPhoto(item.imageUrl ? { uri: item.imageUrl } : null);
    setPriority(String(item.priority || 1));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 800,
      },
      (response) => {
        if (response.didCancel || response.error) return;
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setPhoto({
            uri: asset.uri,
            fileName: asset.fileName || `content_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
        }
      },
    );
  };

  const uploadImage = async (photoAsset) => {
    if (!photoAsset?.uri) return null;
    const result = await uploadBuyerContentPhotoApi(photoAsset.uri);
    if (!result.success || !result.photoUrl) {
      throw new Error('Upload succeeded but no photo URL returned');
    }
    return result.photoUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required.');
      return;
    }

    const priorityNum = parseInt(priority, 10);
    if (!priority.trim() || Number.isNaN(priorityNum) || priorityNum < 1 || priorityNum > 99) {
      Alert.alert('Error', 'Please enter a valid priority number (1-99).');
      return;
    }

    if (!editingItem && sectionItems.length >= MAX_ITEMS_PER_SECTION) {
      Alert.alert('Error', `Maximum of ${MAX_ITEMS_PER_SECTION} items allowed per section.`);
      return;
    }

    try {
      setUploading(true);

      let imageUrl = editingItem?.imageUrl || null;

      if (photo?.uri && photo.uri !== editingItem?.imageUrl) {
        imageUrl = await uploadImage(photo);
      }

      const itemData = {
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim(),
        imageUrl: imageUrl || null,
        section: activeSection,
        priority: priorityNum,
        updatedAt: new Date(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'buyerContent', editingItem.id), itemData);
      } else {
        await addDoc(collection(db, 'buyerContent'), {
          ...itemData,
          createdAt: new Date(),
        });
      }

      closeModal();
      fetchContent();
    } catch (error) {
      console.error('Error saving buyer content:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (itemId) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'buyerContent', itemId));
            fetchContent();
          } catch (error) {
            console.error('Error deleting buyer content:', error);
            Alert.alert('Error', 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.priorityBadge}>
        <Text style={styles.priorityText}>{item.priority || 1}</Text>
      </View>

      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.emptyImagePlaceholder]}>
          <Text style={styles.emptyImageText}>No Image</Text>
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.notes ? (
          <Text style={styles.itemNotes} numberOfLines={1}>
            Notes: {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <EditIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <DeleteIcon width={20} height={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const atSectionLimit = sectionItems.length >= MAX_ITEMS_PER_SECTION;

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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{sectionLabel}</Text>
          <Text style={styles.headerSubtitle}>
            {sectionItems.length}/{MAX_ITEMS_PER_SECTION} items
          </Text>
        </View>
        <TouchableOpacity
          onPress={openAddModal}
          style={[styles.addBtn, atSectionLimit && styles.addBtnDisabled]}
          activeOpacity={0.8}
          disabled={atSectionLimit}
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
          data={sectionItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={sectionItems.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No {sectionLabel.toLowerCase()} yet</Text>
              <Text style={styles.emptySubtitle}>
                Create up to {MAX_ITEMS_PER_SECTION} {sectionLabel.toLowerCase()} items for the buyer
                carousel.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? `Edit ${sectionLabel}` : `Add ${sectionLabel}`}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={modalScrollRef}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              nestedScrollEnabled
            >
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title"
                placeholderTextColor="#9AA4A8"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Image</Text>
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {photo?.uri ? (
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoSizeGuide}>
                    <View style={styles.photoSizeGuideFrame}>
                      <Text style={styles.photoSizeGuideDims}>780 × 360 px</Text>
                      <Text style={styles.photoSizeGuideRatio}>Landscape · 13:6</Text>
                    </View>
                    <Text style={styles.photoPickerText}>Tap to select photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Recommended size: 780 × 360 px (wide landscape). Images are shown as a wide banner on the buyer Shop carousel.
              </Text>

              <Text style={[styles.label, { marginTop: 16 }]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (plain text)"
                placeholderTextColor="#9AA4A8"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Notes (Admin only)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Internal notes (not shown to buyers)"
                placeholderTextColor="#9AA4A8"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={scrollModalToEnd}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>
                Priority <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={priority}
                onChangeText={setPriority}
                placeholder="Enter priority (1-99)"
                placeholderTextColor="#9AA4A8"
                style={styles.input}
                keyboardType="numeric"
                maxLength={2}
                onFocus={scrollModalToEnd}
              />
              <Text style={styles.helperText}>
                Lower numbers appear first in the carousel.
              </Text>
            </ScrollView>

            <View
              style={[
                styles.modalFooter,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE7',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B777B',
    fontWeight: '600',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D7E6D9',
  },
  priorityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: '#539461',
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EAF2EC',
  },
  emptyImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImageText: {
    fontSize: 10,
    color: '#9AA4A8',
    fontWeight: '500',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  itemDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B777B',
  },
  itemNotes: {
    marginTop: 4,
    fontSize: 11,
    color: '#9AA4A8',
    fontStyle: 'italic',
  },
  itemActions: {
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
    maxHeight: '90%',
    overflow: 'hidden',
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
  modalScroll: {
    flexShrink: 1,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B777B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  photoPickerBtn: {
    height: 120,
    borderWidth: 1,
    borderColor: '#D7E6D9',
    borderStyle: 'dashed',
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
  photoSizeGuide: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  photoSizeGuideFrame: {
    width: 168,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#A8C4AB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#E8F2E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSizeGuideDims: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F6B48',
  },
  photoSizeGuideRatio: {
    fontSize: 11,
    color: '#6B777B',
    marginTop: 2,
  },
  photoPickerText: {
    fontSize: 13,
    color: '#6B777B',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6ECE7',
    backgroundColor: '#fff',
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
});
