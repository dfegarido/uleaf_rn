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

const TermsOfUseScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const termsData = [
    {
      title: "ILEAFU Terms of Use",
      content: "Welcome to ILEAFU (Imports Live Exotic Asian Foliage USA). By accessing or using our platform, you agree to comply with the following Terms of Use. These terms govern your use of the ILEAFU website and services, and form a binding agreement between you and ILEAFU."
    },
    {
      subtitle: "1. Platform Purpose ILEAFU is a U.S.",
      content: "ILEAFU is a U.S.-based company with operational hubs in Asia, primarily Thailand. We provide a worry-free, scam-free plant importing service connecting collectors and sellers from Asia to buyers in the United States."
    },
    {
      subtitle: "2. User Eligibility",
      content: "You must be at least 18 years old to use this platform.\nYou agree to provide accurate, current, and complete information during registration."
    },
    {
      subtitle: "3. Account Responsibility",
      content: "You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account will be considered your responsibility."
    },
    {
      subtitle: "4. Prohibited Conduct",
      content: "You may not use the platform for unlawful, fraudulent, or unauthorized purposes. Impersonating others or misrepresenting affiliations is prohibited."
    },
    {
      subtitle: "5. Intellectual Property",
      content: "All content on ILEAFU including logos, graphics, and text is the property of ILEAFU and protected under intellectual property laws. You may not reproduce or distribute content without permission."
    },
    {
      subtitle: "6. Product Listings and Transactions",
      content: "Listings must be accurate and reflect actual items available. ILEAFU reserves the right to remove listings that violate our policies."
    },
    {
      subtitle: "7. Privacy and Data Handling",
      content: "We collect data necessary for transaction processing and platform operations. By using ILEAFU, you consent to the collection and appropriate use of your data. Data will not be sold or misused."
    },
    {
      subtitle: "8. Dispute Resolution",
      content: "Any disputes between suppliers and ILEAFU will be resolved through direct negotiation. If unresolved, both parties agree to binding arbitration under U.S. law."
    },
    {
      subtitle: "9. User-Generated Content",
      content: "By uploading photos, descriptions, or other content, you grant ILEAFU a non-exclusive, royalty-free license to use such content for promotional and operational purposes."
    },
    {
      subtitle: "10. Force Majeure",
      content: "ILEAFU is not liable for delays or failures caused by events beyond our control, such as natural disasters, strikes, or transportation disruptions."
    },
    {
      subtitle: "11. Third-Party Services",
      content: "Certain services on ILEAFU are powered by third-party providers. Use of those services is subject to their own terms and privacy policies."
    },
    {
      subtitle: "12. Platform Modification",
      content: "ILEAFU reserves the right to modify or discontinue services at any time without prior notice."
    },
    {
      subtitle: "13. Termination",
      content: "We may suspend or terminate access to your account for violations of these Terms or any misuse of the platform."
    },
    {
      subtitle: "14. Disclaimer",
      content: "ILEAFU provides the platform 'as is' and makes no warranties regarding reliability or accuracy of the services."
    },
    {
      subtitle: "15. Limitation of Liability",
      content: "ILEAFU is not liable for indirect or consequential damages arising from the use of the platform."
    },
    {
      subtitle: "16. Amendments to Terms",
      content: "ILEAFU may update or change these Terms at any time. Continued use of the platform after such changes indicates your acceptance of the updated terms."
    },
    {
      subtitle: "17. Governing Law",
      content: "These Terms are governed by the laws of the United States and applicable international agreements."
    },
    {
      subtitle: "18. Contact",
      content: "For questions or concerns, please contact us at ileafuasiausa@gmail.com"
    },
    {
      content: "By using the ILEAFU platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use."
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
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {termsData.map((item, index) => (
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

export default TermsOfUseScreen;
