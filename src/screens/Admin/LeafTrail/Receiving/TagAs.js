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
import CheckIcon from '../../../../assets/admin-icons/check-icon.svg';
import CrossIcon from '../../../../assets/admin-icons/cross-icon.svg';
import RightArrowIcon from '../../../../assets/admin-icons/rigth-arrow.svg';

// Reusable component for each option in the list
const OptionItem = ({ isCrossIcon, isCheckIcon, title, hasRightArrow = false, setTagAs, status }) =>{ 
  
  const setStatus = () => {
    setTagAs(status)
  }

  return (
  <TouchableOpacity style={styles.optionsRow} onPress={setStatus}>
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
)};

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
  setTagAs,
  isMissing = false,
  isDamaged = false,
  isNeedsToStay = false,
  isOthers = false,
  forShipping = false,
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
            {/* Indicator */}
            <View style={styles.indicatorContainer}>
              <View style={styles.indicatorBar} />
            </View>

            {/* Content */}
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
              {!showStatusActions && forShipping && 
                <View>
                  <OptionItem
                    isCheckIcon={true}
                    title="For shipping"
                    hasRightArrow
                    setTagAs={setTagAs}
                    status="received"
                  />
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>
                </View>
              }
              {!showStatusActions && isMissing &&
                <View>
                  <OptionItem
                    isCrossIcon={true}
                    title="Tag as missing"
                    hasRightArrow
                    setTagAs={setTagAs}
                    status="missing"
                  />
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>
                </View>
              }
              {!showStatusActions && isDamaged && 
                <View>
                  <OptionItem
                    isCrossIcon={true}
                    title="Tag as damaged"
                    hasRightArrow
                    setTagAs={setTagAs}
                    status="damaged"
                  />
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>
                </View>
              }
              {!showStatusActions && isNeedsToStay && (
                <View>
                  <OptionItem
                    isCheckIcon={true}
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
              {!showStatusActions && isOthers && (
                <View>
                  <OptionItem
                    isCheckIcon={true}
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

// --- Stylesheet ---
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
  iconPlaceholder: {
    color: '#556065',
    fontWeight: 'bold',
  },
  listTitle: {
    fontFamily: 'Inter', // NOTE: You must have this font linked in your project
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22.4, // 140% of 16px
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
  // --- Example Usage Styles ---
  exampleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});