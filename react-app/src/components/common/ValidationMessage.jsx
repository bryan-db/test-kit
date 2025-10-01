import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

/**
 * Validation Message Component for inline error/warning display
 * Implements FR-046 (validation errors), FR-048 (user-friendly messages)
 *
 * @param {Object} props
 * @param {Array<Object>} props.errors - Array of validation error objects
 * @param {string} props.errors[].field - Field name
 * @param {string} props.errors[].message - Error message
 * @param {string} props.errors[].severity - 'error' | 'warning' | 'info'
 */
export function ValidationMessage({ errors = [] }) {
  if (errors.length === 0) {
    return null;
  }

  // Group errors by severity
  const errorsByLevel = {
    error: errors.filter((e) => e.severity === 'error'),
    warning: errors.filter((e) => e.severity === 'warning'),
    info: errors.filter((e) => e.severity === 'info'),
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Error messages (red) */}
      {errorsByLevel.error.length > 0 && (
        <Alert severity="error" sx={{ mb: 1 }}>
          <AlertTitle>Validation Errors</AlertTitle>
          {errorsByLevel.error.map((error, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <strong>{error.field}:</strong> {error.message}
            </Box>
          ))}
        </Alert>
      )}

      {/* Warning messages (orange) */}
      {errorsByLevel.warning.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          <AlertTitle>Warnings</AlertTitle>
          {errorsByLevel.warning.map((warning, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <strong>{warning.field}:</strong> {warning.message}
            </Box>
          ))}
        </Alert>
      )}

      {/* Info messages */}
      {errorsByLevel.info.length > 0 && (
        <Alert severity="info">
          <AlertTitle>Information</AlertTitle>
          {errorsByLevel.info.map((info, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <strong>{info.field}:</strong> {info.message}
            </Box>
          ))}
        </Alert>
      )}
    </Box>
  );
}
