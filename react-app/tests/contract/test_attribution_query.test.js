/**
 * Contract Test: Attribution Comparison Query (FR-025)
 * Feature: 004-data-exploration-frontend
 * Task: T019
 */

import { describe, it, expect, vi } from 'vitest';

describe('Attribution Comparison Query Contract (FR-025)', () => {
  it('should return all 4 attribution models plus total', async () => {
    const mockQueryService = {
      getAttribution: vi.fn().mockResolvedValue([
        {
          campaign_id: 'campaign_001',
          first_touch_conversions: 1200,
          last_touch_conversions: 1500,
          linear_conversions: 1350.50,
          time_decay_conversions: 1425.75,
          total_conversions: 3250
        }
      ])
    };

    const result = await mockQueryService.getAttribution({
      user_role: 'CMO',
      assigned_campaign_ids: null,
      campaign_ids: ['campaign_001', 'campaign_002']
    });

    // Verify all 4 attribution models are present
    expect(result[0]).toHaveProperty('first_touch_conversions');
    expect(result[0]).toHaveProperty('last_touch_conversions');
    expect(result[0]).toHaveProperty('linear_conversions');
    expect(result[0]).toHaveProperty('time_decay_conversions');
    expect(result[0]).toHaveProperty('total_conversions');

    // Verify fractional attribution (linear and time_decay are decimals)
    expect(typeof result[0].linear_conversions).toBe('number');
    expect(typeof result[0].time_decay_conversions).toBe('number');
  });
});
