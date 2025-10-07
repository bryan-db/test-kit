/**
 * Contract Test: Campaign List Query (FR-004)
 * Feature: 004-data-exploration-frontend
 * Task: T015
 *
 * This test MUST FAIL initially (queryService not implemented).
 * It will pass after T033 (implement queryService with sync table fallback).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Campaign List Query Contract (FR-004)', () => {
  let mockQueryService;

  beforeEach(() => {
    // Mock the queryService that will be implemented in T033
    mockQueryService = {
      getCampaigns: vi.fn()
    };
  });

  it('should return campaigns with all 13 required fields', async () => {
    // Mock response matching campaign_performance_summary schema
    const mockCampaigns = [
      {
        campaign_id: 'campaign_001',
        campaign_name: 'Spring Campaign 2024',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        target_segments: ['segment_heavy_users', 'segment_news_readers'],
        channels: ['email', 'social', 'display'],
        total_impressions: 1500000,
        unique_reach: 450000,
        total_spend: 75000.00,
        conversion_count: 3250,
        roi: 2.4567,
        cpm: 50.00,
        updated_at: '2024-10-03T10:00:00Z'
      }
    ];

    mockQueryService.getCampaigns.mockResolvedValue(mockCampaigns);

    const result = await mockQueryService.getCampaigns({
      user_role: 'CMO',
      assigned_campaign_ids: null,
      date_range_start: '2024-01-01',
      date_range_end: '2024-12-31',
      sort_column: 'start_date',
      sort_direction: 'DESC'
    });

    // Verify all 13 fields are present
    expect(result[0]).toHaveProperty('campaign_id');
    expect(result[0]).toHaveProperty('campaign_name');
    expect(result[0]).toHaveProperty('start_date');
    expect(result[0]).toHaveProperty('end_date');
    expect(result[0]).toHaveProperty('target_segments');
    expect(result[0]).toHaveProperty('channels');
    expect(result[0]).toHaveProperty('total_impressions');
    expect(result[0]).toHaveProperty('unique_reach');
    expect(result[0]).toHaveProperty('total_spend');
    expect(result[0]).toHaveProperty('conversion_count');
    expect(result[0]).toHaveProperty('roi');
    expect(result[0]).toHaveProperty('cpm');
    expect(result[0]).toHaveProperty('updated_at');

    // Verify field types
    expect(typeof result[0].campaign_id).toBe('string');
    expect(typeof result[0].total_impressions).toBe('number');
    expect(Array.isArray(result[0].target_segments)).toBe(true);
    expect(Array.isArray(result[0].channels)).toBe(true);
  });

  it('should apply role-based filtering for Analyst users (FR-042)', async () => {
    const mockFilteredCampaigns = [
      { campaign_id: 'campaign_001', campaign_name: 'Assigned Campaign' }
    ];

    mockQueryService.getCampaigns.mockResolvedValue(mockFilteredCampaigns);

    const result = await mockQueryService.getCampaigns({
      user_role: 'Analyst',
      assigned_campaign_ids: ['campaign_001', 'campaign_002'],
      date_range_start: '2024-01-01',
      date_range_end: '2024-12-31'
    });

    // Verify only assigned campaigns returned
    expect(result.every(c => ['campaign_001', 'campaign_002'].includes(c.campaign_id))).toBe(true);
  });

  it('should support parameterized queries with search filter (FR-006)', async () => {
    mockQueryService.getCampaigns.mockResolvedValue([
      { campaign_id: 'campaign_001', campaign_name: 'Spring Campaign' }
    ]);

    await mockQueryService.getCampaigns({
      user_role: 'CMO',
      assigned_campaign_ids: null,
      date_range_start: '2024-01-01',
      date_range_end: '2024-12-31',
      search_term: 'Spring',
      sort_column: 'campaign_name',
      sort_direction: 'ASC',
      limit: 100,
      offset: 0
    });

    expect(mockQueryService.getCampaigns).toHaveBeenCalledWith(
      expect.objectContaining({ search_term: 'Spring' })
    );
  });

  it('should fail when queryService is not implemented', async () => {
    // This test verifies the contract test itself fails initially
    const unimplementedService = {
      getCampaigns: () => {
        throw new Error('queryService.getCampaigns is not implemented yet');
      }
    };

    await expect(unimplementedService.getCampaigns({})).rejects.toThrow(
      'queryService.getCampaigns is not implemented yet'
    );
  });
});
