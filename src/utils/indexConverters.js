/**
 * Utility functions to convert between numeric index values and display labels
 * 
 * Mapping:
 * - 1-3 = Good
 * - 4-6 = Better
 * - 7-10 = Best
 */

/**
 * Convert numeric shipping/acclimation index to display label
 * @param {number|string} value - Numeric value (1-10) or already a label
 * @returns {string} Display label (e.g., "Good (1-3)")
 */
export const convertIndexToLabel = (value) => {
  // If value is already a string label, return it
  if (typeof value === 'string' && value.includes('(')) {
    return value;
  }

  // Convert to number for comparison
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (!numValue || isNaN(numValue)) {
    return '';
  }

  // Map numeric values to labels based on ranges: 1-3 Good, 4-6 Better, 7-10 Best
  if (numValue >= 1 && numValue <= 3) return 'Good (1-3)';
  if (numValue >= 4 && numValue <= 6) return 'Better (4-6)';
  if (numValue >= 7 && numValue <= 10) return 'Best (7-10)';

  // Default fallback - if outside expected range, show as-is
  return value?.toString() || '';
};

/**
 * Convert label to numeric value
 * @param {string|number} label - Display label or numeric value
 * @returns {number} Numeric value (1-10)
 */
export const convertLabelToValue = (label) => {
  // If already a number, return it as-is (should be 1-10)
  if (typeof label === 'number') {
    // Clamp to valid range 1-10
    if (label < 1) return 1;
    if (label > 10) return 10;
    return label;
  }

  // If string number, parse it
  if (typeof label === 'string') {
    const numValue = parseFloat(label);
    if (!isNaN(numValue)) {
      // Clamp to valid range 1-10
      if (numValue < 1) return 1;
      if (numValue > 10) return 10;
      return numValue;
    }

    // Match label patterns - return middle of range
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('good')) return 2;  // Middle of 1-3
    if (lowerLabel.includes('better')) return 5;  // Middle of 4-6
    if (lowerLabel.includes('best')) return 8;  // Middle of 7-10
  }

  return 0;
};

/**
 * Get index options for dropdowns
 * @returns {Array} Array of index options with id, name, and value
 */
export const getIndexOptions = () => [
  { id: 'good', name: 'Good (1-3)', value: 2 },
  { id: 'better', name: 'Better (4-6)', value: 5 },
  { id: 'best', name: 'Best (7-10)', value: 8 }
];

/**
 * Convert backend response data to ensure proper display format
 * Converts numeric shipping_index and acclimation_index to display labels
 * 
 * @param {Object} speciesData - Species data from backend
 * @returns {Object} Species data with converted index values
 */
export const convertSpeciesIndexValues = (speciesData) => {
  if (!speciesData) return speciesData;

  return {
    ...speciesData,
    shippingIndex: convertIndexToLabel(speciesData.shippingIndex || speciesData.shipping_index),
    acclimationIndex: convertIndexToLabel(speciesData.acclimationIndex || speciesData.acclimation_index),
    // Keep original numeric values for backend compatibility
    shipping_index: speciesData.shipping_index || speciesData.shippingIndex,
    acclimation_index: speciesData.acclimation_index || speciesData.acclimationIndex
  };
};
