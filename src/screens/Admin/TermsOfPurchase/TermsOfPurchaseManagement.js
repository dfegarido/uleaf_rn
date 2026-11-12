import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { launchImageLibrary } from 'react-native-image-picker';

import AppImage from '../../../components/AppImage/AppImage';
import CustomAlert from '../../../components/CustomAlert/CustomAlert';
import { uploadBuyerContentPhotoApi } from '../../../components/Api';
import { getTermsOfPurchaseApi, saveTermsOfPurchaseApi } from '../../../components/Api/termsOfPurchaseApi';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import TermsIcon from '../../../assets/admin-icons/terms-of-purchase.svg';

export default function TermsOfPurchaseManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [text, setText] = useState('');
  const [savedVisible, setSavedVisible] = useState(false);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    const res = await getTermsOfPurchaseApi();
    if (res.success) {
      setSavedImageUrl(res.imageUrl);
      setPhoto(res.imageUrl ? { uri: res.imageUrl } : null);
      setText(res.text);
    } else {
      Alert.alert('Error', 'Could not load the Terms of Purchase.');
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTerms();
    }, [fetchTerms]),
  );

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.9, maxWidth: 1600, maxHeight: 1600 },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) setPhoto({ uri: asset.uri });
      },
    );
  };

  const handleSave = async () => {
    if (!photo?.uri) {
      Alert.alert('Picture needed', 'Upload the Terms of Purchase picture first.');
      return;
    }
    if (!text.trim()) {
      Alert.alert('Text needed', 'Paste the Terms of Purchase text first.');
      return;
    }

    try {
      setSaving(true);
      let imageUrl = savedImageUrl;
      if (photo.uri !== savedImageUrl) {
        const upload = await uploadBuyerContentPhotoApi(photo.uri);
        if (!upload.photoUrl) throw new Error('Upload succeeded but no photo URL returned');
        imageUrl = upload.photoUrl;
      }

      const res = await saveTermsOfPurchaseApi({ imageUrl, text: text.trim() });
      if (!res.success) throw new Error(res.error);

      setSavedImageUrl(imageUrl);
      setPhoto({ uri: imageUrl });
      setSavedVisible(true);
    } catch (error) {
      console.error('Error saving Terms of Purchase:', error);
      Alert.alert('Error', 'Failed to save Terms of Purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pictureChanged = Boolean(photo?.uri) && photo.uri !== savedImageUrl;
  const ready = Boolean(photo?.uri) && Boolean(text.trim());

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <BackSolidIcon width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Purchase</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#539461" />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <TermsIcon width={36} height={36} />
              </View>
              <View style={styles.introCopy}>
                <Text style={styles.introTitle}>Shown at checkout</Text>
                <Text style={styles.introText}>
                  The picture sits at the bottom of checkout. Buyers must tick the box, and the link opens the text you paste here.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Picture</Text>
              <Text style={styles.cardTitle}>Checkout picture</Text>
              <View style={styles.frame}>
                {photo?.uri ? (
                  <>
                    <AppImage source={{ uri: photo.uri }} style={styles.preview} resizeMode="contain" />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => setPhoto(null)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Remove picture"
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.empty}>
                    <View style={styles.emptyBadge}>
                      <TermsIcon width={40} height={40} />
                    </View>
                    <Text style={styles.emptyTitle}>No picture yet</Text>
                    <Text style={styles.emptyText}>Upload the Terms of Purchase graphic buyers will see.</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
                      <Text style={styles.uploadBtnText}>Upload picture</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {pictureChanged ? <Text style={styles.pending}>New picture, not saved yet.</Text> : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Text</Text>
              <Text style={styles.cardTitle}>What buyers read</Text>
              <Text style={styles.cardHint}>Paste the full terms. This opens when a buyer taps Terms of Purchase.</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Paste the text here"
                placeholderTextColor="#9AA4A8"
                style={styles.textArea}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.count}>{text.trim().length} characters</Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.saveBtn, (!ready || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Terms of Purchase</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      <CustomAlert
        visible={savedVisible}
        title="Terms of Purchase saved"
        message="Buyers will now see the updated picture and text at checkout."
        buttons={[{ text: 'Done' }]}
        onDismiss={() => setSavedVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F7F4' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE7',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#202325', textAlign: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 28 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3E9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: { flex: 1, marginLeft: 12 },
  introTitle: { fontSize: 15, fontWeight: '700', color: '#245C32' },
  introText: { marginTop: 3, fontSize: 13, lineHeight: 18, color: '#3E6B48' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E3EEE5',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#539461',
  },
  cardTitle: { marginTop: 2, fontSize: 17, fontWeight: '700', color: '#202325' },
  cardHint: { marginTop: 4, fontSize: 13, lineHeight: 18, color: '#6B777B' },
  frame: {
    marginTop: 12,
    height: 280,
    borderRadius: 14,
    backgroundColor: '#F6FAF7',
    borderWidth: 1,
    borderColor: '#D7E6D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', paddingHorizontal: 28 },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E7F3E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#202325' },
  emptyText: { marginTop: 4, fontSize: 13, lineHeight: 18, color: '#6B777B', textAlign: 'center' },
  uploadBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#539461',
  },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(32, 35, 37, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  pending: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#B45309' },
  textArea: {
    marginTop: 12,
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F6FAF7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#202325',
  },
  count: { marginTop: 8, fontSize: 12, color: '#8A969A', textAlign: 'right' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6ECE7',
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
