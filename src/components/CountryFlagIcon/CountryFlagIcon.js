import React from 'react';

// --- Import your SVGs ---
import IdIcon from './../../assets/country-flags/ID.svg';
import PhIcon from './../../assets/country-flags/PH.svg';
import ThIcon from './../../assets/country-flags/TH.svg';

// --- Create the map ---
const iconMap = {
  TH: ThIcon,
  PH: PhIcon,
  ID: IdIcon,
};

// --- Build the dynamic component ---
const CountryFlagIcon = ({ code, width, height }) => {
  const IconComponent = iconMap[code];

  // If the code doesn't exist in the map, render nothing (or a default icon)
  if (!IconComponent) {
    return null; 
  }

  // Render the found SVG component with the passed-in props
  return <IconComponent width={width} height={height} />;
};

export default CountryFlagIcon;