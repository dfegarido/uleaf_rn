import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckIcon from '../../../../assets/admin-icons/check-icon.svg';
import CrossIcon from '../../../../assets/admin-icons/cross-icon.svg';
import RightArrowIcon from '../../../../assets/admin-icons/rigth-arrow.svg';

const OptionItem = ({
  isCrossIcon,
  isCheckIcon,
  title,
  hasRightArrow = false,
  setTagAs,
  status,
}) => {
  const setStatus = () => {
    setTagAs(status);
  };

  return (
    <TouchableOpacity style={styles.optionsRow} onPress={setStatus} activeOpacity={0.7}>
      <View style={styles.listLeft}>
        <View style={styles.iconContainer}>
          {isCrossIcon && <CrossIcon />}
          {isCheckIcon && <CheckIcon />}
        </View>
        <Text style={styles.listTitle}>{title}</Text>
      </View>
      {hasRightArrow && (
        <View style={styles.listRight}>
          <View style={styles.iconContainer}>
            <RightArrowIcon />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const TagAsOptions = ({
  visible,
  onClose,
  setTagAs,
  isMissing = false,
  isDamaged = false,
  isNeedsToStay = false,
  isOthers = false,
  forShipping = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent
      visible={visible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
        />
        <View
          style={[
            styles.actionSheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorBar} />
          </View>

          <View style={styles.content}>
            <View>
              <OptionItem
                isCrossIcon
                title="Tag as missing"
                hasRightArrow
                setTagAs={setTagAs}
                status="missing"
              />
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
            </View>
            <View>
              <OptionItem
                isCrossIcon
                title="Tag as damaged"
                hasRightArrow
                setTagAs={setTagAs}
                status="damaged"
              />
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
            </View>
            {isNeedsToStay && (
              <View>
                <OptionItem
                  isCheckIcon
                  title="Tag as needs to stay"
                  hasRightArrow
                  setTagAs={setTagAs}
                  status="needsToStay"
                />
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                </View>
              </View>
            )}
            {isOthers && (
              <View>
                <OptionItem
                  isCheckIcon
                  title="Tag as Others"
                  hasRightArrow
                  setTagAs={setTagAs}
                  status="others"
                />
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                </View>
              </View>
            )}
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
    elevation: 8,
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
