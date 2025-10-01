import React, { useState, useCallback } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { formatNumber } from '../../utils/formatters';

/**
 * Logarithmic Scale Slider Component for 1K-10M household scale
 * Implements FR-006 (numHouseholds slider with logarithmic scale)
 *
 * @param {Object} props
 * @param {number} props.value - Current value (linear scale)
 * @param {function} props.onChange - Callback when value changes
 * @param {number} props.min - Minimum value (default: 1000)
 * @param {number} props.max - Maximum value (default: 10000000)
 * @param {string} props.label - Slider label
 */
export function LogScaleSlider({
  value = 10000,
  onChange,
  min = 1000,
  max = 10000000,
  label = 'Number of Households',
}) {
  // Convert linear value to log position for slider
  const valueToPosition = useCallback(
    (val) => {
      const minLog = Math.log10(min);
      const maxLog = Math.log10(max);
      return ((Math.log10(val) - minLog) / (maxLog - minLog)) * 100;
    },
    [min, max]
  );

  // Convert slider position back to linear value
  const positionToValue = useCallback(
    (pos) => {
      const minLog = Math.log10(min);
      const maxLog = Math.log10(max);
      const logValue = minLog + (pos / 100) * (maxLog - minLog);
      return Math.round(Math.pow(10, logValue));
    },
    [min, max]
  );

  const [sliderPosition, setSliderPosition] = useState(valueToPosition(value));

  const handleSliderChange = (e, newPosition) => {
    setSliderPosition(newPosition);
    const newValue = positionToValue(newPosition);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Custom marks at log scale intervals
  const marks = [
    { value: 0, label: '1K' },
    { value: 25, label: '10K' },
    { value: 50, label: '100K' },
    { value: 75, label: '1M' },
    { value: 100, label: '10M' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="primary" fontWeight={600}>
          {formatNumber(value)}
        </Typography>
      </Box>
      <Box sx={{ px: 2 }}>
        <Slider
          value={sliderPosition}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={0.1}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={() => formatNumber(positionToValue(sliderPosition))}
        />
      </Box>
    </Box>
  );
}
