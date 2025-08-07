// Abbreviated currency formatting (1k, 1M, etc.)
export const formatCurrency = amount => {
  if (typeof amount !== 'number') amount = Number(amount) || 0;

  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (amount >= 1_000) {
    return (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    return amount.toString();
  }
};

// Full currency formatting with thousand separators and space after dollar sign
// Example: formatCurrencyFull(3080) -> "$ 3,080.00"
export const formatCurrencyFull = (amount, includeDecimal = true) => {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  
  const formattedNumber = includeDecimal 
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString('en-US');
    
  return `$ ${formattedNumber}`;
};

// Currency formatting without dollar sign (just the number with thousand separators)
// Example: formatNumberWithCommas(3080) -> "3,080.00"
export const formatNumberWithCommas = (amount, includeDecimal = true) => {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  
  return includeDecimal 
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString('en-US');
};
