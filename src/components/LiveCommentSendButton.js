import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Send button inside a Live Chat comment pill. Return in the pill inserts a new line
// (Messenger-style), so this is the only way to send. Same green circle + arrow as Chats'
// MessageInput so both modules look alike.
export default function LiveCommentSendButton({ onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel="Send comment"
      // 28pt circle + 8pt slop on each side = the 44pt minimum tap target.
      hitSlop={8}>
      <View style={styles.circle}>
        <Text style={styles.icon}>➤</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Pinned to the pill's bottom-right: 4pt inset centres it in the 36pt one-line pill and keeps
  // it by the last line as the pill grows.
  button: { alignSelf: 'flex-end', margin: 4, marginLeft: 0 },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#539461', justifyContent: 'center', alignItems: 'center' },
  icon: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 2 },
  disabled: { opacity: 0.4 },
});
