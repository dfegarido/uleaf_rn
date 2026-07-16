import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export default function WarningIcon({ size = 14, color = '#F04438' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 7V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1.25" fill={color} />
    </Svg>
  );
}
