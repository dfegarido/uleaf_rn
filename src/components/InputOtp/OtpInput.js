import React, {useRef, useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const OtpInput = ({length = 4, onChangeOtp}) => {
  const inputs = useRef([]);
  const [otpArray, setOtpArray] = useState(Array(length).fill(''));

  // const handleChange = (text, index) => {
  //   if (!/^[0-9]$/.test(text)) return;

  //   const newOtpArray = [...otpArray];
  //   newOtpArray[index] = text;
  //   setOtpArray(newOtpArray);

  //   onChangeOtp(newOtpArray.join(''));

  //   if (text && index < length - 1) {
  //     inputs.current[index + 1].focus();
  //   }
  // };

  const handleChange = (text, index) => {
    if (text !== '' && !/^[0-9]$/.test(text)) return;

    const newOtpArray = [...otpArray];
    newOtpArray[index] = text;
    setOtpArray(newOtpArray);
    onChangeOtp(newOtpArray.join(''));

    if (text && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      index > 0 &&
      otpArray[index] === ''
    ) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(length)].map((_, i) => (
        <TextInput
          key={i}
          ref={ref => (inputs.current[i] = ref)}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          value={otpArray[i]}
          onChangeText={text => handleChange(text, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
});

export default OtpInput;
