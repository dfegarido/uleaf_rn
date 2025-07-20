import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';

const ScreenPrivacy = () => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.mainContent, {paddingTop: insets.top}]}>
      <View style={styles.mainContainer}>
        <Text style={[globalStyles.textXLGreyDark, {paddingBottom: 10}]}>
          ILEAFU Privacy Policy
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          Effective Date: May 2025
          {'\n'}
          ILEAFU (Imports Live Exotic Asian Foliage USA) respects your privacy.
          This Privacy Policy explains how we collect, use, store, and protect
          your personal information when you use our website and services.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          1. Information We Collect
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} Personal information such as name, address, email, and
          phone number.
          {'\n'}
          {'\u2022'} Business details for suppliers (e.g., garden name, shipping
          location).
          {'\n'}
          {'\u2022'} Order and payment details.
          {'\n'}
          {'\u2022'} Usage data including device, IP address, and browser
          information.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          2. How We Use Your Information
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} To process orders and payments.
          {'\n'}
          {'\u2022'} To manage your account and supplier activities.
          {'\n'}
          {'\u2022'} To communicate updates, support, or policy changes.
          {'\n'}
          {'\u2022'} To improve platform services and user experience.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          3. Data Sharing
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} We do not sell or rent your personal data.
          {'\n'}
          {'\u2022'} Your data may be shared with service providers for payment
          processing, logistics, and platform maintenance.
          {'\n'}
          {'\u2022'} We may disclose data if required by law or for legal
          processes.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          4. Data Security
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We implement appropriate technical and organizational measures to
          secure your data. However, no platform can guarantee complete data
          security.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          5. Cookies & Tracking
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We use cookies and similar technologies to enhance user experience,
          analyze site usage, and improve services.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          6. User Rights
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          {'\u2022'} You may request access to or correction of your data.
          {'\n'}
          {'\u2022'} You may request deletion of your data, subject to
          operational or legal retention requirements
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          7. Third-Party Services
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          Our platform may link to or integrate with services (e.g., Stripe,
          shipping partners) that have their own privacy practices. We are not
          responsible for their policies.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          8. Data Retention
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We retain your information as long as your account is active or as
          needed to fulfill our business or legal obligations.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          9. Changes to This Policy
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          We may update this Privacy Policy. You will be notified of significant
          changes through the platform or via email.
        </Text>

        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          10. Contact Us
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          If you have any questions or concerns, please contact us at:
          ileafuasiausa@gmail.com
        </Text>

        <Text style={[globalStyles.textSMGreyLight, {paddingBottom: 10}]}>
          By using ILEAFU, you acknowledge that you have read and agree to this
          Privacy Policy.
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

export default ScreenPrivacy;
