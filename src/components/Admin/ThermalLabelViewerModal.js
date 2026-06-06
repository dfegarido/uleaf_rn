import React from 'react';
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
}) => {
  const countLabel =
    expectedTotal > labels.length
      ? `${labels.length} of ${expectedTotal}`
      : String(labels.length);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
        {loadingMore ? (
          <View style={styles.loadingMoreBar}>
            <ActivityIndicator size="small" color="#539461" />
            <Text style={styles.loadingMoreText}>
              Loading more labels ({labels.length}
              {expectedTotal ? ` of ${expectedTotal}` : ''})…
            </Text>
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
