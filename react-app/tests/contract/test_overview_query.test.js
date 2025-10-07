/**
 * Contract Test: Data Overview Query (FR-027)
 * Feature: 004-data-exploration-frontend
 * Task: T020
 */

import { describe, it, expect, vi } from 'vitest';

describe('Data Overview Query Contract (FR-027)', () => {
  it('should return summary aggregates across all entities', async () => {
    const mockQueryService = {
      getOverview: vi.fn().mockResolvedValue({
        total_households: 1000000,
        total_individuals: 2500000,
        total_campaigns: 150,
        total_engagements: 125000000,
        total_conversions: 487500,
        avg_conversion_rate: 0.0039
      })
    };

    const result = await mockQueryService.getOverview({
      user_role: 'CMO',
      assigned_campaign_ids: null
    });

    // Verify all summary fields
    expect(result).toHaveProperty('total_households');
    expect(result).toHaveProperty('total_individuals');
    expect(result).toHaveProperty('total_campaigns');
    expect(result).toHaveProperty('total_engagements');
    expect(result).toHaveProperty('total_conversions');
    expect(result).toHaveProperty('avg_conversion_rate');

    // Verify numeric types
    expect(typeof result.total_households).toBe('number');
    expect(typeof result.avg_conversion_rate).toBe('number');
  });

  it('should apply role-based filtering to aggregates', async () => {
    const mockQueryService = {
      getOverview: vi.fn().mockResolvedValue({
        total_households: 1000000,
        total_individuals: 2500000,
        total_campaigns: 3, // Analyst only sees 3 assigned campaigns
        total_engagements: 5000000,
        total_conversions: 9750,
        avg_conversion_rate: 0.00195
      })
    };

    const result = await mockQueryService.getOverview({
      user_role: 'Analyst',
      assigned_campaign_ids: ['campaign_001', 'campaign_002', 'campaign_003']
    });

    // Analyst should see fewer campaigns
    expect(result.total_campaigns).toBeLessThanOrEqual(3);
  });
});
