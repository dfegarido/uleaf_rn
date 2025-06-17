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
