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

const NAME_TO_CODE = {
  PHILIPPINES: 'PH',
  THAILAND: 'TH',
  INDONESIA: 'ID',
  PH: 'PH',
  TH: 'TH',
  ID: 'ID',
};

const normalizeCode = code => {
  if (!code) return null;
  const key = String(code).trim().toUpperCase();
  return NAME_TO_CODE[key] || (iconMap[key] ? key : null);
};

// --- Build the dynamic component ---
const CountryFlagIcon = ({ code, width, height }) => {
  const normalized = normalizeCode(code);
  const IconComponent = normalized ? iconMap[normalized] : null;

  // If the code doesn't exist in the map, render nothing (or a default icon)
  if (!IconComponent) {
    return null;
  }

  // Render the found SVG component with the passed-in props
  return <IconComponent width={width} height={height} />;
};

export default CountryFlagIcon;