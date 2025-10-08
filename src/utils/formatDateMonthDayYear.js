import {Platform} from 'react-native';

export const formatDateMonthDayYear = dateStr => {
  const date = new Date(dateStr);
  const options = {month: 'short', day: '2-digit', year: 'numeric'};
  const formatted = date.toLocaleDateString('en-US', options);
  
  // 📱 CROSS-PLATFORM DATE FORMAT LOGGING
  console.log('📅 Date Format Check:', {
    platform: Platform.OS,
    input: dateStr,
    parsedDate: date.toISOString(),
    formattedOutput: formatted,
    expectedFormat: 'Oct 06, 2025',
    matchesExpected: /^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(formatted)
  });
  
  return formatted; // e.g., 'Oct 06, 2025' (proper case)
};

// 🧪 Test function to verify cross-platform date formatting
export const testDateFormatting = () => {
  const testDates = [
    '2025-10-06T00:00:00.000Z',
    '2025-01-15T12:30:45.000Z',
    '2025-12-25T23:59:59.000Z'
  ];
  
  console.log('🧪 Cross-Platform Date Format Test Results:');
  testDates.forEach((dateStr, index) => {
    const result = formatDateMonthDayYear(dateStr);
    console.log(`Test ${index + 1}:`, {
      platform: Platform.OS,
      input: dateStr,
      output: result,
      isCorrectFormat: /^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(result)
    });
  });
};
