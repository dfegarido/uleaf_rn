import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import {AuthContext} from '../../../auth/AuthProvider';
import Svg, {Path} from 'react-native-svg';

// Import icons (you'll need to add these to your assets)
import ProfileIcon from '../../../assets/icons/greydark/profile.svg';
import PasswordIcon from '../../../assets/icons/greydark/lock-key-regular.svg';
import ReportIcon from '../../../assets/icons/greydark/question-regular.svg';
import ChatIcon from '../../../assets/icons/greydark/chat-circle-dots-regular.svg';
import EnvelopeIcon from '../../../assets/icons/greydark/envelope.svg';
import RightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';

// Custom Leaf Icon Component
const LeafIcon = ({width = 24, height = 24, fill = "white"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M20.9475 3.75656C20.9367 3.57308 20.859 3.39992 20.7291 3.26996C20.5991 3.14 20.4259 3.06228 20.2425 3.05156C13.1053 2.6325 7.3884 4.78125 4.9509 8.8125C4.10599 10.1915 3.68964 11.7903 3.75465 13.4063C3.79708 14.4396 4.00733 15.4592 4.37715 16.425C4.39888 16.4844 4.4353 16.5374 4.48302 16.579C4.53074 16.6206 4.5882 16.6494 4.65006 16.6628C4.71191 16.6761 4.77615 16.6737 4.83679 16.6555C4.89742 16.6374 4.95248 16.6042 4.99684 16.5591L12.9656 8.46844C13.0353 8.39876 13.118 8.34348 13.209 8.30577C13.3001 8.26806 13.3977 8.24865 13.4962 8.24865C13.5948 8.24865 13.6923 8.26806 13.7834 8.30577C13.8744 8.34348 13.9572 8.39876 14.0268 8.46844C14.0965 8.53812 14.1518 8.62085 14.1895 8.71189C14.2272 8.80294 14.2466 8.90052 14.2466 8.99906C14.2466 9.09761 14.2272 9.19519 14.1895 9.28624C14.1518 9.37728 14.0965 9.46001 14.0268 9.52969L5.3184 18.3694L3.98809 19.6997C3.84973 19.8344 3.76714 20.0162 3.75672 20.209C3.74629 20.4018 3.80881 20.5915 3.93184 20.7403C3.99921 20.8183 4.08195 20.8816 4.17488 20.9262C4.26781 20.9709 4.36894 20.9958 4.47196 20.9996C4.57498 21.0034 4.67767 20.9859 4.77362 20.9482C4.86958 20.9106 4.95673 20.8535 5.02965 20.7806L6.60371 19.2066C7.92934 19.8478 9.26715 20.1975 10.5937 20.2444C10.6981 20.2481 10.8021 20.25 10.9059 20.25C12.4166 20.2539 13.8986 19.8378 15.1865 19.0481C19.2178 16.6106 21.3675 10.8947 20.9475 3.75656Z" 
      fill={fill}
    />
  </Svg>
);

// Component definitions outside of render
const CreditCard = ({title, value, color, hasArrow = false, icon, isPlantCredits = false}) => (
  <View style={[styles.creditCard]}>
    <View style={[styles.iconActionRow, isPlantCredits && styles.plantCreditsIconRow]}>
      <View style={[
        styles.iconContainer, 
        {backgroundColor: color},
        isPlantCredits && styles.plantCreditsIconContainer
      ]}>
        {icon && icon}
        <Text style={[styles.creditValue, isPlantCredits && styles.plantCreditValue]}>{value}</Text>
      </View>
      {hasArrow && (
        <View style={[styles.arrowContainer, isPlantCredits && styles.plantCreditsArrowContainer]}>
          <RightIcon width={24} height={24} fill="#7F8D91" />
        </View>
      )}
    </View>
    <Text style={[styles.creditLabel, isPlantCredits && styles.plantCreditsLabel]}>{title}</Text>
  </View>
);

const MenuItem = ({icon, title, rightText, onPress}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuTitle}>{title}</Text>
    </View>
    <View style={styles.menuRight}>
      {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
      <RightIcon width={24} height={24} fill="#556065" />
    </View>
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const BuyerProfileScreen = ({navigation}) => {
  const {logout} = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.nameSection}>
            <View style={styles.avatarContainer}>
              <AvatarIcon width={56} height={56} />
            </View>
            <View style={styles.information}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>Olla Holic</Text>
              </View>
              <Text style={styles.usernameText}>@olla</Text>
            </View>
          </View>
        </View>

        {/* Credit Cards Scroll */}
        <View style={styles.scrollContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creditScrollContainer}>
            <CreditCard
              title="My Leaf Points"
              value="120"
              color="#539461"
              icon={<LeafIcon width={24} height={24} fill="#FFFFFF" />}
            />
            <CreditCard
              title="My Plant Credits"
              value="120"
              color="#6B4EFF"
              hasArrow
              icon={<Text style={styles.creditIcon}>💰</Text>}
              isPlantCredits={true}
            />
            <CreditCard
              title="My Shipping Credits"
              value="120"
              color="#48A7F8"
              hasArrow
              icon={<Text style={styles.creditIcon}>🎁</Text>}
            />
          </ScrollView>
        </View>

        {/* Shipping Buddies */}
        <View style={styles.shippingBuddiesContainer}>
          <View style={styles.shippingBuddiesCard}>
            <View style={styles.buddiesContent}>
              <Text style={styles.buddiesTitle}>My Shipping Buddies</Text>
              <View style={styles.requestsRow}>
                <Text style={styles.requestsText}>Joiner request(s)</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              </View>
            </View>
            <View style={styles.highFiveIcon}>
              {/* High five illustration placeholder */}
              <View style={styles.highFivePlaceholder}>
                <Text style={styles.highFiveEmoji}>🙏</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Account Information"
            onPress={() => {}}
          />

          <MenuItem
            icon={<EnvelopeIcon width={24} height={24} fill="#556065" />}
            title="My Address Book"
            onPress={() => {}}
          />

          <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="Venmo"
            rightText="****1234"
            onPress={() => {}}
          />

          <MenuItem
            icon={<PasswordIcon width={24} height={24} fill="#556065" />}
            title="Password"
            onPress={() => {}}
          />
        </View>

        <Divider />

        {/* Leafy Activities Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Leafy Activities</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="My Orders"
            onPress={() => {}}
          />

          <MenuItem
            icon={<EnvelopeIcon width={24} height={24} fill="#556065" />}
            title="Invite Friends"
            onPress={() => {}}
          />

          <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="My Wishlist"
            onPress={() => {}}
          />
        </View>

        <Divider />

        {/* Support Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>

          <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="Report a Problem"
            onPress={() => {}}
          />

          <MenuItem
            icon={<ChatIcon width={24} height={24} fill="#556065" />}
            title="Chat with Us"
            onPress={() => {}}
          />
        </View>

        <Divider />

        {/* Legal Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Terms of Use"
            onPress={() => {}}
          />

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#DFECDF',
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    height: 96, 
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 6,
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  profileSection: {
    backgroundColor: '#DFECDF',
    paddingHorizontal: 24,
    paddingVertical: 4,
    paddingBottom: 24,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    height: 58,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  information: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 32,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: '#202325',
    fontFamily: 'Inter',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  creditScrollContainer: {
    paddingHorizontal: 24,
    gap: 15,
  },
  creditCard: {
    width: 200,
    height: 114,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    gap: 16,
  },
  iconActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 40,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    borderRadius: 1000,
    width: 93,
    height: 40,
    gap: 8,
    flex: 0,
  },
  creditValue: {
    width: 33,
    height: 24,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  creditLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 168,
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingBuddiesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  shippingBuddiesCard: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    height: 112,
  },
  buddiesContent: {
    flex: 1,
    gap: 12,
  },
  buddiesTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#202325',
    fontFamily: 'Inter',
  },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestsText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
  },
  notificationBadge: {
    backgroundColor: '#E7522F',
    borderRadius: 1000,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  highFiveIcon: {
    width: 80,
    height: 80,
  },
  highFivePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#FFDFCF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highFiveEmoji: {
    fontSize: 32,
  },
  settingsSection: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#202325',
    fontFamily: 'Inter',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#393D40',
    fontFamily: 'Inter',
  },
  menuRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
    gap: 8,
  },
  menuRightText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
    textAlign: 'right',
    // Removed flex: 1 to prevent layout issues
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoutButton: {
    backgroundColor: '#E4E7E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  creditIcon: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  // Plant Credits specific styles
  plantCreditsIconRow: {
    width: 168,
    height: 40,
    alignSelf: 'stretch',
  },
  plantCreditsIconContainer: {
    width: 97,
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    gap: 8,
  },
  plantCreditValue: {
    width: 37,
    height: 24,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  plantCreditsArrowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 59,
    height: 24,
    flex: 1,
  },
  plantCreditsLabel: {
    width: 168,
    height: 22,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22, // 140% of 16px = 22.4px, rounded to 22
    color: '#202325',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
  },
});

export default BuyerProfileScreen;
