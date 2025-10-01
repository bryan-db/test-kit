# Data Model: Synthetic Identity Graph Dataset Generator

**Feature**: 001-create-a-databricks
**Date**: 2025-10-01
**Catalog**: `bryan_li`
**Schema**: `synthetic_data`
**Format**: Delta Lake

## Overview

This data model represents a synthetic consumer identity graph with households, individuals, cross-device identifiers, content engagement, audience segmentation, marketing campaigns, and response outcomes. All tables follow Unity Catalog three-level namespace (`catalog.schema.table`) and Delta Lake format for ACID guarantees.

## Entity Relationship Diagram

```
households (1) ──< (N) individuals (1) ──< (N) identity_mappings
                            │
                            ├──< (N) content_engagements
                            ├──< (1) viewership_patterns
                            ├──< (1) audience_attributes
                            ├──< (N) campaign_exposures ──> (1) campaigns
                            └──< (N) response_events ──> (1) campaigns
                                        │
                                        └──< (1) outcome_metrics
```

## Core Entities

### 1. households

Represents residential units containing one or more individuals.

**Table**: `bryan_li.synthetic_data.households`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `household_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique household identifier |
| `location_city` | STRING | NOT NULL | City name |
| `location_state` | STRING | NOT NULL | Two-letter state code |
| `location_zip` | STRING | NOT NULL | Five-digit ZIP code |
| `income_bracket` | STRING | NOT NULL, CHECK IN (...) | Income range: '<30K', '30-60K', '60-100K', '100-150K', '150K+' |
| `household_size` | INT | NOT NULL, CHECK (size BETWEEN 1 AND 10) | Number of individuals in household |
| `housing_type` | STRING | NOT NULL | 'house', 'apartment', 'condo', 'other' |
| `created_at` | TIMESTAMP | NOT NULL | Generation timestamp |

**Indexes**: Clustered by `household_id`, Z-Ordered by `income_bracket, location_state`

**Validation Rules**:
- `income_bracket` distribution should follow realistic census patterns (configurable in wizard)
- `household_size` defaults to normal distribution around 2.5 with σ=1.2

### 2. individuals

Represents people linked to households with demographic attributes.

**Table**: `bryan_li.synthetic_data.individuals`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `individual_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique individual identifier |
| `household_id` | BIGINT | FOREIGN KEY REFERENCES households(household_id), NOT NULL | Parent household |
| `age` | INT | NOT NULL, CHECK (age BETWEEN 18 AND 100) | Age in years (adults only for this use case) |
| `gender` | STRING | NOT NULL, CHECK IN ('Male', 'Female', 'Non-Binary', 'Prefer not to say') | Gender identity |
| `education_level` | STRING | NOT NULL | 'High School', 'Some College', 'Bachelor', 'Master', 'Doctorate' |
| `employment_status` | STRING | NOT NULL | 'Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired' |
| `income_individual` | DECIMAL(10,2) | NULL | Individual income (may be NULL for dependents) |
| `created_at` | TIMESTAMP | NOT NULL | Generation timestamp |

**Indexes**: Clustered by `individual_id`, Z-Ordered by `household_id, age`

**Validation Rules**:
- Age/income correlation must be realistic (higher income skews older)
- Gender distribution defaults to 48% Male, 48% Female, 3% Non-Binary, 1% Prefer not to say (configurable)
- Education/income correlation enforced via CHECK constraint logic

### 3. identity_mappings

Cross-device identifiers linking individuals to multiple digital identities.

**Table**: `bryan_li.synthetic_data.identity_mappings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `mapping_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique mapping identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL | Linked individual |
| `identifier_type` | STRING | NOT NULL, CHECK IN (...) | 'email_hash', 'cookie_id', 'mobile_ad_id', 'device_id', 'ctv_id', 'hashed_phone' |
| `identifier_value` | STRING | NOT NULL | Hashed or pseudonymized identifier value |
| `first_seen` | TIMESTAMP | NOT NULL | First appearance timestamp |
| `last_seen` | TIMESTAMP | NOT NULL, CHECK (last_seen >= first_seen) | Most recent activity timestamp |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether identifier is still active |

**Indexes**: Z-Ordered by `individual_id, identifier_type`

**Validation Rules**:
- Each individual has 2-15 identifiers (configurable, mean 4)
- Identifier type distribution: 60% email, 80% mobile, 40% CTV, 90% cookie, 30% phone
- `identifier_value` must be unique within `identifier_type` (composite unique constraint)

## Engagement Entities

### 4. content_engagements

Records of individual interactions with content.

**Table**: `bryan_li.synthetic_data.content_engagements`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique event identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL | Individual who engaged |
| `content_id` | STRING | NOT NULL | Content identifier (e.g., video ID, article ID) |
| `content_category` | STRING | NOT NULL | 'News', 'Sports', 'Entertainment', 'Education', 'Technology', etc. |
| `engagement_type` | STRING | NOT NULL, CHECK IN ('view', 'click', 'share', 'like', 'comment') | Type of interaction |
| `timestamp` | TIMESTAMP | NOT NULL | Event occurrence time |
| `duration_seconds` | INT | NULL, CHECK (duration_seconds >= 0) | View duration (NULL for non-view events) |
| `device_type` | STRING | NOT NULL | 'mobile', 'desktop', 'tablet', 'ctv' |
| `session_id` | STRING | NULL | Session grouping identifier |

**Indexes**: Partitioned by DATE(timestamp), Z-Ordered by `individual_id, content_category`

**Validation Rules**:
- Timestamp must be within configured time range (wizard-specified: days, weeks, months)
- Temporal patterns should show realistic diurnal and weekly cycles
- `duration_seconds` required for 'view' engagement_type, NULL for others

### 5. viewership_patterns

Aggregated view of individual content consumption patterns (derived from content_engagements).

**Table**: `bryan_li.synthetic_data.viewership_patterns`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pattern_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique pattern identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL, UNIQUE | One pattern per individual |
| `total_engagements` | BIGINT | NOT NULL, CHECK (total_engagements >= 0) | Total engagement count |
| `frequency_daily_avg` | DOUBLE | NOT NULL | Average engagements per day |
| `recency_last_engagement` | TIMESTAMP | NOT NULL | Most recent engagement timestamp |
| `preferred_categories` | ARRAY<STRING> | NOT NULL | Top 3 content categories by engagement count |
| `preferred_device` | STRING | NOT NULL | Most frequently used device type |
| `peak_hour` | INT | NOT NULL, CHECK (peak_hour BETWEEN 0 AND 23) | Hour of day with most activity |
| `computed_at` | TIMESTAMP | NOT NULL | When aggregation was computed |

**Indexes**: Z-Ordered by `individual_id`

**Validation Rules**:
- Derived table: computed from `content_engagements` via aggregation
- `preferred_categories` limited to top 3 by count
- `recency_last_engagement` must match MAX(timestamp) from content_engagements

## Audience Entities

### 6. audience_attributes

Derived characteristics for targeting and segmentation (computed from viewership_patterns).

**Table**: `bryan_li.synthetic_data.audience_attributes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `attribute_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique attribute identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL, UNIQUE | One attribute set per individual |
| `segment_primary` | STRING | NOT NULL | Primary audience segment: 'Tech Enthusiast', 'Sports Fan', 'News Junkie', 'Entertainment Seeker', etc. |
| `segment_secondary` | ARRAY<STRING> | NULL | Secondary segments |
| `affinity_scores` | MAP<STRING, DOUBLE> | NOT NULL | Category affinities (0.0-1.0 scale) |
| `behavioral_classification` | STRING | NOT NULL | 'Heavy User', 'Moderate User', 'Light User', 'Churned' |
| `propensity_to_convert` | DOUBLE | NOT NULL, CHECK (propensity_to_convert BETWEEN 0.0 AND 1.0) | Likelihood of campaign response (0-1) |
| `lifetime_value_estimate` | DECIMAL(10,2) | NULL | Estimated customer lifetime value |
| `computed_at` | TIMESTAMP | NOT NULL | When attributes were computed |

**Indexes**: Z-Ordered by `segment_primary, behavioral_classification`

**Validation Rules**:
- `affinity_scores` keys must match valid content categories
- `affinity_scores` values sum to approximately 1.0 (normalized distribution)
- `behavioral_classification` based on `frequency_daily_avg` thresholds

## Campaign Entities

### 7. campaigns

Marketing campaigns with targeting criteria and metadata.

**Table**: `bryan_li.synthetic_data.campaigns`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `campaign_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique campaign identifier |
| `campaign_name` | STRING | NOT NULL | Descriptive campaign name |
| `start_date` | DATE | NOT NULL | Campaign start date |
| `end_date` | DATE | NOT NULL, CHECK (end_date >= start_date) | Campaign end date |
| `target_segment` | ARRAY<STRING> | NOT NULL | Targeted audience segments |
| `channels` | ARRAY<STRING> | NOT NULL | Distribution channels: 'email', 'social', 'display', 'video', 'ctv' |
| `budget` | DECIMAL(12,2) | NOT NULL, CHECK (budget > 0) | Campaign budget |
| `goal` | STRING | NOT NULL | 'awareness', 'consideration', 'conversion' |
| `created_at` | TIMESTAMP | NOT NULL | Campaign creation timestamp |

**Indexes**: Z-Ordered by `start_date, goal`

**Validation Rules**:
- Campaign duration typically 7-90 days
- `target_segment` values must match valid segments from `audience_attributes.segment_primary`
- At least one channel required

### 8. campaign_exposures

Individual-level campaign exposure events.

**Table**: `bryan_li.synthetic_data.campaign_exposures`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `exposure_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique exposure identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL | Exposed individual |
| `campaign_id` | BIGINT | FOREIGN KEY REFERENCES campaigns(campaign_id), NOT NULL | Campaign shown |
| `exposure_timestamp` | TIMESTAMP | NOT NULL | When exposure occurred |
| `channel` | STRING | NOT NULL, CHECK IN ('email', 'social', 'display', 'video', 'ctv') | Delivery channel |
| `frequency` | INT | NOT NULL, DEFAULT 1, CHECK (frequency > 0) | Exposure count in this session |
| `placement` | STRING | NULL | Ad placement details |
| `cost` | DECIMAL(8,4) | NOT NULL, CHECK (cost >= 0) | Cost per exposure (CPM-based) |

**Indexes**: Partitioned by DATE(exposure_timestamp), Z-Ordered by `campaign_id, individual_id`

**Validation Rules**:
- `exposure_timestamp` must be between campaign `start_date` and `end_date`
- Reach and frequency distributions should follow realistic patterns (configurable)
- `channel` must be in campaign's `channels` array

### 9. response_events

Individual responses to campaign exposures (clicks, conversions, etc.).

**Table**: `bryan_li.synthetic_data.response_events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `response_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique response identifier |
| `individual_id` | BIGINT | FOREIGN KEY REFERENCES individuals(individual_id), NOT NULL | Responding individual |
| `campaign_id` | BIGINT | FOREIGN KEY REFERENCES campaigns(campaign_id), NOT NULL | Campaign that drove response |
| `exposure_id` | BIGINT | FOREIGN KEY REFERENCES campaign_exposures(exposure_id), NULL | Specific exposure (if trackable) |
| `response_type` | STRING | NOT NULL, CHECK IN ('click', 'conversion', 'engagement', 'visit') | Type of response |
| `response_timestamp` | TIMESTAMP | NOT NULL | When response occurred |
| `exposure_timestamp` | TIMESTAMP | NULL | Matched exposure timestamp for attribution |
| `time_to_conversion_hours` | DOUBLE | NULL, CHECK (time_to_conversion_hours >= 0) | Hours between exposure and response |
| `value` | DECIMAL(10,2) | NULL, CHECK (value >= 0) | Monetary value of response (for conversions) |

**Indexes**: Partitioned by DATE(response_timestamp), Z-Ordered by `campaign_id, response_type`

**Validation Rules**:
- **CRITICAL**: `response_timestamp` must be >= `exposure_timestamp` (temporal consistency CHECK constraint)
- `exposure_id` must reference a prior exposure for the same individual and campaign
- Response rates should correlate with `propensity_to_convert` from audience_attributes
- `time_to_conversion_hours` = (response_timestamp - exposure_timestamp) / 3600

### 10. outcome_metrics

Aggregated campaign performance metrics and attribution.

**Table**: `bryan_li.synthetic_data.outcome_metrics`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `outcome_id` | BIGINT | PRIMARY KEY, NOT NULL | Unique outcome identifier |
| `response_id` | BIGINT | FOREIGN KEY REFERENCES response_events(response_id), NOT NULL, UNIQUE | Linked response event |
| `campaign_id` | BIGINT | FOREIGN KEY REFERENCES campaigns(campaign_id), NOT NULL | Campaign attribution |
| `conversion_status` | STRING | NOT NULL, CHECK IN ('converted', 'engaged', 'no_action') | Outcome classification |
| `revenue` | DECIMAL(10,2) | NULL, CHECK (revenue >= 0) | Revenue attributed to this outcome |
| `engagement_score` | DOUBLE | NULL, CHECK (engagement_score BETWEEN 0.0 AND 1.0) | Normalized engagement metric |
| `attribution_model` | STRING | NOT NULL | 'first_touch', 'last_touch', 'linear', 'time_decay' |
| `attribution_weight` | DOUBLE | NOT NULL, CHECK (attribution_weight BETWEEN 0.0 AND 1.0) | Weight for multi-touch attribution |
| `computed_at` | TIMESTAMP | NOT NULL | When metrics were computed |

**Indexes**: Z-Ordered by `campaign_id, conversion_status`

**Validation Rules**:
- `revenue` required when `conversion_status` = 'converted'
- `attribution_weight` sums to 1.0 across all touches for multi-touch models
- `engagement_score` derived from response frequency and recency

## Data Generation Dependencies

Tables must be generated in this order to maintain referential integrity:

1. **Phase 1: Core Entities**
   - `households` (no dependencies)
   - `individuals` (depends on households)
   - `identity_mappings` (depends on individuals)

2. **Phase 2: Engagement Data**
   - `content_engagements` (depends on individuals)
   - `viewership_patterns` (aggregated from content_engagements)

3. **Phase 3: Audience Segmentation**
   - `audience_attributes` (derived from viewership_patterns)

4. **Phase 4: Campaign Data**
   - `campaigns` (no dependencies)
   - `campaign_exposures` (depends on individuals and campaigns)

5. **Phase 5: Response Data**
   - `response_events` (depends on campaign_exposures, individuals, campaigns)
   - `outcome_metrics` (depends on response_events)

## Schema Evolution Strategy

- **Initial Version**: All tables created with version v1 schema
- **Future Extensions**:
  - Add columns via `ALTER TABLE ADD COLUMN` (Delta Lake supports schema evolution)
  - Maintain backward compatibility for incremental generation (FR-015)
  - Use Delta Lake time travel for versioning: `SELECT * FROM table VERSION AS OF 1`

## Validation Queries

Post-generation validation SQL:

```sql
-- Referential integrity check
SELECT COUNT(*) AS orphaned_individuals
FROM bryan_li.synthetic_data.individuals i
LEFT JOIN bryan_li.synthetic_data.households h ON i.household_id = h.household_id
WHERE h.household_id IS NULL;
-- Expected: 0

-- Temporal consistency check (responses after exposures)
SELECT COUNT(*) AS temporal_violations
FROM bryan_li.synthetic_data.response_events
WHERE response_timestamp < exposure_timestamp;
-- Expected: 0

-- Identity mapping coverage check
SELECT AVG(id_count) AS avg_identifiers_per_person
FROM (
    SELECT individual_id, COUNT(*) AS id_count
    FROM bryan_li.synthetic_data.identity_mappings
    GROUP BY individual_id
);
-- Expected: ~4 (configurable)

-- Campaign exposure in-flight check
SELECT COUNT(*) AS out_of_campaign_period
FROM bryan_li.synthetic_data.campaign_exposures e
JOIN bryan_li.synthetic_data.campaigns c ON e.campaign_id = c.campaign_id
WHERE e.exposure_timestamp < CAST(c.start_date AS TIMESTAMP)
   OR e.exposure_timestamp > CAST(c.end_date AS TIMESTAMP) + INTERVAL 1 DAY;
-- Expected: 0
```

## Performance Considerations

- **Partitioning**: Event tables (content_engagements, campaign_exposures, response_events) partitioned by DATE for temporal queries
- **Z-Ordering**: All tables Z-Ordered on frequently filtered columns (household_id, individual_id, campaign_id)
- **File Sizes**: Optimized writes maintain 128 MB file sizes
- **Caching**: Frequently joined dimension tables (households, individuals, campaigns) benefit from Delta caching
- **Query Patterns**: Star schema design supports efficient BI queries via Databricks SQL

## Compliance Notes

- **Privacy**: All data is synthetic - no real PII
- **Governance**: Unity Catalog enforces catalog-level permissions (`bryan_li`)
- **Audit**: Delta Lake transaction log provides full lineage
- **Retention**: Tables support time travel for 30 days (configurable via `delta.logRetentionDuration`)
