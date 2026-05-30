// LifeOS Extension Utilities
// Xử lý timezone và các utility functions

/**
 * Get timezone offset in minutes (GMT+7 = +420 minutes)
 * Có thể lấy từ user settings hoặc mặc định GMT+7
 */
function getTimezoneOffset() {
  // Mặc định GMT+7 (Vietnam)
  return 7 * 60; // +420 minutes
}

/**
 * Get today's date string in user's timezone (YYYY-MM-DD)
 * Format: 24h, một ngày mới kết thúc sau 24h (00:00:00 - 23:59:59)
 */
function getTodayDateString() {
  const now = new Date();
  const timezoneOffset = getTimezoneOffset();
  
  // Convert to user's timezone
  const localTime = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
  
  // Get date components in user's timezone
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in user's timezone (HH:MM:SS format 24h)
 */
function getCurrentTimeString() {
  const now = new Date();
  const timezoneOffset = getTimezoneOffset();
  
  // Convert to user's timezone
  const localTime = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
  
  const hours = String(localTime.getUTCHours()).padStart(2, '0');
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(localTime.getUTCSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get Date object for today at 00:00:00 in user's timezone
 */
function getTodayStart() {
  const todayStr = getTodayDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  
  // Create date at 00:00:00 in user's timezone
  const timezoneOffset = getTimezoneOffset();
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  
  // Adjust for timezone offset
  return new Date(utcDate.getTime() - (timezoneOffset * 60 * 1000));
}

/**
 * Parse date string and convert to user's timezone Date object
 * @param {string} dateString - Date string in format YYYY-MM-DD or ISO string
 */
function parseDateInTimezone(dateString) {
  if (!dateString) return null;
  
  try {
    // If it's just a date string (YYYY-MM-DD), parse it
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const timezoneOffset = getTimezoneOffset();
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      return new Date(utcDate.getTime() - (timezoneOffset * 60 * 1000));
    }
    
    // If it's ISO string, parse and convert
    const date = new Date(dateString);
    const timezoneOffset = getTimezoneOffset();
    
    // Get date components in UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    
    // Create date in user's timezone
    const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    return new Date(utcDate.getTime() - (timezoneOffset * 60 * 1000));
  } catch (e) {
    console.warn('[Utils] Error parsing date:', dateString, e);
    return null;
  }
}

/**
 * Format date to YYYY-MM-DD in user's timezone
 */
function formatDateInTimezone(date) {
  if (!date) return null;
  
  const timezoneOffset = getTimezoneOffset();
  const localTime = new Date(date.getTime() + (timezoneOffset * 60 * 1000));
  
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is today in user's timezone
 */
function isToday(dateString) {
  if (!dateString) return false;
  
  const today = getTodayDateString();
  const dateStr = formatDateInTimezone(parseDateInTimezone(dateString));
  
  return dateStr === today;
}

/**
 * Check if a date is before today in user's timezone
 */
function isBeforeToday(dateString) {
  if (!dateString) return false;
  
  const today = getTodayDateString();
  const dateStr = formatDateInTimezone(parseDateInTimezone(dateString));
  
  return dateStr < today;
}

/**
 * Format time to 24h format (HH:MM)
 */
function formatTime24h(date) {
  if (!date) return '';
  
  const timezoneOffset = getTimezoneOffset();
  const localTime = new Date(date.getTime() + (timezoneOffset * 60 * 1000));
  
  const hours = String(localTime.getUTCHours()).padStart(2, '0');
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTodayDateString,
    getCurrentTimeString,
    getTodayStart,
    parseDateInTimezone,
    formatDateInTimezone,
    isToday,
    isBeforeToday,
    formatTime24h,
    getTimezoneOffset
  };
}

