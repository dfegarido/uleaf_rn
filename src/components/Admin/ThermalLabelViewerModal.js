import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../assets/icons/accent/download.svg';
import {
  saveThermalLabelsToGallery,
  shareThermalLabels,
} from '../../utils/thermalLabelExport';

/**
 * Shows thermal label previews after generateThermalLabels succeeds.
 */
const ThermalLabelViewerModal = ({
  visible,
  labels = [],
  onClose,
  title = 'Generated Labels',
  loadingMore = false,
  expectedTotal = 0,
  onEmailPress,
  emailDisabled = false,
}) => {
  const [actionBusy, setActionBusy] = useState(false);

  const countLabel =
    expectedTotal > labels.length
      ? `${labels.length} of ${expectedTotal}`
      : String(labels.length);

  const runAction = useCallback(async (action) => {
    if (actionBusy || !labels.length) return;
    setActionBusy(true);
    try {
      await action();
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, labels.length]);

  const handleShare = useCallback(
    () => runAction(() => shareThermalLabels(labels)),
    [labels, runAction],
  );

  const handleSaveToGallery = useCallback(
    () => runAction(() => saveThermalLabelsToGallery(labels)),
    [labels, runAction],
  );

  const handleEmail = useCallback(() => {
    if (actionBusy || emailDisabled || typeof onEmailPress !== 'function') return;
    onEmailPress();
  }, [actionBusy, emailDisabled, onEmailPress]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={12}>
            <BackIcon width={22} height={22} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title} ({countLabel})
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton, actionBusy && styles.actionDisabled]}
            onPress={handleSaveToGallery}
            disabled={actionBusy || !labels.length}>
            <Text style={styles.actionButtonText}>Save to Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton, actionBusy && styles.actionDisabled]}
            onPress={handleShare}
            disabled={actionBusy || !labels.length}>
            <View style={styles.actionContent}>
              <DownloadIcon width={18} height={18} />
              <Text style={styles.actionButtonText}>Share</Text>
            </View>
          </TouchableOpacity>
          {typeof onEmailPress === 'function' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.emailButton, (actionBusy || emailDisabled) && styles.actionDisabled]}
              onPress={handleEmail}
              disabled={actionBusy || emailDisabled}>
              <Text style={styles.emailButtonText}>Email</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loadingMore ? (
          <View style={styles.loadingMoreBar}>
            <ActivityIndicator size="small" color="#539461" />
            <Text style={styles.loadingMoreText}>
              Loading more labels ({labels.length}
              {expectedTotal ? ` of ${expectedTotal}` : ''})…
            </Text>
          </View>
        ) : null}

        {actionBusy ? (
          <View style={styles.actionBusyBar}>
            <ActivityIndicator size="small" color="#539461" />
            <Text style={styles.actionBusyText}>Saving labels…</Text>
          </View>
        ) : null}

        <FlatList
          data={labels}
          keyExtractor={(item, index) => String(item.orderId || item.plantCode || index)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <View style={styles.preview}>
              <Text style={styles.previewLabel} numberOfLines={1}>
                {item.plantCode || `Label ${index + 1}`}
              </Text>
              <Image
                source={{ uri: `data:image/png;base64,${item.base64}` }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          )}
          ListEmptyComponent={
            loadingMore ? (
              <View style={styles.emptyLoading}>
                <ActivityIndicator size="large" color="#539461" />
                <Text style={styles.empty}>Preparing label previews…</Text>
              </View>
            ) : (
              <Text style={styles.empty}>No label images to display.</Text>
            )
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9EB',
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9EB',
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  galleryButton: {
    backgroundColor: '#539461',
  },
  shareButton: {
    backgroundColor: '#4A90E2',
  },
  emailButton: {
    backgroundColor: '#23C16B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionBusyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: '#F0F7F1',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9EB',
  },
  actionBusyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  loadingMoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F7F1',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9EB',
  },
  loadingMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#539461',
  },
  grid: {
    padding: 12,
    gap: 10,
  },
  preview: {
    flex: 1,
    margin: 6,
    maxWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E9EB',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#647276',
    marginBottom: 6,
  },
  previewImage: {
    width: '100%',
    height: 140,
  },
  empty: {
    textAlign: 'center',
    color: '#647276',
    marginTop: 32,
    fontSize: 15,
  },
  emptyLoading: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
});

export default ThermalLabelViewerModal;
