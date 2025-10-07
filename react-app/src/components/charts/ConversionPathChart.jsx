/**
 * ConversionPathChart Component - Sankey diagram for conversion paths
 * Feature: 004-data-exploration-frontend
 * Task: T045
 */

import React from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import { Box, Typography } from '@mui/material';

export default function ConversionPathChart({
  data,
  title = 'Conversion Paths',
  height = 400
}) {
  if (!data || !data.nodes || !data.links) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No conversion path data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
      <Box sx={{ height }}>
        <ResponsiveSankey
          data={data}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: 'category10' }}
          nodeOpacity={1}
          nodeThickness={18}
          nodeInnerPadding={3}
          nodeSpacing={24}
          nodeBorderWidth={0}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={16}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        />
      </Box>
    </Box>
  );
}
