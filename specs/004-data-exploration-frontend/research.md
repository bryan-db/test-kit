# Research: Marketing Analytics Explorer

**Feature**: 004-data-exploration-frontend
**Date**: 2025-10-03
**Status**: Complete

This document consolidates research findings for technology choices and implementation patterns for the Marketing Analytics Explorer dashboard.

---

## Research: Lakehouse Architecture Patterns

**Decision**: Use targeted `mergeSchema` for Bronze/Silver, explicit `ALTER TABLE` for Gold; implement Liquid Clustering for new tables with Z-ORDER fallback for existing tables; use streaming MERGE with `foreachBatch` for near-real-time or scheduled batch MERGE for hourly refreshes.

**Rationale**:
- **Schema Evolution Control**: `mergeSchema` option provides per-write control vs permissive global `autoMerge`, preventing unintended schema drift
- **Gold Layer Governance**: Explicit `ALTER TABLE` ensures downstream consumers aren't surprised by schema changes
- **Query Performance**: Liquid Clustering provides 3-5x faster optimization than Z-ordering with incremental updates; Z-ORDER still effective for existing tables with stable access patterns
- **Incremental Aggregation**: MERGE updates only changed aggregates (80-95% reduction vs full overwrite), preserving historical data and enabling concurrent queries

**Alternatives Considered**:
- **Global autoMerge**: Rejected due to lack of governance (allows any schema changes without validation)
- **Hive-style partitioning only**: Rejected for high-cardinality columns (creates small partition problem)
- **Complete mode streaming**: Rejected due to full table rewrite on every trigger (expensive, slow)
- **Full overwrite pattern**: Rejected due to 5-10x higher compute costs

**Implementation Notes**:

### Schema Evolution by Layer
```python
# Bronze: Permissive ingestion
df.write.format("delta").mode("append") \
  .option("mergeSchema", "true") \
  .save("/path/to/bronze")

# Silver: Controlled evolution
df.write.format("delta").mode("append") \
  .option("mergeSchema", "true") \
  .save("/path/to/silver")

# Gold: Explicit governance
spark.sql("ALTER TABLE gold.campaign_performance_summary ADD COLUMN new_metric DOUBLE")
```

### Optimization Strategies
```sql
-- New tables: Liquid Clustering (recommended)
CREATE TABLE campaign_performance_summary (
  campaign_id BIGINT,
  total_impressions BIGINT,
  ...
)
USING DELTA
CLUSTER BY (campaign_id, segment_id);

-- Existing tables: Z-ORDER
OPTIMIZE campaign_performance_summary
ZORDER BY (campaign_id, segment_id);
```

### Incremental Aggregation Pattern
```python
# Scheduled batch MERGE for hourly refresh
def refresh_hourly_aggregates(target_hour):
    hourly_data = spark.read.table("silver.engagements") \
        .filter((col("timestamp") >= target_hour) &
                (col("timestamp") < target_hour + timedelta(hours=1)))

    hourly_data.createOrReplaceTempView("hourly_updates")

    spark.sql("""
        MERGE INTO gold.campaign_performance_summary AS target
        USING hourly_updates AS source
        ON target.campaign_id = source.campaign_id
           AND target.hour_window = source.hour_window
        WHEN MATCHED THEN UPDATE SET *
        WHEN NOT MATCHED THEN INSERT *
    """)
```

**Optimization Checklist**:
- Target 128MB-1GB files via `spark.sql.files.maxRecordsPerFile`
- Run OPTIMIZE daily for hourly dashboard tables
- Enable `delta.autoOptimize.optimizeWrite` and `autoCompact` for gold tables
- Use partition pruning in MERGE ON clause for 90%+ search space reduction

---

## Research: Lakebase Sync Tables

**Decision**: Use Triggered Sync Mode with hourly Databricks Workflow scheduling, with automatic fallback to gold Delta tables when sync unavailable.

**Rationale**:
- **Optimal Refresh Cadence**: Triggered mode supports hourly incremental updates (vs 15-second minimum for continuous mode)
- **Low-Latency Access**: Lakebase Postgres provides sub-millisecond reads for operational workloads
- **Efficient Incremental Sync**: Change Data Feed (CDF) processes only delta changes vs full snapshots
- **Resilience**: Automatic fallback to gold Delta tables ensures availability during Lakebase maintenance
- **Cost Efficiency**: 99% idle time vs 100% running for continuous mode

**Alternatives Considered**:
- **Continuous Sync**: Rejected as over-engineered for hourly refresh (excessive compute costs)
- **Snapshot Mode**: Rejected due to inefficiency for large tables (full refresh each time)
- **Materialized Views**: Rejected due to lack of OLTP low-latency access layer
- **Cached Queries**: Rejected as invalidated on any table update (unsuitable for hourly-changing data)

**Implementation Notes**:

### Setup Prerequisites
```python
# Enable Change Data Feed on source Delta table
spark.sql("""
    ALTER TABLE bryan_li.analytics.campaign_performance_summary
    SET TBLPROPERTIES (delta.enableChangeDataFeed = true)
""")
```

### Create Synced Table
```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.database import *

w = WorkspaceClient()

synced_table = w.database.create_synced_database_table(
    SyncedDatabaseTable(
        name="bryan_li.analytics.campaign_performance_summary_sync",
        database_instance_name="production_lakebase_instance",
        spec=SyncedTableSpec(
            source_table_full_name="bryan_li.analytics.campaign_performance_summary",
            primary_key_columns=["campaign_id"],
            scheduling_policy=SyncedTableSchedulingPolicy.TRIGGERED,
            new_pipeline_spec=NewPipelineSpec(
                storage_catalog="bryan_li",
                storage_schema="analytics"
            )
        )
    )
)
```

### Hourly Refresh Job
```python
# Databricks Workflow: Cron "0 0 * * * ?" (hourly at minute 0)
w.database.sync_synced_database_table(
    full_name="bryan_li.analytics.campaign_performance_summary_sync"
)
```

### Fallback Query Pattern
```python
def query_with_fallback(table_name: str) -> DataFrame:
    """Query sync table with automatic fallback to Delta."""
    synced_name = f"{table_name}_sync"

    try:
        table_info = w.database.get_synced_database_table(synced_name)
        if table_info.pipeline_state in ["RUNNING", "IDLE"]:
            return spark.read.table(synced_name)
    except:
        pass

    # Fallback to gold Delta
    return spark.read.table(table_name)
```

**Limitations**:
- 2 TB uncompressed source table size limit
- Only additive schema changes supported (breaking changes require re-sync)
- Requires primary key definition for efficient row-level operations
- ~1,200 rows/sec/CU for continuous writes, 15,000 rows/sec/CU bulk

---

## Research: DBSQL for React Frontend

**Decision**: Use REST API (Statement Execution API 2.0) with backend proxy architecture (Node.js/Express or FastAPI) instead of direct `@databricks/sql` connector.

**Rationale**:
- **Stateless Architecture**: REST API eliminates connection pooling complexity (no session state to manage)
- **Security**: React frontend cannot securely connect directly to Databricks (would expose credentials); backend proxy mediates all connections
- **Performance**: Built-in query caching (24-hour result cache, serverless remote cache) without client implementation
- **Simplicity**: No driver installation or platform-specific binaries; works with standard HTTP clients

**Alternatives Considered**:
- **@databricks/sql Connector**: Rejected due to 15-16s connection initialization latency, no built-in connection pooling, unclear session reuse patterns
- **Direct Delta Lake Access**: Rejected due to lack of Unity Catalog governance
- **JDBC/ODBC**: Rejected despite 2x performance advantage due to operational complexity

**Implementation Notes**:

### Backend Proxy Pattern
```javascript
// Node.js + Express backend
import express from 'express';
import axios from 'axios';

app.post('/api/query', async (req, res) => {
  const { statement, parameters } = req.body;

  const payload = {
    warehouse_id: WAREHOUSE_ID,
    statement: statement,
    parameters: parameters,
    wait_timeout: '50s'
  };

  const response = await axios.post(
    `https://${DATABRICKS_HOST}/api/2.0/sql/statements`,
    payload,
    { headers: { 'Authorization': `Bearer ${DATABRICKS_TOKEN}` } }
  );

  if (response.data.status.state === 'SUCCEEDED') {
    return res.json(response.data.result.data_array);
  }

  // Poll for async results
  const results = await pollForResults(response.data.statement_id);
  res.json(results);
});
```

### Parameterized Queries (SQL Injection Prevention)
```javascript
const statement = `
  SELECT * FROM bryan_li.analytics.campaign_performance_summary_sync
  WHERE campaign_id = :campaign_id AND date >= :start_date
`;

const parameters = [
  { name: 'campaign_id', value: 'C123', type: 'STRING' },
  { name: 'start_date', value: '2024-01-01', type: 'DATE' }
];
```

### Error Handling with Circuit Breaker
```javascript
class DatabricksQueryClient {
  async executeWithRetry(statement, parameters, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await executeDatabricksQuery(statement, parameters);
      } catch (error) {
        if (!this.isRetryableError(error)) throw error;
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  isRetryableError(error) {
    return error.response?.status === 503 ||
           error.response?.status === 429 ||
           error.code === 'ECONNRESET';
  }
}
```

### Frontend Caching (React Query)
```javascript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['campaigns', { incomeBracket: '60-100K' }],
  queryFn: () => axios.post('/api/query', { statement, parameters }),
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 2
});
```

**Production Checklist**:
- Use Service Principal tokens (not personal access tokens)
- Implement request auth/authorization on backend API
- Enable HTTP keep-alive for connection reuse
- Set 30-50s `wait_timeout` for interactive queries
- Monitor warehouse auto-stop behavior

---

## Research: React Visualization Libraries

**Decision**:
- **Time-series**: Recharts (primary), ECharts for React (>20K rows fallback)
- **Funnel**: Nivo (@nivo/funnel)
- **Heatmap**: Nivo (@nivo/heatmap), ECharts for >10K cells
- **Geographic maps**: react-simple-maps (choropleth), deck.gl (data-heavy overlays)
- **Conversion paths**: Nivo (@nivo/sankey)

**Rationale**:
- **Recharts for Time-Series**: 10M+ weekly downloads, best developer experience, built-in TypeScript, handles 10K+ rows adequately
- **Nivo for Specialized Charts**: Native funnel/heatmap/sankey components, extensive customization, responsive design
- **Performance Fallback**: ECharts with WebGL for datasets >20K rows (3-5x faster than SVG rendering)
- **Maps**: react-simple-maps for simplicity (choropleth), deck.gl for GPU-accelerated large datasets

**Alternatives Considered**:
- **Victory**: Rejected due to limited adoption, smaller community
- **D3.js (direct)**: Rejected as too low-level for rapid dashboard development
- **Visx**: Rejected due to steeper learning curve, longer development time
- **Apache ECharts (primary)**: Rejected due to outdated echarts-for-react wrapper; use as fallback only

**Implementation Notes**:

### Installation
```bash
npm i recharts@3.2.1
npm i @nivo/funnel@0.91.0 @nivo/heatmap@0.99.0 @nivo/sankey@0.87.23
npm i react-simple-maps@3.0.0
npm i echarts@5.5.1  # Fallback for large datasets
```

### Component Examples
```typescript
// Time-series with Recharts
import { LineChart, Line, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={400}>
  <LineChart data={data}>
    <Line type="monotone" dataKey="impressions" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>

// Funnel with Nivo
import { ResponsiveFunnel } from '@nivo/funnel';

<ResponsiveFunnel
  data={funnelData}
  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
  valueFormat=">-.4s"
  colors={{ scheme: 'spectral' }}
/>
```

### Performance Optimizations
- Use LTTB (Largest-Triangle-Three-Buckets) algorithm for >10K point downsampling
- Switch to Canvas rendering in Nivo for >5K cells: `enableLabels={false}`
- Implement React.memo() for chart components to prevent re-renders
- Debounce window resize events (300ms recommended)

**Bundle Sizes**:
- Recharts: ~400KB (tree-shakeable)
- Nivo packages: ~100-200KB each
- react-simple-maps: ~50KB
- deck.gl: ~600KB (code split for on-demand loading)

---

## Research: PySpark Aggregation Patterns

**Decision**: Use native PySpark window functions with broadcast joins for multi-touch attribution, successive LEFT JOINs for funnel analysis, and optimized groupBy/pivot with explicit value specification for segment rollups.

**Rationale**:
- **Performance**: Native PySpark functions 3-100x faster than pandas UDFs (JVM-native, Catalyst optimizer, no Python-JVM serialization)
- **Accuracy**: Window functions with proper partitioning (`partitionBy`, `orderBy`, `rowsBetween`) provide exact attribution without data loss
- **Scalability**: Databricks Photon engine optimizes window functions natively; broadcast joins skip shuffle for small tables
- **Maintainability**: Declarative PySpark API clearer than custom pandas UDFs

**Alternatives Considered**:
- **Pandas UDFs**: Rejected due to serialization overhead, 3-100x slower, no partial aggregation
- **Pure SQL**: Same performance as PySpark (Catalyst optimizer), but less composable for multi-step transformations
- **Pre-aggregated Views**: Rejected due to storage costs and staleness; use temp views for single-use only

**Implementation Notes**:

### Multi-Touch Attribution Models
```python
from pyspark.sql.window import Window
from pyspark.sql.functions import first_value, row_number, count, sum, expr

# First-touch attribution
window_first = Window.partitionBy("individual_id", "conversion_id") \
    .orderBy("touchpoint_timestamp") \
    .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing)

first_touch = exposures.withColumn(
    "is_first_touch",
    row_number().over(window_first) == 1
).filter(col("is_first_touch")) \
 .withColumn("attribution_weight", lit(1.0))

# Time-decay attribution
time_decay = exposures.withColumn(
    "days_to_conversion",
    (unix_timestamp("conversion_ts") - unix_timestamp("touchpoint_ts")) / 86400
).withColumn(
    "decay_weight",
    expr("pow(2, -days_to_conversion / 7.0)")  # 7-day half-life
)

window_sum = Window.partitionBy("individual_id", "conversion_id")
time_decay = time_decay.withColumn(
    "attribution_weight",
    col("decay_weight") / sum("decay_weight").over(window_sum)
)
```

### Funnel Analysis (Cohort-Based)
```python
# Define cohort (avoid cross-cohort contamination)
cohort = exposures.filter(
    (col("exposure_ts") >= "2024-01-01") &
    (col("exposure_ts") < "2024-02-01")
).withColumn(
    "first_exposure",
    min("exposure_ts").over(Window.partitionBy("individual_id"))
).filter(col("exposure_ts") == col("first_exposure"))

# Track cohort through stages with LEFT JOINs
stage2 = cohort.join(
    responses.filter(col("response_ts") <= expr("first_exposure + interval 7 days")),
    "individual_id",
    "left"
)

# Calculate conversion rates
funnel_summary = stage2.agg(
    count("*").alias("total_cohort"),
    sum(when(col("response_id").isNotNull(), 1).otherwise(0)).alias("responses")
).withColumn(
    "conversion_rate",
    col("responses") / col("total_cohort")
)
```

### Segment Rollups with Pivot
```python
# Specify pivot values explicitly (faster than inference)
channels = ["Email", "Social", "Display", "Video", "CTV"]

performance_pivot = exposures.groupBy("segment") \
    .pivot("channel", channels) \
    .agg(
        count("exposure_id").alias("impressions"),
        sum("cost").alias("total_cost")
    )

# Use broadcast for small dimension tables
segment_metadata = spark.table("segments")
enriched = exposures.join(broadcast(segment_metadata), "segment")
```

**Performance Checklist**:
- Use `broadcast()` for tables <10GB
- Specify pivot values explicitly (avoid inference)
- Cache frequently-accessed DataFrames only
- Enable Photon engine for automatic optimization
- Avoid pandas UDFs unless migrating existing code

---

## Research: Role-Based Data Filtering

**Decision**: Unity Catalog Row-Level Security (Row Filters)

**Rationale**:
- **Centralized Enforcement**: Row filters apply across all access patterns (notebooks, SQL warehouses, BI tools, Databricks Apps)
- **Automatic Inheritance**: Filters cascade to all downstream views/queries; users cannot bypass by accessing underlying tables
- **Built-in Audit Logging**: `system.access.audit` table captures all data access with complete visibility
- **Performance**: With proper design (<10% overhead), filters pushed down to scan stage, reading only required data
- **SQL Injection Protection**: Pre-registered SQL UDFs with typed parameters eliminate injection risk

**Alternatives Considered**:
- **Application-Layer Filtering**: Rejected due to lack of centralized enforcement, must implement consistently across all access paths, custom audit logging required
- **Dynamic Views**: Rejected as users with table access can bypass view filters
- **Hybrid Approach**: Rejected due to complexity of maintaining two security layers

**Implementation Notes**:

### Create Row Filter Function
```sql
-- Create filter function for role-based access
CREATE FUNCTION bryan_li.analytics.role_based_filter(campaign_id STRING)
RETURN is_account_group_member('marketing_cmo')
       OR current_user() IN (
           SELECT user_email FROM bryan_li.analytics.user_assignments
           WHERE assigned_campaign_ids LIKE '%' || campaign_id || '%'
       );

-- Apply filter to table
ALTER TABLE bryan_li.analytics.campaign_performance_summary
SET ROW FILTER bryan_li.analytics.role_based_filter ON (campaign_id);
```

### Best Practices for Performance
- Use deterministic functions: `is_account_group_member()`, `current_user()`, `is_member()`
- Avoid per-row metadata lookups or subqueries in filter logic
- Keep function arguments minimal (only necessary columns)
- Test query performance with realistic workloads after applying filters

### Audit Setup
```python
# Query audit logs for data access patterns
audit_query = """
SELECT
    event_time,
    user_identity.email as user_email,
    request_params.full_name_arg as table_accessed,
    action_name
FROM system.access.audit
WHERE service_name = 'unityCatalog'
  AND action_name IN ('getTable', 'generateTemporaryTableCredential')
  AND request_params.full_name_arg LIKE 'bryan_li.analytics%'
  AND event_date >= current_date() - INTERVAL 7 DAYS
ORDER BY event_time DESC
"""
```

### Integration with Project
```python
# Extend auth.py to support row filter management
def create_row_filter_for_user(
    catalog: str, schema: str, table: str,
    filter_column: str, user_groups: List[str]
) -> None:
    """Create row filter based on user group membership."""

    function_name = f"{catalog}.{schema}.{table}_{filter_column}_filter"
    group_checks = " OR ".join([f"is_account_group_member('{g}')" for g in user_groups])

    filter_sql = f"""
    CREATE OR REPLACE FUNCTION {function_name}({filter_column} STRING)
    RETURN {group_checks}
    """

    spark.sql(filter_sql)

    spark.sql(f"""
        ALTER TABLE {catalog}.{schema}.{table}
        SET ROW FILTER {function_name} ON ({filter_column})
    """)
```

**When to Use Application-Layer Instead**:
- External applications (non-Databricks endpoints)
- Complex multi-table business logic not expressible in SQL UDFs
- Runtime context unavailable in Databricks (JWT claims, session variables)
- Delta Sharing consumers (doesn't support row filters)

---

## Summary

All research complete with no remaining unknowns. Key technology decisions:

1. **Data Architecture**: Medallion with Liquid Clustering, hourly MERGE refreshes
2. **Sync Tables**: Triggered mode with automatic Delta fallback
3. **Frontend Data Access**: REST API via backend proxy (Node.js/Express)
4. **Visualizations**: Recharts + Nivo + react-simple-maps
5. **PySpark Aggregations**: Native window functions + broadcast joins
6. **Security**: Unity Catalog row-level filters

Ready for Phase 1: Design & Contracts.
