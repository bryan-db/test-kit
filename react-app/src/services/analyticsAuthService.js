/**
 * Analytics Auth Service - User Role Resolution for Marketing Analytics
 * Feature: 004-data-exploration-frontend
 * Task: T031
 *
 * Extends base authService to query user_assignments table for role-based
 * access control (CMO vs Analyst with assigned campaigns/segments).
 */

import { getDBSQLClient } from './dbsqlClient';

/**
 * Fetch user role and assignments from user_assignments table
 *
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object>} User assignment object with role and allowed IDs
 */
export async function getUserAssignments(userEmail) {
  const dbsqlClient = getDBSQLClient();

  // Query user_assignments table (FR-040)
  const query = `
    SELECT
      user_id,
      user_email,
      user_role,
      assigned_campaign_ids,
      assigned_segment_ids
    FROM bryan_li.analytics.user_assignments
    WHERE user_email = :user_email
  `;

  const parameters = [
    { name: 'user_email', value: userEmail, type: 'STRING' }
  ];

  try {
    const results = await dbsqlClient.executeQuery(query, parameters);

    if (results.length === 0) {
      // User not found in assignments table - deny access
      throw new Error(`User ${userEmail} not found in analytics user assignments`);
    }

    const user = results[0];

    return {
      user_id: user.user_id,
      user_email: user.user_email,
      user_role: user.user_role, // 'CMO' or 'Analyst'
      assigned_campaign_ids: user.assigned_campaign_ids || null, // NULL for CMO
      assigned_segment_ids: user.assigned_segment_ids || null, // NULL for CMO
      is_cmo: user.user_role === 'CMO',
      is_analyst: user.user_role === 'Analyst'
    };
  } catch (error) {
    console.error('Failed to fetch user assignments:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific campaign
 *
 * @param {Object} userAssignments - User assignment object from getUserAssignments
 * @param {string} campaignId - Campaign ID to check
 * @returns {boolean} True if user can access campaign
 */
export function canAccessCampaign(userAssignments, campaignId) {
  if (userAssignments.is_cmo) {
    // CMOs can access all campaigns
    return true;
  }

  if (!userAssignments.assigned_campaign_ids) {
    // Analyst with no campaign assignments
    return false;
  }

  // Check if campaign is in assigned list
  return userAssignments.assigned_campaign_ids.includes(campaignId);
}

/**
 * Check if user has access to a specific segment
 *
 * @param {Object} userAssignments - User assignment object from getUserAssignments
 * @param {string} segmentId - Segment ID to check
 * @returns {boolean} True if user can access segment
 */
export function canAccessSegment(userAssignments, segmentId) {
  if (userAssignments.is_cmo) {
    // CMOs can access all segments
    return true;
  }

  if (!userAssignments.assigned_segment_ids) {
    // Analyst with no segment assignments
    return false;
  }

  // Check if segment is in assigned list
  return userAssignments.assigned_segment_ids.includes(segmentId);
}

/**
 * Build role-based filter for DBSQL queries (FR-042)
 *
 * Injects appropriate WHERE clause based on user role:
 * - CMO: No filtering (sees all data)
 * - Analyst: Filtered by assigned_campaign_ids or assigned_segment_ids
 *
 * @param {Object} userAssignments - User assignment object
 * @param {string} entityType - 'campaign' or 'segment'
 * @returns {Object} Filter object with SQL clause and parameters
 */
export function buildRoleBasedFilter(userAssignments, entityType = 'campaign') {
  if (userAssignments.is_cmo) {
    // CMO sees everything - no filter needed
    return {
      sqlClause: '1=1', // Always true
      parameters: []
    };
  }

  // Analyst - filter by assignments
  if (entityType === 'campaign') {
    const assignedIds = userAssignments.assigned_campaign_ids || [];

    if (assignedIds.length === 0) {
      // No campaigns assigned - return empty results
      return {
        sqlClause: '1=0', // Always false
        parameters: []
      };
    }

    return {
      sqlClause: 'campaign_id IN (:assigned_campaign_ids)',
      parameters: [
        { name: 'assigned_campaign_ids', value: assignedIds, type: 'ARRAY' }
      ]
    };
  } else if (entityType === 'segment') {
    const assignedIds = userAssignments.assigned_segment_ids || [];

    if (assignedIds.length === 0) {
      return {
        sqlClause: '1=0',
        parameters: []
      };
    }

    return {
      sqlClause: 'segment_id IN (:assigned_segment_ids)',
      parameters: [
        { name: 'assigned_segment_ids', value: assignedIds, type: 'ARRAY' }
      ]
    };
  }

  throw new Error(`Unknown entity type: ${entityType}. Expected 'campaign' or 'segment'.`);
}

/**
 * React hook for analytics authentication
 * Fetches user assignments on mount and provides role-based access functions
 */
import { useState, useEffect } from 'react';
import { useAuth } from './authService';

export function useAnalyticsAuth() {
  const { token, isAuthenticated, getAccessToken } = useAuth();
  const [userAssignments, setUserAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserAssignments() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // DEV MODE: Skip user_assignments table query and use mock CMO user
        if (import.meta.env.DEV || import.meta.env.VITE_DEV_TOKEN) {
          console.log('DEV MODE: Using mock CMO user assignments');
          setUserAssignments({
            user_id: 'dev-user-1',
            user_email: 'bryan.li@databricks.com',
            user_role: 'CMO',
            assigned_campaign_ids: null,
            assigned_segment_ids: null,
            is_cmo: true,
            is_analyst: false
          });
          setError(null);
          setLoading(false);
          return;
        }

        // PRODUCTION: Query user_assignments table
        const userEmail = import.meta.env.VITE_USER_EMAIL || 'bryan.li@databricks.com';
        const assignments = await getUserAssignments(userEmail);
        setUserAssignments(assignments);
        setError(null);
      } catch (err) {
        console.error('Failed to load user assignments:', err);
        setError(err.message);
        setUserAssignments(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAssignments();
  }, [isAuthenticated, token]);

  return {
    userAssignments,
    loading,
    error,
    canAccessCampaign: (campaignId) => userAssignments && canAccessCampaign(userAssignments, campaignId),
    canAccessSegment: (segmentId) => userAssignments && canAccessSegment(userAssignments, segmentId),
    buildRoleBasedFilter: (entityType) => userAssignments && buildRoleBasedFilter(userAssignments, entityType),
    isCMO: userAssignments?.is_cmo || false,
    isAnalyst: userAssignments?.is_analyst || false
  };
}

export default {
  getUserAssignments,
  canAccessCampaign,
  canAccessSegment,
  buildRoleBasedFilter,
  useAnalyticsAuth
};
