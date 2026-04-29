import React, {useEffect, useRef, useState} from 'react';
import { View,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
} from 'react-native';

const OtpInput = ({length = 4, onChangeOtp}) => {
  const inputs = useRef([]);
  const [otpArray, setOtpArray] = useState(Array(length).fill(''));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleChange = (text, index) => {
    const digits = (text || '').replace(/\D/g, '');
    const newOtpArray = [...otpArray];

    // Handle paste/autofill: distribute multiple digits across subsequent inputs.
    if (digits.length > 1) {
      let cursor = index;
      for (const ch of digits) {
        if (cursor >= length) break;
        newOtpArray[cursor] = ch;
        cursor += 1;
      }
      setOtpArray(newOtpArray);
      onChangeOtp(newOtpArray.join(''));

      const nextFocusIndex = Math.min(index + digits.length, length - 1);
      inputs.current[nextFocusIndex]?.focus();
      return;
    }

    // Single-digit input / clear behavior.
    const single = digits.slice(0, 1);
    newOtpArray[index] = single;
    setOtpArray(newOtpArray);
    onChangeOtp(newOtpArray.join(''));

    if (single && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      index > 0 &&
      otpArray[index] === ''
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // style={styles.keyboardAvoid}
      >
        <View style={styles.container}>
          {[...Array(length)].map((_, i) => (
            <TextInput
              key={i}
              ref={ref => (inputs.current[i] = ref)}
              style={styles.input}
              // Allow multi-character paste/autofill to reach onChangeText.
              // We still render one digit per box via handleChange distribution.
              maxLength={length}
              keyboardType="number-pad"
              returnKeyType="done"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus={i === 0}
              value={otpArray[i]}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              textAlign="center"
            />
          ))}
        </View>

        {/* {Platform.OS === 'ios' && isKeyboardVisible && (
          <View style={styles.doneBar}>
            <TouchableOpacity onPress={dismissKeyboard}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )} */}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 30,
  },
  input: {
    width: 50,
    height: 50,
    fontSize: 24,
    borderWidth: 1,
    borderRadius: 50,
    borderColor: '#888',
    color: '#000',
    backgroundColor: '#fff',
  },
  doneBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  doneText: {
    color: '#007AFF',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
});

export default OtpInput;
