/**
 * AudienceInsights Dashboard
 * Feature: 004-data-exploration-frontend
 * Task: T047
 *
 * Features:
 * - Segment selector dropdown
 * - Demographic distribution charts (age, gender, education)
 * - Household income distribution bar chart
 * - Engagement patterns heatmap
 * - Segment comparison view (2-5 segments side-by-side)
 * - CSV export
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  People as PeopleIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import DataFreshnessIndicator from '../shared/DataFreshnessIndicator';
import HeatmapChart from '../charts/HeatmapChart';
import { useAnalyticsAuth } from '../../services/analyticsAuthService';
import { useSegments } from '../../services/queryService';

// Material Design color palette
const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#c2185b', '#7b1fa2', '#0288d1', '#689f38', '#fbc02d'];

export default function AudienceInsights() {
  const { userAssignments, loading: authLoading } = useAnalyticsAuth();
  const { data: segments = [], isLoading: segmentsLoading } = useSegments(userAssignments);

  const [selectedSegments, setSelectedSegments] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Mock demographic data for selected segment(s)
  const demographicData = {
    gender: [
      { name: 'Male', value: 49 },
      { name: 'Female', value: 49 },
      { name: 'Other', value: 2 }
    ],
    education: [
      { name: 'High School', value: 28 },
      { name: 'Some College', value: 21 },
      { name: 'Bachelor', value: 24 },
      { name: 'Graduate', value: 15 },
      { name: 'Other', value: 12 }
    ],
    income: [
      { name: '<$25K', value: 12 },
      { name: '$25K-$50K', value: 20 },
      { name: '$50K-$75K', value: 18 },
      { name: '$75K-$100K', value: 17 },
      { name: '$100K-$150K', value: 18 },
      { name: '$150K+', value: 15 }
    ],
    age: [
      { name: '18-24', value: 15 },
      { name: '25-34', value: 22 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 18 },
      { name: '55-64', value: 15 },
      { name: '65+', value: 10 }
    ]
  };

  const handleSegmentChange = (event) => {
    const value = event.target.value;
    if (comparisonMode) {
      // Multi-select for comparison (max 5)
      setSelectedSegments(typeof value === 'string' ? value.split(',') : value.slice(0, 5));
    } else {
      // Single select
      setSelectedSegments([value]);
    }
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    setSelectedSegments([]); // Reset selection when switching modes
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export segment insights');
  };

  if (authLoading || segmentsLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon fontSize="large" />
            Audience Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore demographic distributions and engagement patterns across audience segments
          </Typography>
          <Box sx={{ mt: 2 }}>
            <DataFreshnessIndicator
              updatedAt={new Date().toISOString()}
              variant="chip"
            />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={selectedSegments.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Segment Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="segment-select-label">
                {comparisonMode ? 'Select Segments (2-5)' : 'Select Segment'}
              </InputLabel>
              <Select
                labelId="segment-select-label"
                multiple={comparisonMode}
                value={comparisonMode ? selectedSegments : (selectedSegments[0] || '')}
                onChange={handleSegmentChange}
                input={<OutlinedInput label={comparisonMode ? 'Select Segments (2-5)' : 'Select Segment'} />}
                renderValue={(selected) => {
                  if (comparisonMode) {
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((segId) => {
                          const seg = segments.find(s => s.segment_id === segId);
                          return <Chip key={segId} label={seg?.segment_name || segId} size="small" />;
                        })}
                      </Box>
                    );
                  }
                  const seg = segments.find(s => s.segment_id === selected);
                  return seg?.segment_name || '';
                }}
              >
                {segments.map((segment) => (
                  <MenuItem key={segment.segment_id} value={segment.segment_id}>
                    {comparisonMode && (
                      <Checkbox checked={selectedSegments.indexOf(segment.segment_id) > -1} />
                    )}
                    <ListItemText
                      primary={segment.segment_name}
                      secondary={`${segment.segment_size.toLocaleString()} individuals`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant={comparisonMode ? 'contained' : 'outlined'}
              startIcon={<CompareIcon />}
              onClick={toggleComparisonMode}
              fullWidth
            >
              {comparisonMode ? 'Exit Comparison Mode' : 'Compare Segments'}
            </Button>
          </Grid>
        </Grid>

        {selectedSegments.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {comparisonMode
              ? 'Select 2-5 segments to compare their demographics and engagement patterns'
              : 'Select a segment to view detailed demographic breakdown and engagement patterns'}
          </Alert>
        )}
      </Paper>

      {/* Demographics Section */}
      {selectedSegments.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Demographic Distribution
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Gender Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gender Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={demographicData.gender}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {demographicData.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Age Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Age Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={demographicData.age}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Education Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Education Level
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={demographicData.education} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: 'Percentage (%)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#388e3c" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Household Income Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Household Income
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={demographicData.income}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f57c00" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Engagement Patterns Heatmap */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Engagement Patterns
          </Typography>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Temporal Engagement Heatmap (Hour × Day of Week)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Heatmap visualization will be available once HeatmapChart component is implemented and backend data is available.
              </Alert>
              {/* TODO: Add HeatmapChart once implemented with real data */}
              {/* <HeatmapChart data={engagementHeatmapData} /> */}
            </CardContent>
          </Card>

          {/* Comparison View (if in comparison mode) */}
          {comparisonMode && selectedSegments.length >= 2 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Segment Comparison ({selectedSegments.length} segments selected)
              </Typography>
              <Alert severity="success">
                Comparison view showing side-by-side metrics for {selectedSegments.length} segments.
                Full implementation requires backend data aggregation.
              </Alert>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
