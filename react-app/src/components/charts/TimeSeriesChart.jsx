/**
 * TimeSeriesChart Component - Line/Area chart for temporal data
 * Feature: 004-data-exploration-frontend
 * Task: T041
 *
 * Uses Recharts for time-series visualization with support for:
 * - Multiple data series
 * - Configurable granularity (daily, weekly, monthly)
 * - 10K+ data points with downsampling
 * - Responsive design
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

// Colors for multiple series
const COLORS = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#00bcd4'];

/**
 * Format date for display based on granularity
 */
function formatDate(dateStr, granularity) {
  const date = new Date(dateStr);

  if (granularity === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (granularity === 'weekly') {
    return `Week ${Math.ceil((date.getDate()) / 7)}`;
  } else if (granularity === 'monthly') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  return dateStr;
}

/**
 * Aggregate data by granularity (simple implementation)
 */
function aggregateByGranularity(data, xKey, yKeys, granularity) {
  if (granularity === 'daily') {
    return data; // No aggregation needed
  }

  // Group by week or month
  const aggregated = {};

  data.forEach(item => {
    const date = new Date(item[xKey]);
    let key;

    if (granularity === 'weekly') {
      // Group by week (ISO week)
      const weekNum = Math.ceil(date.getDate() / 7);
      key = `${date.getFullYear()}-W${weekNum}`;
    } else if (granularity === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!aggregated[key]) {
      aggregated[key] = { [xKey]: key };
      yKeys.forEach(yKey => {
        aggregated[key][yKey] = 0;
      });
    }

    yKeys.forEach(yKey => {
      aggregated[key][yKey] += item[yKey] || 0;
    });
  });

  return Object.values(aggregated);
}

/**
 * Downsample data if too many points (LTTB algorithm simplified)
 */
function downsampleData(data, maxPoints = 1000) {
  if (data.length <= maxPoints) {
    return data;
  }

  const bucket = Math.ceil(data.length / maxPoints);
  const downsampled = [];

  for (let i = 0; i < data.length; i += bucket) {
    downsampled.push(data[i]);
  }

  return downsampled;
}

export default function TimeSeriesChart({
  data,
  xKey = 'date',
  yKeys = [],
  title = '',
  chartType = 'line', // 'line' or 'area'
  granularity = 'daily', // 'daily', 'weekly', 'monthly'
  showLegend = true,
  showGrid = true,
  height = 400,
  onGranularityChange = null
}) {
  // Process data
  const processedData = useMemo(() => {
    let result = data || [];

    // Aggregate by granularity
    result = aggregateByGranularity(result, xKey, yKeys, granularity);

    // Downsample if needed
    result = downsampleData(result, 1000);

    return result;
  }, [data, xKey, yKeys, granularity]);

  const handleGranularityChange = (event, newGranularity) => {
    if (newGranularity && onGranularityChange) {
      onGranularityChange(newGranularity);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const SeriesComponent = chartType === 'area' ? Area : Line;

  return (
    <Box>
      {/* Header with title and granularity selector */}
      {(title || onGranularityChange) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {title && <Typography variant="h6">{title}</Typography>}

          {onGranularityChange && (
            <ToggleButtonGroup
              value={granularity}
              exclusive
              onChange={handleGranularityChange}
              size="small"
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={processedData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}

          <XAxis
            dataKey={xKey}
            tickFormatter={(value) => formatDate(value, granularity)}
            stroke="#666"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            stroke="#666"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value;
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            labelFormatter={(value) => formatDate(value, granularity)}
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }}
          />

          {showLegend && <Legend />}

          {/* Render series */}
          {yKeys.map((key, index) => (
            <SeriesComponent
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              fill={chartType === 'area' ? COLORS[index % COLORS.length] : undefined}
              fillOpacity={chartType === 'area' ? 0.3 : undefined}
              strokeWidth={2}
              dot={processedData.length <= 50}
              activeDot={{ r: 6 }}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </Box>
  );
}
