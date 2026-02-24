/**
 * Date utilities for handling UTC datetime from server
 * Server stores all dates in UTC, but may not include 'Z' suffix
 */

/**
 * Parse a datetime string from server as UTC
 * Ensures dates without timezone indicator are treated as UTC
 * @param {string} dateString - DateTime string from server
 * @returns {Date} Date object
 */
export const parseUTCDate = (dateString) => {
  if (!dateString) return null;
  
  // If already has timezone indicator, parse directly
  if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
    return new Date(dateString);
  }
  
  // Append 'Z' to indicate UTC
  return new Date(dateString + 'Z');
};

/**
 * Format a relative time string (e.g., "2 hours ago")
 * @param {string} dateString - DateTime string from server
 * @returns {string} Formatted relative time
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const date = parseUTCDate(dateString);
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Show local date for older dates
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format date for display
 * @param {string} dateString - DateTime string from server
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = parseUTCDate(dateString);
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
};

/**
 * Format time only for display (e.g., "1:29 PM")
 * @param {string} dateString - DateTime string from server
 * @param {string} locale - Locale string (default: 'vi-VN')
 * @returns {string} Formatted time
 */
export const formatTime = (dateString, locale = 'vi-VN') => {
  if (!dateString) return '';
  
  const date = parseUTCDate(dateString);
  if (!date) return '';
  
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date and time for display
 * @param {string} dateString - DateTime string from server
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = parseUTCDate(dateString);
  if (!date) return '';
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
