export const formatDateMonthDayYear = dateStr => {
  const date = new Date(dateStr);
  const options = {month: 'short', day: '2-digit', year: 'numeric'};
  const formatted = date.toLocaleDateString('en-US', options);
  
  return formatted; // e.g., 'Oct 06, 2025' (proper case)
};
