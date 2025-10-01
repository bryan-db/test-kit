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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
} from '@mui/material';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import EventIcon from '@mui/icons-material/Event';
import CategoryIcon from '@mui/icons-material/Category';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDistributionSlider } from '../../hooks/useDistributionSlider';
import { validateDistributionSum } from '../../utils/proportionalRedistribute';
import { calculateMetrics, formatNumber } from '../../services/metricsCalculator';

/**
 * Engagement Configuration Component (Step 3 of wizard)
 * Implements FR-017 through FR-023
 *
 * @param {Object} props
 * @param {Object} props.config - Current engagement configuration
 * @param {function} props.onUpdate - Callback when configuration updates
 * @param {function} props.onNext - Navigate to next step
 * @param {function} props.onBack - Navigate to previous step
 */
export function EngagementConfig({ config, onUpdate, onNext, onBack }) {
  const engagementConfig = config?.engagement || {};

  // Engagement type categories (FR-021)
  const engagementTypes = ['View', 'Click', 'Share', 'Like', 'Comment'];

  // Content categories (FR-020)
  const contentCategories = [
    'News',
    'Sports',
    'Entertainment',
    'Technology',
    'Health',
    'Finance',
    'Travel',
    'Food',
  ];

  // Auto-adjusting engagement type distribution sliders (FR-022)
  const {
    values: engagementTypeValues,
    handleChange: handleEngagementTypeChange,
    getSum: getEngagementTypeSum,
  } = useDistributionSlider(
    engagementTypes,
    engagementConfig.engagementTypeDistribution || {},
    (newValues) => {
      onUpdate({ engagementTypeDistribution: newValues });
    }
  );

  // Calculate estimated total events (FR-019)
  const estimatedTotalEvents = useMemo(() => {
    const metrics = calculateMetrics({ ...config, engagement: engagementConfig });
    return metrics.estimatedTotalEvents;
  }, [config, engagementConfig]);

  // Validate engagement type distribution
  const engagementTypeValid = validateDistributionSum(engagementTypeValues);

  // Handle content category selection
  const selectedCategories = engagementConfig.contentCategories || [];
  const handleCategoryToggle = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onUpdate({ contentCategories: newCategories });
  };

  // Validate at least one content category selected
  const categoriesValid = selectedCategories.length > 0;

  // Overall validation
  const isValid = engagementTypeValid && categoriesValid;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <TouchAppIcon sx={{ fontSize: 32 }} color="primary" />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Engagement Configuration
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure temporal patterns, content categories, and engagement types
      </Typography>

      {/* Time Period and Events Per Person (FR-017, FR-018) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EventIcon color="primary" />
            <Typography variant="h6">
              Time Period & Event Volume
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Time Period (days)
              </Typography>
              <Slider
                value={engagementConfig.timePeriodDays || 30}
                onChange={(e, value) => onUpdate({ timePeriodDays: value })}
                min={7}
                max={730}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 7, label: '7' },
                  { value: 30, label: '30' },
                  { value: 90, label: '90' },
                  { value: 365, label: '365' },
                  { value: 730, label: '730' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Duration of engagement data to generate (7-730 days)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Events Per Person (annual)
              </Typography>
              <Slider
                value={engagementConfig.eventsPerPerson || 100}
                onChange={(e, value) => onUpdate({ eventsPerPerson: value })}
                min={10}
                max={1000}
                step={10}
                valueLabelDisplay="auto"
                marks={[
                  { value: 10, label: '10' },
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1K' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Average events per individual per year (10-1000)
              </Typography>
            </Grid>
          </Grid>

          {/* Total Estimated Events Display (FR-019) */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Estimated Total Events:</strong> {formatNumber(estimatedTotalEvents)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on {engagementConfig.eventsPerPerson || 100} events/person/year over{' '}
              {engagementConfig.timePeriodDays || 30} days
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Content Categories (FR-020) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">
              Content Categories
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select content categories to include in engagement data
          </Typography>

          <FormGroup sx={{ mt: 2 }}>
            <Grid container spacing={1}>
              {contentCategories.map((category) => (
                <Grid item xs={6} sm={4} key={category}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                      />
                    }
                    label={category}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>

          {/* Category Validation */}
          {!categoriesValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please select at least one content category
            </Alert>
          )}
          {categoriesValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Engagement Type Distribution (FR-021, FR-022) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">
              Engagement Type Distribution
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust one slider and others will automatically redistribute proportionally
          </Typography>

          <Box sx={{ mt: 2 }}>
            {engagementTypes.map((type) => (
              <Box key={type} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{type}</Typography>
                  <Typography variant="body2" color="primary">
                    {((engagementTypeValues[type] || 0) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Slider
                  value={engagementTypeValues[type] || 0}
                  onChange={(e, value) => handleEngagementTypeChange(type, value)}
                  min={0}
                  max={1}
                  step={0.01}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                />
              </Box>
            ))}
          </Box>

          {/* Engagement Type Validation */}
          {!engagementTypeValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Engagement types must sum to 100% (currently{' '}
              {(getEngagementTypeSum() * 100).toFixed(1)}%)
            </Alert>
          )}
          {engagementTypeValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Engagement type distribution sums to 100%
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Temporal Pattern (FR-023) */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">
              Temporal Pattern
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the temporal distribution pattern for engagement events
          </Typography>

          <FormControl sx={{ mt: 2 }}>
            <RadioGroup
              value={engagementConfig.temporalPattern || 'uniform'}
              onChange={(e) => onUpdate({ temporalPattern: e.target.value })}
            >
              <FormControlLabel
                value="uniform"
                control={<Radio />}
                label="Uniform - Events distributed evenly over time"
              />
              <FormControlLabel
                value="daily"
                control={<Radio />}
                label="Daily Pattern - Higher activity during business hours"
              />
              <FormControlLabel
                value="weekly"
                control={<Radio />}
                label="Weekly Pattern - Higher activity on weekdays"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ minWidth: 150 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          disabled={!isValid}
          onClick={onNext}
          sx={{ minWidth: 150 }}
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
}
