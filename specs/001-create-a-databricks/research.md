# Research: Synthetic Identity Graph Dataset Generator

**Feature**: 001-create-a-databricks
**Date**: 2025-10-01
**Purpose**: Technology decisions for Databricks App generating synthetic identity graph datasets at scale (1K-1M+ households) in < 5 minutes

## 1. Databricks Apps Architecture

### Decision
Use Databricks Apps serverless deployment model with UI compute separated from data generation compute.

### Rationale
- Databricks Apps provides managed hosting for interactive applications within workspace
- Serverless model with 2 vCPU/6 GB memory limit sufficient for UI rendering and wizard logic
- Heavy data generation (1M+ records) delegated to separate Databricks clusters via Jobs API
- No infrastructure management required - automatic scaling and authentication
- Built-in workspace authentication and Unity Catalog permissions inheritance

### Key Characteristics
- **Deployment**: Single `app.py` entry point with `requirements.txt` dependencies
- **Runtime**: Python 3.10+ with access to Databricks SDK and workspace APIs
- **Compute**: UI runs on lightweight app compute (2 vCPU/6 GB)
- **Data Generation**: Submitted as Databricks Jobs to full-scale clusters
- **Lifecycle**: SIGTERM shutdown signal with 15-second graceful termination window
- **Limitations**:
  - No persistent in-memory state across restarts
  - Must use external storage (Unity Catalog volumes) for wizard state
  - Cannot directly execute long-running Spark jobs within app compute

### Alternatives Considered
- **Databricks Notebooks**: Lacks production UI framework, not suitable for wizard interface
- **External Web App** (EC2/Cloud Run): Added complexity for authentication, Unity Catalog integration, and permission inheritance
- **Databricks SQL Dashboards**: Read-only, cannot trigger data generation

## 2. Frontend Framework Choice

### Decision
**Streamlit** as the frontend framework for the multi-step wizard interface.

### Rationale
- Native multi-step form support via `st.session_state` and callbacks
- Simple declarative syntax for rapid UI development
- Built-in widgets for configuration inputs (sliders, selects, number inputs)
- Automatic re-rendering on state changes ideal for wizard progression
- Official Databricks Apps support with examples and documentation
- Session state persistence patterns for wizard step tracking

### Implementation Pattern
```python
if 'wizard_step' not in st.session_state:
    st.session_state.wizard_step = 0
    st.session_state.config = {}

def next_step():
    save_config_checkpoint()  # Persist to volumes
    st.session_state.wizard_step += 1

st.button("Next", on_click=next_step)
```

### Alternatives Considered
- **Dash** (Plotly): More powerful but excessive complexity for wizard use case; callbacks more verbose than Streamlit
- **Gradio**: Best for ML model demos, lacks robust multi-step wizard patterns and validation hooks
- **Panel** (HoloViz): Less mainstream, smaller community, fewer Databricks examples

## 3. Session Management & State Persistence

### Decision
Hybrid approach: Streamlit `session_state` for active session + Unity Catalog Volumes for durable checkpoints.

### Rationale
- Databricks Apps can restart, losing in-memory `session_state`
- Unity Catalog Volumes provide POSIX filesystem for config persistence
- Save wizard config to volumes after each step completion
- Load config from volumes on app initialization to resume interrupted sessions
- Use Databricks Jobs API to poll generation progress (job_id stored in volumes)

### Implementation Pattern
```python
VOLUME_PATH = "/Volumes/bryan_li/synthetic_data/wizard_checkpoints"

def save_checkpoint():
    config_path = f"{VOLUME_PATH}/{user_email}_{timestamp}.json"
    dbutils.fs.put(config_path, json.dumps(st.session_state.config))

def load_latest_checkpoint():
    checkpoints = dbutils.fs.ls(VOLUME_PATH)
    if checkpoints:
        latest = max(checkpoints, key=lambda x: x.modificationTime)
        content = dbutils.fs.head(latest.path)
        return json.loads(content)
    return None
```

### Alternatives Considered
- **In-Memory Only**: Lost on app restart, poor user experience
- **Database (SQL)**: Added operational complexity vs POSIX volumes
- **Cookies/Browser Storage**: Security concerns for large configs, not suitable for sensitive parameters

## 4. Synthetic Data Generation at Scale

### Decision
**Databricks Labs `dbldatagen`** as primary generation tool, supplemented with Pandas UDFs wrapping Faker for semantic data.

### Rationale
- `dbldatagen` designed for billion-row generation directly in PySpark
- Declarative spec-based API matches wizard configuration pattern
- Automatic distribution across Spark partitions for parallel generation
- 10-100x faster than pure Faker for large-scale generation
- Faker via Pandas UDFs for complex semantic fields (names, emails) where `dbldatagen` lacks realism
- Pandas UDFs execute batched operations, avoiding row-at-a-time Python overhead

### Performance Characteristics
- **dbldatagen**: 1M households in ~1-2 minutes on 8-node cluster
- **Pandas UDFs**: 3-100x faster than row-at-a-time Python UDFs
- **Hybrid**: Use dbldatagen for 80% of columns (IDs, numeric distributions, categorical), Faker for 20% (names, emails, locations)

### Implementation Pattern
```python
import dbldatagen as dg
from pyspark.sql.functions import pandas_udf
import pandas as pd
from faker import Faker

# dbldatagen for structure
household_spec = (dg.DataGenerator(spark, rows=1_000_000, partitions=200)
    .withColumn("household_id", "long", uniqueValues=1_000_000)
    .withColumn("size", "integer", minValue=1, maxValue=6, distribution="normal(2.5, 1.2)")
    .withColumn("income_bracket", "string", values=["<30K", "30-60K", "60-100K", "100K+"],
                 weights=[0.2, 0.3, 0.3, 0.2]))

df_households = household_spec.build()

# Pandas UDF for semantic data
@pandas_udf("string")
def generate_city(ids: pd.Series) -> pd.Series:
    fake = Faker()
    return pd.Series([fake.city() for _ in range(len(ids))])

df_households = df_households.withColumn("city", generate_city("household_id"))
```

### Alternatives Considered
- **Pure Faker**: Hits memory limits beyond 100K records, no native PySpark distribution
- **Synthetic Data Vault**: Requires external service, added operational complexity
- **Hand-rolled generators**: Reinventing wheel, lacks statistical distribution support

## 5. Unity Catalog Integration

### Decision
Use Databricks SDK for Python to validate permissions proactively and create Delta Lake tables in `bryan_li` catalog.

### Rationale
- SDK provides typed Python interfaces to Unity Catalog APIs
- Proactive permission validation (USE_CATALOG, USE_SCHEMA, CREATE_TABLE) before generation prevents wasted compute
- `df.write.saveAsTable()` writes Delta Lake with automatic catalog registration
- Inherits workspace authentication - no credential management needed
- Grants API for permission checks, Tables API for schema operations

### Required Permissions
- `USE CATALOG` on `bryan_li`
- `USE SCHEMA` on target schema (e.g., `bryan_li.synthetic_data`)
- `CREATE TABLE` on schema

### Implementation Pattern
```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import catalog

w = WorkspaceClient()

def verify_permissions(catalog_name, schema_name):
    try:
        grants = w.grants.get(
            securable_type=catalog.SecurableType.SCHEMA,
            full_name=f"{catalog_name}.{schema_name}"
        )
        required = {catalog.Privilege.CREATE_TABLE, catalog.Privilege.USE_SCHEMA}
        granted = {p.privilege for p in grants.privilege_assignments}
        return required.issubset(granted)
    except Exception as e:
        st.error(f"Permission check failed: {e}")
        return False

# Write Delta Lake table
df.write.format("delta").mode("overwrite").saveAsTable(
    f"bryan_li.synthetic_data.households"
)
```

### Alternatives Considered
- **Direct SQL (`CREATE TABLE`)**: Requires manual schema definition, no validation hooks
- **Delta Lake OSS APIs**: Lacks Unity Catalog integration, manual governance
- **REST API calls**: More verbose than SDK, type-unsafe

## 6. Performance Optimization

### Decision
Use Adaptive Query Execution (AQE) + Optimized Writes + Z-Ordering without physical partitioning for < 5 minute generation target.

### Rationale
- Tables < 100 GB benefit from Z-Ordering without partitioning overhead
- AQE optimizes join and aggregation strategies at runtime
- Optimized writes reduce file count, improving read performance
- Auto-compaction maintains optimal file sizes
- 8x m5.4xlarge workers with Photon acceleration balances cost and performance
- Warm pools reduce cluster startup from 2-3 minutes to 30 seconds

### Performance Timeline (1M Households Target)
1. Cluster startup: 30 seconds (warm pool)
2. Data generation (households + individuals + events): 1-2 minutes
3. Delta Lake write with optimized writes: 1-2 minutes
4. Z-Order optimization: 30-60 seconds
**Total**: 3-4.5 minutes (within 5-minute SLA)

### Cluster Configuration
```python
cluster_config = {
    "node_type_id": "m5.4xlarge",
    "num_workers": 8,
    "spark_version": "14.3.x-scala2.12",  # LTS with Photon
    "spark_conf": {
        "spark.databricks.delta.optimizeWrite.enabled": "true",
        "spark.databricks.delta.autoCompact.enabled": "true",
        "spark.sql.adaptive.enabled": "true",
        "spark.databricks.photon.enabled": "true"
    },
    "instance_pool_id": "<warm_pool_id>"  # 30-second startup
}
```

### Spark Partitioning Strategy
```python
# 200 partitions for 1M households = 5K rows/partition (optimal for Spark)
df_households = household_spec.withPartitions(200).build()

# Write with Z-Ordering on frequently queried columns
df_households.write.format("delta").option("dataChange", "false").saveAsTable("households")
spark.sql("OPTIMIZE bryan_li.synthetic_data.households ZORDER BY (household_id, income_bracket)")
```

### Alternatives Considered
- **Physical Partitioning** (by date/region): Added write overhead, unnecessary for < 100 GB tables
- **Bucketing**: Not supported in Unity Catalog, deprecated pattern
- **Larger Clusters** (16+ workers): Diminishing returns beyond 8 workers for 1M rows, increased cost

## 7. Identity Graph Patterns

### Decision
Relational core with separate `identity_mappings` edge table for cross-device identifiers.

### Rationale
- Relational model aligns with Delta Lake strengths (ACID, schema enforcement)
- Separate `identity_mappings` table normalizes 2-15 identifiers per individual
- Foreign key constraints (informational) document relationships
- CHECK constraints enforce temporal consistency (responses after exposures)
- Two-phase generation: parent entities first, then children with FK constraints

### Schema Design
```sql
-- Core entities
CREATE TABLE bryan_li.synthetic_data.households (
    household_id BIGINT PRIMARY KEY,
    location STRING,
    income_bracket STRING,
    size INT,
    created_at TIMESTAMP
);

CREATE TABLE bryan_li.synthetic_data.individuals (
    individual_id BIGINT PRIMARY KEY,
    household_id BIGINT FOREIGN KEY REFERENCES households(household_id),
    age INT CHECK (age BETWEEN 18 AND 100),
    gender STRING,
    education STRING,
    created_at TIMESTAMP
);

-- Identity resolution
CREATE TABLE bryan_li.synthetic_data.identity_mappings (
    mapping_id BIGINT PRIMARY KEY,
    individual_id BIGINT FOREIGN KEY REFERENCES individuals(individual_id),
    identifier_type STRING,  -- 'email_hash', 'cookie_id', 'mobile_ad_id', 'device_id', 'ctv_id'
    identifier_value STRING,
    created_at TIMESTAMP
);

-- Events with temporal constraints
CREATE TABLE bryan_li.synthetic_data.response_events (
    response_id BIGINT PRIMARY KEY,
    individual_id BIGINT,
    campaign_id BIGINT,
    response_timestamp TIMESTAMP,
    exposure_timestamp TIMESTAMP,
    CONSTRAINT temporal_consistency CHECK (response_timestamp > exposure_timestamp)
);
```

### Referential Integrity Pattern
```python
# Phase 1: Generate parent entities
df_households = generate_households(num_households)
df_households.write.saveAsTable("bryan_li.synthetic_data.households")

# Phase 2: Generate children with FK constraint
df_individuals = generate_individuals(df_households)  # Joins to get valid household_ids
df_individuals.write.saveAsTable("bryan_li.synthetic_data.individuals")

# Phase 3: Generate identity mappings
df_mappings = generate_identity_mappings(df_individuals, identifiers_per_person=4)
df_mappings.write.saveAsTable("bryan_li.synthetic_data.identity_mappings")
```

### Cross-Device Identity Distribution
- 2-15 identifiers per individual (configurable in wizard)
- Types: `email_hash`, `cookie_id`, `mobile_ad_id`, `device_id`, `ctv_id`, `hashed_phone`
- Realistic distribution: 60% have email, 80% have mobile, 40% have CTV

### Alternatives Considered
- **Graph Database** (Neo4j): Operational complexity, poor analytics query performance, no Unity Catalog integration
- **Denormalized Wide Table**: Loses referential integrity, nullable explosion for cross-device IDs
- **Nested Structs/Arrays**: Poor SQL queryability, incompatible with BI tools

## Summary of Key Technologies

| Area | Technology | Rationale |
|------|------------|-----------|
| **Frontend** | Streamlit | Multi-step wizard support, simple syntax |
| **State Management** | Streamlit session_state + Unity Catalog Volumes | Durable checkpoints, resume capability |
| **Data Generation** | dbldatagen + Pandas UDFs (Faker) | Scalable + semantic realism |
| **Unity Catalog** | Databricks SDK for Python | Typed permission validation, Delta Lake integration |
| **Performance** | AQE + Optimized Writes + Z-Order + Photon | < 5 min generation, warm pool startup |
| **Data Model** | Relational with separate identity edge table | ACID guarantees, query performance |

## Implementation Checklist

- [x] Research completed for all areas
- [ ] Validate Streamlit session state patterns in test environment
- [ ] Benchmark dbldatagen generation times on representative cluster
- [ ] Test Unity Catalog permission validation flows
- [ ] Prototype two-phase generation with referential integrity
- [ ] Measure end-to-end generation time for 1M households
- [ ] Document Z-Order maintenance strategy for incremental updates

## References

- [Databricks Apps Documentation](https://docs.databricks.com/en/dev-tools/databricks-apps/)
- [dbldatagen GitHub](https://github.com/databrickslabs/dbldatagen)
- [Unity Catalog Python SDK](https://databricks-sdk-py.readthedocs.io/)
- [Delta Lake Optimization Guide](https://docs.databricks.com/delta/optimize.html)
- [Pandas UDFs Best Practices](https://docs.databricks.com/udf/pandas.html)
