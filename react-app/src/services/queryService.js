/**
 * Query Service - Unified interface for all marketing analytics queries
 * Feature: 004-data-exploration-frontend
 * Task: T033
 *
 * Features:
 * - Automatic sync table fallback (FR-031, FR-032)
 * - Role-based filtering integration (FR-042)
 * - React Query integration for caching
 * - Implements all 7 DBSQL query contracts
 */

import { getDBSQLClient } from './dbsqlClient';
import { buildRoleBasedFilter } from './analyticsAuthService';

/**
 * Query configuration with sync table fallback
 */
const QUERY_CONFIG = {
  useSyncTables: true, // FR-031: Prefer sync tables for <3s load time
  fallbackOnError: true, // FR-032: Fallback to gold Delta on sync unavailable
  cacheTime: 5 * 60 * 1000 // 5 minute cache for React Query
};

/**
 * Execute query with automatic sync table fallback
 *
 * @param {string} baseTableName - Base table name without catalog/schema
 * @param {string} query - SQL query template (use {table} placeholder)
 * @param {Array} parameters - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function executeWithFallback(baseTableName, query, parameters = []) {
  const dbsqlClient = getDBSQLClient();

  if (QUERY_CONFIG.useSyncTables) {
    try {
      // Try sync table first (FR-031)
      const syncQuery = query.replace(
        `bryan_li.analytics.${baseTableName}`,
        `bryan_li.analytics.${baseTableName}_sync`
      );

      const results = await dbsqlClient.executeQuery(syncQuery, parameters);
      console.debug(`Query succeeded using sync table: ${baseTableName}_sync`);
      return results;
    } catch (error) {
      console.warn(`Sync table ${baseTableName}_sync unavailable, falling back to gold Delta:`, error.message);

      if (!QUERY_CONFIG.fallbackOnError) {
        throw error;
      }

      // Fallback to gold Delta table (FR-032)
      const results = await dbsqlClient.executeQuery(query, parameters);
      console.debug(`Query succeeded using gold Delta table: ${baseTableName}`);
      return results;
    }
  } else {
    // Directly query gold Delta table
    return await dbsqlClient.executeQuery(query, parameters);
  }
}

// ==========================================
// FR-004: Campaign List Query
// ==========================================

/**
 * Get campaign performance summary with role-based filtering
 *
 * @param {Object} userAssignments - User assignments from analyticsAuthService
 * @param {Object} filters - Filter object with date_range_start, date_range_end, search_term, sort, pagination
 * @returns {Promise<Array>} Campaign performance records
 */
export async function getCampaigns(userAssignments, filters = {}) {
  const {
    date_range_start = '2024-01-01',
    date_range_end = '2024-12-31',
    search_term = null,
    sort_column = 'start_date',
    sort_direction = 'DESC',
    limit = 100,
    offset = 0
  } = filters;

  const roleFilter = buildRoleBasedFilter(userAssignments, 'campaign');

  const query = `
    SELECT
      campaign_id,
      campaign_name,
      start_date,
      end_date,
      target_segment,
      channels,
      total_impressions,
      unique_reach,
      total_spend,
      conversion_count,
      roi,
      cpm
    FROM bryan_li.analytics.campaign_performance_summary
    WHERE
      ${roleFilter.sqlClause}
      AND start_date >= :date_range_start
      AND end_date <= :date_range_end
      ${search_term ? "AND campaign_name LIKE CONCAT('%', :search_term, '%')" : ''}
    ORDER BY ${sort_column} ${sort_direction}
    LIMIT :limit OFFSET :offset
  `;

  const parameters = [
    ...roleFilter.parameters,
    { name: 'date_range_start', value: date_range_start, type: 'DATE' },
    { name: 'date_range_end', value: date_range_end, type: 'DATE' },
    { name: 'limit', value: limit, type: 'INT' },
    { name: 'offset', value: offset, type: 'INT' }
  ];

  if (search_term) {
    parameters.push({ name: 'search_term', value: search_term, type: 'STRING' });
  }

  return await executeWithFallback('campaign_performance_summary', query, parameters);
}

// ==========================================
// FR-009: Audience Segment List Query
// ==========================================

/**
 * Get audience segment summary with role-based filtering
 *
 * @param {Object} userAssignments - User assignments from analyticsAuthService
 * @returns {Promise<Array>} Audience segment records
 */
export async function getSegments(userAssignments) {
  const roleFilter = buildRoleBasedFilter(userAssignments, 'segment');

  const query = `
    SELECT
      segment_id,
      segment_name,
      segment_size,
      behavioral_classification,
      avg_propensity_to_convert,
      total_conversions
    FROM bryan_li.analytics.audience_segment_summary
    WHERE ${roleFilter.sqlClause}
    ORDER BY total_conversions DESC
  `;

  const parameters = roleFilter.parameters;

  return await executeWithFallback('audience_segment_summary', query, parameters);
}

// ==========================================
// FR-013: Content Engagement Metrics Query
// ==========================================

/**
 * Get content engagement metrics with date and category filters
 *
 * @param {Object} filters - Filter object with date_range, categories, event_types
 * @returns {Promise<Array>} Content engagement records
 */
export async function getEngagement(filters = {}) {
  const {
    date_range_start = '2024-01-01',
    date_range_end = '2024-12-31',
    categories = null,
    event_types = null
  } = filters;

  const query = `
    SELECT
      engagement_date,
      content_category,
      event_type,
      total_engagements,
      unique_users,
      engagement_rate
    FROM bryan_li.analytics.content_engagement_daily
    WHERE
      engagement_date >= :date_range_start
      AND engagement_date <= :date_range_end
      ${categories ? 'AND content_category IN (:categories)' : ''}
      ${event_types ? 'AND event_type IN (:event_types)' : ''}
    ORDER BY engagement_date DESC, total_engagements DESC
  `;

  const parameters = [
    { name: 'date_range_start', value: date_range_start, type: 'DATE' },
    { name: 'date_range_end', value: date_range_end, type: 'DATE' }
  ];

  if (categories) {
    parameters.push({ name: 'categories', value: categories, type: 'ARRAY' });
  }

  if (event_types) {
    parameters.push({ name: 'event_types', value: event_types, type: 'ARRAY' });
  }

  return await executeWithFallback('content_engagement_daily', query, parameters);
}

// ==========================================
// FR-023: Conversion Funnel Query
// ==========================================

/**
 * Get funnel metrics for campaigns with role-based filtering
 *
 * @param {Object} userAssignments - User assignments from analyticsAuthService
 * @returns {Promise<Array>} Funnel metrics records
 */
export async function getFunnelMetrics(userAssignments) {
  const roleFilter = buildRoleBasedFilter(userAssignments, 'campaign');

  const query = `
    SELECT
      campaign_id,
      total_exposures,
      unique_exposed,
      total_responses,
      unique_responders,
      total_conversions,
      exposure_to_response_rate,
      response_to_conversion_rate,
      overall_conversion_rate
    FROM bryan_li.analytics.conversion_funnel_metrics
    WHERE ${roleFilter.sqlClause}
    ORDER BY overall_conversion_rate DESC
  `;

  const parameters = roleFilter.parameters;

  return await executeWithFallback('conversion_funnel_metrics', query, parameters);
}

// ==========================================
// FR-025: Attribution Model Comparison Query
// ==========================================

/**
 * Get attribution comparison for selected campaigns
 *
 * @param {Object} userAssignments - User assignments from analyticsAuthService
 * @param {Array} campaignIds - Optional filter for specific campaigns
 * @returns {Promise<Array>} Attribution comparison records
 */
export async function getAttribution(userAssignments, campaignIds = null) {
  const roleFilter = buildRoleBasedFilter(userAssignments, 'campaign');

  const query = `
    SELECT
      campaign_id,
      first_touch_conversions,
      last_touch_conversions,
      linear_conversions,
      time_decay_conversions,
      total_conversions
    FROM bryan_li.analytics.attribution_comparison
    WHERE
      ${roleFilter.sqlClause}
      ${campaignIds ? 'AND campaign_id IN (:campaign_ids)' : ''}
    ORDER BY total_conversions DESC
  `;

  const parameters = [...roleFilter.parameters];

  if (campaignIds) {
    parameters.push({ name: 'campaign_ids', value: campaignIds, type: 'ARRAY' });
  }

  return await executeWithFallback('attribution_comparison', query, parameters);
}

// ==========================================
// FR-027: Data Overview Summary Query
// ==========================================

/**
 * Get summary statistics across all entities (with role-based filtering)
 *
 * @param {Object} userAssignments - User assignments from analyticsAuthService
 * @returns {Promise<Object>} Summary statistics object
 */
export async function getOverview(userAssignments) {
  const roleFilter = buildRoleBasedFilter(userAssignments, 'campaign');

  const query = `
    SELECT
      (SELECT COUNT(*) FROM bryan_li.synthetic_datasets.households) AS total_households,
      (SELECT COUNT(*) FROM bryan_li.synthetic_datasets.individuals) AS total_individuals,
      (SELECT COUNT(*) FROM bryan_li.synthetic_datasets.campaigns) AS total_campaigns,
      (SELECT SUM(event_count) FROM bryan_li.analytics.content_engagement_daily) AS total_engagements,
      (SELECT SUM(conversion_count) FROM bryan_li.analytics.campaign_performance_summary
       WHERE ${roleFilter.sqlClause}) AS total_conversions
  `;

  const parameters = roleFilter.parameters;

  const dbsqlClient = getDBSQLClient();
  const results = await dbsqlClient.executeQuery(query, parameters);

  // Return single object instead of array
  return results[0] || {};
}

// ==========================================
// React Query Integration
// ==========================================

/**
 * React Query hook for campaigns
 * Provides automatic caching, refetching, and loading states
 */
import { useQuery } from '@tanstack/react-query';

export function useCampaigns(userAssignments, filters) {
  return useQuery({
    queryKey: ['campaigns', userAssignments?.user_id, filters],
    queryFn: () => getCampaigns(userAssignments, filters),
    enabled: !!userAssignments,
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export function useSegments(userAssignments) {
  return useQuery({
    queryKey: ['segments', userAssignments?.user_id],
    queryFn: () => getSegments(userAssignments),
    enabled: !!userAssignments,
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export function useEngagement(filters) {
  return useQuery({
    queryKey: ['engagement', filters],
    queryFn: () => getEngagement(filters),
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export function useFunnelMetrics(userAssignments) {
  return useQuery({
    queryKey: ['funnelMetrics', userAssignments?.user_id],
    queryFn: () => getFunnelMetrics(userAssignments),
    enabled: !!userAssignments,
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export function useAttribution(userAssignments, campaignIds) {
  return useQuery({
    queryKey: ['attribution', userAssignments?.user_id, campaignIds],
    queryFn: () => getAttribution(userAssignments, campaignIds),
    enabled: !!userAssignments,
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export function useOverview(userAssignments) {
  return useQuery({
    queryKey: ['overview', userAssignments?.user_id],
    queryFn: () => getOverview(userAssignments),
    enabled: !!userAssignments,
    staleTime: QUERY_CONFIG.cacheTime,
    retry: 2
  });
}

export default {
  getCampaigns,
  getSegments,
  getEngagement,
  getFunnelMetrics,
  getAttribution,
  getOverview,
  useCampaigns,
  useSegments,
  useEngagement,
  useFunnelMetrics,
  useAttribution,
  useOverview
};
