import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const privacyData = [
    {
      title: "Privacy Policy",
      content: "Effective Date: May 2025\n\nILEAFU (Imports Live Exotic Asian Foliage USA) respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services."
    },
    {
      subtitle: "1. Information We Collect",
      content: "Personal information such as name, address, email, and phone number.\nBusiness details for suppliers (e.g., garden name, shipping location).\nOrder and payment details.\nUsage data including device, IP address, and browser information."
    },
    {
      subtitle: "2. How We Use Your Information",
      content: "To process orders and payments.\nTo manage your account and supplier activities.\nTo communicate updates, support, or policy changes.\nTo improve platform services and user experience."
    },
    {
      subtitle: "3. Data Sharing",
      content: "We do not sell or rent your personal data.\nYour data may be shared with service providers for payment processing, logistics, and platform maintenance.\nWe may disclose data if required by law or for legal processes."
    },
    {
      subtitle: "4. Data Security",
      content: "We implement appropriate technical and organizational measures to secure your data.\nHowever, no platform can guarantee complete data security."
    },
    {
      subtitle: "5. Cookies and Tracking",
      content: "We use cookies and similar technologies to enhance user experience, analyze site usage, and improve services."
    },
    {
      subtitle: "6. User Rights",
      content: "You may request access to or correction of your data.\nYou may request deletion of your data, subject to operational or legal retention requirements"
    },
    {
      subtitle: "7. Third-Party Services",
      content: "Our platform may link to or integrate with services (e.g., Stripe, shipping partners) that have their own privacy practices.\nWe are not responsible for their policies."
    },
    {
      subtitle: "8. Data Retention",
      content: "We retain your information as long as your account is active or as needed to fulfill our business or legal obligations."
    },
    {
      subtitle: "9. Changes to This Policy",
      content: "We may update this Privacy Policy.\nYou will be notified of significant changes through the platform or via email."
    },
    {
      subtitle: "10. Contact Us",
      content: "If you have any questions or concerns, please contact us at: ileafuasiausa@gmail.com"
    },
    {
      content: "By using ILEAFU, you acknowledge that you have read and agree to this Privacy Policy."
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {privacyData.map((item, index) => (
          <View key={index} style={styles.copySection}>
            {item.title && (
              <View style={styles.titleSection}>
                <Text style={styles.titleText}>{item.title}</Text>
              </View>
            )}
            {item.subtitle && (
              <Text style={styles.subtitleText}>{item.subtitle}</Text>
            )}
            <Text style={styles.contentText}>{item.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: 100,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  copySection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
  },
  titleSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 12,
    width: '100%',
  },
  titleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#202325',
    width: '100%',
  },
  subtitleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
    width: '100%',
  },
  contentText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
    width: '100%',
  },
});

export default PrivacyPolicyScreen;
