// RectBadgeWithNotch.js
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Mask, Rect, Circle} from 'react-native-svg';

const BadgeWithTransparentNotch = ({
  width = 100,
  height = 36,
  borderRadius = 18,
  color = '#FF4C4C',
  text = '',
  textColor = '#fff',
  fontSize = 14,
  notchSize = 8,
  style,
}) => {
  const notchPosition = {
    x: width, // far right edge
    y: height / 2, // vertical center
  };

  return (
    <View style={[{width, height}, style]}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={width} height={height}>
          <Mask id="notchMask">
            {/* Full rounded rect */}
            <Rect
              x="0"
              y="0"
              width={width}
              height={height}
              rx={borderRadius}
              ry={borderRadius}
              fill="white"
            />
            {/* Center-right notch */}
            <Circle
              cx={notchPosition.x}
              cy={notchPosition.y}
              r={notchSize}
              fill="black"
            />
          </Mask>

          {/* Apply mask to colored rect */}
          <Rect
            width={width}
            height={height}
            fill={color}
            mask="url(#notchMask)"
            rx={borderRadius}
            ry={borderRadius}
          />
        </Svg>
      </View>

      {/* Text overlay */}
      <View style={styles.textWrapper}>
        <Text
          style={[styles.text, {color: textColor, fontSize}]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BadgeWithTransparentNotch;
