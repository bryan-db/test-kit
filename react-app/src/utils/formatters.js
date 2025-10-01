/**
 * Formatting Utilities
 * Provides consistent number, duration, and percentage formatting across the application
 */

/**
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,000,000")
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('en-US');
}

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2m 30s", "1h 15m")
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format a decimal as a percentage
 * @param {number} decimal - Decimal value (0-1)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage (e.g., "50.0%")
 */
export function formatPercentage(decimal, decimals = 1) {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return '0.0%';
  }
  return `${(decimal * 100).toFixed(decimals)}%`;
}

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 GB", "250 MB")
 */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format a date to ISO 8601 string
 * @param {Date} date - Date object
 * @returns {string} ISO 8601 formatted date
 */
export function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

/**
 * Format a timestamp to human-readable relative time
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Relative time (e.g., "2 minutes ago", "just now")
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown';

  const now = new Date();
  const past = new Date(timestamp);
  const diffSeconds = Math.floor((now - past) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
  return `${Math.floor(diffSeconds / 86400)} days ago`;
}
