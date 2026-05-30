// Date utility functions with validation and timezone support (GMT+7)
// Prevents "Invalid time value" errors
// All dates are handled in GMT+7 timezone (Vietnam timezone)

/**
 * Get timezone offset in minutes (GMT+7 = +420 minutes)
 * Default to GMT+7 (Vietnam timezone)
 */
export function getTimezoneOffset(): number {
  // GMT+7 = +420 minutes
  return 7 * 60;
}

/**
 * Get today's date string in user's timezone (YYYY-MM-DD)
 * Format: 24h, một ngày mới kết thúc sau 24h (00:00:00 - 23:59:59)
 * Uses GMT+7 timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  const timezoneOffset = getTimezoneOffset();
  
  // Convert to user's timezone (GMT+7)
  const localTime = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
  
  // Get date components in user's timezone
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in user's timezone (HH:MM:SS format 24h)
 * Uses GMT+7 timezone
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const timezoneOffset = getTimezoneOffset();
  
  // Convert to user's timezone (GMT+7)
  const localTime = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
  
  const hours = String(localTime.getUTCHours()).padStart(2, '0');
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(localTime.getUTCSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get Date object for today at 00:00:00 in user's timezone (GMT+7)
 */
export function getTodayStart(): Date {
  const todayStr = getTodayDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  
  // Create date at 00:00:00 in user's timezone
  const timezoneOffset = getTimezoneOffset();
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  
  // Adjust for timezone offset
  return new Date(utcDate.getTime() - (timezoneOffset * 60 * 1000));
}

/**
 * Parse date string and convert to user's timezone Date object (GMT+7)
 * @param dateString - Date string in format YYYY-MM-DD or ISO string
 */
export function parseDateInTimezone(dateString: string | null | undefined): Date | null {
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
    console.warn('[DateUtils] Error parsing date:', dateString, e);
    return null;
  }
}

/**
 * Format date to YYYY-MM-DD in user's timezone (GMT+7)
 */
export function formatDateInTimezone(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  const timezoneOffset = getTimezoneOffset();
  const localTime = new Date(date.getTime() + (timezoneOffset * 60 * 1000));
  
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is today in user's timezone (GMT+7)
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const today = getTodayDateString();
  const dateStr = formatDateInTimezone(parseDateInTimezone(dateString));
  
  return dateStr === today;
}

/**
 * Check if a date is before today in user's timezone (GMT+7)
 */
export function isBeforeToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const today = getTodayDateString();
  const dateStr = formatDateInTimezone(parseDateInTimezone(dateString));
  
  return dateStr !== null && dateStr < today;
}

/**
 * Format time to 24h format (HH:MM)
 */
export function formatTime24h(date: Date | null | undefined): string {
  if (!date) return '';
  
  const timezoneOffset = getTimezoneOffset();
  const localTime = new Date(date.getTime() + (timezoneOffset * 60 * 1000));
  
  const hours = String(localTime.getUTCHours()).padStart(2, '0');
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Safely parse a date string
 * Returns a valid Date or null if invalid
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Safely parse ISO date string using date-fns parseISO
 * Returns a valid Date or null if invalid
 * Handles time-only strings (HH:MM:SS) by combining with today's date
 */
export function safeParseISO(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Check if it's a time-only string (HH:MM:SS or HH:MM)
    const timeOnlyPattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const timeMatch = dateString.match(timeOnlyPattern);
    
    if (timeMatch) {
      // It's a time-only string, combine with today's date
      const today = new Date();
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      
      // Validate time values
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        return null;
      }
      
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
      
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    }
    
    // Use native Date parsing for full date strings
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Only warn for non-time-only strings
      console.warn('Invalid ISO date string:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    // Only warn for non-time-only strings
    const timeOnlyPattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    if (!timeOnlyPattern.test(dateString || '')) {
      console.warn('Error parsing ISO date:', dateString, error);
    }
    return null;
  }
}

/**
 * Safely get time from date
 * Returns timestamp or 0 if invalid
 */
export function safeGetTime(date: Date | string | null | undefined): number {
  if (!date) return 0;
  
  try {
    const dateObj = typeof date === 'string' ? safeParseDate(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 0;
    }
    return dateObj.getTime();
  } catch (error) {
    console.warn('Error getting time from date:', date, error);
    return 0;
  }
}

/**
 * Safely format date to ISO string
 * Returns empty string if invalid
 */
export function safeToISOString(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? safeParseDate(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString();
  } catch (error) {
    console.warn('Error converting date to ISO:', date, error);
    return '';
  }
}

/**
 * Safely get date string (YYYY-MM-DD) in user's timezone (GMT+7)
 * Returns empty string if invalid
 */
export function safeGetDateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? safeParseDate(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }
    // Use timezone-aware formatting
    return formatDateInTimezone(dateObj) || '';
  } catch (error) {
    console.warn('Error getting date string:', date, error);
    return '';
  }
}

/**
 * Filter out invalid dates from array
 */
export function filterValidDates(dates: (string | null | undefined)[]): string[] {
  return dates
    .filter((d): d is string => !!d)
    .map(d => safeGetDateString(d))
    .filter(d => d !== '');
}

