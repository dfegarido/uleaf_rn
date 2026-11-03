import React, { useContext, useState } from 'react';
import { Animated } from 'react-native';

// Live chat (seller, admin and buyer) holds 5 rows: each stacks name over message
// (17 + 2 + 18) + 4pt padding, 2pt gap.
export const CHAT_ROW_HEIGHT = 41;
export const CHAT_MAX_HEIGHT = 5 * CHAT_ROW_HEIGHT + 4 * 2;

// Fades rows in the top row-height of the chat box, like the reference. A JS opacity per cell,
// driven natively from the scroll offset, so iOS and Android match with no MaskedView dependency.
// ponytail: fades whole rows, not pixels; add @react-native-masked-view if a per-pixel edge is needed.
export const ChatFadeContext = React.createContext(null);
export const ChatFadeCell = ({ style, onLayout, onFocusCapture, children }) => {
  const fade = useContext(ChatFadeContext);
  const [y, setY] = useState(null);
  // `offset` lifts a short list's rows by the empty space above it, so the fade band stays at the
  // top of the full 5-row box and a lone comment is never faded.
  const opacity = y == null || !fade
    ? 1
    : fade.scrollY.interpolate({
        inputRange: [y + fade.offset - CHAT_ROW_HEIGHT, y + fade.offset],
        outputRange: [1, 0.2],
        extrapolate: 'clamp',
      });
  return (
    <Animated.View
      style={[style, { opacity }]}
      onFocusCapture={onFocusCapture}
      onLayout={(e) => {
        setY(e.nativeEvent.layout.y);
        onLayout?.(e);
      }}>
      {children}
    </Animated.View>
  );
};
