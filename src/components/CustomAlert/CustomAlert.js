import React from 'react';
import { View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import GlassView from '../Glass/GlassView';

/**
 * Shared alert / confirmation dialog.
 *
 * `variant="solid"` (default) is the original card: white panel, the app's global
 * primary/secondary buttons. The signup screens use it — leave that look alone.
 *
 * `variant="frosted"` is the payment confirmation: a centred frosted panel with two
 * equal neutral pills, per the supplied mockup. It is drawn only from RN views over a
 * scrim (no platform dialog), so it renders the same on iOS and Android — which is
 * exactly why the payment confirm uses this instead of `Alert.alert`, whose layout,
 * colours and button order are the OS's and therefore differ per platform.
 *
 * Buttons keep the `Alert.alert` shape — `{text, onPress, style: 'cancel'}` — so a call
 * site can be moved off `Alert.alert` by changing the component, not the payload.
 */
const CustomAlert = ({
  visible,
  title,
  message,
  buttons = [{text: 'OK', onPress: () => {}}],
  onDismiss,
  variant = 'solid',
}) => {
  const isFrosted = variant === 'frosted';

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const content = (
    <>
      {/* Title */}
      {title && (
        <Text style={[styles.title, isFrosted && styles.frostedTitle]}>{title}</Text>
      )}

      {/* Message */}
      {message && (
        <Text style={[styles.message, isFrosted && styles.frostedMessage]}>{message}</Text>
      )}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            activeOpacity={isFrosted ? 0.7 : 0.2}
            style={[
              button.style === 'cancel'
                ? globalStyles.secondaryButton
                : globalStyles.primaryButton,
              styles.button,
              buttons.length === 1 && styles.singleButton,
              isFrosted && styles.frostedButton,
            ]}
            onPress={() => handleButtonPress(button)}>
            <Text
              style={[
                button.style === 'cancel'
                  ? globalStyles.secondaryButtonButtonText
                  : globalStyles.primaryButtonText,
                styles.buttonText,
                isFrosted && styles.frostedButtonText,
              ]}>
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={[styles.modalOverlay, isFrosted && styles.frostedOverlay]}>
        {isFrosted ? (
          <GlassView
            variant="light"
            radius={36}
            style={styles.frostedCard}
            contentStyle={styles.frostedCardContent}>
            {content}
          </GlassView>
        ) : (
          <View style={styles.alertContainer}>{content}</View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 24,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: '100%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202325',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#393D43',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    marginVertical: 0,
  },
  singleButton: {
    // When there's only one button, it should take full width
  },
  buttonText: {
    fontSize: 16,
  },

  // --- frosted variant: the payment confirmation -------------------------------
  // Values measured off the supplied mockup (a 2x capture, 804px = 402pt wide), so the
  // dialog matches it on both platforms:
  //   card      348 of 402pt = 86.6% wide, 136pt tall, insets ~27pt
  //   rhythm    top pad 26 + title line 21.5 + gap 20 + pills 52 + bottom pad 17 = 136.5
  //   title     ink 16.5pt (cap+descender = .93em) -> font ~18, semibold
  //   pills     152 x 52pt, 26 radius, ~10pt apart, labels cap 13.5pt -> font ~19
  //   padding   17pt inside the card
  // The card's radius, hairline border, tint and shadow come from GlassView's `light`.
  frostedOverlay: {
    paddingHorizontal: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  frostedCard: {
    width: '86%',
    maxWidth: 380,
  },
  frostedCardContent: {
    paddingTop: 21,
    paddingBottom: 20,
    paddingHorizontal: 17,
  },
  frostedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  frostedMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  frostedButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DADDDF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frostedButtonText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#202325',
  },
});

export default CustomAlert;
