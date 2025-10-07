/**
 * FunnelChart Component - Funnel visualization for conversion analysis
 * Feature: 004-data-exploration-frontend
 * Task: T042
 *
 * Uses Nivo Funnel for visualizing conversion stages:
 * - Exposures → Responses → Conversions
 * - Drop-off rates at each stage
 * - Percentage labels
 */

import React from 'react';
import { ResponsiveFunnel } from '@nivo/funnel';
import { Box, Typography, Paper } from '@mui/material';

/**
 * Calculate drop-off rate between stages
 */
function calculateDropoff(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((previous - current) / previous * 100).toFixed(1);
}

/**
 * Transform funnel metrics data to Nivo format
 */
function transformToFunnelData(funnelMetrics) {
  if (!funnelMetrics) return [];

  const {
    total_exposures = 0,
    total_responses = 0,
    total_conversions = 0
  } = funnelMetrics;

  return [
    {
      id: 'exposures',
      value: total_exposures,
      label: 'Exposures',
      percentage: 100
    },
    {
      id: 'responses',
      value: total_responses,
      label: 'Responses',
      percentage: total_exposures ? (total_responses / total_exposures * 100).toFixed(1) : 0,
      dropoff: calculateDropoff(total_responses, total_exposures)
    },
    {
      id: 'conversions',
      value: total_conversions,
      label: 'Conversions',
      percentage: total_responses ? (total_conversions / total_responses * 100).toFixed(1) : 0,
      dropoff: calculateDropoff(total_conversions, total_responses)
    }
  ];
}

export default function FunnelChart({
  data,
  title = 'Conversion Funnel',
  height = 400,
  colors = { scheme: 'blues' },
  showLabels = true,
  showPercentages = true
}) {
  const funnelData = transformToFunnelData(data);

  if (!data || funnelData.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No funnel data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      {/* Funnel Visualization */}
      <Box sx={{ height }}>
        <ResponsiveFunnel
          data={funnelData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          valueFormat=">-.4s"
          colors={colors}
          borderWidth={20}
          borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
          borderOpacity={1}
          labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
          beforeSeparatorLength={100}
          beforeSeparatorOffset={20}
          afterSeparatorLength={100}
          afterSeparatorOffset={20}
          currentPartSizeExtension={10}
          currentBorderWidth={40}
          motionConfig="gentle"
          enableLabel={showLabels}
          label={(d) => {
            if (showPercentages) {
              return `${d.data.label}: ${d.data.value.toLocaleString()} (${d.data.percentage}%)`;
            }
            return `${d.data.label}: ${d.data.value.toLocaleString()}`;
          }}
        />
      </Box>

      {/* Drop-off Summary */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Drop-off Analysis
        </Typography>
        {funnelData.map((stage, index) => {
          if (index === 0) return null; // Skip first stage (no drop-off)

          return (
            <Box key={stage.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">
                {funnelData[index - 1].label} → {stage.label}
              </Typography>
              <Typography variant="body2" color="error">
                -{stage.dropoff}% drop-off
              </Typography>
            </Box>
          );
        })}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #ddd' }}>
          <Typography variant="body2" fontWeight="bold">
            Overall Conversion Rate
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {data?.overall_conversion_rate
              ? `${(data.overall_conversion_rate * 100).toFixed(2)}%`
              : 'N/A'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
