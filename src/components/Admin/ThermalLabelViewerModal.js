import React from 'react';
import {
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
}) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={12}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title} ({labels.length})
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={labels}
        keyExtractor={(item, index) => String(item.orderId || item.plantCode || index)}
        numColumns={2}
        contentContainerStyle={styles.grid}
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
          <Text style={styles.empty}>No label images to display.</Text>
        }
      />
    </SafeAreaView>
  </Modal>
);

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
});

export default ThermalLabelViewerModal;
