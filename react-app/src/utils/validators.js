/**
 * Validation Utilities
 * Provides validation functions for user inputs and configuration values
 */

/**
 * Validate that a value is within a specified range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if value is in range
 */
export function isInRange(value, min, max) {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * Validate that a string is a valid SQL identifier
 * @param {string} name - String to validate
 * @returns {boolean} True if valid SQL identifier
 */
export function isValidSQLIdentifier(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // SQL identifier rules:
  // - Must start with letter or underscore
  // - Can contain letters, digits, underscores
  // - Cannot be a SQL reserved word (basic check)
  const sqlIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  if (!sqlIdentifierPattern.test(name)) {
    return false;
  }

  // Check against common SQL reserved words
  const reservedWords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'ALTER', 'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE',
    'FUNCTION', 'USER', 'GROUP', 'ORDER', 'BY', 'LIMIT', 'OFFSET'
  ];

  return !reservedWords.includes(name.toUpperCase());
}

/**
 * Validate catalog name (Unity Catalog naming rules)
 * @param {string} name - Catalog name to validate
 * @returns {boolean} True if valid catalog name
 */
export function isValidCatalogName(name) {
  return isValidSQLIdentifier(name);
}

/**
 * Validate schema name (Unity Catalog naming rules)
 * @param {string} name - Schema name to validate
 * @returns {boolean} True if valid schema name
 */
export function isValidSchemaName(name) {
  return isValidSQLIdentifier(name);
}

/**
 * Validate that a string is non-empty
 * @param {string} value - String to validate
 * @returns {boolean} True if non-empty
 */
export function isNonEmpty(value) {
  return value && typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that an array is non-empty
 * @param {Array} arr - Array to validate
 * @returns {boolean} True if non-empty array
 */
export function isNonEmptyArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validate that min < max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if min < max
 */
export function isValidRange(min, max) {
  if (min === null || min === undefined || isNaN(min)) return false;
  if (max === null || max === undefined || isNaN(max)) return false;
  return min < max;
}

/**
 * Validate integer
 * @param {number} value - Value to validate
 * @returns {boolean} True if integer
 */
export function isInteger(value) {
  return Number.isInteger(value);
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean} True if positive
 */
export function isPositive(value) {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validate non-negative number
 * @param {number} value - Value to validate
 * @returns {boolean} True if non-negative
 */
export function isNonNegative(value) {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}
