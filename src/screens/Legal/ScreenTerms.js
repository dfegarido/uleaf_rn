import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';

const ScreenTerms = () => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.mainContent, {paddingTop: insets.top}]}>
      <View style={styles.mainContainer}>
        <Text style={[globalStyles.textXLGreyDark, {paddingBottom: 10}]}>
          ILEAFU Terms of Use
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          Welcome to ILEAFU (Imports Live Exotic Asian Foliage USA). By
          accessing or using our platform, you agree to comply with the
          following Terms of Use. These terms govern your use of the ILEAFU
          website and services, and form a binding agreement between you and
          ILEAFU.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          1. Platform Purpose ILEAFU is a U.S.
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU is a U.S.-based company with operational hubs in Asia,
          primarily Thailand. We provide a worry-free, scam-free plant importing
          service connecting collectors and sellers from Asia to buyers in the
          United States.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          2. User Eligibility
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} You must be at least 18 years old to use this platform.
          {'\n'}
          {'\u2022'} You agree to provide accurate, current, and complete
          information during registration.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          3. Account Responsibility
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} You are responsible for maintaining the confidentiality of
          your login credentials.
          {'\n'}
          {'\u2022'} Any activity under your account will be considered your
          responsibility.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          4. Prohibited Conduct
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} You may not use the platform for unlawful, fraudulent, or
          unauthorized purposes.
          {'\n'}
          {'\u2022'} Impersonating others or misrepresenting affiliations is
          prohibited.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          5. Intellectual Property
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          All content on ILEAFU including logos, graphics, and text is the
          property of ILEAFU and protected under intellectual property laws. You
          may not reproduce or distribute content without permission.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          6. Product Listings and Transactions
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} Listings must be accurate and reflect actual items
          available.
          {'\n'}
          {'\u2022'} ILEAFU reserves the right to remove listings that violate
          our policies.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          7. Privacy and Data Handling
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We collect data necessary for transaction processing and platform
          operations. By using ILEAFU, you consent to the collection and
          appropriate use of your data. Data will not be sold or misused.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          8. Dispute Resolution
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          Any disputes between suppliers and ILEAFU will be resolved through
          direct negotiation. If unresolved, both parties agree to binding
          arbitration under U.S. law.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          9. User-Generated Content
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          By uploading photos, descriptions, or other content, you grant ILEAFU
          a non-exclusive, royalty-free license to use such content for
          promotional and operational purposes.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          10. Force Majeure
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU is not liable for delays or failures caused by events beyond
          our control, such as natural disasters, strikes, or transportation
          disruptions.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          11. Third-Party Services
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          Certain services on ILEAFU are powered by third-party providers. Use
          of those services is subject to their own terms and privacy policies.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          12. Platform Modifications
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU reserves the right to modify or discontinue services at any
          time without prior notice.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          13. Termination
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We may suspend or terminate access to your account for violations of
          these Terms or any misuse of the platform.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          14. Disclaimer
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU provides the platform 'as is' and makes no warranties regarding
          reliability or accuracy of the services.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          15. Limitation of Liability
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU is not liable for indirect or consequential damages arising
          from the use of the platform.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          16. Amendments to Terms
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          ILEAFU may update or change these Terms at any time. Continued use of
          the platform after such changes indicates your acceptance of the
          updated terms.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          17. Governing Law
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          These Terms are governed by the laws of the United States and
          applicable international agreements.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          18. Contact
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          For questions or concerns, please contact us at
          ileafuasiausa@gmail.com
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          By using the ILEAFU platform, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Use.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});

export default ScreenTerms;
