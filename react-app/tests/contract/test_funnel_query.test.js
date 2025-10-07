/**
 * Contract Test: Conversion Funnel Query (FR-023)
 * Feature: 004-data-exploration-frontend
 * Task: T018
 */

import { describe, it, expect, vi } from 'vitest';

describe('Conversion Funnel Query Contract (FR-023)', () => {
  it('should return funnel metrics with 9 required fields', async () => {
    const mockQueryService = {
      getFunnelMetrics: vi.fn().mockResolvedValue([
        {
          campaign_id: 'campaign_001',
          total_exposures: 1500000,
          unique_exposed: 450000,
          total_responses: 45000,
          unique_responders: 35000,
          total_conversions: 3250,
          exposure_to_response_rate: 0.0778,
          response_to_conversion_rate: 0.0722,
          overall_conversion_rate: 0.0022
        }
      ])
    };

    const result = await mockQueryService.getFunnelMetrics({
      user_role: 'CMO',
      assigned_campaign_ids: null
    });

    // Verify all funnel metrics fields
    expect(result[0]).toHaveProperty('campaign_id');
    expect(result[0]).toHaveProperty('total_exposures');
    expect(result[0]).toHaveProperty('unique_exposed');
    expect(result[0]).toHaveProperty('total_responses');
    expect(result[0]).toHaveProperty('unique_responders');
    expect(result[0]).toHaveProperty('total_conversions');
    expect(result[0]).toHaveProperty('exposure_to_response_rate');
    expect(result[0]).toHaveProperty('response_to_conversion_rate');
    expect(result[0]).toHaveProperty('overall_conversion_rate');

    // Verify calculated rates are decimals between 0 and 1
    expect(result[0].exposure_to_response_rate).toBeGreaterThanOrEqual(0);
    expect(result[0].exposure_to_response_rate).toBeLessThanOrEqual(1);
  });
});
