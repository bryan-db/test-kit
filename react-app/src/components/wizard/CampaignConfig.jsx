import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Grid,
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ShareIcon from '@mui/icons-material/Share';
import PercentIcon from '@mui/icons-material/Percent';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Campaign Configuration Component (Step 4 of wizard)
 * Implements FR-024 through FR-028
 *
 * @param {Object} props
 * @param {Object} props.config - Current campaign configuration
 * @param {function} props.onUpdate - Callback when configuration updates
 * @param {function} props.onNext - Navigate to next step
 * @param {function} props.onBack - Navigate to previous step
 */
export function CampaignConfig({ config, onUpdate, onNext, onBack }) {
  const campaignConfig = config?.campaign || {};

  // Marketing channels (FR-026)
  const marketingChannels = [
    'Email',
    'Social Media',
    'Display Ads',
    'Search Ads',
    'TV',
    'Radio',
    'Print',
    'Direct Mail',
  ];

  // Handle marketing channel selection
  const selectedChannels = campaignConfig.marketingChannels || [];
  const handleChannelToggle = (channel) => {
    const newChannels = selectedChannels.includes(channel)
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel];
    onUpdate({ marketingChannels: newChannels });
  };

  // Validate campaign duration range (FR-045)
  const durationMin = campaignConfig.campaignDurationMin || 7;
  const durationMax = campaignConfig.campaignDurationMax || 30;
  const durationRangeValid = durationMin < durationMax;

  // Validate response rate range (FR-045)
  const responseRateMin = campaignConfig.responseRateMin || 0.01;
  const responseRateMax = campaignConfig.responseRateMax || 0.1;
  const responseRateRangeValid = responseRateMin < responseRateMax;

  // Validate at least one marketing channel selected
  const channelsValid = selectedChannels.length > 0;

  // Overall validation
  const isValid = durationRangeValid && responseRateRangeValid && channelsValid;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <CampaignIcon sx={{ fontSize: 32 }} color="primary" />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Campaign Configuration
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure marketing campaigns, channels, reach, and response rates
      </Typography>

      {/* Number of Campaigns (FR-024) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CampaignIcon color="primary" />
            <Typography variant="h6">
              Number of Campaigns
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total number of marketing campaigns to generate (1-100)
          </Typography>

          <Box sx={{ px: 2, mt: 2 }}>
            <Slider
              value={campaignConfig.numCampaigns || 10}
              onChange={(e, value) => onUpdate({ numCampaigns: value })}
              min={1}
              max={100}
              step={1}
              valueLabelDisplay="on"
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Campaign Duration Range (FR-025, FR-045) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DateRangeIcon color="primary" />
            <Typography variant="h6">
              Campaign Duration Range
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set the minimum and maximum duration for campaigns (in days)
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Minimum Duration (days)
              </Typography>
              <Slider
                value={durationMin}
                onChange={(e, value) => onUpdate({ campaignDurationMin: value })}
                min={1}
                max={365}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1' },
                  { value: 30, label: '30' },
                  { value: 90, label: '90' },
                  { value: 365, label: '365' },
                ]}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Maximum Duration (days)
              </Typography>
              <Slider
                value={durationMax}
                onChange={(e, value) => onUpdate({ campaignDurationMax: value })}
                min={1}
                max={365}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1' },
                  { value: 30, label: '30' },
                  { value: 90, label: '90' },
                  { value: 365, label: '365' },
                ]}
              />
            </Grid>
          </Grid>

          {/* Duration Range Validation */}
          {!durationRangeValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Minimum duration must be less than maximum duration (currently {durationMin} - {durationMax} days)
            </Alert>
          )}
          {durationRangeValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Valid duration range: {durationMin} - {durationMax} days
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Marketing Channels (FR-026) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ShareIcon color="primary" />
            <Typography variant="h6">
              Marketing Channels
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select marketing channels to include in campaign data
          </Typography>

          <FormGroup sx={{ mt: 2 }}>
            <Grid container spacing={1}>
              {marketingChannels.map((channel) => (
                <Grid item xs={6} sm={4} key={channel}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedChannels.includes(channel)}
                        onChange={() => handleChannelToggle(channel)}
                      />
                    }
                    label={channel}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>

          {/* Channel Validation */}
          {!channelsValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please select at least one marketing channel
            </Alert>
          )}
          {channelsValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ {selectedChannels.length} channel{selectedChannels.length === 1 ? '' : 's'} selected
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reach Percentage (FR-027) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PercentIcon color="primary" />
            <Typography variant="h6">
              Campaign Reach
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Percentage of individuals reached per campaign (1%-100%)
          </Typography>

          <Box sx={{ px: 2, mt: 2 }}>
            <Slider
              value={campaignConfig.reachPercentage || 0.1}
              onChange={(e, value) => onUpdate({ reachPercentage: value })}
              min={0.01}
              max={1.0}
              step={0.01}
              valueLabelDisplay="on"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              marks={[
                { value: 0.01, label: '1%' },
                { value: 0.25, label: '25%' },
                { value: 0.5, label: '50%' },
                { value: 0.75, label: '75%' },
                { value: 1.0, label: '100%' },
              ]}
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Each campaign will reach approximately{' '}
              <strong>{((campaignConfig.reachPercentage || 0.1) * 100).toFixed(0)}%</strong>{' '}
              of all individuals
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Response Rate Range (FR-028, FR-045) */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PercentIcon color="primary" />
            <Typography variant="h6">
              Response Rate Range
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set the minimum and maximum response rate for campaigns (as percentage)
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Minimum Response Rate
              </Typography>
              <Slider
                value={responseRateMin}
                onChange={(e, value) => onUpdate({ responseRateMin: value })}
                min={0.001}
                max={0.5}
                step={0.001}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                marks={[
                  { value: 0.001, label: '0.1%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                ]}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Maximum Response Rate
              </Typography>
              <Slider
                value={responseRateMax}
                onChange={(e, value) => onUpdate({ responseRateMax: value })}
                min={0.001}
                max={0.5}
                step={0.001}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                marks={[
                  { value: 0.001, label: '0.1%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                ]}
              />
            </Grid>
          </Grid>

          {/* Response Rate Range Validation */}
          {!responseRateRangeValid && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Minimum response rate must be less than maximum (currently{' '}
              {(responseRateMin * 100).toFixed(1)}% - {(responseRateMax * 100).toFixed(1)}%)
            </Alert>
          )}
          {responseRateRangeValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Valid response rate range: {(responseRateMin * 100).toFixed(1)}% - {(responseRateMax * 100).toFixed(1)}%
            </Alert>
          )}
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
          Review & Submit
        </Button>
      </Box>
    </Box>
  );
}
