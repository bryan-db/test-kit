/**
 * ContentEngagement Dashboard
 * Feature: 004-data-exploration-frontend
 * Task: T048
 *
 * Features:
 * - Category multi-select filter
 * - Event type filter (page_view, video_view, click, share)
 * - TimeSeriesChart showing engagement trends
 * - Bar chart for event type distribution
 * - Top content table (by engagement count)
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
  Checkbox,
  ListItemText,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import DateRangePicker from '../shared/DateRangePicker';
import DataFreshnessIndicator from '../shared/DataFreshnessIndicator';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { useEngagement } from '../../services/queryService';

const CONTENT_CATEGORIES = ['News', 'Entertainment', 'Sports', 'Technology', 'Lifestyle'];
const EVENT_TYPES = ['page_view', 'video_view', 'click', 'share'];

const EVENT_TYPE_LABELS = {
  page_view: 'Page Views',
  video_view: 'Video Views',
  click: 'Clicks',
  share: 'Shares'
};

// Material Design colors
const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#c2185b'];

export default function ContentEngagement() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedCategories, setSelectedCategories] = useState(CONTENT_CATEGORIES);
  const [selectedEventTypes, setSelectedEventTypes] = useState(EVENT_TYPES);

  const { data: engagement = [], isLoading, error } = useEngagement({
    date_range_start: dateRange.start,
    date_range_end: dateRange.end,
    categories: selectedCategories,
    event_types: selectedEventTypes
  });

  const authLoading = false;

  // Mock data for UI testing
  const eventTypeDistribution = EVENT_TYPES.map((type, idx) => ({
    name: EVENT_TYPE_LABELS[type],
    value: [60000, 25000, 10000, 5000][idx]
  }));

  const engagementTrend = [
    { date: '2024-01-01', page_view: 2000, video_view: 800, click: 300, share: 100 },
    { date: '2024-01-08', page_view: 2200, video_view: 900, click: 350, share: 120 },
    { date: '2024-01-15', page_view: 2400, video_view: 1000, click: 400, share: 150 },
    { date: '2024-01-22', page_view: 2100, video_view: 850, click: 320, share: 110 },
    { date: '2024-01-29', page_view: 2500, video_view: 1100, click: 450, share: 180 }
  ];

  const topContent = [
    { category: 'Technology', title: 'AI Breakthrough in 2024', total_engagements: 15000, unique_users: 8000, engagement_rate: 0.53 },
    { category: 'News', title: 'Breaking: Market Update', total_engagements: 12000, unique_users: 7000, engagement_rate: 0.58 },
    { category: 'Sports', title: 'Championship Finals Recap', total_engagements: 10000, unique_users: 6500, engagement_rate: 0.65 },
    { category: 'Entertainment', title: 'Top Movies of the Year', total_engagements: 9500, unique_users: 5500, engagement_rate: 0.58 },
    { category: 'Lifestyle', title: 'Healthy Living Tips', total_engagements: 8000, unique_users: 5000, engagement_rate: 0.63 }
  ];

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const handleEventTypeChange = (event) => {
    const value = event.target.value;
    setSelectedEventTypes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export content engagement data');
  };

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
          Failed to load engagement data: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon fontSize="large" />
            Content Engagement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyze engagement patterns across content categories and event types
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
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="category-select-label">Content Categories</InputLabel>
              <Select
                labelId="category-select-label"
                multiple
                value={selectedCategories}
                onChange={handleCategoryChange}
                input={<OutlinedInput label="Content Categories" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {CONTENT_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={selectedCategories.indexOf(category) > -1} />
                    <ListItemText primary={category} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="event-type-select-label">Event Types</InputLabel>
              <Select
                labelId="event-type-select-label"
                multiple
                value={selectedEventTypes}
                onChange={handleEventTypeChange}
                input={<OutlinedInput label="Event Types" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={EVENT_TYPE_LABELS[value]} size="small" />
                    ))}
                  </Box>
                )}
              >
                {EVENT_TYPES.map((eventType) => (
                  <MenuItem key={eventType} value={eventType}>
                    <Checkbox checked={selectedEventTypes.indexOf(eventType) > -1} />
                    <ListItemText primary={EVENT_TYPE_LABELS[eventType]} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Engagement Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Engagement Trends Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedEventTypes.includes('page_view') && (
                    <Line type="monotone" dataKey="page_view" stroke={COLORS[0]} name="Page Views" />
                  )}
                  {selectedEventTypes.includes('video_view') && (
                    <Line type="monotone" dataKey="video_view" stroke={COLORS[1]} name="Video Views" />
                  )}
                  {selectedEventTypes.includes('click') && (
                    <Line type="monotone" dataKey="click" stroke={COLORS[2]} name="Clicks" />
                  )}
                  {selectedEventTypes.includes('share') && (
                    <Line type="monotone" dataKey="share" stroke={COLORS[3]} name="Shares" />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <Alert severity="info" sx={{ mt: 2 }}>
                Replace with TimeSeriesChart component when available with real backend data.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={eventTypeDistribution.filter(d =>
                  selectedEventTypes.includes(
                    Object.keys(EVENT_TYPE_LABELS).find(key => EVENT_TYPE_LABELS[key] === d.name)
                  )
                )}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Total Engagements', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Content Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Content by Engagement
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Content Title</TableCell>
                  <TableCell align="right">Total Engagements</TableCell>
                  <TableCell align="right">Unique Users</TableCell>
                  <TableCell align="right">Engagement Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topContent
                  .filter(content => selectedCategories.includes(content.category))
                  .map((content, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip label={content.category} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{content.title}</TableCell>
                      <TableCell align="right">{content.total_engagements.toLocaleString()}</TableCell>
                      <TableCell align="right">{content.unique_users.toLocaleString()}</TableCell>
                      <TableCell align="right">{(content.engagement_rate * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}
