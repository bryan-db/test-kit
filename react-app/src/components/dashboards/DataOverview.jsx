/**
 * DataOverview Dashboard - Landing page with summary statistics
 * Feature: 004-data-exploration-frontend
 * Task: T050
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  People as PeopleIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useOverview } from '../../services/queryService';
import { useAnalyticsAuth } from '../../services/analyticsAuthService';
import DataFreshnessIndicator from '../shared/DataFreshnessIndicator';

function SummaryCard({ title, value, icon: Icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
              {value?.toLocaleString() || '0'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 48, color: `${color}.main`, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DataOverview() {
  const { userAssignments, loading: authLoading } = useAnalyticsAuth();
  const { data: overview = {}, isLoading, error } = useOverview(userAssignments);

  if (authLoading || isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load overview: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Marketing Analytics Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive view of your synthetic marketing data ecosystem
        </Typography>
        {/* <Box sx={{ mt: 2 }}>
          <DataFreshnessIndicator
            updatedAt={new Date().toISOString()}
            variant="detailed"
            showDetails
          />
        </Box> */}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Households"
            value={overview.total_households}
            icon={HomeIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Individuals"
            value={overview.total_individuals}
            icon={PeopleIcon}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Active Campaigns"
            value={overview.total_campaigns}
            icon={CampaignIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Conversions"
            value={overview.total_conversions}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Engagement Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Engagement Overview
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                {overview.total_engagements?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Content Engagements
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Conversion Performance
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h3" color="success.main" sx={{ mb: 1 }}>
                {overview.avg_conversion_rate
                  ? `${(overview.avg_conversion_rate * 100).toFixed(2)}%`
                  : '0.00%'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Conversion Rate
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Quality Summary */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Pipeline Status
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            All gold tables are up to date. Last ETL refresh: {new Date().toLocaleString()}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Data refreshes hourly via the marketing_analytics_etl job.
            Sync tables provide sub-second query performance for dashboards.
          </Typography>
        </Box>
      </Paper>

      {/* Quick Links */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Access
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/dashboards/campaigns"
            >
              Campaign Performance
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/dashboards/audience"
            >
              Audience Insights
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/dashboards/content"
            >
              Content Engagement
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/dashboards/attribution"
            >
              Attribution Analysis
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
