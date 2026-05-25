import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { updateLiveRequestStatusApi } from '../../../components/Api/liveRequestApi';
import { updateLiveSessionStatusApi } from '../../../components/Api/agoraLiveApi';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import CalendarIcon from '../../../assets/admin-icons/calendar.svg';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import LiveCalendarModal from './LiveCalendarModal';

const LiveSetup = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedWeek: 0 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editPhoto, setEditPhoto] = useState(null);

  const scrollViewRef = useRef(null);

  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDisplayDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
  };

  const fetchLiveRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('📡 Fetching live stream requests...');

      const q = query(
        collection(db, 'liveRequests'),
        orderBy('requestedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const allRequests = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        allRequests.push({
          id: docSnap.id,
          ...data,
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : data.requestedAt,
          requestedDate: data.requestedDate?.toDate ? data.requestedDate.toDate() : data.requestedDate,
          reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate() : data.reviewedAt,
        });
      });

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const pending = allRequests.filter(r => r.status === 'pending').length;
      const approvedToday = allRequests.filter(r => {
        if (r.status !== 'approved' || !r.reviewedAt) return false;
        const reviewed = new Date(r.reviewedAt);
        reviewed.setHours(0, 0, 0, 0);
        return reviewed.getTime() === today.getTime();
      }).length;
      const rejectedWeek = allRequests.filter(r => {
        if (r.status !== 'rejected' || !r.reviewedAt) return false;
        const reviewed = new Date(r.reviewedAt);
        return reviewed >= weekAgo;
      }).length;

      setStats({ pending, approvedToday, rejectedWeek });
      setRequests(allRequests);
      setFilteredRequests(allRequests);
      console.log(`✅ Loaded ${allRequests.length} live requests`);
    } catch (error) {
      console.error('❌ Error fetching live requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLiveRequests(false);
    }, [fetchLiveRequests])
  );

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateKey = formatDateKey(date);
    const filtered = requests.filter(r => {
      if (!r.requestedDate) return false;
      return formatDateKey(r.requestedDate) === dateKey;
    });
    setFilteredRequests(filtered);
    console.log(`📅 Filtered to ${filtered.length} requests for ${dateKey}`);
  };

  const handleShowAll = () => {
    setFilteredRequests(requests);
    setSelectedDate(new Date());
  };

  const handleRequestPress = (request) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
    setRejectionReason('');
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedRequest(null);
    setRejectionReason('');
    setIsEditMode(false);
    setEditPhoto(null);
  };

  const handleStartEdit = () => {
    if (!selectedRequest) return;
    setEditTitle(selectedRequest.title || '');
    setEditDate(selectedRequest.requestedDate ? new Date(selectedRequest.requestedDate) : new Date());
    setEditPhoto(null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditPhoto(null);
  };

  const handleChoosePhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.5 },
      (response) => {
        if (response.didCancel) {
          console.log('Admin cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Could not select image. Please try again.');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setEditPhoto({
            uri: asset.uri,
            base64: `data:${asset.type};base64,${asset.base64}`,
            fileName: asset.fileName,
            type: asset.type,
          });
        }
      },
    );
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;
    if (!editTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title.');
      return;
    }

    setActionLoading(true);
    try {
      const requestRef = doc(db, 'liveRequests', selectedRequest.id);
      const updates = {
        title: editTitle.trim(),
        requestedDate: editDate,
      };

      if (editPhoto) {
        const { coverPhotoUrl, coverPhotoPath, ...restSessionData } = selectedRequest.sessionData || {};
        updates.sessionData = {
          ...restSessionData,
          coverPhoto: editPhoto.base64,
          filename: editPhoto.fileName,
          mimeType: editPhoto.type,
        };
      }

      await updateDoc(requestRef, updates);

      // If approved and has a live session, update the live doc too
      if (selectedRequest.status === 'approved' && selectedRequest.liveSessionId) {
        try {
          const liveRef = doc(db, 'live', selectedRequest.liveSessionId);
          const liveUpdates = {
            title: editTitle.trim(),
            scheduledAt: editDate,
          };
          await updateDoc(liveRef, liveUpdates);
        } catch (liveError) {
          console.error('Error updating live session:', liveError);
        }
      }

      // Optimistic update
      const updated = requests.map(r =>
        r.id === selectedRequest.id
          ? { ...r, title: editTitle.trim(), requestedDate: editDate, ...(editPhoto && { sessionData: updates.sessionData }) }
          : r
      );
      setRequests(updated);
      setFilteredRequests(prev => prev.map(r =>
        r.id === selectedRequest.id
          ? { ...r, title: editTitle.trim(), requestedDate: editDate, ...(editPhoto && { sessionData: updates.sessionData }) }
          : r
      ));
      setSelectedRequest(prev => ({ ...prev, title: editTitle.trim(), requestedDate: editDate, ...(editPhoto && { sessionData: updates.sessionData }) }));

      Alert.alert('Success', 'Request updated successfully.');
      setIsEditMode(false);
      setEditPhoto(null);
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);

      const response = await updateLiveRequestStatusApi({
        requestId: selectedRequest.id,
        status: 'approved',
      });

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to approve request');
      }

      // Workaround: ensure the created live session is marked as approved
      if (response.liveSessionId) {
        try {
          await updateLiveSessionStatusApi(response.liveSessionId, 'approved');
        } catch (statusErr) {
          console.warn('Failed to update live session status to approved:', statusErr.message);
        }
      }

      const now = new Date();

      // Optimistic update
      const updated = requests.map(r =>
        r.id === selectedRequest.id
          ? { ...r, status: 'approved', reviewedAt: now, reviewedBy: 'admin', ...(response.liveSessionId && { liveSessionId: response.liveSessionId }) }
          : r
      );
      setRequests(updated);
      setFilteredRequests(prev => prev.map(r =>
        r.id === selectedRequest.id
          ? { ...r, status: 'approved', reviewedAt: now, reviewedBy: 'admin', ...(response.liveSessionId && { liveSessionId: response.liveSessionId }) }
          : r
      ));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), approvedToday: prev.approvedToday + 1 }));

      Alert.alert('Approved', `Live request for ${selectedRequest.sellerName} has been approved.`);
      closeDetailModal();
    } catch (error) {
      console.error('❌ Error approving request:', error);
      Alert.alert('Error', error.message || 'Failed to approve request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = () => {
    if (!selectedRequest) return;
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    setRejectModalVisible(false);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for rejection.');
      return;
    }
    try {
      setActionLoading(true);

      const response = await updateLiveRequestStatusApi({
        requestId: selectedRequest.id,
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to reject request');
      }

      const now = new Date();

      // Optimistic update
      const updated = requests.map(r =>
        r.id === selectedRequest.id
          ? { ...r, status: 'rejected', reviewedAt: now, reviewedBy: 'admin', rejectionReason: rejectionReason.trim() }
          : r
      );
      setRequests(updated);
      setFilteredRequests(prev => prev.map(r =>
        r.id === selectedRequest.id
          ? { ...r, status: 'rejected', reviewedAt: now, reviewedBy: 'admin', rejectionReason: rejectionReason.trim() }
          : r
      ));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), rejectedWeek: prev.rejectedWeek + 1 }));

      setRejectModalVisible(false);
      setRejectionReason('');
      Alert.alert('Rejected', `Live request for ${selectedRequest.sellerName} has been rejected.`);
      closeDetailModal();
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      Alert.alert('Error', error.message || 'Failed to reject request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'approved':
        return { text: 'Approved', color: '#539461', bgColor: '#E9F7EF' };
      case 'rejected':
        return { text: 'Rejected', color: '#E7522F', bgColor: '#FDEDEC' };
      default:
        return { text: status, color: '#6B777B', bgColor: '#F5F6F6' };
    }
  };

  const getTypeBadge = (liveType) => {
    switch (liveType) {
      case 'live':
        return { text: 'Live', color: '#48A7F8', bgColor: '#EBF5FB' };
      case 'purge':
        return { text: 'Purge', color: '#9B59B6', bgColor: '#F5EEF8' };
      default:
        return { text: 'Live', color: '#48A7F8', bgColor: '#EBF5FB' };
    }
  };

  const renderRequestItem = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    const typeBadge = getTypeBadge(item.liveType);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => handleRequestPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeBadge.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>{typeBadge.text}</Text>
            </View>
          </View>
          <Text style={styles.requestDate}>{formatDisplayDate(item.requestedDate)}</Text>
        </View>

        <View style={styles.requestBody}>
          <Text style={styles.sellerName}>{item.sellerName || 'Unknown Seller'}</Text>
          <Text style={styles.sellerEmail}>{item.sellerEmail || '—'}</Text>
          <Text style={styles.requestTitle}>{item.title || 'Untitled Request'}</Text>
          <Text style={styles.requestTime}>{formatTime(item.requestedDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedRequest) return null;
    const statusBadge = getStatusBadge(selectedRequest.status);
    const typeBadge = getTypeBadge(selectedRequest.liveType);

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeDetailModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          {Platform.OS === 'android' && (
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          )}

          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
            <TouchableOpacity
              onPress={closeDetailModal}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <CloseIcon width={24} height={24} color="#202325" />
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Request' : 'Request Details'}</Text>
              <Text style={styles.modalSubtitle}>{selectedRequest.sellerName}</Text>
            </View>
            {!isEditMode && (
              <TouchableOpacity
                onPress={handleStartEdit}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
            {isEditMode && <View style={{ width: 40 }} />}
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            <View style={styles.detailSection}>
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
                  <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: typeBadge.bgColor }]}>
                  <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>{typeBadge.text}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Seller</Text>
              <Text style={styles.detailValue}>{selectedRequest.sellerName || '—'}</Text>
              <Text style={styles.detailValue}>{selectedRequest.sellerEmail || '—'}</Text>
            </View>

            {isEditMode ? (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Enter title..."
                    placeholderTextColor="#9AA4A8"
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Requested Date & Time</Text>
                  <Text style={[styles.detailValue, { color: '#202325' }]}>{editDate.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Cover Photo</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={handleChoosePhoto}>
                    {editPhoto ? (
                      <Image source={{ uri: editPhoto.uri }} style={styles.coverImage} />
                    ) : selectedRequest.sessionData?.coverPhoto ? (
                      <Image source={{ uri: selectedRequest.sessionData.coverPhoto }} style={styles.coverImage} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Text style={styles.imagePickerText}>Tap to select cover photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedRequest.title || '—'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Requested Date & Time</Text>
                  <Text style={styles.detailValue}>{formatDisplayDate(selectedRequest.requestedDate)}</Text>
                  <Text style={styles.detailValue}>{formatTime(selectedRequest.requestedDate)}</Text>
                </View>

                {selectedRequest.sessionData?.coverPhoto ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Cover Photo</Text>
                    <Image source={{ uri: selectedRequest.sessionData.coverPhoto }} style={styles.coverImagePreview} />
                  </View>
                ) : null}
              </>
            )}

            {selectedRequest.description ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedRequest.description}</Text>
              </View>
            ) : null}

            {selectedRequest.rejectionReason ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Rejection Reason</Text>
                <Text style={[styles.detailValue, { color: '#E7522F' }]}>{selectedRequest.rejectionReason}</Text>
              </View>
            ) : null}

          </ScrollView>

          {isEditMode ? (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleCancelEdit}
                disabled={actionLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.rejectButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleSaveEdit}
                disabled={actionLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.approveButtonText}>{actionLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          ) : selectedRequest.status === 'pending' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={openRejectModal}
                disabled={actionLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleApprove}
                disabled={actionLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.approveButtonText}>
                  {actionLoading ? 'Approving...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rejection overlay */}
          {rejectModalVisible && (
            <View style={styles.rejectOverlay}>
              <TouchableOpacity style={styles.rejectOverlayBackdrop} onPress={closeRejectModal} />
              <View style={styles.rejectSheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Reject Request</Text>
                  <TouchableOpacity onPress={closeRejectModal} style={styles.closeButton}>
                    <CloseIcon width={20} height={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetBody}>
                  <Text style={styles.rejectModalLabel}>Why are you rejecting this request?</Text>
                  <TextInput
                    style={styles.rejectInput}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    placeholder="Enter reason..."
                    placeholderTextColor="#9AA4A8"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={closeRejectModal}
                    disabled={actionLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rejectButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={handleConfirmReject}
                    disabled={actionLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.approveButtonText}>
                      {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Setup</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchLiveRequests(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendarModal(true)}
            activeOpacity={0.7}
          >
            <CalendarIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.approvedToday}</Text>
          <Text style={styles.statLabel}>Approved Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rejectedWeek}</Text>
          <Text style={styles.statLabel}>Rejected This Week</Text>
        </View>
      </View>

      {/* Filter indicator */}
      <View style={styles.filterIndicator}>
        <Text style={styles.filterText}>
          {filteredRequests.length === requests.length
            ? `All Requests (${requests.length})`
            : `Requests for ${formatDisplayDate(selectedDate)} (${filteredRequests.length})`}
        </Text>
        {filteredRequests.length !== requests.length && (
          <TouchableOpacity onPress={handleShowAll} activeOpacity={0.7}>
            <Text style={styles.showAllText}>Show All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : filteredRequests.length > 0 ? (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLiveRequests(true)}
              colors={['#539461']}
              tintColor="#539461"
            />
          }
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No live requests found</Text>
          <Text style={styles.emptySubtitle}>
            {requests.length > 0
              ? 'No requests for the selected date'
              : 'Seller live stream requests will appear here'}
          </Text>
        </View>
      )}

      {/* Calendar Modal */}
      <LiveCalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={handleDateSelect}
        initialDate={selectedDate}
        requests={requests}
      />

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#539461',
  },
  calendarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EEEA',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B777B',
    marginTop: 4,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestDate: {
    fontSize: 12,
    color: '#9AA4A8',
  },
  requestBody: {
    gap: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  sellerEmail: {
    fontSize: 13,
    color: '#6B777B',
  },
  requestTitle: {
    fontSize: 14,
    color: '#393D40',
    marginTop: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#9AA4A8',
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B777B',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B777B',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B777B',
    marginTop: 2,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9AA4A8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
    lineHeight: 22,
  },
  rejectInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 12,
    fontSize: 14,
    color: '#202325',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EEEA',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FDEDEC',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E7522F',
  },
  approveButton: {
    backgroundColor: '#539461',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#539461',
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 12,
    fontSize: 14,
    color: '#202325',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8EEEA',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#6B777B',
    fontWeight: '500',
  },
  coverImagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  rejectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  rejectOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rejectSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 101,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  sheetBody: {
    padding: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EEEA',
    backgroundColor: '#FFFFFF',
  },
  rejectModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 12,
  },
});

export default LiveSetup;
