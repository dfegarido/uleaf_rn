import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import GlassView from './Glass/GlassView';
import CaretDownIcon from '../assets/icons/white/caret-down.svg';

// Top-right control shown in place of a live screen's header while the comment box is open.
// Return inserts a new line there, so the keyboard has no dismiss key; this closes it. A caret
// rather than an X: an X in a live header reads as "leave the live".
export default function LiveCommentCloseButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Close comments">
      <GlassView variant="control" radius={14} style={styles.button}>
        <CaretDownIcon width={24} height={24} />
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Same 44pt glass circle as the header's back button.
  button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
