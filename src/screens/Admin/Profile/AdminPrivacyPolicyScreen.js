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

const AdminPrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  const privacyData = [
    {
      title: "Privacy Policy for Admin Users",
      content: "This privacy policy explains how ILEAFU collects, uses, and protects information related to admin users and their activities on our platform."
    },
    {
      subtitle: "1. Information We Collect from Admin Users",
      content: "Personal Information: Name, email address, role, department, and contact details.\nAuthentication Data: Login credentials, session tokens, and security logs.\nActivity Logs: All administrative actions, timestamps, IP addresses, and system interactions.\nDevice Information: Browser type, operating system, and device identifiers used for admin access."
    },
    {
      subtitle: "2. How We Use Admin Information",
      content: "To provide and maintain admin access to platform functions.\nTo monitor system security and detect unauthorized activities.\nTo comply with audit requirements and regulatory obligations.\nTo improve admin tools and platform security measures.\nTo communicate important system updates and security notifications."
    },
    {
      subtitle: "3. Admin Data Sharing and Access",
      content: "Admin information is shared only with authorized personnel on a need-to-know basis.\nData may be disclosed to comply with legal obligations or law enforcement requests.\nThird-party service providers may access admin data for security monitoring and system maintenance.\nAll data sharing follows strict confidentiality agreements and security protocols."
    },
    {
      subtitle: "4. Admin Data Security",
      content: "We implement multi-factor authentication and encryption for all admin accounts.\nAdmin activities are continuously monitored for suspicious behavior.\nRegular security audits and penetration testing are conducted.\nData is stored in secure, access-controlled environments with backup and recovery procedures."
    },
    {
      subtitle: "5. Admin Activity Monitoring",
      content: "All admin actions are logged with detailed timestamps and context.\nAccess to sensitive data and system functions is tracked and auditable.\nAbnormal usage patterns trigger automated security alerts.\nLogs are retained for compliance and security investigation purposes."
    },
    {
      subtitle: "6. Admin Rights and Responsibilities",
      content: "You have the right to review your admin activity logs upon request.\nYou must promptly report any suspected security incidents or data breaches.\nYou are responsible for maintaining the confidentiality of your admin credentials.\nYou must comply with all data handling and privacy policies."
    },
    {
      subtitle: "7. Data Retention for Admin Users",
      content: "Admin account information is retained throughout your employment or role tenure.\nActivity logs are retained for a minimum of 7 years for compliance purposes.\nUpon termination, personal admin data is anonymized or deleted within 90 days.\nSecurity logs may be retained longer as required by law or security policies."
    },
    {
      subtitle: "8. Third-Party Admin Tools",
      content: "We may use third-party security tools to monitor admin activities.\nThese tools are subject to strict data processing agreements.\nAdmin users consent to monitoring by approved security and audit tools.\nWe are not responsible for the privacy practices of unauthorized third-party tools."
    },
    {
      subtitle: "9. Changes to Admin Privacy Policy",
      content: "We may update this policy to reflect changes in security practices or legal requirements.\nAdmin users will be notified of significant changes via email or system notifications.\nContinued use of admin functions constitutes acceptance of policy updates."
    },
    {
      subtitle: "10. Contact Information",
      content: "For questions about admin privacy practices or to report security concerns, contact:\nEmail: security@ileafu.com\nPhone: [Security Hotline]\nAddress: [Admin Security Office Address]"
    },
    {
      subtitle: "11. Compliance",
      content: "This policy complies with applicable privacy laws including GDPR, CCPA, and industry security standards.\nAdmin users acknowledge understanding of their privacy rights and data handling responsibilities."
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

export default AdminPrivacyPolicyScreen;
