import React from 'react';
import { Box, Slider, Typography, Alert } from '@mui/material';
import { useDistributionSlider } from '../../hooks/useDistributionSlider';
import { validateDistributionSum } from '../../utils/proportionalRedistribute';

/**
 * Distribution Slider Component with auto-adjust logic
 * Implements FR-044 (distribution sum validation)
 *
 * @param {Object} props
 * @param {Array<string>} props.categories - Category names
 * @param {Object} props.values - Current distribution values
 * @param {function} props.onChange - Callback when values change
 * @param {string} props.title - Section title
 */
export function DistributionSlider({ categories, values, onChange, title }) {
  const {
    values: distributionValues,
    handleChange,
    getSum,
  } = useDistributionSlider(categories, values, onChange);

  const sum = getSum();
  const isValid = validateDistributionSum(distributionValues);

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Adjust one slider and others will automatically redistribute proportionally
      </Typography>

      <Box sx={{ mt: 2 }}>
        {categories.map((category) => (
          <Box key={category} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{category}</Typography>
              <Typography variant="body2" color="primary">
                {((distributionValues[category] || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>
            <Slider
              value={distributionValues[category] || 0}
              onChange={(e, value) => handleChange(category, value)}
              min={0}
              max={1}
              step={0.01}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
            />
          </Box>
        ))}
      </Box>

      {/* Sum validation display (FR-044) */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          Total: <strong>{(sum * 100).toFixed(1)}%</strong>
        </Typography>
        {!isValid && (
          <Alert severity="error">
            Distribution must sum to 100% (currently {(sum * 100).toFixed(1)}%)
          </Alert>
        )}
        {isValid && (
          <Alert severity="success">
            ✓ Distribution sums to 100%
          </Alert>
        )}
      </Box>
    </Box>
  );
}
