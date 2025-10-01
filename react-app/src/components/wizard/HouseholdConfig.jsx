import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDistributionSlider } from '../../hooks/useDistributionSlider';
import { calculateMetrics, formatNumber } from '../../services/metricsCalculator';
import { validateDistributionSum } from '../../utils/proportionalRedistribute';

/**
 * Household Configuration Component (Step 1 of wizard)
 * Implements FR-006 through FR-010
 *
 * @param {Object} props
 * @param {Object} props.config - Current household configuration
 * @param {function} props.onUpdate - Callback when configuration updates
 * @param {function} props.onNext - Navigate to next step
 */
export function HouseholdConfig({ config, onUpdate, onNext }) {
  const householdConfig = config?.household || {};

  // Income bracket categories
  const incomeBrackets = ['< $30K', '$30K - $60K', '$60K - $100K', '$100K - $150K', '> $150K'];

  // Auto-adjusting income distribution sliders (FR-010)
  const {
    values: incomeBracketsValues,
    handleChange: handleIncomeBracketChange,
    getSum: getIncomeBracketsSum,
  } = useDistributionSlider(
    incomeBrackets,
    householdConfig.incomeBrackets || {},
    (newValues) => {
      onUpdate({ incomeBrackets: newValues });
    }
  );

  // Calculate estimated individuals (FR-007)
  const estimatedIndividuals = useMemo(() => {
    const metrics = calculateMetrics(config);
    return metrics.estimatedIndividuals;
  }, [config]);

  // Validate income brackets sum
  const incomeBracketsValid = validateDistributionSum(incomeBracketsValues);

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <HomeWorkIcon sx={{ fontSize: 32 }} color="primary" />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Household Configuration
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure the number of households and their characteristics
      </Typography>

      {/* Number of Households - Log Scale Slider (FR-006) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HomeIcon color="primary" />
            <Typography variant="h6">
              Number of Households
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total households to generate (1,000 - 10,000,000)
          </Typography>

          <Box sx={{ px: 2, mt: 2 }}>
            <Slider
              value={householdConfig.numHouseholds || 10000}
              onChange={(e, value) => onUpdate({ numHouseholds: value })}
              min={1000}
              max={10000000}
              step={1000}
              scale={(x) => x} // Linear for now, can add log scale if needed
              valueLabelDisplay="on"
              valueLabelFormat={(value) => formatNumber(value)}
              marks={[
                { value: 1000, label: '1K' },
                { value: 10000, label: '10K' },
                { value: 100000, label: '100K' },
                { value: 1000000, label: '1M' },
                { value: 10000000, label: '10M' },
              ]}
            />
          </Box>

          {/* Estimated Individuals Display (FR-007) */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Estimated Individuals:</strong> {formatNumber(estimatedIndividuals)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on average household size of {householdConfig.householdSizeMean || 2.5}
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Household Size Distribution (FR-008) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h6">
              Household Size Distribution
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Mean Household Size
              </Typography>
              <Slider
                value={householdConfig.householdSizeMean || 2.5}
                onChange={(e, value) => onUpdate({ householdSizeMean: value })}
                min={1}
                max={6}
                step={0.1}
                valueLabelDisplay="auto"
                marks
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Standard Deviation
              </Typography>
              <Slider
                value={householdConfig.householdSizeStdDev || 1.2}
                onChange={(e, value) => onUpdate({ householdSizeStdDev: value })}
                min={0.5}
                max={2.5}
                step={0.1}
                valueLabelDisplay="auto"
                marks
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Income Bracket Distribution (FR-009, FR-010) */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AttachMoneyIcon color="primary" />
            <Typography variant="h6">
              Income Bracket Distribution
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust one slider and others will automatically redistribute proportionally
          </Typography>

          <Box sx={{ mt: 2 }}>
            {incomeBrackets.map((bracket) => (
              <Box key={bracket} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{bracket}</Typography>
                  <Typography variant="body2" color="primary">
                    {((incomeBracketsValues[bracket] || 0) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Slider
                  value={incomeBracketsValues[bracket] || 0}
                  onChange={(e, value) => handleIncomeBracketChange(bracket, value)}
                  min={0}
                  max={1}
                  step={0.01}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                />
              </Box>
            ))}
          </Box>

          {/* Validation Message (FR-044) */}
          {!incomeBracketsValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Income brackets must sum to 100% (currently{' '}
              {(getIncomeBracketsSum() * 100).toFixed(1)}%)
            </Alert>
          )}
          {incomeBracketsValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Income brackets sum to 100%
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          disabled={!incomeBracketsValid}
          onClick={onNext}
          sx={{ minWidth: 150 }}
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
}
