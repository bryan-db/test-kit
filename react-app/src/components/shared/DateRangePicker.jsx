/**
 * DateRangePicker Component - Date range filter for dashboards
 * Feature: 004-data-exploration-frontend
 * Task: T039
 *
 * Features:
 * - Default to last 30 days (FR-002)
 * - Custom date range selection
 * - Quick preset buttons (Today, Last 7 days, Last 30 days, Last 90 days, YTD)
 * - Validation (start_date <= end_date)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  ButtonGroup,
  Paper,
  Typography,
  Stack
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';

// Date utility functions
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getToday = () => {
  return new Date();
};

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const getYearStart = () => {
  const date = new Date();
  date.setMonth(0, 1);
  return date;
};

// Date range presets
const DATE_PRESETS = {
  TODAY: { label: 'Today', getDates: () => ({ start: getToday(), end: getToday() }) },
  LAST_7: { label: 'Last 7 Days', getDates: () => ({ start: getDateDaysAgo(7), end: getToday() }) },
  LAST_30: { label: 'Last 30 Days', getDates: () => ({ start: getDateDaysAgo(30), end: getToday() }) },
  LAST_90: { label: 'Last 90 Days', getDates: () => ({ start: getDateDaysAgo(90), end: getToday() }) },
  YTD: { label: 'Year to Date', getDates: () => ({ start: getYearStart(), end: getToday() }) }
};

export default function DateRangePicker({ value, onChange, minDate = null, maxDate = null }) {
  // Initialize with default last 30 days (FR-002)
  const defaultRange = DATE_PRESETS.LAST_30.getDates();
  const [startDate, setStartDate] = useState(
    value?.start || formatDate(defaultRange.start)
  );
  const [endDate, setEndDate] = useState(
    value?.end || formatDate(defaultRange.end)
  );
  const [error, setError] = useState(null);

  // Validate date range
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setError('Start date must be before or equal to end date');
      } else if (minDate && start < new Date(minDate)) {
        setError(`Start date must be after ${minDate}`);
      } else if (maxDate && end > new Date(maxDate)) {
        setError(`End date must be before ${maxDate}`);
      } else {
        setError(null);

        // Notify parent component of valid date range change
        if (onChange && (!value || value.start !== startDate || value.end !== endDate)) {
          onChange({ start: startDate, end: endDate });
        }
      }
    }
  }, [startDate, endDate, minDate, maxDate, onChange, value]);

  // Handle preset button clicks
  const handlePresetClick = (presetKey) => {
    const { start, end } = DATE_PRESETS[presetKey].getDates();
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  // Handle manual date input
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon color="primary" />
          <Typography variant="h6">Date Range</Typography>
        </Box>

        {/* Quick Preset Buttons */}
        <ButtonGroup variant="outlined" size="small" fullWidth>
          {Object.entries(DATE_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              onClick={() => handlePresetClick(key)}
              sx={{ textTransform: 'none' }}
            >
              {preset.label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Custom Date Range Inputs */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minDate,
              max: endDate
            }}
            size="small"
            fullWidth
            error={!!error}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            to
          </Typography>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: startDate,
              max: maxDate
            }}
            size="small"
            fullWidth
            error={!!error}
          />
        </Box>

        {/* Validation Error Message */}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}

        {/* Date Range Summary */}
        {!error && startDate && endDate && (
          <Typography variant="caption" color="text.secondary">
            Selected: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            {' '}({Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days)
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
