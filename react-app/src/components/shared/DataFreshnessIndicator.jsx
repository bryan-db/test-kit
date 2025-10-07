/**
 * DataFreshnessIndicator Component - Display data freshness timestamp
 * Feature: 004-data-exploration-frontend
 * Task: T040
 *
 * Shows "Data as of [timestamp]" from `updated_at` column in gold tables
 * Helps users understand data recency for analytics dashboards
 */

import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import {
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Calculate time difference for human-readable format
 */
function getTimeDifference(timestamp) {
  const now = new Date();
  const updated = new Date(timestamp);
  const diffMs = now - updated;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Determine freshness status based on age
 */
function getFreshnessStatus(timestamp) {
  const now = new Date();
  const updated = new Date(timestamp);
  const diffHours = (now - updated) / (1000 * 60 * 60);

  if (diffHours < 2) {
    return { level: 'fresh', color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
  } else if (diffHours < 24) {
    return { level: 'recent', color: 'info', icon: <UpdateIcon fontSize="small" /> };
  } else if (diffHours < 72) {
    return { level: 'stale', color: 'warning', icon: <WarningIcon fontSize="small" /> };
  } else {
    return { level: 'outdated', color: 'error', icon: <ErrorIcon fontSize="small" /> };
  }
}

export default function DataFreshnessIndicator({ updatedAt, variant = 'chip', showDetails = false }) {
  if (!updatedAt) {
    return null;
  }

  const timestamp = new Date(updatedAt);
  const formattedDate = timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const timeAgo = getTimeDifference(timestamp);
  const status = getFreshnessStatus(timestamp);

  // Tooltip content with detailed information
  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Data Freshness
      </Typography>
      <Typography variant="caption" display="block">
        Last Updated: {formattedDate}
      </Typography>
      <Typography variant="caption" display="block">
        Status: {status.level.charAt(0).toUpperCase() + status.level.slice(1)}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
        Data refreshes hourly via ETL pipeline
      </Typography>
    </Box>
  );

  // Chip variant (default, compact display)
  if (variant === 'chip') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Chip
          icon={status.icon}
          label={`Data as of: ${timeAgo}`}
          color={status.color}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // Detailed variant (for dashboard headers)
  if (variant === 'detailed') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {status.icon}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Data as of: {formattedDate}
          </Typography>
          {showDetails && (
            <Typography variant="caption" display="block" color="text.secondary">
              {timeAgo} • Refreshed hourly
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <UpdateIcon fontSize="small" />
          Data as of: {timeAgo}
        </Typography>
      </Tooltip>
    );
  }

  return null;
}
