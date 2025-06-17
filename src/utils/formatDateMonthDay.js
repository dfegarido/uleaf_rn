export const formatDateMonthDay = dateStr => {
  const date = new Date(dateStr);
  const options = {month: 'short', day: '2-digit'};
  return date.toLocaleDateString('en-US', options).toUpperCase(); // e.g., 'MAY 19'
};
