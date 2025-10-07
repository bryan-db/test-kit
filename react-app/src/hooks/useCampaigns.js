/**
 * React Query hook for campaign data fetching
 * Feature: 004-data-exploration-frontend
 * Task: T046
 */

import { useQuery } from '@tanstack/react-query';
import { getCampaigns } from '../services/queryService';

/**
 * Fetch campaigns with role-based filtering and caching
 *
 * @param {Object} userAssignments - User assignment object from useAnalyticsAuth
 * @param {Object} filters - Filter object (date_range_start, date_range_end, search_term, etc.)
 * @returns {UseQueryResult} React Query result with campaigns data
 */
export function useCampaigns(userAssignments, filters = {}) {
  return useQuery({
    queryKey: ['campaigns', userAssignments?.user_id, filters],
    queryFn: () => getCampaigns(userAssignments, filters),
    enabled: !!userAssignments, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });
}

export default useCampaigns;
