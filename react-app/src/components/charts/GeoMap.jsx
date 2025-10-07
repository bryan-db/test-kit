/**
 * GeoMap Component - Geographic visualization
 * Feature: 004-data-exploration-frontend
 * Task: T044
 */

import React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Box, Typography } from '@mui/material';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function GeoMap({
  data = {},
  title = 'Regional Performance',
  height = 400,
  metric = 'value'
}) {
  return (
    <Box>
      {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
      <Box sx={{ height, width: '100%' }}>
        <ComposableMap projection="geoAlbersUsa">
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const value = data[geo.id] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={value > 0 ? `rgba(25, 118, 210, ${Math.min(value / 100, 1)})` : '#DDD'}
                      stroke="#FFF"
                      style={{
                        hover: { fill: '#1976d2', outline: 'none' },
                        pressed: { fill: '#0d47a1', outline: 'none' }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </Box>
    </Box>
  );
}
