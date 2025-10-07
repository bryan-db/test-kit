# Quickstart Guide: Marketing Analytics Explorer

**Feature**: 004-data-exploration-frontend
**Purpose**: Manual test scenarios to validate dashboard functionality

This guide provides step-by-step test scenarios corresponding to acceptance criteria from the feature spec.

---

## Prerequisites

1. **Data Pipeline**: Run Feature 001 synthetic data generation to populate bronze tables
2. **Gold Tables**: Execute silver_to_gold.py pipeline to create aggregated metrics
3. **Sync Tables**: Run sync_table_refresh.py to publish to Lakebase
4. **User Assignments**: Insert test users into `bryan_li.analytics.user_assignments`
5. **Frontend**: Start React dev server: `cd react-app && npm run dev`
6. **Backend**: Start backend proxy: `cd backend && npm start`

---

## Test Scenario 1: Campaign Performance Dashboard (FR-001, FR-004)

**Objective**: Verify Campaign Performance dashboard loads with all required columns

**Given**: User is authenticated as CMO
**When**: Navigate to `/dashboards/campaigns`
**Then**:
- Table displays with columns: name, dates, segments, channels, impressions, reach, spend, conversions, ROI
- Data loads in <3 seconds (FR-029)
- Date range filter defaults to last 30 days (FR-002)
- Sort controls functional on all columns (FR-005)

**Manual Steps**:
1. Open browser to `http://localhost:5173/dashboards/campaigns`
2. Open DevTools Network tab
3. Measure page load time from navigation to table render
4. Verify SQL query targets `campaign_performance_summary_sync`
5. Click "Start Date" column header → verify ascending sort
6. Click again → verify descending sort
7. Use date range picker → set custom range → verify filtered results

**Expected Results**:
- ✅ Page loads in <3 seconds
- ✅ All 10 columns present in table
- ✅ Default date range: last 30 days
- ✅ Sorting works on all columns
- ✅ Filter updates in <1 second (FR-030)

---

## Test Scenario 2: Campaign Detail View (FR-007)

**Objective**: Verify clicking a campaign shows detailed breakdown

**Given**: User is on Campaign Performance dashboard
**When**: Click on a specific campaign row
**Then**:
- Detail view displays: exposure timeline, response curve, segment breakdown, channel contribution

**Manual Steps**:
1. From campaigns list, click first campaign row
2. Verify detail modal or page opens
3. Check for exposure timeline chart (time-series)
4. Check for response curve visualization
5. Check for segment-level performance table
6. Check for channel contribution pie/bar chart

**Expected Results**:
- ✅ Detail view opens within 1 second
- ✅ All 4 visualizations present
- ✅ Data corresponds to selected campaign
- ✅ Close button returns to campaign list

---

## Test Scenario 3: Audience Segment Selection (FR-009, FR-010)

**Objective**: Verify audience segment demographics display

**Given**: User is on Audience Insights page
**When**: Select an audience segment
**Then**:
- Demographic distribution displays (age, gender, education)
- Household income distribution chart
- Geographic distribution (if available)
- Engagement patterns by content category

**Manual Steps**:
1. Navigate to `/dashboards/audience-insights`
2. Select first segment from dropdown or list
3. Verify demographic charts render
4. Verify income distribution bar chart
5. Verify engagement patterns heatmap or table
6. Check cross-device identity mapping stats

**Expected Results**:
- ✅ Segment selection triggers data fetch
- ✅ Demographic charts display with correct data
- ✅ Income distribution matches segment profile
- ✅ Engagement stats show content category breakdown

---

## Test Scenario 4: Segment Comparison (FR-012)

**Objective**: Verify side-by-side segment comparison

**Given**: User is on Audience Insights page
**When**: Select 2-5 segments for comparison
**Then**:
- Side-by-side visualization shows comparative metrics

**Manual Steps**:
1. On Audience Insights, enable comparison mode
2. Select 3 segments using checkboxes
3. Verify comparison view renders
4. Check for key metrics: size, conversion rate, engagement rate
5. Verify visual differentiation (colors, labels)

**Expected Results**:
- ✅ Comparison supports 2-5 segments
- ✅ Metrics displayed side-by-side
- ✅ Clear visual distinction between segments
- ✅ Can add/remove segments dynamically

---

## Test Scenario 5: Content Engagement Filtering (FR-013, FR-015)

**Objective**: Verify content engagement filters work correctly

**Given**: User is on Content Engagement page
**When**: Apply filters (date range, category, event type)
**Then**:
- Filtered engagement metrics display
- Charts update to reflect filters

**Manual Steps**:
1. Navigate to `/dashboards/content-engagement`
2. Select date range: Last 7 days
3. Select categories: News, Entertainment
4. Select event types: page_view, video_view
5. Verify results update with <1s latency (FR-030)
6. Check total engagement count matches filters

**Expected Results**:
- ✅ Filter updates trigger new query
- ✅ Results reflect all applied filters
- ✅ Update completes in <1 second
- ✅ Can clear filters to reset view

---

## Test Scenario 6: Attribution Analysis (FR-023, FR-025)

**Objective**: Verify multi-touch attribution model comparison

**Given**: User is on Attribution Analysis page
**When**: View attribution comparison dashboard
**Then**:
- Time-to-conversion histogram displays
- Attribution model comparison shows first-touch, last-touch, linear, time-decay
- Conversion paths visualization shows common sequences

**Manual Steps**:
1. Navigate to `/dashboards/attribution-analysis`
2. Verify funnel visualization (exposures → responses → conversions)
3. Check time-to-conversion histogram (bins: <1d, 1-7d, 7-30d, 30d+)
4. Verify attribution comparison table/chart shows all 4 models
5. Check conversion path Sankey diagram

**Expected Results**:
- ✅ Funnel shows 3 stages with drop-off rates
- ✅ Histogram displays conversion timing distribution
- ✅ Attribution models show different credit distribution
- ✅ Conversion paths show common touchpoint sequences

---

## Test Scenario 7: Sync Table Performance (FR-031)

**Objective**: Verify sync tables provide <3s load time

**Given**: Gold datasets have been synced to Lakebase
**When**: Load any dashboard
**Then**:
- Data loads from sync tables with sub-second query times

**Manual Steps**:
1. Verify sync tables exist: `SHOW TABLES IN bryan_li.analytics LIKE '%_sync'`
2. Open Network tab in browser DevTools
3. Load Campaign Performance dashboard
4. Inspect SQL query in Network request
5. Measure query execution time from request to response
6. Verify query targets `*_sync` table (not gold Delta)

**Expected Results**:
- ✅ SQL query uses `campaign_performance_summary_sync`
- ✅ Query completes in <500ms
- ✅ Page load <3 seconds total (FR-029)
- ✅ No errors or fallback to Delta tables

---

## Test Scenario 8: Sync Table Fallback (FR-032)

**Objective**: Verify automatic fallback to gold Delta tables when sync unavailable

**Given**: Sync tables are disabled or unavailable
**When**: Load dashboard
**Then**:
- System falls back to gold Delta tables
- Performance degrades slightly (3-5s) but remains functional

**Manual Steps**:
1. Simulate sync unavailability: Stop Lakebase instance or drop sync tables
2. Load Campaign Performance dashboard
3. Monitor backend logs for fallback messages
4. Verify query targets `campaign_performance_summary` (not `*_sync`)
5. Measure page load time (expect 3-5s vs <3s)
6. Verify data still displays correctly

**Expected Results**:
- ✅ System detects sync table unavailable
- ✅ Automatically queries gold Delta table
- ✅ Data displays correctly (no errors)
- ✅ Load time 3-5 seconds (acceptable degradation)
- ✅ User sees notification about degraded performance (optional)

---

## Performance Validation Checklist

After completing all scenarios, validate performance requirements:

- [ ] **FR-029**: Dashboard initial load <3 seconds (measure with DevTools)
- [ ] **FR-030**: Filter updates <1 second (measure network request time)
- [ ] **FR-033**: System handles unlimited data volumes (test with 1M+ households)
- [ ] **FR-036**: Hourly refresh pipeline completes successfully (check Databricks job logs)

---

## Role-Based Access Testing (FR-042)

**CMO User Test**:
1. Login as CMO user
2. Verify all campaigns visible in Campaign Performance dashboard
3. Verify all segments visible in Audience Insights
4. Confirm no data filtering applied

**Analyst User Test**:
1. Login as Analyst user with assigned campaigns `['C001', 'C002']`
2. Verify only campaigns C001 and C002 visible
3. Attempt to access campaign C003 directly → should return empty or error
4. Verify segments limited to those assigned in user_assignments table

---

## Troubleshooting

**Issue**: Dashboard loads slowly (>3 seconds)
- Check sync table status: `SELECT * FROM bryan_li.analytics.user_assignments`
- Verify Lakebase instance running: Databricks SDK `get_synced_database_table()`
- Check for Z-ordering on gold tables: `DESCRIBE DETAIL bryan_li.analytics.campaign_performance_summary`

**Issue**: Queries return empty results
- Verify gold tables populated: `SELECT COUNT(*) FROM bryan_li.analytics.campaign_performance_summary`
- Check role-based filtering: Review `user_assignments` table for correct campaign/segment mappings
- Inspect backend logs for SQL query syntax errors

**Issue**: Authentication fails
- Verify user exists in `user_assignments` table
- Check Databricks token expiration
- Confirm backend proxy has valid `DATABRICKS_HOST` and `DATABRICKS_TOKEN` env vars

---

**Completion Criteria**: All 8 test scenarios pass + performance validation checklist complete + role-based access verified
