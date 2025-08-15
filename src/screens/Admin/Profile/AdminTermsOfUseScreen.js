import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const AdminTermsOfUseScreen = () => {
  const navigation = useNavigation();

  const termsData = [
    {
      title: "Terms of Use for Admin Users",
      content: "These terms govern your access to and use of the ILEAFU administrative platform and services."
    },
    {
      subtitle: "1. Admin Platform Overview",
      content: "ILEAFU is a U.S.-based company with operational hubs in Asia, primarily Thailand. As an admin user, you have privileged access to manage platform operations, user accounts, and system configurations."
    },
    {
      subtitle: "2. Admin Eligibility",
      content: "Admin access is restricted to authorized personnel only.\nYou must maintain the confidentiality of your admin credentials and use them responsibly.\nAdmin privileges may be revoked at any time for policy violations."
    },
    {
      subtitle: "3. Admin Responsibilities",
      content: "You are responsible for maintaining the security and integrity of the platform.\nAll administrative actions must comply with company policies and applicable laws.\nYou must report any security incidents or policy violations immediately."
    },
    {
      subtitle: "4. Prohibited Admin Conduct",
      content: "Unauthorized access to user data beyond what is necessary for your role.\nSharing admin credentials or allowing unauthorized access to admin functions.\nUsing admin privileges for personal gain or purposes outside your designated role."
    },
    {
      subtitle: "5. Data Handling and Privacy",
      content: "Admin users have access to sensitive user data and must handle it in accordance with privacy laws and company policies.\nData must only be accessed when necessary for legitimate administrative purposes.\nAll data handling must comply with GDPR, CCPA, and other applicable privacy regulations."
    },
    {
      subtitle: "6. System Integrity",
      content: "Admin users must not compromise system security or stability.\nAll system modifications must follow established change management procedures.\nBackup and disaster recovery procedures must be followed as outlined in company policies."
    },
    {
      subtitle: "7. Audit and Compliance",
      content: "All admin activities are logged and subject to audit.\nYou consent to monitoring of your admin activities for security and compliance purposes.\nYou must cooperate with internal and external audits as required."
    },
    {
      subtitle: "8. Termination of Admin Access",
      content: "Admin access may be terminated immediately upon violation of these terms.\nUpon termination of employment or role change, all admin access will be revoked.\nYou must return all company property and maintain confidentiality of information accessed during your admin tenure."
    },
    {
      subtitle: "9. Limitation of Liability",
      content: "The company provides admin access 'as is' without warranties.\nAdmin users assume responsibility for their actions and any consequences thereof.\nThe company's liability is limited to the maximum extent permitted by law."
    },
    {
      subtitle: "10. Agreement",
      content: "By accessing admin functions, you acknowledge that you have read, understood, and agree to be bound by these terms.\nThese terms may be updated periodically, and continued use constitutes acceptance of any changes."
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  copySection: {
    marginBottom: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
    lineHeight: 28,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#393D40',
    marginBottom: 8,
    lineHeight: 24,
  },
  contentText: {
    fontSize: 14,
    color: '#556065',
    lineHeight: 20,
  },
});

export default AdminTermsOfUseScreen;
