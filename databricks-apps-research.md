# Databricks Apps Research: Synthetic Identity Graph Data Generator

**Research Date**: 2025-10-01
**Purpose**: Technical decision-making for building a synthetic identity graph data generator on Databricks Apps
**Target Scale**: 1M+ households with related data in under 5 minutes

---

## 1. Databricks Apps Architecture

### Decision: Deploy as Serverless Databricks App with External State Persistence

**Deployment Model**:
- Containerized serverless application running on Databricks' managed platform
- Maximum resources: 2 vCPUs and 6 GB memory per app
- No persistent in-memory state after app restarts

**Runtime Environment**:
- Python 3.11+ on Databricks Runtime 14.3 LTS or higher
- Supports frameworks: Streamlit, Dash, Gradio (Python), React/Angular/Svelte (Node.js)
- No pre-installed Node.js libraries (must declare in package.json)

**Key Limitations**:
1. **Resource Constraints**: 2 vCPU, 6 GB memory max (app restarts if exceeded)
2. **File Size Limits**: Individual app files cannot exceed 10 MB
3. **State Persistence**: In-memory state is lost on restart; external storage required
4. **Logging**: App logs deleted when compute resource terminates
5. **Workspace Tier**: Not supported in Standard tier workspaces
6. **App Quota**: Limited number of apps per workspace
7. **Graceful Shutdown**: Must terminate within 15 seconds of SIGTERM or forced SIGKILL

**Rationale**:
- Databricks Apps provides integrated authentication and Unity Catalog access
- Serverless model eliminates infrastructure management
- Native integration with Databricks SQL, Jobs, and Model Serving for compute-intensive tasks
- 2 vCPU limit is acceptable because data generation will execute on Databricks compute clusters, not app compute
- App serves only as UI/orchestration layer

**Alternatives Considered**:
- **External Web App + Databricks API**: More complex deployment, requires separate hosting, loses workspace authentication integration
- **Jupyter Notebook UI**: Poor user experience for non-technical users, no multi-step wizard capability
- **Databricks SQL Dashboard**: No support for complex multi-step workflows or dynamic parameter configuration

---

## 2. Frontend Framework Choices

### Decision: Streamlit for Multi-Step Wizard Interface

**Framework Selection**: Streamlit

**Rationale**:
1. **Multi-Step Wizard Support**: Session state management and callbacks provide clean patterns for wizard progression
2. **Low Learning Curve**: Simple, Pythonic API enables rapid development ("app as a script" paradigm)
3. **Built-in State Management**: `st.session_state` provides first-class support for preserving wizard state across reruns
4. **Rich Widget Library**: Sliders, sidebars, progress bars, and form components ideal for configuration UI
5. **Performance**: Script reruns are fast for configuration UIs (non-issue for our use case)
6. **Databricks Support**: Explicitly supported in Databricks Apps runtime

**Implementation Pattern**:
```python
# Wizard state management
if 'wizard_step' not in st.session_state:
    st.session_state.wizard_step = 0
    st.session_state.config = {}

def next_step():
    st.session_state.wizard_step += 1

def prev_step():
    st.session_state.wizard_step -= 1

# Step rendering with callbacks
if st.session_state.wizard_step == 0:
    # Household configuration
    st.button("Next", on_click=next_step)
elif st.session_state.wizard_step == 1:
    # Demographics configuration
    st.button("Back", on_click=prev_step)
    st.button("Next", on_click=next_step)
```

**Alternatives Considered**:

**Gradio**:
- **Pros**: Fastest prototyping, excellent for ML model UIs
- **Cons**: Less flexible for complex multi-step workflows, designed for input/output pairs rather than wizard UIs
- **Verdict**: Better for model inference interfaces, not ideal for configuration wizards

**Dash**:
- **Pros**: More customizable, better performance for complex interactions, only reruns callback functions (not entire script)
- **Cons**: Steeper learning curve, requires more boilerplate code, callback pattern more complex for wizard flows
- **Multi-Page Pattern**: Requires `dcc.Store` component for state sharing across pages, pattern-matching callbacks, and disabling validation
- **Verdict**: Overkill for wizard UI, complexity not justified for configuration interface

**Comparison Summary**:

| Feature | Streamlit | Gradio | Dash |
|---------|-----------|--------|------|
| Learning Curve | Low | Lowest | High |
| Multi-Step Wizards | Excellent | Poor | Good |
| State Management | Built-in (`session_state`) | Limited | Manual (`dcc.Store`) |
| Customization | Medium | Low | High |
| Performance | Good (script rerun) | Excellent | Excellent (targeted callbacks) |
| Best For | Dashboards, wizards | ML demos | Complex interactive apps |

---

## 3. Session Management

### Decision: External State Persistence Using Unity Catalog Volumes + In-App Session State

**Architecture**:
- **In-App State**: Streamlit `st.session_state` for active wizard session (household config, demographics, etc.)
- **Persistent State**: Unity Catalog volumes for intermediate results, generated datasets, and user preferences
- **Job State**: Databricks Jobs API for tracking long-running generation jobs

**Implementation Pattern**:
```python
import streamlit as st
from databricks.sdk import WorkspaceClient

# Initialize session state
if 'config' not in st.session_state:
    st.session_state.config = load_config_from_volume()

# Save to persistent storage on key checkpoints
def save_checkpoint():
    w = WorkspaceClient()
    config_path = f"/Volumes/bryan_li/identity_gen/configs/{st.session_state.session_id}.json"
    w.files.upload(config_path, json.dumps(st.session_state.config))

# Trigger generation job (runs on cluster, not app compute)
def start_generation():
    w = WorkspaceClient()
    job_run = w.jobs.run_now(
        job_id=JOB_ID,
        notebook_params=st.session_state.config
    )
    st.session_state.job_run_id = job_run.run_id
```

**Rationale**:
1. **Volatility Mitigation**: App restarts lose in-memory state; Unity Catalog volumes provide durable storage
2. **Separation of Concerns**: UI state (wizard progress) separate from data state (generated datasets)
3. **Scalability**: Heavy computation offloaded to Databricks Jobs/clusters, not app compute (2 vCPU limit)
4. **Audit Trail**: Persistent configurations enable reproducibility and debugging

**Best Practices**:
1. **Checkpoint Strategy**: Save config to volumes after each wizard step validation
2. **Session ID**: Generate unique session ID on wizard initialization for config file naming
3. **Lazy Loading**: Load large datasets via Databricks SQL queries, not in-app DataFrames
4. **Progress Polling**: Use Jobs API to poll generation status, display progress in Streamlit UI
5. **Graceful Degradation**: Handle missing state gracefully (e.g., expired sessions redirect to new wizard)

**Alternatives Considered**:
- **SQL Warehouse Tables**: More overhead for transient session state, overkill for temporary configs
- **Object Storage (S3/ADLS)**: Requires additional credential management, Unity Catalog volumes provide simpler interface
- **Databricks Secret Scopes**: For secrets only, not suitable for general state persistence

---

## 4. Synthetic Data Generation at Scale

### Decision: Databricks Labs `dbldatagen` + Pandas UDFs for Custom Logic

**Primary Tool**: Databricks Labs Data Generator (`dbldatagen`)

**Rationale**:
1. **Native Spark Integration**: Generates data directly as Spark DataFrames (no serialization overhead)
2. **Scale**: Can generate billions of rows in minutes on appropriately sized clusters
3. **Referential Integrity**: Built-in support for primary/foreign key relationships across tables
4. **Repeatability**: Seed-based generation ensures deterministic outputs
5. **No External Dependencies**: Beyond Databricks runtime packages
6. **Performance**: Optimized for distributed generation, avoids Python UDF overhead for common patterns

**Architecture**:
```python
import dbldatagen as dg

# Household generation (dbldatagen)
household_spec = (
    dg.DataGenerator(spark, name="households", rows=1_000_000)
    .withColumn("household_id", "long", uniqueValues=1_000_000)
    .withColumn("income_bracket", "string", values=["<30K", "30-60K", "60-100K", "100K+"], weights=[0.25, 0.35, 0.25, 0.15])
    .withColumn("location", "string", template="City_{}")
)
households_df = household_spec.build()

# Individual generation with FK relationship
individual_spec = (
    dg.DataGenerator(spark, name="individuals", rows=2_500_000)
    .withColumn("individual_id", "long", uniqueValues=2_500_000)
    .withColumn("household_id", "long", minValue=1, maxValue=1_000_000)  # FK to households
    .withColumn("age", "integer", minValue=18, maxValue=85, distribution=dg.distributions.Normal(45, 15))
)
individuals_df = individual_spec.build()
```

**Faker Integration** (for complex semantic data):
```python
from pyspark.sql.functions import pandas_udf
from faker import Faker
import pandas as pd

@pandas_udf("string")
def generate_emails(ids: pd.Series) -> pd.Series:
    fake = Faker()
    Faker.seed(0)  # Deterministic
    return pd.Series([fake.email() for _ in range(len(ids))])

# Apply Pandas UDF for columns requiring Faker
individuals_df = individuals_df.withColumn("email", generate_emails("individual_id"))
```

**Performance Best Practices**:
1. **Avoid Traditional UDFs**: Use Pandas UDFs (3-100x faster) for custom logic due to vectorization
2. **Broadcast Variables**: For lookup tables (e.g., content catalog), broadcast to all workers
3. **Partition Strategy**: Generate partitioned data aligned with target Delta table partitioning
4. **Batch Size**: `dbldatagen` automatically handles batch sizing for optimal parallelism
5. **Cluster Sizing**: For 1M households + 2.5M individuals + events (10M+ total rows), use cluster with:
   - 8-16 worker nodes (m5.4xlarge or equivalent)
   - Auto-scaling enabled for variable workload
   - Photon acceleration for vectorized execution

**Faker at Scale - Known Limitations**:
- **1M records**: Noticeable slowdown (several minutes), acceptable with Pandas UDFs
- **10M+ records**: Memory issues without chunking; use `dbldatagen` for bulk columns, Faker for semantic fields only
- **Recommendation**: Limit Faker to <20% of columns, use `dbldatagen` templates/distributions for majority

**Alternatives Considered**:
- **Pure Faker**: Too slow at 1M+ scale, memory issues, designed for single-node generation
- **Custom PySpark Generators**: Reinvents the wheel, `dbldatagen` provides proven patterns
- **Synth/SDV Libraries**: Not Spark-native, require serialization overhead or single-node generation

**Hybrid Approach** (Recommended):
1. **dbldatagen**: Household structure, demographics, numeric attributes, timestamps
2. **Pandas UDFs + Faker**: Email addresses, names, product descriptions (semantic complexity)
3. **Built-in Spark Functions**: Date math, random distributions, conditional logic

---

## 5. Unity Catalog Integration

### Decision: Databricks SDK for Python with Explicit Permission Validation

**API Pattern**: `databricks.sdk.WorkspaceClient` with `w.tables.create()` and `w.grants.get()`

**Implementation**:

```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import catalog

w = WorkspaceClient()

# 1. Check CREATE TABLE permissions BEFORE generation
def verify_permissions(catalog_name: str, schema_name: str, principal: str) -> bool:
    """Verify user has CREATE TABLE privilege on schema"""
    try:
        permissions = w.grants.get(
            securable_type=catalog.SecurableType.SCHEMA,
            full_name=f"{catalog_name}.{schema_name}",
            principal=principal
        )

        # Check if CREATE_TABLE privilege exists
        for grant in permissions.privilege_assignments:
            if catalog.Privilege.CREATE_TABLE in grant.privileges:
                return True
        return False
    except Exception as e:
        st.error(f"Permission check failed: {e}")
        return False

# 2. Create Delta Lake table via SDK
def create_identity_table(
    catalog_name: str,
    schema_name: str,
    table_name: str,
    df: DataFrame
):
    """Write DataFrame as managed Delta table in Unity Catalog"""
    full_name = f"{catalog_name}.{schema_name}.{table_name}"

    # Write DataFrame to Delta Lake
    df.write.format("delta") \
        .mode("overwrite") \
        .option("overwriteSchema", "true") \
        .saveAsTable(full_name)

    # Optionally: Grant SELECT to users
    w.grants.update(
        full_name=full_name,
        securable_type=catalog.SecurableType.TABLE,
        changes=[
            catalog.PermissionsChange(
                principal="analysts_group",
                add=[catalog.Privilege.SELECT]
            )
        ]
    )

# 3. Wizard flow with pre-validation
if st.button("Generate Dataset"):
    current_user = w.current_user.me().user_name

    if not verify_permissions("bryan_li", "identity_graphs", current_user):
        st.error("You lack CREATE TABLE privileges in bryan_li.identity_graphs schema")
        st.info("Request access from your workspace admin or catalog owner")
        return

    # Proceed with generation
    start_generation_job(config=st.session_state.config)
```

**Required Permissions**:
- `USE_CATALOG` on `bryan_li` catalog
- `USE_SCHEMA` on target schema (e.g., `identity_graphs`)
- `CREATE_TABLE` on target schema

**Permission Check Methods**:
1. **Proactive API Check**: `w.grants.get()` before generation (recommended)
2. **SQL Command**: `SHOW GRANTS ON SCHEMA bryan_li.identity_graphs` (requires parsing output)
3. **Try/Catch**: Attempt table creation and handle PermissionDenied exception (reactive, poor UX)

**Rationale**:
1. **Early Validation**: Check permissions before 5-minute generation job runs
2. **Clear Error Messages**: Provide actionable guidance when permissions missing
3. **Audit Support**: `w.grants` API provides full visibility into effective permissions
4. **SDK vs SQL**: SDK provides typed responses, better error handling than raw SQL

**Alternatives Considered**:
- **SQL Warehouse Execution**: More latency, requires parsing SQL output, less type-safe
- **Assume Permissions**: Run generation and handle failure reactively (terrible UX, wastes compute)
- **Databricks CLI**: Requires subprocess execution, less integrated with Python app

**Best Practices**:
1. **Validate Early**: Permission check on wizard initialization (before user spends time configuring)
2. **Principal Detection**: Use `w.current_user.me().user_name` for logged-in user
3. **Helpful Errors**: Provide links to documentation or suggest contacting workspace admin
4. **Schema Namespace**: Create dedicated schema (e.g., `bryan_li.synthetic_data`) for generated tables
5. **Table Naming Convention**: `{purpose}_{scale}_{timestamp}` (e.g., `identity_graph_1M_20251001`)

---

## 6. Performance Optimization

### Decision: Adaptive Query Execution (AQE) + Optimized Writes + Strategic Partitioning

**Target**: Generate and write 1M+ households with related data (10M+ total rows) in under 5 minutes

**Key Strategies**:

#### 6.1 Spark Configuration

```python
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
spark.conf.set("spark.sql.adaptive.enabled", "true")  # Default in DBR 14.3+
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.shuffle.partitions", "auto")  # Or 200-400 for 1M households
```

**Optimized Writes**: Dynamically optimizes partition sizes to write 128 MB files per partition, reducing small file problem

**Auto Compaction**: Automatically triggers for partitions with many small files (configurable via `spark.databricks.delta.autoCompact.minNumFiles`)

**Adaptive Query Execution (AQE)**: Dynamically coalesces partitions, switches join strategies, and handles skew at runtime

#### 6.2 Partitioning Strategy

**Decision: Avoid Physical Partitioning for <100 GB Tables, Use Z-Ordering Instead**

**Rationale**:
- 1M households + 10M related records ≈ 5-20 GB uncompressed (well below 100 GB threshold)
- Physical partitioning causes write overhead and small file proliferation at this scale
- Z-Ordering provides query optimization without partitioning downsides

**Z-Order Approach**:
```python
# Write unpartitioned table
households_df.write.format("delta").mode("overwrite").saveAsTable("bryan_li.synthetic.households")

# Apply Z-Ordering for common query patterns
spark.sql("OPTIMIZE bryan_li.synthetic.households ZORDER BY (location, income_bracket)")

# For engagement events (time-series queries)
spark.sql("OPTIMIZE bryan_li.synthetic.engagement_events ZORDER BY (individual_id, timestamp)")
```

**When to Partition** (for future large-scale scenarios):
- Tables >100 GB and growing
- Frequent queries filtering by specific columns (date, region)
- Files should be 100MB-1GB per partition
- Example: `partitionBy("event_date")` for multi-year engagement history

#### 6.3 Write Performance Pattern

```python
# Generate all entities in parallel (independent generation)
household_spec = dg.DataGenerator(spark, rows=1_000_000, partitions=200)
individual_spec = dg.DataGenerator(spark, rows=2_500_000, partitions=400)
engagement_spec = dg.DataGenerator(spark, rows=10_000_000, partitions=800)

# Build DataFrames (lazy evaluation)
households_df = household_spec.build()
individuals_df = individual_spec.build()
engagements_df = engagement_spec.build()

# Write in dependency order (household → individual → engagement)
# Use Spark Jobs API to parallelize independent writes
from concurrent.futures import ThreadPoolExecutor

def write_table(df, table_name):
    df.write.format("delta").mode("overwrite").saveAsTable(table_name)

with ThreadPoolExecutor(max_workers=3) as executor:
    # Households written first
    household_future = executor.submit(write_table, households_df, "households")
    household_future.result()  # Wait for completion

    # Individuals and identity mappings can write in parallel (both depend on households)
    individual_future = executor.submit(write_table, individuals_df, "individuals")
    identity_future = executor.submit(write_table, identity_mappings_df, "identity_mappings")
    individual_future.result()
    identity_future.result()

    # Engagement events depend on individuals
    engagement_future = executor.submit(write_table, engagements_df, "engagement_events")
    engagement_future.result()
```

#### 6.4 Join Optimization

**Broadcast Joins** for small reference tables (<10 MB):
```python
from pyspark.sql.functions import broadcast

# Content catalog (small lookup table)
content_df = spark.table("content_catalog")  # 1000 rows

# Broadcast join for engagement generation
engagements_df = individuals_df.join(
    broadcast(content_df),
    individuals_df.preferred_category == content_df.category
)
```

**Shuffle Joins** for large-to-large joins (household-individual):
```python
# Let AQE handle partition sizing automatically
individuals_df = individuals_df.join(
    households_df,
    on="household_id",
    how="left"
)
```

#### 6.5 Cluster Configuration

**Recommended for 1M Households + 10M Events**:
- **Driver**: m5.4xlarge (16 vCPU, 64 GB RAM)
- **Workers**: 8x m5.4xlarge (auto-scaling 4-12)
- **Databricks Runtime**: 14.3 LTS with Photon
- **Photon Acceleration**: Enables vectorized execution for 2-3x speedup on aggregations/joins

**Cost Optimization**:
- Use Spot instances for workers (generation workload is fault-tolerant)
- Auto-termination after 10 minutes idle
- Generation job pattern: short-lived cluster (spin up → generate → write → terminate)

#### 6.6 Performance Benchmarks

**Expected Timeline** (1M households, 2.5M individuals, 10M engagement events):
1. Cluster startup: 2-3 minutes (cold start)
2. Data generation: 1-2 minutes (dbldatagen + Pandas UDFs)
3. Write to Delta Lake: 1-2 minutes (optimized writes)
4. Z-Order optimization: 0.5-1 minute (optional, can run async)

**Total**: 4-8 minutes (within 5-minute target with warm cluster)

**Optimization for <5 Min Target**:
- Use **warm pools** (Databricks feature): Reduces cluster startup to 30 seconds
- Pre-create empty Delta tables with schema: Eliminates initial schema inference
- Skip Z-Order during generation: Run as separate optimization job nightly

**Alternatives Considered**:
- **Aggressive Partitioning**: Too many small files at 1M scale, degrades read performance
- **Single-Node Generation**: Python faker loops cannot scale beyond 100K rows in reasonable time
- **Pandas-Only Approach**: Memory limited to driver node, no distributed benefits

---

## 7. Identity Graph Patterns

### Decision: Hybrid Relational + Graph Structure with Separate Identity Mapping Table

**Data Model Architecture**:

```
households (relational)
├── household_id (PK)
├── location
├── income_bracket
└── created_at

individuals (relational)
├── individual_id (PK)
├── household_id (FK → households)
├── age, gender, education
└── created_at

identity_mappings (graph edge table)
├── mapping_id (PK)
├── individual_id (FK → individuals)
├── identifier_type (email_hash, cookie_id, mobile_ad_id, device_id)
├── identifier_value
├── confidence_score (0.0-1.0 for probabilistic matching)
├── observed_at
└── is_primary (boolean)

content_engagement (event table)
├── event_id (PK)
├── identifier_type + identifier_value (composite FK → identity_mappings)
├── individual_id (resolved FK → individuals)
├── timestamp, content_id, duration
└── engagement_type

campaign_exposures (event table)
├── exposure_id (PK)
├── individual_id (FK → individuals)
├── campaign_id (FK → campaigns)
├── timestamp, channel
└── CHECK (timestamp >= campaign.start_date)

response_events (outcome table)
├── response_id (PK)
├── exposure_id (FK → campaign_exposures)
├── individual_id (FK → individuals)
├── response_type, timestamp, value
└── CHECK (timestamp >= exposure.timestamp)
```

**Rationale**:
1. **Relational Core**: Households and individuals in normalized tables (efficient joins, familiar SQL patterns)
2. **Identity Resolution**: Separate `identity_mappings` table models cross-device graph as edges
3. **Temporal Consistency**: CHECK constraints (Delta Lake 2.0+) enforce event ordering
4. **Referential Integrity**: Foreign keys maintained via generation logic (Delta Lake doesn't enforce FKs, but validates on read)

**Cross-Device Identity Resolution Pattern**:

```python
# Generate 2-4 identifiers per individual (realistic cross-device scenario)
identity_mappings_spec = (
    dg.DataGenerator(spark, rows=2_500_000 * 3)  # Average 3 devices/identifiers per person
    .withColumn("mapping_id", "long", uniqueValues=7_500_000)
    .withColumn("individual_id", "long", minValue=1, maxValue=2_500_000)
    .withColumn("identifier_type", "string",
                values=["email_hash", "cookie_id", "mobile_ad_id", "device_id", "ctv_id"],
                weights=[0.3, 0.25, 0.25, 0.15, 0.05])
    .withColumn("confidence_score", "float", minValue=0.7, maxValue=1.0)
    .withColumn("is_primary", "boolean", weights=[0.25, 0.75])  # 25% primary identifiers
)

# Generate identifier values using Pandas UDF + Faker
@pandas_udf("string")
def generate_identifier(id_type: pd.Series) -> pd.Series:
    fake = Faker()
    def make_id(typ):
        if typ == "email_hash": return hashlib.sha256(fake.email().encode()).hexdigest()
        elif typ == "cookie_id": return fake.uuid4()
        elif typ == "mobile_ad_id": return fake.uuid4()
        elif typ == "device_id": return fake.uuid4()
        else: return fake.uuid4()
    return id_type.apply(make_id)

identity_mappings_df = identity_mappings_df.withColumn(
    "identifier_value",
    generate_identifier("identifier_type")
)
```

**Referential Integrity in Distributed Generation**:

**Challenge**: Spark generates data in parallel partitions; foreign keys must resolve across partitions

**Solution 1: Two-Phase Generation** (Recommended)
```python
# Phase 1: Generate parent tables with known ID ranges
households_df = household_spec.build()
households_df.write.saveAsTable("households")

# Phase 2: Generate child tables with FK constraints pointing to known IDs
individual_spec = individual_spec.withColumn(
    "household_id",
    "long",
    minValue=1,
    maxValue=1_000_000,  # Must match household ID range
    random=True
)
individuals_df = individual_spec.build()
```

**Solution 2: Post-Generation Validation**
```python
# Validate referential integrity after generation
def validate_foreign_keys(child_table: str, parent_table: str, fk_column: str, pk_column: str):
    orphans = spark.sql(f"""
        SELECT COUNT(*) as orphan_count
        FROM {child_table} c
        LEFT JOIN {parent_table} p ON c.{fk_column} = p.{pk_column}
        WHERE p.{pk_column} IS NULL
    """)

    count = orphans.collect()[0]['orphan_count']
    if count > 0:
        raise ValueError(f"Found {count} orphaned records in {child_table}")

validate_foreign_keys("individuals", "households", "household_id", "household_id")
```

**Temporal Consistency Enforcement**:

```python
# Generate campaign exposures with temporal constraints
exposure_spec = (
    dg.DataGenerator(spark, rows=5_000_000)
    .withColumn("individual_id", "long", minValue=1, maxValue=2_500_000)
    .withColumn("campaign_id", "long", minValue=1, maxValue=100)
    .withColumn("exposure_timestamp", "timestamp",
                begin="2024-01-01 00:00:00",
                end="2024-12-31 23:59:59")
)

# Generate responses AFTER exposures (temporal dependency)
response_df = spark.sql("""
    SELECT
        uuid() as response_id,
        exposure_id,
        individual_id,
        DATE_ADD(exposure_timestamp, CAST(RAND() * 30 AS INT)) as response_timestamp,
        CASE
            WHEN RAND() < 0.05 THEN 'conversion'
            WHEN RAND() < 0.20 THEN 'click'
            ELSE 'view'
        END as response_type
    FROM campaign_exposures
    WHERE RAND() < 0.15  -- 15% response rate
""")

# Validate temporal consistency
assert response_df.filter("response_timestamp < exposure_timestamp").count() == 0
```

**Identity Graph Query Patterns**:

```sql
-- Cross-device attribution: Find all devices for users who converted
WITH converters AS (
    SELECT DISTINCT individual_id
    FROM response_events
    WHERE response_type = 'conversion'
)
SELECT
    c.individual_id,
    im.identifier_type,
    im.identifier_value,
    COUNT(ce.event_id) as engagement_count
FROM converters c
JOIN identity_mappings im ON c.individual_id = im.individual_id
LEFT JOIN content_engagement ce ON im.identifier_value = ce.identifier_value
GROUP BY c.individual_id, im.identifier_type, im.identifier_value

-- Household-level aggregation
SELECT
    h.household_id,
    h.location,
    COUNT(DISTINCT i.individual_id) as household_size,
    COUNT(DISTINCT ce.event_id) as total_engagements,
    SUM(CASE WHEN re.response_type = 'conversion' THEN 1 ELSE 0 END) as conversions
FROM households h
JOIN individuals i ON h.household_id = i.household_id
LEFT JOIN content_engagement ce ON i.individual_id = ce.individual_id
LEFT JOIN response_events re ON i.individual_id = re.individual_id
GROUP BY h.household_id, h.location
```

**Alternatives Considered**:

**Graph Database (Neo4j/TigerGraph)**:
- **Pros**: Native graph traversal algorithms, optimized for identity resolution queries
- **Cons**: Requires separate system outside Databricks, no Unity Catalog integration, adds operational complexity
- **Verdict**: Overkill for synthetic data generation; relational model with edge table sufficient

**Denormalized Wide Table**:
- **Pros**: Simpler schema, fewer joins
- **Cons**: Duplicates household/individual data across engagement rows, loses referential integrity semantics, huge table size
- **Verdict**: Poor for identity graph use case; need explicit relationship modeling

**Nested Structs (Spark StructType)**:
- **Pros**: Hierarchical representation (household → array of individuals → array of events)
- **Cons**: Difficult to query, no standard SQL support, explosion of data on unnesting
- **Verdict**: Not suitable for analytical queries

**Best Practices**:
1. **Cardinality Realism**: 2-15 devices per individual (per industry research)
2. **Confidence Scores**: Deterministic matches (email) = 1.0, probabilistic (device clustering) = 0.7-0.95
3. **Primary Identifier**: Flag one identifier as canonical for de-duplication
4. **Timestamp Tracking**: Separate `observed_at` (when mapping discovered) from `created_at` (entity creation)
5. **Privacy**: Use hashed identifiers (SHA256) for PII fields in synthetic data to model real-world practices

---

## Summary Decision Matrix

| Research Area | Decision | Key Trade-Off |
|--------------|----------|--------------|
| **App Architecture** | Serverless Databricks App | Simplicity vs. resource limits (2 vCPU acceptable for UI) |
| **Frontend Framework** | Streamlit | Ease of development vs. customization (sufficient for wizard) |
| **Session Management** | Unity Catalog volumes + session state | Durability vs. complexity (external storage required) |
| **Data Generation** | dbldatagen + Pandas UDFs | Scale vs. flexibility (hybrid covers both) |
| **Unity Catalog API** | Databricks SDK with permission checks | Type safety vs. SQL simplicity (SDK preferred) |
| **Performance** | AQE + Optimized Writes + Z-Order | Write latency vs. read performance (Z-Order optimal) |
| **Identity Graph** | Relational core + edge table | Query simplicity vs. graph capabilities (SQL sufficient) |

---

## Implementation Checklist

- [ ] Verify workspace tier (not Standard) and app quota availability
- [ ] Confirm Unity Catalog access to `bryan_li` catalog
- [ ] Install dependencies: `dbldatagen`, `databricks-sdk`, `streamlit`
- [ ] Create dedicated schema: `bryan_li.synthetic_data`
- [ ] Set up Unity Catalog volume: `/Volumes/bryan_li/synthetic_data/configs`
- [ ] Configure Databricks Job for data generation (8-node cluster with Photon)
- [ ] Implement permission validation on wizard initialization
- [ ] Design data model with FK relationships and temporal constraints
- [ ] Write contract tests for wizard API and generation outputs
- [ ] Benchmark generation on test cluster (target: <5 min for 1M households)
- [ ] Document quickstart with sample queries

---

**References**:
- Databricks Apps Docs: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/
- dbldatagen GitHub: https://github.com/databrickslabs/dbldatagen
- Unity Catalog SDK: https://databricks-sdk-py.readthedocs.io/
- Delta Lake Optimization: https://docs.databricks.com/aws/en/delta/best-practices
