export function numberToCurrency(amount) {
  if (isNaN(amount)) return '0.00';

  return Number(amount)
    .toFixed(2) // always 2 decimal places
    .replace(/\B(?=(\d{3})+(?!\d))/g, ','); // add commas
}
