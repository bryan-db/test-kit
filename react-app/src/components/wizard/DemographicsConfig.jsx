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
import PeopleIcon from '@mui/icons-material/People';
import WcIcon from '@mui/icons-material/Wc';
import SchoolIcon from '@mui/icons-material/School';
import CakeIcon from '@mui/icons-material/Cake';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDistributionSlider } from '../../hooks/useDistributionSlider';
import { validateDistributionSum } from '../../utils/proportionalRedistribute';

/**
 * Demographics Configuration Component (Step 2 of wizard)
 * Implements FR-011 through FR-016
 *
 * @param {Object} props
 * @param {Object} props.config - Current demographics configuration
 * @param {function} props.onUpdate - Callback when configuration updates
 * @param {function} props.onNext - Navigate to next step
 * @param {function} props.onBack - Navigate to previous step
 */
export function DemographicsConfig({ config, onUpdate, onNext, onBack }) {
  const demographicsConfig = config?.demographics || {};

  // Gender categories (FR-012)
  const genderCategories = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  // Education level categories (FR-014)
  const educationLevels = [
    'Less than High School',
    'High School',
    'Some College',
    'Bachelor\'s Degree',
    'Graduate Degree',
  ];

  // Auto-adjusting gender distribution sliders (FR-013)
  const {
    values: genderValues,
    handleChange: handleGenderChange,
    getSum: getGenderSum,
  } = useDistributionSlider(
    genderCategories,
    demographicsConfig.genderDistribution || {},
    (newValues) => {
      onUpdate({ genderDistribution: newValues });
    }
  );

  // Auto-adjusting education distribution sliders (FR-015)
  const {
    values: educationValues,
    handleChange: handleEducationChange,
    getSum: getEducationSum,
  } = useDistributionSlider(
    educationLevels,
    demographicsConfig.educationDistribution || {},
    (newValues) => {
      onUpdate({ educationDistribution: newValues });
    }
  );

  // Validate age range (FR-045)
  const ageMin = demographicsConfig.ageMin || 18;
  const ageMax = demographicsConfig.ageMax || 65;
  const ageRangeValid = ageMin < ageMax;

  // Validate distributions
  const genderValid = validateDistributionSum(genderValues);
  const educationValid = validateDistributionSum(educationValues);

  // Overall validation
  const isValid = ageRangeValid && genderValid && educationValid;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <PeopleIcon sx={{ fontSize: 32 }} color="primary" />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Demographics Configuration
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure age ranges, gender distribution, education levels, and identity mappings
      </Typography>

      {/* Age Range Sliders (FR-011, FR-045) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CakeIcon color="primary" />
            <Typography variant="h6">
              Age Range
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set the minimum and maximum age for generated individuals
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Minimum Age
              </Typography>
              <Slider
                value={ageMin}
                onChange={(e, value) => onUpdate({ ageMin: value })}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0' },
                  { value: 18, label: '18' },
                  { value: 65, label: '65' },
                  { value: 100, label: '100' },
                ]}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Maximum Age
              </Typography>
              <Slider
                value={ageMax}
                onChange={(e, value) => onUpdate({ ageMax: value })}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0' },
                  { value: 18, label: '18' },
                  { value: 65, label: '65' },
                  { value: 100, label: '100' },
                ]}
              />
            </Grid>
          </Grid>

          {/* Age Range Validation (FR-045) */}
          {!ageRangeValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Minimum age must be less than maximum age (currently {ageMin} - {ageMax})
            </Alert>
          )}
          {ageRangeValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Valid age range: {ageMin} - {ageMax} years
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gender Distribution (FR-012, FR-013) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WcIcon color="primary" />
            <Typography variant="h6">
              Gender Distribution
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust one slider and others will automatically redistribute proportionally
          </Typography>

          <Box sx={{ mt: 2 }}>
            {genderCategories.map((category) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{category}</Typography>
                  <Typography variant="body2" color="primary">
                    {((genderValues[category] || 0) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Slider
                  value={genderValues[category] || 0}
                  onChange={(e, value) => handleGenderChange(category, value)}
                  min={0}
                  max={1}
                  step={0.01}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                />
              </Box>
            ))}
          </Box>

          {/* Gender Validation */}
          {!genderValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Gender distribution must sum to 100% (currently{' '}
              {(getGenderSum() * 100).toFixed(1)}%)
            </Alert>
          )}
          {genderValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Gender distribution sums to 100%
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Education Level Distribution (FR-014, FR-015) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">
              Education Level Distribution
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust one slider and others will automatically redistribute proportionally
          </Typography>

          <Box sx={{ mt: 2 }}>
            {educationLevels.map((level) => (
              <Box key={level} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{level}</Typography>
                  <Typography variant="body2" color="primary">
                    {((educationValues[level] || 0) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Slider
                  value={educationValues[level] || 0}
                  onChange={(e, value) => handleEducationChange(level, value)}
                  min={0}
                  max={1}
                  step={0.01}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                />
              </Box>
            ))}
          </Box>

          {/* Education Validation */}
          {!educationValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Education distribution must sum to 100% (currently{' '}
              {(getEducationSum() * 100).toFixed(1)}%)
            </Alert>
          )}
          {educationValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Education distribution sums to 100%
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Identity Mappings Per Person (FR-016) */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FingerprintIcon color="primary" />
            <Typography variant="h6">
              Identity Mappings
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Number of cross-device identifiers per individual (2-15)
          </Typography>

          <Box sx={{ px: 2, mt: 2 }}>
            <Slider
              value={demographicsConfig.identityMappingsPerPerson || 5}
              onChange={(e, value) => onUpdate({ identityMappingsPerPerson: value })}
              min={2}
              max={15}
              step={1}
              valueLabelDisplay="on"
              marks={[
                { value: 2, label: '2' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
              ]}
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Each individual will have{' '}
              <strong>{demographicsConfig.identityMappingsPerPerson || 5}</strong> unique
              device/identity mappings for cross-device tracking analysis.
            </Typography>
          </Alert>
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
