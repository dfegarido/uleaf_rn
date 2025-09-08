import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';

const CustomAlert = ({
  visible,
  title,
  message,
  buttons = [{text: 'OK', onPress: () => {}}],
  onDismiss,
}) => {
  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}
          
          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  button.style === 'cancel' 
                    ? globalStyles.secondaryButton 
                    : globalStyles.primaryButton,
                  styles.button,
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={() => handleButtonPress(button)}>
                <Text
                  style={[
                    button.style === 'cancel'
                      ? globalStyles.secondaryButtonButtonText
                      : globalStyles.primaryButtonText,
                    styles.buttonText,
                  ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
});

export default CustomAlert;
