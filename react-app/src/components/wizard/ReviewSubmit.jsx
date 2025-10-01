import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { calculateMetrics, formatNumber } from '../../services/metricsCalculator';
import { useAuth } from '../../services/authService';
import { createDatabricksClient } from '../../services/databricksApi';

/**
 * Review & Submit Component (Step 5 of wizard)
 * Implements FR-029 through FR-035
 *
 * @param {Object} props
 * @param {Object} props.config - Complete configuration object
 * @param {function} props.onUpdate - Callback for output config updates
 * @param {function} props.onBack - Navigate to previous step
 * @param {function} props.onJobSubmitted - Callback when job is submitted (receives runId)
 */
export function ReviewSubmit({ config, onUpdate, onBack, onJobSubmitted }) {
  const { getAccessToken } = useAuth();
  const [catalog, setCatalog] = useState(config?.output?.catalog || 'bryan_li');
  const [schema, setSchema] = useState(config?.output?.schema || 'synthetic_data');
  const [seed, setSeed] = useState(config?.output?.seed || Math.floor(Math.random() * 1000000));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Calculate estimated metrics (FR-030)
  const metrics = useMemo(() => calculateMetrics(config), [config]);

  // Estimate generation time (FR-031)
  const estimatedMinutes = useMemo(() => {
    const households = config?.household?.numHouseholds || 10000;
    if (households < 50000) return '< 2';
    if (households < 100000) return '2-4';
    if (households < 500000) return '3-4';
    return '4-5';
  }, [config?.household?.numHouseholds]);

  // Handle job submission (FR-035)
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Update output configuration
      onUpdate({ catalog, schema, seed });

      // Create API client
      const client = createDatabricksClient(getAccessToken);

      // Submit job with full configuration
      const fullConfig = {
        ...config,
        output: { catalog, schema, seed },
      };

      console.log('Submitting job with config:', fullConfig);
      const runId = await client.submitJob(fullConfig);

      console.log('Job submitted successfully! Run ID:', runId);

      // Notify parent component
      if (onJobSubmitted) {
        onJobSubmitted(runId);
      }
    } catch (error) {
      console.error('Job submission failed:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <SummarizeIcon sx={{ fontSize: 32 }} color="primary" />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Review & Submit
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review your configuration and submit the generation job
      </Typography>

      {/* Configuration Summary (FR-029) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration Summary
          </Typography>

          {/* Household Summary */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                Household Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Number of Households
                  </Typography>
                  <Typography variant="body2">
                    {formatNumber(config?.household?.numHouseholds || 10000)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Household Size
                  </Typography>
                  <Typography variant="body2">
                    {config?.household?.avgHouseholdSize || 2.5}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Demographics Summary */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                Demographics Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Age Range
                  </Typography>
                  <Typography variant="body2">
                    {config?.demographics?.ageMin || 18} - {config?.demographics?.ageMax || 65} years
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Identity Mappings
                  </Typography>
                  <Typography variant="body2">
                    {config?.demographics?.identityMappingsPerPerson || 5} per person
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Engagement Summary */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                Engagement Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Time Period
                  </Typography>
                  <Typography variant="body2">
                    {config?.engagement?.timePeriodDays || 30} days
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Events Per Person
                  </Typography>
                  <Typography variant="body2">
                    {config?.engagement?.eventsPerPerson || 100} / year
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Campaign Summary */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                Campaign Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Number of Campaigns
                  </Typography>
                  <Typography variant="body2">
                    {config?.campaign?.numCampaigns || 10}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Reach Percentage
                  </Typography>
                  <Typography variant="body2">
                    {((config?.campaign?.reachPercentage || 0.1) * 100).toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Estimated Metrics (FR-030) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estimated Output Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Total Events
              </Typography>
              <Typography variant="h6" color="primary">
                {formatNumber(metrics.estimatedTotalEvents)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Total Individuals
              </Typography>
              <Typography variant="h6" color="primary">
                {formatNumber(metrics.estimatedIndividuals)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Generation Time (FR-031)
              </Typography>
              <Typography variant="h6" color="primary">
                {estimatedMinutes} min
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Output Configuration (FR-032, FR-033) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Output Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Catalog"
                value={catalog}
                onChange={(e) => setCatalog(e.target.value)}
                helperText="Unity Catalog name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schema"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                helperText="Schema within catalog"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Random Seed (FR-032)"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value))}
                helperText="For reproducible results"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Permission Warning (FR-034) */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Required Permissions:</strong> Ensure you have SELECT, CREATE_TABLE, and MODIFY privileges on catalog <strong>{catalog}</strong>
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Run: GRANT MODIFY ON CATALOG {catalog} TO `your_user`
        </Typography>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            Job Submission Failed
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          disabled={submitting}
          sx={{ minWidth: 150 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          endIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ minWidth: 200 }}
        >
          {submitting ? 'Submitting...' : 'Submit Generation Job'}
        </Button>
      </Box>
    </Box>
  );
}
