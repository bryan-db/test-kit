# Data Model: Marketing Analytics Explorer

**Feature**: 004-data-exploration-frontend
**Date**: 2025-10-03

This document defines all data entities for the Marketing Analytics Explorer, including gold tables, configuration tables, and frontend state models.

---

## Gold Tables (5)

### 1. campaign_performance_summary

**Purpose**: Pre-aggregated campaign metrics for dashboard performance

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.campaign_performance_summary (
  campaign_id STRING NOT NULL,
  campaign_name STRING NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_segments ARRAY<STRING>,
  channels ARRAY<STRING>,
  total_impressions BIGINT,
  unique_reach BIGINT,
  total_spend DECIMAL(18,2),
  conversion_count BIGINT,
  roi DECIMAL(10,4),
  cpm DECIMAL(10,4),
  updated_at TIMESTAMP
)
USING DELTA
PARTITIONED BY (DATE(start_date))
CLUSTER BY (campaign_id);
```

**Primary Key**: campaign_id
**Relationships**: Derived from campaigns, campaign_exposures, response_events, outcome_metrics
**Validation Rules**:
- roi = (conversion_count * avg_order_value - total_spend) / total_spend
- cpm = (total_spend / total_impressions) * 1000
- unique_reach <= total_impressions

---

### 2. audience_segment_summary

**Purpose**: Pre-aggregated segment demographics and engagement metrics

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.audience_segment_summary (
  segment_id STRING NOT NULL,
  segment_name STRING NOT NULL,
  segment_size BIGINT,
  behavioral_classification STRING,
  avg_propensity_to_convert DECIMAL(5,4),
  total_conversions BIGINT,
  demographic_distribution_json STRING,  -- JSON: {age_groups: {...}, gender: {...}, education: {...}}
  engagement_stats_json STRING,          -- JSON: {avg_events_per_user: N, top_categories: [...]}
  updated_at TIMESTAMP
)
USING DELTA
CLUSTER BY (segment_id);
```

**Primary Key**: segment_id
**Relationships**: Derived from audience_segments, individuals, viewership_patterns, response_events
**Validation Rules**:
- avg_propensity_to_convert BETWEEN 0.0 AND 1.0
- demographic_distribution_json IS JSON
- engagement_stats_json IS JSON

---

### 3. content_engagement_daily

**Purpose**: Daily engagement metrics by category and event type

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.content_engagement_daily (
  engagement_date DATE NOT NULL,
  content_category STRING NOT NULL,
  event_type STRING NOT NULL,
  total_engagements BIGINT,
  unique_users BIGINT,
  engagement_rate DECIMAL(10,6),
  updated_at TIMESTAMP
)
USING DELTA
PARTITIONED BY (engagement_date)
CLUSTER BY (content_category, event_type);
```

**Primary Key**: (engagement_date, content_category, event_type)
**Relationships**: Derived from content_engagements, individuals
**Validation Rules**:
- engagement_rate = unique_users / total_distinct_users_that_day
- event_type IN ('page_view', 'video_view', 'click', 'share')

---

### 4. attribution_comparison

**Purpose**: Multi-touch attribution model comparison per campaign

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.attribution_comparison (
  campaign_id STRING NOT NULL,
  first_touch_conversions BIGINT,
  last_touch_conversions BIGINT,
  linear_conversions DECIMAL(18,2),      -- Fractional attribution
  time_decay_conversions DECIMAL(18,2),   -- Fractional attribution
  total_conversions BIGINT,
  updated_at TIMESTAMP
)
USING DELTA
CLUSTER BY (campaign_id);
```

**Primary Key**: campaign_id
**Relationships**: Derived from campaign_exposures, response_events, outcome_metrics
**Validation Rules**:
- first_touch_conversions + last_touch_conversions >= total_conversions (due to overlap)
- linear_conversions ≈ time_decay_conversions (within 20% for most campaigns)
- All attribution values >= 0

---

### 5. conversion_funnel_metrics

**Purpose**: Funnel stage metrics for conversion analysis

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.conversion_funnel_metrics (
  campaign_id STRING NOT NULL,
  total_exposures BIGINT,
  unique_exposed BIGINT,
  total_responses BIGINT,
  unique_responders BIGINT,
  total_conversions BIGINT,
  exposure_to_response_rate DECIMAL(10,6),
  response_to_conversion_rate DECIMAL(10,6),
  overall_conversion_rate DECIMAL(10,6),
  updated_at TIMESTAMP
)
USING DELTA
CLUSTER BY (campaign_id);
```

**Primary Key**: campaign_id
**Relationships**: Derived from campaign_exposures, response_events, outcome_metrics
**Validation Rules**:
- exposure_to_response_rate = unique_responders / unique_exposed
- response_to_conversion_rate = total_conversions / total_responses
- overall_conversion_rate = total_conversions / total_exposures
- unique_responders <= unique_exposed
- total_conversions <= total_responses

---

## Configuration Tables (1)

### 6. user_assignments

**Purpose**: Maps analyst users to their allowed campaigns and segments for role-based filtering

**Schema**:
```sql
CREATE TABLE bryan_li.analytics.user_assignments (
  user_id STRING NOT NULL,
  user_email STRING NOT NULL,
  user_role STRING NOT NULL,              -- 'CMO' or 'Analyst'
  assigned_campaign_ids ARRAY<STRING>,    -- NULL for CMO (all access)
  assigned_segment_ids ARRAY<STRING>,     -- NULL for CMO (all access)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA;
```

**Primary Key**: user_id
**Validation Rules**:
- user_role IN ('CMO', 'Analyst')
- CMO users: assigned_campaign_ids IS NULL AND assigned_segment_ids IS NULL
- Analyst users: assigned_campaign_ids IS NOT NULL OR assigned_segment_ids IS NOT NULL
- user_email LIKE '%@%.%' (valid email format)

---

## Frontend State Models (1)

### 7. DashboardSession (Client-Side)

**Purpose**: User's current exploration session and filter state (React state, not persisted to database)

**TypeScript Interface**:
```typescript
interface DashboardSession {
  // Current user context
  current_user: {
    user_id: string;
    user_email: string;
    user_role: 'CMO' | 'Analyst';
    assigned_campaign_ids?: string[];
    assigned_segment_ids?: string[];
  };

  // Active dashboard and filters
  active_dashboard: 'campaign_performance' | 'audience_insights' | 'content_engagement' | 'attribution_analysis' | 'data_overview';
  selected_date_range: {
    start_date: string;  // ISO 8601 date
    end_date: string;
  };
  selected_campaigns: string[];  // Filter by campaign_id
  selected_segments: string[];   // Filter by segment_id
  selected_categories: string[]; // For content engagement

  // Additional UI state
  applied_filters: Record<string, any>;
  sort_config: {
    column: string;
    direction: 'asc' | 'desc';
  };

  // Data freshness
  last_refresh_timestamp: string;  // ISO 8601 timestamp
}
```

**Validation Rules**:
- If user_role === 'Analyst':
  - selected_campaigns MUST be subset of assigned_campaign_ids
  - selected_segments MUST be subset of assigned_segment_ids
- selected_date_range.start_date <= selected_date_range.end_date
- active_dashboard determines which filters are applicable

---

## Sync Tables (Lakebase)

All 5 gold tables have corresponding sync tables for low-latency queries:

1. `bryan_li.analytics.campaign_performance_summary_sync`
2. `bryan_li.analytics.audience_segment_summary_sync`
3. `bryan_li.analytics.content_engagement_daily_sync`
4. `bryan_li.analytics.attribution_comparison_sync`
5. `bryan_li.analytics.conversion_funnel_metrics_sync`

**Configuration**:
- **Scheduling Policy**: TRIGGERED (hourly refresh via Databricks Workflow)
- **Primary Keys**: Same as gold tables
- **CDF Enabled**: Yes (for incremental sync)
- **Fallback**: Automatic query routing to gold Delta tables if sync unavailable

---

## Data Lineage

```
Bronze Layer (Feature 001 Output)
  ├── households
  ├── individuals
  ├── identity_mappings
  ├── content_engagements
  ├── viewership_patterns
  ├── audience_segments
  ├── campaigns
  ├── campaign_exposures
  ├── response_events
  └── outcome_metrics

         ↓ [bronze_to_silver.py]

Silver Layer (Cleansed/Standardized)
  └── [Same 10 tables, validated and typed]

         ↓ [silver_to_gold.py]

Gold Layer (Pre-Aggregated)
  ├── campaign_performance_summary
  ├── audience_segment_summary
  ├── content_engagement_daily
  ├── attribution_comparison
  └── conversion_funnel_metrics

         ↓ [sync_table_refresh.py]

Sync Tables (Lakebase - Low Latency)
  ├── campaign_performance_summary_sync
  ├── audience_segment_summary_sync
  ├── content_engagement_daily_sync
  ├── attribution_comparison_sync
  └── conversion_funnel_metrics_sync

         ↓ [DBSQL Queries via REST API]

React Frontend (Dashboards)
```

---

## Optimization Summary

### Liquid Clustering
All gold tables use Liquid Clustering for optimal query performance:
- **campaign_performance_summary**: CLUSTER BY (campaign_id)
- **audience_segment_summary**: CLUSTER BY (segment_id)
- **content_engagement_daily**: CLUSTER BY (content_category, event_type)
- **attribution_comparison**: CLUSTER BY (campaign_id)
- **conversion_funnel_metrics**: CLUSTER BY (campaign_id)

### Partitioning
Time-based partitioning for efficient date range filtering:
- **campaign_performance_summary**: PARTITIONED BY (DATE(start_date))
- **content_engagement_daily**: PARTITIONED BY (engagement_date)

### Auto-Optimization
All gold tables have auto-optimize enabled:
```sql
ALTER TABLE <table_name> SET TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',
  'delta.autoOptimize.autoCompact' = 'true'
);
```

---

**Total Entities**: 7 (5 gold tables + 1 config table + 1 frontend state model)
