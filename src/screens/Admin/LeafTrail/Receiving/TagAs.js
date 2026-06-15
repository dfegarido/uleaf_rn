import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RightArrowIcon from '../../../../assets/admin-icons/rigth-arrow.svg';

const MenuActionItem = ({ title, onPress }) => (
  <TouchableOpacity
    style={styles.optionsRow}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.listLeft}>
      <Text style={styles.listTitle}>{title}</Text>
    </View>
    <View style={styles.listRight}>
      <View style={styles.iconContainer}>
        <RightArrowIcon />
      </View>
    </View>
  </TouchableOpacity>
);

const TagAsOptions = ({
  visible,
  onClose,
  showStatusActions = false,
  onLeafTrailStatusPress,
  onPlantStatusPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.actionSheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.indicatorContainer}>
              <View style={styles.indicatorBar} />
            </View>

            <View style={styles.content}>
              {showStatusActions ? (
                <View>
                  <MenuActionItem
                    title="Change leaf trail status"
                    onPress={() => {
                      onClose?.();
                      onLeafTrailStatusPress?.();
                    }}
                  />
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>
                  <MenuActionItem
                    title="Change plant status"
                    onPress={() => {
                      onClose?.();
                      onPlantStatusPress?.();
                    }}
                  />
                </View>
              ) : null}
            </View>
        </View>
      </View>
    </Modal>
  );
};

export default TagAsOptions;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  indicatorContainer: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorBar: {
    width: 50,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
  },
  content: {
    width: '100%',
    paddingTop: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    paddingHorizontal: 8,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
    flex: 1,
  },
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4,
    color: '#393D40',
  },
  dividerContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
});
