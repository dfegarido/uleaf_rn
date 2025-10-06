/**
 * Utility functions to convert between numeric index values and display labels
 * 
 * Mapping:
 * - 3 = Good (3-5)
 * - 7 = Better (4-6)
 * - 10 = Best (7-10)
 */

/**
 * Convert numeric shipping/acclimation index to display label
 * @param {number|string} value - Numeric value (3, 7, 10) or old numeric strings (1-10) or already a label
 * @returns {string} Display label (e.g., "Good (3-5)")
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

  // Map numeric values to labels (support both new standardized values and old migration values)
  // New standard values: 3, 7, 10
  if (numValue === 3) return 'Good (3-5)';
  if (numValue === 7) return 'Better (4-6)';
  if (numValue === 10) return 'Best (7-10)';

  // Old migration values: 1-10 scale, map to closest category
  if (numValue >= 1 && numValue <= 5) return 'Good (3-5)';
  if (numValue >= 6 && numValue <= 8) return 'Better (4-6)';
  if (numValue >= 9 && numValue <= 10) return 'Best (7-10)';

  // Default fallback - if outside expected range, show as-is
  return value?.toString() || '';
};

/**
 * Convert label to numeric value
 * @param {string|number} label - Display label or numeric value
 * @returns {number} Numeric value (3, 7, or 10)
 */
export const convertLabelToValue = (label) => {
  // If already a number, return it
  if (typeof label === 'number') {
    // Map to standard values (3, 7, 10)
    if (label <= 5) return 3;
    if (label <= 8) return 7;
    return 10;
  }

  // If string number, parse it
  if (typeof label === 'string') {
    const numValue = parseFloat(label);
    if (!isNaN(numValue)) {
      // Map to standard values (3, 7, 10)
      if (numValue <= 5) return 3;
      if (numValue <= 8) return 7;
      return 10;
    }

    // Match label patterns
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('good')) return 3;
    if (lowerLabel.includes('better')) return 7;
    if (lowerLabel.includes('best')) return 10;
  }

  return 0;
};

/**
 * Get index options for dropdowns
 * @returns {Array} Array of index options with id, name, and value
 */
export const getIndexOptions = () => [
  { id: 'good', name: 'Good (3-5)', value: 3 },
  { id: 'better', name: 'Better (4-6)', value: 7 },
  { id: 'best', name: 'Best (7-10)', value: 10 }
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
