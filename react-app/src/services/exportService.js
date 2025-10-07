/**
 * Export Service - CSV and PNG Export Functionality
 * Feature: 004-data-exploration-frontend
 * Tasks: T034 (CSV), T035 (PNG)
 *
 * Features:
 * - CSV export for tabular data (FR-038)
 * - PNG export for visualizations (FR-039)
 * - Browser download triggers
 */

import html2canvas from 'html2canvas';

// ==========================================
// T034: CSV Export Functionality
// ==========================================

/**
 * Convert array of objects to CSV string
 *
 * @param {Array} data - Array of objects with consistent keys
 * @param {Array} columns - Optional column order/filter
 * @returns {string} CSV formatted string
 */
function arrayToCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Determine columns
  const headers = columns || Object.keys(data[0]);

  // Build CSV header row
  const headerRow = headers.map(escapeCSVField).join(',');

  // Build CSV data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVField(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field values (handle commas, quotes, newlines)
 *
 * @param {any} value - Field value
 * @returns {string} Escaped CSV field
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert arrays to JSON string
  if (Array.isArray(value)) {
    value = JSON.stringify(value);
  }

  // Convert objects to JSON string
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  const stringValue = String(value);

  // Escape double quotes
  const escaped = stringValue.replace(/"/g, '""');

  // Wrap in quotes if contains comma, quote, or newline
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }

  return escaped;
}

/**
 * Trigger browser download of CSV file
 *
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Filename (default: data.csv)
 */
function downloadCSV(csvContent, filename = 'data.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke object URL to free memory
  URL.revokeObjectURL(url);
}

/**
 * Export table data to CSV and trigger download
 *
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 * @param {Array} columns - Optional column order/filter
 */
export function exportToCSV(data, filename = 'export.csv', columns = null) {
  try {
    const csv = arrayToCSV(data, columns);

    if (!csv) {
      throw new Error('No data to export');
    }

    // Ensure filename has .csv extension
    if (!filename.endsWith('.csv')) {
      filename += '.csv';
    }

    downloadCSV(csv, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('CSV export failed:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// T035: PNG Export Functionality
// ==========================================

/**
 * Export chart/visualization element to PNG image
 *
 * @param {HTMLElement|string} elementOrSelector - DOM element or CSS selector
 * @param {string} filename - Output filename (default: chart.png)
 * @param {Object} options - html2canvas options (scale, backgroundColor, etc.)
 * @returns {Promise<Object>} Export result with success status
 */
export async function exportToPNG(elementOrSelector, filename = 'chart.png', options = {}) {
  try {
    // Get element
    const element = typeof elementOrSelector === 'string'
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;

    if (!element) {
      throw new Error(`Element not found: ${elementOrSelector}`);
    }

    // Default options for high-quality export
    const defaultOptions = {
      scale: 2, // 2x resolution for high DPI displays
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true, // Allow cross-origin images
      allowTaint: false
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Capture element as canvas
    const canvas = await html2canvas(element, mergedOptions);

    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    if (!blob) {
      throw new Error('Failed to generate PNG blob');
    }

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return { success: true, filename: link.download };
  } catch (error) {
    console.error('PNG export failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export Recharts/Nivo chart to PNG
 * Automatically finds the chart container and exports it
 *
 * @param {string} chartContainerId - ID or selector for chart container
 * @param {string} filename - Output filename
 * @returns {Promise<Object>} Export result
 */
export async function exportChartToPNG(chartContainerId, filename = 'chart.png') {
  // Add .png extension if not present
  if (!filename.endsWith('.png')) {
    filename += '.png';
  }

  return await exportToPNG(chartContainerId, filename, {
    scale: 3, // Higher resolution for charts
    backgroundColor: '#ffffff'
  });
}

// ==========================================
// Convenience Functions for Dashboard Exports
// ==========================================

/**
 * Export campaign performance table to CSV
 */
export function exportCampaignPerformance(campaigns) {
  const columns = [
    'campaign_id',
    'campaign_name',
    'start_date',
    'end_date',
    'target_segments',
    'channels',
    'total_impressions',
    'unique_reach',
    'total_spend',
    'conversion_count',
    'roi',
    'cpm'
  ];

  return exportToCSV(
    campaigns,
    `campaign_performance_${new Date().toISOString().split('T')[0]}.csv`,
    columns
  );
}

/**
 * Export audience segments to CSV
 */
export function exportAudienceSegments(segments) {
  const columns = [
    'segment_id',
    'segment_name',
    'segment_size',
    'behavioral_classification',
    'avg_propensity_to_convert',
    'total_conversions'
  ];

  return exportToCSV(
    segments,
    `audience_segments_${new Date().toISOString().split('T')[0]}.csv`,
    columns
  );
}

/**
 * Export content engagement metrics to CSV
 */
export function exportContentEngagement(engagements) {
  const columns = [
    'engagement_date',
    'content_category',
    'event_type',
    'total_engagements',
    'unique_users',
    'engagement_rate'
  ];

  return exportToCSV(
    engagements,
    `content_engagement_${new Date().toISOString().split('T')[0]}.csv`,
    columns
  );
}

/**
 * Export attribution comparison to CSV
 */
export function exportAttributionComparison(attributions) {
  const columns = [
    'campaign_id',
    'first_touch_conversions',
    'last_touch_conversions',
    'linear_conversions',
    'time_decay_conversions',
    'total_conversions'
  ];

  return exportToCSV(
    attributions,
    `attribution_comparison_${new Date().toISOString().split('T')[0]}.csv`,
    columns
  );
}

/**
 * Export funnel metrics to CSV
 */
export function exportFunnelMetrics(funnels) {
  const columns = [
    'campaign_id',
    'total_exposures',
    'unique_exposed',
    'total_responses',
    'unique_responders',
    'total_conversions',
    'exposure_to_response_rate',
    'response_to_conversion_rate',
    'overall_conversion_rate'
  ];

  return exportToCSV(
    funnels,
    `funnel_metrics_${new Date().toISOString().split('T')[0]}.csv`,
    columns
  );
}

export default {
  exportToCSV,
  exportToPNG,
  exportChartToPNG,
  exportCampaignPerformance,
  exportAudienceSegments,
  exportContentEngagement,
  exportAttributionComparison,
  exportFunnelMetrics
};
