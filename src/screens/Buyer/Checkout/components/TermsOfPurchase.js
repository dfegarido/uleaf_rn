import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppImage from '../../../../components/AppImage/AppImage';
import CheckBox from '../../../../components/CheckBox/CheckBox';
import { getTermsOfPurchaseApi } from '../../../../components/Api/termsOfPurchaseApi';

export const TERMS_REQUIRED_MESSAGE =
  'Please read and agree to our Terms of Purchase before placing your order.';

// The picture and the checkbox mount together on checkout; share one request.
let inflight = null;
const fetchTerms = () => {
  if (!inflight) {
    inflight = getTermsOfPurchaseApi().finally(() => {
      inflight = null;
    });
  }
  return inflight;
};

const useTermsOfPurchase = () => {
  const [terms, setTerms] = useState({ imageUrl: null, text: '' });
  useEffect(() => {
    let active = true;
    fetchTerms().then((res) => {
      if (active && res.success) setTerms({ imageUrl: res.imageUrl, text: res.text });
    });
    return () => {
      active = false;
    };
  }, []);
  return terms;
};

/** Admin-uploaded Terms of Purchase picture, shown at the bottom of checkout. */
export const TermsOfPurchaseImage = () => {
  const { imageUrl } = useTermsOfPurchase();
  const [aspectRatio, setAspectRatio] = useState(1);

  if (!imageUrl) return null;

  return (
    <View style={styles.imageWrap}>
      <AppImage
        source={{ uri: imageUrl }}
        resizeWidth={1200}
        style={[styles.image, { aspectRatio }]}
        resizeMode="contain"
        onLoad={(e) => {
          const { width, height } = e.nativeEvent?.source || {};
          if (width && height) setAspectRatio(width / height);
        }}
      />
    </View>
  );
};

/** "I have read and agree to the Terms of Purchase." row; the link opens the admin text. */
export const TermsAgreement = ({ agreed, onToggle }) => {
  const { text } = useTermsOfPurchase();
  const [textVisible, setTextVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.agreementRow}>
      <CheckBox isChecked={agreed} onToggle={onToggle} />
      <Text style={styles.agreementText} onPress={onToggle} suppressHighlighting>
        I have read and agree to the{' '}
        <Text style={styles.link} onPress={() => setTextVisible(true)}>
          Terms of Purchase
        </Text>
        .
      </Text>

      <Modal
        visible={textVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setTextVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTextVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Terms of Purchase</Text>
              <TouchableOpacity onPress={() => setTextVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.termsText}>
                {text || 'Terms of Purchase are not available right now. Please try again later.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    // Clears the agreement row the fixed checkout bar adds above Place Order.
    paddingBottom: 56,
  },
  image: {
    width: '100%',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  agreementText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#393D40',
  },
  link: {
    color: '#2E7D32',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE7',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    color: '#6B777B',
  },
  sheetBody: {
    padding: 20,
  },
  termsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#393D40',
  },
});
