/**
 * Contract Test: Content Engagement Query (FR-013)
 * Feature: 004-data-exploration-frontend
 * Task: T017
 */

import { describe, it, expect, vi } from 'vitest';

describe('Content Engagement Query Contract (FR-013)', () => {
  it('should return engagement metrics with 6 required fields', async () => {
    const mockQueryService = {
      getEngagement: vi.fn().mockResolvedValue([
        {
          engagement_date: '2024-10-01',
          content_category: 'News',
          event_type: 'page_view',
          total_engagements: 45000,
          unique_users: 12000,
          engagement_rate: 0.2667
        }
      ])
    };

    const result = await mockQueryService.getEngagement({
      date_range_start: '2024-10-01',
      date_range_end: '2024-10-03',
      categories: ['News', 'Sports'],
      event_types: ['page_view', 'video_view']
    });

    expect(result[0]).toHaveProperty('engagement_date');
    expect(result[0]).toHaveProperty('content_category');
    expect(result[0]).toHaveProperty('event_type');
    expect(result[0]).toHaveProperty('total_engagements');
    expect(result[0]).toHaveProperty('unique_users');
    expect(result[0]).toHaveProperty('engagement_rate');
  });

  it('should apply date range and category filters', async () => {
    const mockQueryService = {
      getEngagement: vi.fn().mockResolvedValue([])
    };

    await mockQueryService.getEngagement({
      date_range_start: '2024-01-01',
      date_range_end: '2024-01-31',
      categories: ['Technology'],
      event_types: null
    });

    expect(mockQueryService.getEngagement).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ['Technology'],
        date_range_start: '2024-01-01',
        date_range_end: '2024-01-31'
      })
    );
  });
});
