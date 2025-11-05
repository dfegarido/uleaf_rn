import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LeftIcon from '../../../../assets/icons/greylight/caret-left-regular.svg';
import { useShippingBuddiesController } from './controllers/ShippingBuddiesController';
import JoinerList from './components/JoinerList';
import EmptyState from './components/EmptyState';
import UserSearchModal from './components/UserSearchModal';
import Toast from '../../../../components/Toast/Toast';
import styles from './components/styles/ReceiverShippingBuddiesStyles';

/**
 * ReceiverShippingBuddiesScreen - Screen for receivers to manage their joiners
 */
const ReceiverShippingBuddiesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    joiners,
    loadingJoiners,
    handleApproveReject,
    formatExpirationDate,
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
  } = useShippingBuddiesController();

  const [modalVisible, setModalVisible] = useState(false);
  const [receiverUsername, setReceiverUsername] = useState('');
  const [selectedReceiverId, setSelectedReceiverId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchUsers('');
    }
  }, [modalVisible]);

  // Search users when search text changes (with debounce)
  useEffect(() => {
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
    const result = await handleSubmitReceiverRequest(receiverUsername, selectedReceiverId);
    if (result.success) {
      setReceiverUsername('');
      setSelectedReceiverId(null);
    }
  };

  const handleApprove = (requestId) => {
    handleApproveReject(requestId, 'approve');
  };

  const handleReject = (requestId) => {
    handleApproveReject(requestId, 'reject');
  };

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
        {loadingJoiners ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
          </View>
        ) : joiners && joiners.length > 0 ? (
          <JoinerList
            joiners={joiners}
            loading={loadingJoiners}
            onApprove={handleApprove}
            onReject={handleReject}
            formatExpirationDate={formatExpirationDate}
          />
        ) : (
          <EmptyState
            receiverUsername={receiverUsername}
            onUsernamePress={() => setModalVisible(true)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
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
    </SafeAreaView>
  );
};

export default ReceiverShippingBuddiesScreen;

