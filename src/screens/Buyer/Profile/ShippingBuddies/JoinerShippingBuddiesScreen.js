import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LeftIcon from '../../../../assets/icons/greylight/caret-left-regular.svg';
import { useShippingBuddiesController } from './controllers/ShippingBuddiesController';
import BuddyDetails from './components/BuddyDetails';
import EmptyState from './components/EmptyState';
import UserSearchModal from './components/UserSearchModal';
import ErrorModal from './components/ErrorModal';
import CancelRequestModal from './components/CancelRequestModal';
import Toast from '../../../../components/Toast/Toast';
import styles from './components/styles/JoinerShippingBuddiesStyles';

/**
 * JoinerShippingBuddiesScreen - Screen for joiners to manage their receiver request
 */
const JoinerShippingBuddiesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    myReceiverRequest,
    loadingMyRequest,
    handleCancelRequest,
    formatExpirationDate,
    formatFlightDate,
    users,
    loadingUsers,
    searchText,
    setSearchText,
    fetchUsers,
    handleSubmitReceiverRequest,
    toastVisible,
    toastMessage,
    toastType,
    setToastVisible,
    errorModalVisible,
    errorModalMessage,
    setErrorModalVisible,
    cancelRequestModalVisible,
    setCancelRequestModalVisible,
    handleConfirmCancelRequest,
  } = useShippingBuddiesController();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [receiverUsername, setReceiverUsername] = React.useState('');
  const [selectedReceiverId, setSelectedReceiverId] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Fetch users when modal opens
  React.useEffect(() => {
    if (modalVisible) {
      fetchUsers('');
    }
  }, [modalVisible]);

  // Search users when search text changes (with debounce)
  React.useEffect(() => {
    if (modalVisible && searchText !== undefined) {
      const debounceTimeout = setTimeout(() => {
        fetchUsers(searchText);
      }, 500);

      return () => clearTimeout(debounceTimeout);
    }
  }, [searchText, modalVisible]);

  const handleSelectUser = (user) => {
    const actualUsername = user.username && user.username.trim()
      ? user.username.trim()
      : (user.email ? user.email.split('@')[0] : '');

    const displayUsername = actualUsername ? `@${actualUsername}` : '';

    setReceiverUsername(displayUsername);
    setSelectedReceiverId(user.id);
    setModalVisible(false);
    setSearchText('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await handleSubmitReceiverRequest(receiverUsername, selectedReceiverId);
    setSubmitting(false);
    if (result.success) {
      setReceiverUsername('');
      setSelectedReceiverId(null);
    }
  };

  const getInitials = (receiver) => {
    const first = receiver?.firstName?.[0] || '';
    const last = receiver?.lastName?.[0] || '';
    const username = receiver?.username?.[0] || '';
    return (first + last || username || 'U').toUpperCase();
  };

  const getDisplayName = (receiver) => {
    if (!receiver) return 'Unknown User';
    const fullName = `${receiver.firstName || ''} ${receiver.lastName || ''}`.trim();
    return fullName || 'Unknown User';
  };

  // Reset image error when receiver request changes
  React.useEffect(() => {
    setImageError(false);
    if (myReceiverRequest?.receiver) {
      console.log('[JoinerShippingBuddies] Receiver data:', {
        uid: myReceiverRequest.receiver.uid,
        firstName: myReceiverRequest.receiver.firstName,
        lastName: myReceiverRequest.receiver.lastName,
        username: myReceiverRequest.receiver.username,
        profileImage: myReceiverRequest.receiver.profileImage,
      });
    }
  }, [myReceiverRequest]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shipping Buddies</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>
        {loadingMyRequest ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
          </View>
        ) : myReceiverRequest ? (
          // Requester View (User is a joiner)
          <View style={styles.requesterContainer}>
            {/* Buddy Card */}
            <View style={styles.buddyCard}>
              {/* Avatar */}
              <View style={styles.buddyAvatar}>
                {myReceiverRequest.receiver?.profileImage && !imageError ? (
                  <Image
                    source={{ uri: myReceiverRequest.receiver.profileImage }}
                    style={styles.buddyAvatarImage}
                    resizeMode="cover"
                    onError={(error) => {
                      // If image fails to load, show initials as fallback
                      console.log('[JoinerShippingBuddies] Failed to load receiver profile image:', {
                        url: myReceiverRequest.receiver.profileImage,
                        error: error.nativeEvent.error
                      });
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('[JoinerShippingBuddies] Successfully loaded receiver profile image');
                    }}
                  />
                ) : (
                  <View style={styles.buddyAvatarPlaceholder}>
                    <Text style={styles.buddyAvatarText}>
                      {getInitials(myReceiverRequest.receiver)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.buddyDetails}>
                <Text style={styles.buddyName} numberOfLines={2} ellipsizeMode="tail">
                  {getDisplayName(myReceiverRequest.receiver)}
                </Text>
                <Text style={styles.buddyUsername} numberOfLines={1} ellipsizeMode="tail">
                  @{myReceiverRequest.receiver?.username || 'unknown'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>

            {myReceiverRequest.status === 'approved' || myReceiverRequest.status === 'pending_cancel' ? (
              // Approved View - Show Details
              <BuddyDetails
                buddyRequest={myReceiverRequest}
                formatExpirationDate={formatExpirationDate}
                formatFlightDate={formatFlightDate}
                onCancelRequest={handleCancelRequest}
              />
            ) : (
              // Pending View - Show Status and Cancel Button
              <>
                {/* Status */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>
                    Request sent, waiting for approval
                  </Text>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelRequest}
                    activeOpacity={0.8}>
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : (
          // Empty State - No receiver request
          <>
            <EmptyState
              receiverUsername={receiverUsername}
              onUsernamePress={() => setModalVisible(true)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
            {/* Note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Note: You may request a receiver only when there are no existing joiners.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* User Search Modal */}
      <UserSearchModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSearchText('');
        }}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        users={users}
        loading={loadingUsers}
        onSelectUser={handleSelectUser}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      {/* Cancel Request Modal */}
      <CancelRequestModal
        visible={cancelRequestModalVisible}
        onConfirm={handleConfirmCancelRequest}
        onCancel={() => setCancelRequestModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default JoinerShippingBuddiesScreen;

