# Synthetic Identity Graph Dataset Generator

A Databricks App that generates realistic synthetic datasets representing identity graphs with households, individuals, demographics, content engagement, audience attributes, campaigns, and responses.

## 🎯 Overview

This application generates high-quality synthetic data for testing, development, and analytics use cases. It creates a complete identity graph with referential integrity and realistic distributions across 10 entity types.

### Generated Entities

1. **Households** - Geographic locations, income brackets, household sizes
2. **Individuals** - Demographics, age, gender, education, employment
3. **Identity Mappings** - Cross-device identifiers (email, cookies, mobile IDs)
4. **Content Engagements** - User interactions with content (views, clicks, shares)
5. **Viewership Patterns** - Aggregated engagement metrics
6. **Audience Attributes** - Derived segments and behavioral classifications
7. **Campaigns** - Marketing campaigns with targeting and budgets
8. **Campaign Exposures** - Individual campaign impressions
9. **Response Events** - User responses to campaigns
10. **Outcome Metrics** - Conversion tracking and attribution

## 🚀 Quick Start

### Prerequisites

- Databricks workspace access (e2-demo-field-eng.cloud.databricks.com)
- Unity Catalog permissions on `bryan_li` catalog:
  ```sql
  GRANT USE CATALOG ON CATALOG bryan_li TO `<your_email>`;
  GRANT USE SCHEMA ON SCHEMA bryan_li.synthetic_data TO `<your_email>`;
  GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data TO `<your_email>`;
  ```
- Python 3.11+ with PySpark

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up Databricks CLI (if needed)
databricks auth login --host https://e2-demo-field-eng.cloud.databricks.com
```

### Basic Usage

```python
from pyspark.sql import SparkSession
from databricks_app.src.models.schemas import GenerationConfig, HouseholdConfig
from databricks_app.src.generators.pipeline import execute_full_pipeline

# Initialize Spark
spark = SparkSession.builder.appName("synthetic_data_gen").getOrCreate()

# Configure generation
config = GenerationConfig(
    seed=42,
    catalog_name="bryan_li",
    schema_name="synthetic_data",
    household_config=HouseholdConfig(
        num_households=10000,
        income_brackets={
            "<30K": 0.20,
            "30-60K": 0.30,
            "60-100K": 0.25,
            "100-150K": 0.15,
            "150K+": 0.10
        },
        size_distribution={"mean": 2.5, "std_dev": 1.2}
    ),
    # ... additional configs
)

# Generate data
result = execute_full_pipeline(spark, config, write_to_catalog=True)

print(f"Status: {result['status']}")
print(f"Tables created: {result['tables_created']}")
print(f"Row counts: {result['row_counts']}")
```

## 📁 Project Structure

```
databricks_app/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── pyproject.toml                     # Code quality config
└── src/
    ├── models/
    │   └── schemas.py                 # Data models and schemas (420 lines)
    ├── generators/
    │   ├── household_generator.py     # Household generation (237 lines)
    │   ├── individual_generator.py    # Individual & identity mapping (321 lines)
    │   ├── engagement_generator.py    # Content engagement (254 lines)
    │   └── pipeline.py                # Full pipeline orchestrator (186 lines)
    ├── storage/
    │   └── catalog_writer.py          # Unity Catalog writer (247 lines)
    ├── wizard/
    │   └── validation.py              # Config validation (425 lines)
    └── utils/
        └── auth.py                    # Permission checks (236 lines)

tests/
├── contract/
│   ├── test_app_interface.py          # Contract tests (247 lines)
│   ├── test_household_config.py       # Household validation tests (143 lines)
│   └── test_demographics_config.py    # Demographics validation tests (176 lines)
└── integration/
    ├── test_household_generation.py   # Household generator tests (203 lines)
    ├── test_full_pipeline.py          # End-to-end pipeline tests (271 lines)
    └── test_catalog_permissions.py    # Permission tests (175 lines)
```

## 🔧 Implementation Status

### ✅ Completed (28/44 tasks - 63.6%)

#### Phase 3.1: Setup ✅
- [x] Project structure
- [x] Dependencies (requirements.txt)
- [x] Code quality config (pyproject.toml)

#### Phase 3.2: Tests First (TDD) ✅
- [x] Contract tests (T004-T006) - **36/36 passing**
- [x] Integration tests (T007-T009)

#### Phase 3.3: Data Models ✅
- [x] WizardStep enum, SessionState, GenerationConfig
- [x] All 10 Delta Lake table schemas
- [x] Configuration validation functions

#### Phase 3.4: Generators (Partial)
- [x] Household generator (T020)
- [x] Individual generator (T021)
- [x] Identity mapping generator (T022)
- [x] Engagement generator (T023)
- [ ] Audience/viewership generators (T024)
- [ ] Campaign generators (T025-T026)
- [ ] Response generators (T027)

#### Phase 3.5: Storage Layer ✅
- [x] CatalogWriter with Delta Lake optimizations (T028)
- [x] Permission verification (T029)

### 🚧 Remaining Work (16 tasks - 36.4%)

- **Phase 3.4**: Complete generators T024-T027 (4 tasks)
- **Phase 3.6**: Streamlit wizard UI T030-T035 (6 tasks)
- **Phase 3.7**: Job orchestration T036-T038 (3 tasks)
- **Phase 3.8**: Polish & validation T039-T044 (6 tasks)

## 🏗️ Architecture

### Technology Stack

- **Data Generation**: dbldatagen (structural), Faker (semantic)
- **Processing**: PySpark for distributed generation
- **Storage**: Delta Lake tables in Unity Catalog
- **SDK**: Databricks SDK for Python
- **Testing**: pytest, pytest-spark, pytest-mock
- **Code Quality**: black, ruff, mypy

### Design Patterns

#### TDD Approach
All features have tests written first:
- Contract tests validate schemas and APIs
- Integration tests validate end-to-end workflows
- Tests fail until implementation is complete

#### Generator Pattern
Each entity type has a dedicated generator:
```python
def generate_households(spark, config, seed) -> DataFrame:
    # 1. Use dbldatagen for structural data
    # 2. Use Faker Pandas UDFs for semantic data
    # 3. Return DataFrame matching schema
```

#### Pipeline Orchestration
Central pipeline maintains dependency order:
```
Households → Individuals → Identity Mappings → Engagements
                                              ↓
            Campaigns ← Audience Attributes ← Viewership Patterns
                ↓
         Exposures → Responses → Outcomes
```

## 📊 Performance Targets

- **Small dataset**: 10K households in < 2 minutes
- **Medium dataset**: 100K households in < 3 minutes
- **Large dataset**: 1M households in < 5 minutes

### Optimization Features

1. **Optimized Writes**: Auto-enabled for better write performance
2. **Auto-compaction**: Prevents small file problems
3. **Z-Order**: Optimizes for common query patterns
4. **Partitioning**: Configurable partition strategies
5. **Photon**: Leverages Databricks Photon engine

## 🧪 Testing

### Run Contract Tests
```bash
pytest tests/contract/ -v
```

Expected: **36 tests passing**

### Run Integration Tests
```bash
# Requires Spark environment
pytest tests/integration/ -v
```

## 📖 Configuration Reference

### GenerationConfig

```python
@dataclass
class GenerationConfig:
    seed: int                                    # Random seed (0-2147483647)
    catalog_name: str = "bryan_li"               # Unity Catalog name
    schema_name: str = "synthetic_data"          # Schema name
    household_config: HouseholdConfig            # Household settings
    demographics_config: DemographicsConfig      # Demographics settings
    engagement_config: EngagementConfig          # Engagement settings
    audience_config: AudienceConfig              # Audience settings
    campaign_config: CampaignConfig              # Campaign settings
    incremental: bool = False                    # Append vs overwrite
```

### HouseholdConfig

```python
@dataclass
class HouseholdConfig:
    num_households: int                          # 1,000 to 10,000,000
    income_brackets: Dict[str, float]            # Distribution (must sum to 1.0)
    size_distribution: Dict[str, float]          # {"mean": 2.5, "std_dev": 1.2}
    location_distribution: Dict[str, float]      # Optional geographic weights
```

### DemographicsConfig

```python
@dataclass
class DemographicsConfig:
    age_range: Dict[str, int]                    # {"min": 18, "max": 100}
    gender_distribution: Dict[str, float]        # Distribution (must sum to 1.0)
    education_distribution: Dict[str, float]     # Optional education levels
    employment_distribution: Dict[str, float]    # Optional employment status
    identity_mappings: Dict[str, any]            # Cross-device identifier config
```

## 🔐 Security & Permissions

### Required Permissions

```sql
-- Catalog level
GRANT USE CATALOG ON CATALOG bryan_li TO `<user>`;

-- Schema level
GRANT USE SCHEMA ON SCHEMA bryan_li.synthetic_data TO `<user>`;
GRANT CREATE TABLE ON SCHEMA bryan_li.synthetic_data TO `<user>`;
```

### Permission Verification

The application checks permissions before generation:

```python
from databricks_app.src.utils.auth import verify_catalog_permissions

has_perms, missing = verify_catalog_permissions(
    catalog_name="bryan_li",
    schema_name="synthetic_data"
)

if not has_perms:
    print(f"Missing: {missing}")
```

## 📈 Monitoring & Validation

### Table Statistics

```python
from databricks_app.src.storage.catalog_writer import CatalogWriter

writer = CatalogWriter(spark)
stats = writer.get_table_stats("bryan_li", "synthetic_data", "households")

print(f"Rows: {stats['num_rows']}")
print(f"Size: {stats['size_bytes']} bytes")
print(f"Files: {stats['num_files']}")
```

### Data Quality Checks

```sql
-- Verify row counts
SELECT
    'households' as table_name,
    COUNT(*) as row_count
FROM bryan_li.synthetic_data.households

UNION ALL

SELECT
    'individuals',
    COUNT(*)
FROM bryan_li.synthetic_data.individuals;

-- Check referential integrity
SELECT COUNT(*) as orphan_individuals
FROM bryan_li.synthetic_data.individuals i
LEFT JOIN bryan_li.synthetic_data.households h
    ON i.household_id = h.household_id
WHERE h.household_id IS NULL;

-- Verify data distributions
SELECT
    income_bracket,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM bryan_li.synthetic_data.households
GROUP BY income_bracket
ORDER BY income_bracket;
```

## 🐛 Troubleshooting

### Common Issues

#### "Missing Unity Catalog permissions"
**Solution**: Grant required permissions (see Security section)

#### "Java gateway process exited"
**Solution**: Ensure Java 11+ is installed and JAVA_HOME is set

#### "Table already exists"
**Solution**: Use `mode="overwrite"` or drop existing tables

#### "Out of memory"
**Solution**: Reduce `num_households` or increase cluster size

## 📚 Additional Resources

- [Databricks Apps Documentation](https://docs.databricks.com/aws/en/dev-tools/databricks-apps/)
- [Unity Catalog Guide](https://docs.databricks.com/data-governance/unity-catalog/)
- [Delta Lake Documentation](https://docs.delta.io/)
- [dbldatagen Documentation](https://databrickslabs.github.io/dbldatagen/)

## 🤝 Contributing

See [specs/001-create-a-databricks/](../specs/001-create-a-databricks/) for:
- `spec.md` - Feature requirements
- `plan.md` - Implementation plan
- `data-model.md` - Entity relationship diagrams
- `research.md` - Technical decisions
- `tasks.md` - Task breakdown and progress

## 📄 License

Internal Databricks project for demonstration purposes.
