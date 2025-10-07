/**
 * HeatmapChart Component - Temporal pattern visualization
 * Feature: 004-data-exploration-frontend
 * Task: T043
 */

import React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Typography } from '@mui/material';

export default function HeatmapChart({
  data,
  title = 'Engagement Heatmap',
  height = 400,
  colors = 'blues'
}) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No heatmap data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
      <Box sx={{ height }}>
        <ResponsiveHeatMap
          data={data}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.2s"
          axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: -90, legend: '', legendOffset: 46 }}
          axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: 'Day of Week', legendPosition: 'middle', legendOffset: -72 }}
          colors={{ type: 'sequential', scheme: colors }}
          emptyColor="#555555"
          legends={[{
            anchor: 'bottom',
            translateX: 0,
            translateY: 30,
            length: 400,
            thickness: 8,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            title: 'Engagement →',
            titleAlign: 'start',
            titleOffset: 4
          }]}
        />
      </Box>
    </Box>
  );
}
