# DBSQL Query Contracts

**Feature**: 004-data-exploration-frontend
**Purpose**: Define all DBSQL queries the React frontend will execute via backend proxy

All queries use parameterized inputs (`:param_name`) to prevent SQL injection and support role-based filtering.

---

## FR-004: Campaign List Query

**Purpose**: Retrieve all campaigns with performance metrics for Campaign Performance dashboard

```sql
SELECT
  campaign_id,
  campaign_name,
  start_date,
  end_date,
  target_segments,
  channels,
  total_impressions,
  unique_reach,
  total_spend,
  conversion_count,
  roi,
  cpm
FROM bryan_li.analytics.campaign_performance_summary_sync
WHERE
  -- Role-based filtering (FR-042)
  (:user_role = 'CMO' OR campaign_id IN (:assigned_campaign_ids))
  -- Date range filter (FR-002, FR-006)
  AND start_date >= :date_range_start
  AND end_date <= :date_range_end
  -- Search filter (FR-006)
  AND (:search_term IS NULL OR campaign_name LIKE CONCAT('%', :search_term, '%'))
ORDER BY :sort_column :sort_direction
LIMIT :limit OFFSET :offset;
```

**Parameters**:
- `user_role`: STRING ('CMO' | 'Analyst')
- `assigned_campaign_ids`: ARRAY<STRING> (NULL for CMO)
- `date_range_start`: DATE
- `date_range_end`: DATE
- `search_term`: STRING (optional)
- `sort_column`: STRING (default: 'start_date')
- `sort_direction`: STRING ('ASC' | 'DESC')
- `limit`: INT (default: 100)
- `offset`: INT (default: 0)

---

## FR-009: Audience Segment List Query

**Purpose**: Retrieve audience segments with summary metrics

```sql
SELECT
  segment_id,
  segment_name,
  segment_size,
  behavioral_classification,
  avg_propensity_to_convert,
  total_conversions
FROM bryan_li.analytics.audience_segment_summary_sync
WHERE
  -- Role-based filtering (FR-042)
  (:user_role = 'CMO' OR segment_id IN (:assigned_segment_ids))
ORDER BY total_conversions DESC;
```

**Parameters**:
- `user_role`: STRING
- `assigned_segment_ids`: ARRAY<STRING>

---

## FR-013: Content Engagement Metrics Query

**Purpose**: Retrieve daily engagement metrics by category

```sql
SELECT
  engagement_date,
  content_category,
  event_type,
  total_engagements,
  unique_users,
  engagement_rate
FROM bryan_li.analytics.content_engagement_daily_sync
WHERE
  engagement_date >= :date_range_start
  AND engagement_date <= :date_range_end
  AND (:categories IS NULL OR content_category IN (:categories))
  AND (:event_types IS NULL OR event_type IN (:event_types))
ORDER BY engagement_date DESC, total_engagements DESC;
```

**Parameters**:
- `date_range_start`: DATE
- `date_range_end`: DATE
- `categories`: ARRAY<STRING> (optional)
- `event_types`: ARRAY<STRING> (optional)

---

## FR-023: Conversion Funnel Query

**Purpose**: Retrieve funnel metrics for campaigns

```sql
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
FROM bryan_li.analytics.conversion_funnel_metrics_sync
WHERE
  (:user_role = 'CMO' OR campaign_id IN (:assigned_campaign_ids))
ORDER BY overall_conversion_rate DESC;
```

**Parameters**:
- `user_role`: STRING
- `assigned_campaign_ids`: ARRAY<STRING>

---

## FR-025: Attribution Model Comparison Query

**Purpose**: Compare attribution models for selected campaigns

```sql
SELECT
  campaign_id,
  first_touch_conversions,
  last_touch_conversions,
  linear_conversions,
  time_decay_conversions,
  total_conversions
FROM bryan_li.analytics.attribution_comparison_sync
WHERE
  (:user_role = 'CMO' OR campaign_id IN (:assigned_campaign_ids))
  AND (:campaign_ids IS NULL OR campaign_id IN (:campaign_ids))
ORDER BY total_conversions DESC;
```

**Parameters**:
- `user_role`: STRING
- `assigned_campaign_ids`: ARRAY<STRING>
- `campaign_ids`: ARRAY<STRING> (user-selected filter)

---

## FR-027: Data Overview Summary Query

**Purpose**: Aggregate summary statistics across all entities

```sql
SELECT
  (SELECT COUNT(*) FROM bryan_li.raw_data.households) AS total_households,
  (SELECT COUNT(*) FROM bryan_li.raw_data.individuals) AS total_individuals,
  (SELECT COUNT(*) FROM bryan_li.raw_data.campaigns) AS total_campaigns,
  (SELECT SUM(total_engagements) FROM bryan_li.analytics.content_engagement_daily_sync) AS total_engagements,
  (SELECT SUM(total_conversions) FROM bryan_li.analytics.campaign_performance_summary_sync
   WHERE :user_role = 'CMO' OR campaign_id IN (:assigned_campaign_ids)) AS total_conversions,
  (SELECT AVG(overall_conversion_rate) FROM bryan_li.analytics.conversion_funnel_metrics_sync
   WHERE :user_role = 'CMO' OR campaign_id IN (:assigned_campaign_ids)) AS avg_conversion_rate;
```

**Parameters**:
- `user_role`: STRING
- `assigned_campaign_ids`: ARRAY<STRING>

---

## FR-040: User Authentication Query

**Purpose**: Retrieve user role and assignments for session initialization

```sql
SELECT
  user_id,
  user_email,
  user_role,
  assigned_campaign_ids,
  assigned_segment_ids
FROM bryan_li.analytics.user_assignments
WHERE user_email = :user_email;
```

**Parameters**:
- `user_email`: STRING

---

## Performance Optimization

All queries follow these optimization patterns:

1. **Sync Table Preference**: Query `*_sync` tables for <3s load times (FR-029)
2. **Role Filtering**: Apply `user_role = 'CMO' OR id IN (:assigned_ids)` pattern for FR-042
3. **Parameterization**: Use `:param` syntax to prevent SQL injection
4. **Limit/Offset**: Implement pagination to avoid large result sets
5. **Fallback Logic**: Application-layer retry with gold Delta tables if sync unavailable (FR-032)

---

**Total Queries**: 7 core queries (expandable to 15+ for specific dashboard needs)
