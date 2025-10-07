/**
 * CampaignPerformance Dashboard
 * Feature: 004-data-exploration-frontend
 * Task: T046
 *
 * Features:
 * - Campaign performance table with 10 columns
 * - Date range filter (FR-003)
 * - Search by campaign name
 * - Sort by any column
 * - Campaign detail modal with time series chart
 * - Role-based filtering (CMO sees all, Analyst sees assigned only)
 * - CSV export
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Campaign as CampaignIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import DateRangePicker from '../shared/DateRangePicker';
import DataFreshnessIndicator from '../shared/DataFreshnessIndicator';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { useAnalyticsAuth } from '../../services/analyticsAuthService';
import { useCampaigns } from '../../hooks/useCampaigns';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

export default function CampaignPerformance() {
  // Authentication and role-based access
  const { userAssignments, loading: authLoading, isCMO } = useAnalyticsAuth();

  // State
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Data fetching with React Query
  const { data: campaigns = [], isLoading, error } = useCampaigns(userAssignments, {
    date_range_start: dateRange.start,
    date_range_end: dateRange.end,
    search_term: searchTerm || null
  });

  // DataGrid columns (FR-004)
  const columns = [
    {
      field: 'campaign_name',
      headerName: 'Campaign Name',
      width: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => handleRowClick(params.row)}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      width: 120,
      type: 'date',
      valueFormatter: (params) => new Date(params).toLocaleDateString()
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      width: 120,
      type: 'date',
      valueFormatter: (params) => new Date(params).toLocaleDateString()
    },
    {
      field: 'target_segment',
      headerName: 'Target Segment',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" />
      )
    },
    {
      field: 'channels',
      headerName: 'Channels',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {params.value?.map((channel, idx) => (
            <Chip key={idx} label={channel} size="small" color="secondary" />
          ))}
        </Box>
      )
    },
    {
      field: 'total_impressions',
      headerName: 'Impressions',
      width: 120,
      type: 'number',
      valueFormatter: (params) => formatNumber(params)
    },
    {
      field: 'unique_reach',
      headerName: 'Unique Reach',
      width: 120,
      type: 'number',
      valueFormatter: (params) => formatNumber(params)
    },
    {
      field: 'total_spend',
      headerName: 'Spend',
      width: 120,
      type: 'number',
      valueFormatter: (params) => formatCurrency(params)
    },
    {
      field: 'conversion_count',
      headerName: 'Conversions',
      width: 110,
      type: 'number'
    },
    {
      field: 'conversion_rate',
      headerName: 'CVR',
      width: 100,
      type: 'number',
      valueFormatter: (params) => formatPercentage(params)
    }
  ];

  const handleRowClick = (campaign) => {
    setSelectedCampaign(campaign);
    setDetailModalOpen(true);
  };

  const handleExport = () => {
    // TODO: Implement CSV export using exportService
    console.log('Export campaigns data');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (authLoading) {
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
          Failed to load campaign data: {error.message}
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
            <CampaignIcon fontSize="large" />
            Campaign Performance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isCMO ? 'All campaigns' : 'Your assigned campaigns'}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <DataFreshnessIndicator tableName="campaign_performance_summary" />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <TextField
            fullWidth
            label="Search campaigns"
            placeholder="Search by campaign name..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Stack>
      </Paper>

      {/* Campaigns Table */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={campaigns}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.campaign_id}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
            sorting: {
              sortModel: [{ field: 'start_date', sort: 'desc' }]
            }
          }}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-cell:hover': {
              cursor: 'pointer'
            }
          }}
        />
      </Paper>

      {/* Campaign Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCampaign?.campaign_name}
        </DialogTitle>
        <DialogContent>
          {selectedCampaign && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {new Date(selectedCampaign.start_date).toLocaleDateString()} - {new Date(selectedCampaign.end_date).toLocaleDateString()}
              </Typography>

              {/* Summary Stats */}
              <Stack direction="row" spacing={3} sx={{ my: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Impressions</Typography>
                  <Typography variant="h6">{formatNumber(selectedCampaign.total_impressions)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Unique Reach</Typography>
                  <Typography variant="h6">{formatNumber(selectedCampaign.unique_reach)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Spend</Typography>
                  <Typography variant="h6">{formatCurrency(selectedCampaign.total_spend)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Conversions</Typography>
                  <Typography variant="h6">{selectedCampaign.conversion_count}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">CVR</Typography>
                  <Typography variant="h6">{formatPercentage(selectedCampaign.conversion_rate)}</Typography>
                </Box>
              </Stack>

              {/* Time Series Chart */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Campaign Performance Over Time
              </Typography>
              <Box sx={{ mt: 2, height: 300 }}>
                {/* TODO: Fetch time series data for this campaign */}
                <TimeSeriesChart
                  data={[]}
                  xKey="date"
                  yKeys={['impressions', 'conversions']}
                  colors={['#1976d2', '#388e3c']}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
