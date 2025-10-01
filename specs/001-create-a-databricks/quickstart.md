# Quickstart: Synthetic Identity Graph Dataset Generator

**Feature**: 001-create-a-databricks
**Date**: 2025-10-01
**Purpose**: End-to-end validation scenarios for the Databricks App

## Prerequisites

1. **Databricks Workspace Access**:
   - Workspace: `e2-demo-field-eng.cloud.databricks.com`
   - Valid personal access token or OAuth

2. **Unity Catalog Permissions**:
   ```sql
   GRANT USE CATALOG ON CATALOG bryan_li TO `<user_email>`;
   GRANT USE SCHEMA ON SCHEMA bryan_li.synthetic_data TO `<user_email>`;
   GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data TO `<user_email>`;
   ```

3. **Databricks App Deployed**:
   - App deployed to workspace at `/Workspace/Apps/synthetic-identity-graph-generator`
   - Dependencies installed from `requirements.txt`

4. **Cluster with Warm Pool** (for < 5 min generation target):
   - 8x m5.4xlarge workers
   - Spark 14.3.x with Photon
   - Instance pool configured for 30-second startup

## Scenario 1: Small Dataset Generation (Development)

**Goal**: Generate 10K households end-to-end in < 2 minutes

### Steps

1. **Launch App**:
   ```
   Navigate to: https://e2-demo-field-eng.cloud.databricks.com/apps/synthetic-identity-graph-generator
   ```

2. **Wizard Step 1 - Household Configuration**:
   - Number of households: `10,000`
   - Household size distribution: Mean `2.5`, Std Dev `1.2` (defaults)
   - Income brackets: Use default distribution
   - Click **Next**

3. **Wizard Step 2 - Demographics Configuration**:
   - Age range: `18` to `85`
   - Gender distribution: Use defaults (48% M, 48% F, 3% NB, 1% PNTS)
   - Education distribution: Use defaults
   - Identifiers per person: Mean `4`
   - Click **Next**

4. **Wizard Step 3 - Engagement Configuration**:
   - Time period: `30` days
   - Events per person: Mean `50`, Distribution `power_law`
   - Content categories: Select all defaults
   - Engagement type weights: Use defaults
   - Click **Next**

5. **Wizard Step 4 - Audience Configuration**:
   - Segments: Use default list (Tech Enthusiast, Sports Fan, etc.)
   - Behavioral thresholds: Use defaults
   - Click **Next**

6. **Wizard Step 5 - Campaign Configuration**:
   - Number of campaigns: `5`
   - Campaign duration: Min `14`, Max `60` days
   - Channels: `email`, `social`, `display`
   - Reach: `30%`
   - Response rate range: `1%` to `10%`
   - Click **Next**

7. **Review & Submit**:
   - Random seed: `42` (for reproducibility)
   - Catalog: `bryan_li`
   - Schema: `synthetic_data`
   - Click **Generate Dataset**

8. **Monitor Progress**:
   - Progress bar should show: "Generation in progress..."
   - Expected time: 1-2 minutes
   - Status updates every 5 seconds via Jobs API polling

9. **Validation**:
   ```sql
   -- Verify table creation
   SHOW TABLES IN bryan_li.synthetic_data;

   -- Expected tables:
   -- households, individuals, identity_mappings, content_engagements,
   -- viewership_patterns, audience_attributes, campaigns, campaign_exposures,
   -- response_events, outcome_metrics

   -- Verify household count
   SELECT COUNT(*) FROM bryan_li.synthetic_data.households;
   -- Expected: 10,000

   -- Verify individuals (2.5 avg household size)
   SELECT COUNT(*) FROM bryan_li.synthetic_data.individuals;
   -- Expected: ~25,000

   -- Verify identity mappings (4 per person avg)
   SELECT COUNT(*) FROM bryan_li.synthetic_data.identity_mappings;
   -- Expected: ~100,000

   -- Verify engagement events (50 per person avg over 30 days)
   SELECT COUNT(*) FROM bryan_li.synthetic_data.content_engagements;
   -- Expected: ~1,250,000

   -- Verify campaigns
   SELECT COUNT(*) FROM bryan_li.synthetic_data.campaigns;
   -- Expected: 5

   -- Verify referential integrity
   SELECT COUNT(*) AS orphaned_individuals
   FROM bryan_li.synthetic_data.individuals i
   LEFT JOIN bryan_li.synthetic_data.households h ON i.household_id = h.household_id
   WHERE h.household_id IS NULL;
   -- Expected: 0

   -- Verify temporal consistency
   SELECT COUNT(*) AS temporal_violations
   FROM bryan_li.synthetic_data.response_events
   WHERE response_timestamp < exposure_timestamp;
   -- Expected: 0
   ```

**Success Criteria**:
- ✅ All 10 tables created
- ✅ Row counts match expectations (±10% for stochastic distributions)
- ✅ No referential integrity violations
- ✅ No temporal consistency violations
- ✅ Generation completed in < 2 minutes

## Scenario 2: Medium Dataset with Custom Demographics

**Goal**: Generate 100K households with specific demographic targeting

### Steps

1. Launch app and configure:
   - **Step 1**: 100,000 households
   - **Step 2**:
     - Age range: `25` to `55` (younger working-age population)
     - Income skew: Increase `100-150K` to `0.25`, `150K+` to `0.10`
     - Identifiers: Mean `6` (higher cross-device tracking)
   - **Step 3-5**: Use defaults
   - Random seed: `123`

2. Generate and validate:
   ```sql
   -- Verify age distribution
   SELECT
     CASE
       WHEN age BETWEEN 25 AND 34 THEN '25-34'
       WHEN age BETWEEN 35 AND 44 THEN '35-44'
       WHEN age BETWEEN 45 AND 55 THEN '45-55'
       ELSE 'Other'
     END AS age_bucket,
     COUNT(*) AS count
   FROM bryan_li.synthetic_data.individuals
   GROUP BY age_bucket
   ORDER BY age_bucket;
   -- Expected: No 'Other' bucket, distribution across 25-55

   -- Verify income bracket distribution
   SELECT income_bracket, COUNT(*) AS count
   FROM bryan_li.synthetic_data.households
   GROUP BY income_bracket
   ORDER BY income_bracket;
   -- Expected: Higher counts in 100-150K and 150K+ brackets

   -- Verify cross-device coverage
   SELECT AVG(id_count) AS avg_identifiers
   FROM (
     SELECT individual_id, COUNT(*) AS id_count
     FROM bryan_li.synthetic_data.identity_mappings
     GROUP BY individual_id
   );
   -- Expected: ~6.0
   ```

3. **Performance Validation**:
   - Check Databricks Job run time in workspace
   - Expected: < 4 minutes for 100K households

**Success Criteria**:
- ✅ Age distribution matches custom range (25-55)
- ✅ Income distribution reflects higher brackets
- ✅ Average identifiers per person ≈ 6
- ✅ Completed in < 4 minutes

## Scenario 3: Large-Scale Performance Test

**Goal**: Validate < 5 minute SLA for 1M+ households

### Steps

1. **Pre-requisites**:
   - Warm cluster pool configured with 8x m5.4xlarge workers
   - Photon acceleration enabled

2. **Configuration**:
   - **Step 1**: 1,000,000 households
   - **Step 2-5**: Use defaults
   - Random seed: `999`

3. **Generation**:
   - Click **Generate Dataset**
   - Monitor Spark UI for progress:
     - Stage 1: Household generation
     - Stage 2: Individual generation
     - Stage 3: Engagement event generation
     - Stage 4-6: Campaign and response generation

4. **Timing Breakdown** (expected):
   ```
   Cluster startup (warm pool):  30 seconds
   Household generation:         30 seconds
   Individual generation:        45 seconds
   Engagement generation:        90 seconds
   Audience derivation:          20 seconds
   Campaign generation:          15 seconds
   Exposure generation:          60 seconds
   Response generation:          30 seconds
   Delta writes + Z-Order:       60 seconds
   ────────────────────────────────────────
   Total:                        ~4.5 minutes
   ```

5. **Validation Queries** (sample 1% for performance):
   ```sql
   -- Verify scale
   SELECT
     'households' AS table_name, COUNT(*) AS row_count
   FROM bryan_li.synthetic_data.households
   UNION ALL
   SELECT 'individuals', COUNT(*) FROM bryan_li.synthetic_data.individuals
   UNION ALL
   SELECT 'identity_mappings', COUNT(*) FROM bryan_li.synthetic_data.identity_mappings
   UNION ALL
   SELECT 'content_engagements', COUNT(*) FROM bryan_li.synthetic_data.content_engagements;
   -- Expected:
   -- households:          1,000,000
   -- individuals:         2,500,000
   -- identity_mappings:   10,000,000
   -- content_engagements: 125,000,000

   -- Sample referential integrity check (1% sample)
   SELECT COUNT(*) AS orphaned_sample
   FROM (
     SELECT * FROM bryan_li.synthetic_data.individuals TABLESAMPLE (1 PERCENT)
   ) i
   LEFT JOIN bryan_li.synthetic_data.households h ON i.household_id = h.household_id
   WHERE h.household_id IS NULL;
   -- Expected: 0

   -- Check Delta Lake file statistics
   DESCRIBE DETAIL bryan_li.synthetic_data.households;
   -- Verify: numFiles < 1000, sizeInBytes reasonable
   ```

**Success Criteria**:
- ✅ 1M households generated
- ✅ ~125M engagement events generated
- ✅ Total generation time < 5 minutes
- ✅ Referential integrity maintained at scale
- ✅ Delta Lake files optimized (< 1000 files per table)

## Scenario 4: Deterministic Reproducibility

**Goal**: Validate seed-based reproducibility (FR-011)

### Steps

1. **First Generation**:
   - Configure 10K households
   - Random seed: `777`
   - Generate dataset

2. **Record Results**:
   ```sql
   -- Capture checksums
   SELECT
     COUNT(*) AS total_households,
     SUM(CAST(household_id AS DOUBLE)) AS household_id_sum,
     SUM(household_size) AS total_individuals_expected
   FROM bryan_li.synthetic_data.households;

   SELECT
     COUNT(*) AS total_engagements,
     SUM(duration_seconds) AS total_duration
   FROM bryan_li.synthetic_data.content_engagements
   WHERE duration_seconds IS NOT NULL;
   ```

3. **Second Generation**:
   - Drop existing tables:
     ```sql
     DROP SCHEMA IF EXISTS bryan_li.synthetic_data CASCADE;
     CREATE SCHEMA bryan_li.synthetic_data;
     ```
   - Re-run wizard with **identical configuration** and seed `777`

4. **Validation**:
   ```sql
   -- Verify identical checksums
   SELECT
     COUNT(*) AS total_households,
     SUM(CAST(household_id AS DOUBLE)) AS household_id_sum,
     SUM(household_size) AS total_individuals_expected
   FROM bryan_li.synthetic_data.households;
   -- Expected: Identical to first generation

   SELECT
     COUNT(*) AS total_engagements,
     SUM(duration_seconds) AS total_duration
   FROM bryan_li.synthetic_data.content_engagements
   WHERE duration_seconds IS NOT NULL;
   -- Expected: Identical to first generation
   ```

**Success Criteria**:
- ✅ Identical row counts across all tables
- ✅ Identical aggregate statistics (sums, checksums)
- ✅ Deterministic generation with same seed

## Scenario 5: Permission Validation

**Goal**: Verify permission enforcement (NFR-005, NFR-006)

### Steps

1. **Create Test User** (admin action):
   ```sql
   -- User with only USE permissions (no CREATE TABLE)
   GRANT USE CATALOG ON CATALOG bryan_li TO `test_user@example.com`;
   GRANT USE SCHEMA ON SCHEMA bryan_li.synthetic_data TO `test_user@example.com`;
   -- Do NOT grant CREATE TABLE
   ```

2. **Attempt Generation as Test User**:
   - Log in as `test_user@example.com`
   - Launch Databricks App
   - Progress through wizard to final step
   - Click **Generate Dataset**

3. **Expected Behavior**:
   - App should check permissions **before** submitting job
   - Error message displayed:
     ```
     Permission Denied: You do not have CREATE TABLE privilege on schema bryan_li.synthetic_data.
     Please contact your workspace administrator to grant the required permissions.
     ```
   - **No job submitted** to Jobs API (validation happens upfront)

4. **Grant Permission and Retry**:
   ```sql
   GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data TO `test_user@example.com`;
   ```
   - Retry generation as test user
   - Should succeed with permission granted

**Success Criteria**:
- ✅ Permission check occurs before job submission
- ✅ Clear error message for missing privileges
- ✅ Generation succeeds after granting CREATE TABLE

## Scenario 6: Incremental Data Generation

**Goal**: Validate incremental append capability (FR-015)

### Steps

1. **Initial Generation**:
   - Generate 10K households with seed `1001`
   - Note generation timestamp

2. **Incremental Append**:
   - Re-launch wizard
   - Configure 5K **additional** households
   - Use **different seed**: `1002`
   - Enable "Append to existing tables" option (if implemented)
   - Generate

3. **Validation**:
   ```sql
   -- Verify total count
   SELECT COUNT(*) FROM bryan_li.synthetic_data.households;
   -- Expected: 15,000

   -- Verify no duplicate household_ids
   SELECT household_id, COUNT(*) AS duplicates
   FROM bryan_li.synthetic_data.households
   GROUP BY household_id
   HAVING COUNT(*) > 1;
   -- Expected: 0 rows

   -- Verify Delta Lake versions
   DESCRIBE HISTORY bryan_li.synthetic_data.households;
   -- Expected: 2 versions (initial + append)

   -- Query time travel
   SELECT COUNT(*)
   FROM bryan_li.synthetic_data.households VERSION AS OF 0;
   -- Expected: 10,000 (first version)
   ```

**Success Criteria**:
- ✅ Incremental append successful
- ✅ No duplicate primary keys
- ✅ Delta Lake versioning tracks appends
- ✅ Time travel access to previous versions

## Troubleshooting

### Generation Takes > 5 Minutes

**Diagnosis**:
- Check cluster startup time in Spark UI
- Verify warm pool is configured
- Check Photon is enabled

**Resolution**:
```python
# Update cluster config in job submission
spark.conf.set("spark.databricks.photon.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
```

### Referential Integrity Violations

**Diagnosis**:
```sql
SELECT COUNT(*) AS orphans
FROM bryan_li.synthetic_data.individuals i
LEFT JOIN bryan_li.synthetic_data.households h ON i.household_id = h.household_id
WHERE h.household_id IS NULL;
```

**Resolution**:
- Verify two-phase generation (households before individuals)
- Check for race conditions in parallel writes
- Ensure FK joins use broadcast for small dimension tables

### Temporal Consistency Violations

**Diagnosis**:
```sql
SELECT *
FROM bryan_li.synthetic_data.response_events
WHERE response_timestamp < exposure_timestamp
LIMIT 10;
```

**Resolution**:
- Add CHECK constraint to response_events table
- Verify timestamp generation logic respects causality
- Use exposure_timestamp as minimum for response_timestamp generation

## Post-Quickstart Cleanup

```sql
-- Drop synthetic data schema (WARNING: Deletes all generated data)
DROP SCHEMA IF EXISTS bryan_li.synthetic_data CASCADE;

-- Recreate empty schema for next run
CREATE SCHEMA bryan_li.synthetic_data;
```

## Success Metrics Summary

| Scenario | Validation Criteria | Pass/Fail |
|----------|---------------------|-----------|
| Small Dataset (10K) | < 2 min, all tables created, referential integrity | ☐ |
| Custom Demographics (100K) | Age/income distributions match config, < 4 min | ☐ |
| Large-Scale (1M+) | < 5 min SLA, 125M+ events, optimized writes | ☐ |
| Reproducibility | Identical results with same seed | ☐ |
| Permission Validation | Upfront checks, clear errors, enforcement | ☐ |
| Incremental Append | No duplicates, Delta versioning, time travel | ☐ |

All scenarios passing = **Ready for production use**
