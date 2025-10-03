# test-kit: Synthetic Identity Graph Data Generator

A Databricks-native application for generating synthetic identity graph datasets at scale, packaged as a Databricks Asset Bundle for streamlined deployment.

## Overview

test-kit generates realistic synthetic data for identity resolution use cases, including:
- **Households** with configurable size and income distributions
- **Individuals** with demographics (age, gender, education)
- **Identity mappings** (2-15 cross-device identifiers per person)
- **Content engagement** events with temporal patterns
- **Audience segments** derived from engagement behavior
- **Marketing campaigns** with exposure and response tracking
- **Outcome metrics** with attribution models

## Quick Start

### Prerequisites

- **Databricks CLI** 0.200+ ([install guide](https://docs.databricks.com/dev-tools/cli/install.html))
- **Databricks workspace** access with permissions:
  - CREATE permission on Unity Catalog
  - CREATE SCHEMA permission
  - CAN_MANAGE permission on jobs
  - Apps deployment permission

### Deploy to Dev Environment

```bash
# 1. Clone the repository
git clone <repo-url>
cd test-kit

# 2. Authenticate to Databricks
export DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
export DATABRICKS_TOKEN=<your-token>

# 3. Validate bundle configuration
databricks bundle validate --target dev

# 4. Deploy to dev
databricks bundle deploy --target dev
```

**What gets deployed:**
- **Job**: "Synthetic Data Generation (dev)" - Executes the generation pipeline
- **App**: "Synthetic Data Generator (dev)" - React UI for configuration
- **Notebooks**: Python generation code uploaded to workspace
- **Data**: Written to `bryan_li.synthetic_datasets_dev` schema

### Full Deployment Guide

For complete deployment instructions including prod deployment, rollback procedures, and troubleshooting, see:
- **[Quickstart Guide](specs/003-databricks-asset-bundles/quickstart.md)** - Step-by-step deployment walkthrough

## Project Structure

```
test-kit/
├── databricks.yml                           # Root bundle configuration
├── databricks_app/                          # Python generation pipeline
│   ├── generation_notebook.py               # Main execution notebook
│   ├── src/
│   │   ├── models/                          # Data schemas and configuration
│   │   ├── generators/                      # Entity generators (household, individual, etc.)
│   │   ├── storage/                         # Unity Catalog writers
│   │   └── utils/                           # Validation and helpers
│   └── requirements.txt                     # Python dependencies
├── react-app/                               # React configuration UI
│   ├── src/
│   ├── dist/                                # Production build
│   └── app.yaml                             # Databricks App config
├── tests/                                   # Test suites
│   ├── contract/                            # Bundle validation tests
│   └── integration/                         # End-to-end tests
├── .github/
│   └── workflows/databricks-deploy.yml      # CI/CD automation
└── specs/                                   # Feature specifications
    └── 003-databricks-asset-bundles/
        ├── quickstart.md                    # Deployment guide
        ├── plan.md                          # Implementation plan
        └── tasks.md                         # Task breakdown
```

## Databricks Asset Bundle

This project uses **Databricks Asset Bundles (DAB)** for deployment, providing:

✅ **Environment Isolation**: Separate dev/prod configurations
✅ **Production Safeguards**: Multi-layer protection (approval + mode lock + explicit flag)
✅ **Variable Substitution**: Dynamic catalog/schema per environment
✅ **CI/CD Ready**: GitHub Actions workflows included
✅ **Idempotent Deployments**: Safe to redeploy, change detection built-in

### Bundle Configuration

The bundle defines two deployment targets:

| Aspect | Dev | Prod |
|--------|-----|------|
| **Schema** | `synthetic_datasets_dev` | `synthetic_datasets_prod` |
| **Cluster** | 2x i3.xlarge | 8x i3.2xlarge |
| **Mode** | development | production |
| **Approval** | Auto-deploy | Manual approval required |

See [databricks.yml](databricks.yml) for full configuration.

## Deployment Workflows

### Daily Development Cycle

```bash
# 1. Make code changes
vim databricks_app/src/generators/household_generator.py

# 2. Validate bundle
databricks bundle validate --target dev

# 3. Deploy to dev
databricks bundle deploy --target dev

# 4. Test in workspace (trigger job run)
```

### Production Release

```bash
# 1. Tag release
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# 2. GitHub Actions triggers prod deployment
# 3. Manual approval required
# 4. Deploy executes with production safeguards
```

**GitHub Actions CI/CD** (see [.github/workflows/databricks-deploy.yml](.github/workflows/databricks-deploy.yml)):
- **On PR**: Validates bundle configuration
- **On merge to main**: Auto-deploys to dev
- **On Git tag**: Triggers prod deployment with manual approval gate

## CLI Commands

```bash
# Validate bundle configuration
databricks bundle validate --target {dev|prod}

# Deploy to environment
databricks bundle deploy --target {dev|prod}

# List deployed resources
databricks bundle resources list --target {dev|prod}

# Trigger job run
databricks jobs run-now <job-id>

# Monitor job status
databricks runs get-output <run-id>
```

## Data Output

Generated data is written to **Unity Catalog** with Delta Lake format:

**Dev Environment:**
- Catalog: `bryan_li`
- Schema: `synthetic_datasets_dev`
- Tables: `households`, `individuals`, `identity_mappings`, `content_engagements`, `viewership_patterns`, `audience_segments`, `campaigns`, `campaign_exposures`, `response_events`, `outcome_metrics`

**Prod Environment:**
- Catalog: `bryan_li`
- Schema: `synthetic_datasets_prod`
- Tables: (same as dev)

All tables include:
- **Delta Lake optimizations**: Auto-compact, optimize-write enabled
- **Z-order indexing**: For efficient querying
- **Schema evolution**: Supports schema changes without breaking queries

## Configuration Options

The generation pipeline supports configurable parameters (via job base_parameters):

```json
{
  "seed": 42,
  "num_households": 100000,
  "household_size_distribution": {"1": 0.28, "2": 0.35, ...},
  "income_distribution": {"<25k": 0.12, "25k-50k": 0.20, ...},
  "age_range": {"min": 18, "max": 90},
  "gender_distribution": {"M": 0.49, "F": 0.49, "Other": 0.02},
  "engagement_start_date": "2024-01-01",
  "engagement_end_date": "2024-12-31",
  "content_categories": ["News", "Entertainment", "Sports"],
  "catalog": "${var.catalog_name}",
  "schema": "${var.schema_name}"
}
```

Variables `catalog` and `schema` are injected automatically based on deployment target.

## Troubleshooting

### Bundle Validation Fails

```bash
# Check notebook paths
ls databricks_app/generation_notebook.py

# Verify YAML syntax
databricks bundle validate --target dev

# Debug with verbose output
databricks bundle validate --target dev --debug
```

### Deployment Fails

```bash
# Check permissions
databricks workspace list /

# Verify authentication
databricks auth profiles

# Review deployment logs
databricks bundle deploy --target dev --debug
```

### Job Execution Fails

Check job run output in Databricks UI:
1. Navigate to **Workflows** → **Jobs**
2. Find job "Synthetic Data Generation (dev/prod)"
3. View run details and error traces

Common issues:
- **Missing catalog**: Ensure `bryan_li` catalog exists
- **Permission errors**: Grant CREATE SCHEMA on catalog
- **Library errors**: Check Spark cluster has dbldatagen, faker installed

## Development

### Local Testing

```bash
# Install dependencies
cd databricks_app
pip install -r requirements.txt

# Run tests
cd ..
pytest tests/
```

### Adding New Generators

1. Create generator in `databricks_app/src/generators/`
2. Update `databricks_app/src/pipeline.py` to include new generator
3. Add schema to `databricks_app/src/models/`
4. Test locally, deploy to dev
5. Update bundle configuration if needed

## Support

- **Documentation**: [specs/003-databricks-asset-bundles/](specs/003-databricks-asset-bundles/)
- **Issues**: Report via GitHub Issues
- **Databricks Docs**: [Asset Bundles](https://docs.databricks.com/dev-tools/bundles/index.html)

## License

Proprietary - Databricks Field Engineering

---

**Generated with** [Claude Code](https://claude.com/claude-code) | **Last Updated**: 2025-10-02
