import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Loading Spinner Component with Material Design 3 circular progress
 * Implements NFR-003 (loading indicator for operations >200ms)
 *
 * @param {Object} props
 * @param {string} props.text - Optional text label below spinner
 * @param {number} props.size - Spinner size in pixels (default: 40)
 * @param {boolean} props.fullScreen - Whether to center in full viewport
 */
export function LoadingSpinner({ text, size = 40, fullScreen = false }) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={size} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: 4,
      }}
    >
      {content}
    </Box>
  );
}
