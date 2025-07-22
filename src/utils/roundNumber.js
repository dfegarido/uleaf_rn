export const roundNumber = (value, decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) {
    console.log('roundNumber: Invalid input value');
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};
