import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const GuideModal = ({ isVisible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <BackSolidIcon width={24} height={24} color="#393D40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Guidelines</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.lastUpdatedText}>Last updated May 2, 2025</Text>
            <Text style={styles.bodyText}>LIVE ARRIVAL GUARANTEE REQUIREMENTS </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>Winner shipping buyer must
              purchase upgrade shipping Next Day, 2 days air with insulation and
              heat pack.</Text>
            </View>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>Our standard shipping 3 days selected (not
              guaranteed.)</Text>
            </View>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>We are not responsible for delays, lost
              packages,damages.</Text>
            </View>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>All sales are final cancellation 25% charges.</Text>
            </View>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>Unbox video and photos required 1 hour after receive the package.</Text>
            </View>
          </View>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
          </View>
          <View style={styles.content}>
            <Text style={styles.bodyText}>NO REFUND,RETURN,EXCHANGE.</Text>
            <Text style={styles.bodyTextBottom}>
              While we encourage sellers to establish clear and detailed shop
              policies, it's important to ensure these policies align with
              ILeafU's platform policies and Terms and Conditions. 
            </Text>
            <Text style={styles.bodyTextBottom}>If there's ever a conflict between a seller's shop policies and
              ILeafU's platform policies, our platform's policies will be
              prioritized to maintain a fair and consistent experience for all
              users. </Text>
            <Text style={styles.bodyTextBottom}> For more details or assistance, please reach out to
              ILeafU's Customer Support team.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 28, // to balance the header
  },
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  lastUpdatedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#647276',
  },
  bodyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    color: '#393D40',
  },
  bodyTextBottom: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
    color: '#393D40',
    marginBottom: 10,
  },
  dividerContainer: {
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 0, // Space between bullet points
    alignItems: 'flex-start', // Align items to the top if text wraps
  },
  bulletSymbol: {
    fontSize: 16, // Adjust size as needed
    marginRight: 8, // Space between bullet and text
    lineHeight: 22, // Match lineHeight of bulletText for alignment
    color: '#333', // Adjust color as needed
  },
  bulletText: {
    flex: 1, // Allow text to wrap
    fontSize: 16, // Adjust size as needed
    lineHeight: 22, // Adjust line spacing as needed
    color: '#333', // Adjust color as needed
  },
});

export default GuideModal;
