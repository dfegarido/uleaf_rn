export const formatDateMonthDayYear = dateStr => {
  const date = new Date(dateStr);
  const options = {month: 'short', day: '2-digit', year: 'numeric'};
  return date.toLocaleDateString('en-US', options).toUpperCase(); // e.g., 'MAY 19, 2025'
};
