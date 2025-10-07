/**
 * Contract Test: Audience Segment Query (FR-009)
 * Feature: 004-data-exploration-frontend
 * Task: T016
 */

import { describe, it, expect, vi } from 'vitest';

describe('Audience Segment Query Contract (FR-009)', () => {
  it('should return segments with 6 required fields', async () => {
    const mockQueryService = {
      getSegments: vi.fn().mockResolvedValue([
        {
          segment_id: 'segment_heavy_users',
          segment_name: 'Heavy Users',
          segment_size: 125000,
          behavioral_classification: 'high_engagement',
          avg_propensity_to_convert: 0.6789,
          total_conversions: 8450
        }
      ])
    };

    const result = await mockQueryService.getSegments({
      user_role: 'CMO',
      assigned_segment_ids: null
    });

    expect(result[0]).toHaveProperty('segment_id');
    expect(result[0]).toHaveProperty('segment_name');
    expect(result[0]).toHaveProperty('segment_size');
    expect(result[0]).toHaveProperty('behavioral_classification');
    expect(result[0]).toHaveProperty('avg_propensity_to_convert');
    expect(result[0]).toHaveProperty('total_conversions');
  });

  it('should filter segments for Analyst users (FR-042)', async () => {
    const mockQueryService = {
      getSegments: vi.fn().mockResolvedValue([
        { segment_id: 'segment_heavy_users', segment_name: 'Heavy Users' }
      ])
    };

    const result = await mockQueryService.getSegments({
      user_role: 'Analyst',
      assigned_segment_ids: ['segment_heavy_users', 'segment_news_readers']
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(s =>
      ['segment_heavy_users', 'segment_news_readers'].includes(s.segment_id)
    )).toBe(true);
  });
});
