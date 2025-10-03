# Data Model: Databricks Asset Bundle Configuration

**Feature**: 003-databricks-asset-bundles
**Date**: 2025-10-02

## Overview

The Databricks Asset Bundle (DAB) configuration model defines the structure of deployment artifacts. Unlike traditional data models (database schemas), this model describes YAML configuration files that define infrastructure-as-code for Databricks resources.

## Core Entities

### 1. Bundle (Root Configuration)

**File**: `databricks.yml`

**Purpose**: Top-level bundle definition with metadata, variables, and resource inclusions

**Schema**:
```yaml
bundle:
  name: string              # Bundle identifier (required)
  cluster_id: string        # Optional default cluster

variables:
  [key]:
    description: string     # Variable documentation
    default: any           # Default value

include:
  - string                  # Paths to additional config files

resources:
  jobs: map                 # Job definitions (or use include)
  apps: map                 # App definitions (or use include)

targets:
  [env_name]:              # Environment-specific overrides
    mode: string           # development | production
    workspace:
      host: string         # Workspace URL
      root_path: string    # Deployment path
    variables: map         # Variable overrides
```

**Validation Rules**:
- `bundle.name` must be unique per workspace
- `targets` must contain at least one target
- `mode: production` enforces stricter validation

**Relationships**:
- Contains 0+ JobResource entities (via `resources.jobs` or `include`)
- Contains 0+ AppResource entities (via `resources.apps` or `include`)
- Defines 1+ Target entities (dev, prod)

---

### 2. JobResource

**File**: `resources/jobs/synthetic-data-generation.yml`

**Purpose**: Defines a Databricks job with tasks, cluster configuration, and scheduling

**Schema**:
```yaml
resources:
  jobs:
    [job_key]:
      name: string                    # Job display name
      tasks:
        - task_key: string            # Unique task identifier
          notebook_task:
            notebook_path: string     # Path to notebook
            base_parameters: map      # Notebook widget parameters
          new_cluster:                # Cluster specification
            spark_version: string
            node_type_id: string
            num_workers: int
            spark_conf: map
          libraries:                  # Python packages
            - pypi:
                package: string
      schedule:                       # Optional scheduling
        quartz_cron_expression: string
        timezone_id: string
      max_concurrent_runs: int
      timeout_seconds: int
      email_notifications:
        on_failure: [string]
```

**Validation Rules**:
- `task_key` must be unique within job
- `notebook_path` must exist in bundle (relative to bundle root)
- `spark_version` must be valid Databricks runtime version
- `node_type_id` must be available in target workspace
- `base_parameters` keys must match notebook widgets

**Relationships**:
- Belongs to Bundle (1:1)
- References NotebookAsset entities (1:many via `notebook_path`)
- Instantiates Cluster specification (embedded)
- Uses variables from Bundle.variables and Target.variables

**State Transitions**:
```
[Created] → validate → [Valid] → deploy → [Deployed]
[Deployed] → update → [Updated]
[Deployed] → delete → [Deleted]
```

---

### 3. AppResource

**File**: `resources/apps/synthetic-data-generator.yml` (or inline in databricks.yml)

**Purpose**: Defines a Databricks App (web application) with source code and resource requirements

**Schema**:
```yaml
resources:
  apps:
    [app_key]:
      name: string                    # App display name
      description: string             # App description
      source_code_path: string        # Relative path to app source
      resources:                      # Optional resource grants
        - name: string
          job:
            id: string
            permission: string        # CAN_VIEW | CAN_MANAGE_RUN
```

**Validation Rules**:
- `source_code_path` must exist and contain app.yaml
- App name must be unique per workspace
- Resource permissions must be valid Databricks permissions

**Relationships**:
- Belongs to Bundle (1:1)
- References source directory (react-app/)
- May reference JobResource for permissions (0:many)

**State Transitions**:
```
[Created] → validate → [Valid] → deploy → [Deployed] → start → [Running]
[Running] → stop → [Stopped]
[Deployed] → update → [Updated]
```

---

### 4. Target (Environment Profile)

**Location**: Embedded in `databricks.yml` under `targets:`

**Purpose**: Environment-specific configuration overrides (dev vs prod)

**Schema**:
```yaml
targets:
  [target_name]:                # "dev" or "prod"
    mode: string                # development | production
    workspace:
      host: string              # https://e2-demo-field-eng.cloud.databricks.com
      root_path: string         # /Users/${workspace.current_user.userName}/.bundle/${bundle.target}/${bundle.name}
    variables:                  # Override bundle.variables
      catalog_name: string      # bryan_li
      schema_name: string       # synthetic_datasets_dev | synthetic_datasets_prod
      cluster_node_type: string # i3.xlarge (dev) | i3.2xlarge (prod)
      cluster_num_workers: int  # 2 (dev) | 8 (prod)
    run_as:                     # Optional: run as service principal
      service_principal_name: string
```

**Validation Rules**:
- Target name must match deployment `--target` flag
- `mode: production` requires explicit confirmation for destructive changes
- `workspace.host` must be a valid Databricks workspace URL
- Variable overrides must match declared variables in `bundle.variables`

**Relationships**:
- Belongs to Bundle (1:many)
- Overrides Bundle.variables
- Applied during deployment based on `--target` flag

---

### 5. NotebookAsset

**Location**: Source tree (databricks_app/)

**Purpose**: Python notebooks that execute data generation logic

**Schema** (implicit - inferred from file system):
```
path: databricks_app/generation_notebook.py
type: Python
widgets:
  config:
    type: text
    default: "{}"
dependencies:
  - databricks_app/src/generators/*.py
  - databricks_app/src/models/*.py
  - databricks_app/requirements.txt
```

**Validation Rules**:
- File must exist at bundle validation time
- Python syntax must be valid
- Widget parameters must be defined via `dbutils.widgets.get()`
- Dependencies (imports) must be resolvable

**Relationships**:
- Referenced by JobResource.tasks.notebook_task.notebook_path
- Imports from other NotebookAssets or Python modules
- Requires libraries specified in requirements.txt

---

### 6. ValidationContract

**Purpose**: Defines the expected structure and rules for bundle validation

**Schema** (conceptual - enforced by Databricks CLI):
```yaml
validation:
  checks:
    - name: schema_validation
      status: pass | fail
      errors: [string]

    - name: resource_references
      status: pass | fail
      errors: [string]

    - name: permission_check
      status: pass | fail
      warnings: [string]

    - name: variable_substitution
      status: pass | fail
      errors: [string]
```

**Validation Levels**:
1. **Schema**: YAML structure matches DAB schema
2. **References**: Paths, IDs, and names resolve correctly
3. **Permissions**: Service principal has required access
4. **Variables**: All variables have values (default or override)

---

## Entity Relationship Diagram (Textual)

```
Bundle (databricks.yml)
├── Variables (0..*)
│   └── Default values
├── Targets (1..*)
│   ├── dev
│   │   ├── mode: development
│   │   ├── workspace config
│   │   └── variable overrides
│   └── prod
│       ├── mode: production
│       ├── workspace config
│       └── variable overrides
└── Resources
    ├── Jobs (0..*)
    │   └── synthetic-data-generation
    │       ├── tasks (1..*)
    │       │   └── notebook_task
    │       │       └── references NotebookAsset
    │       ├── cluster spec
    │       └── schedule
    └── Apps (0..*)
        └── synthetic-data-generator
            ├── source_code_path
            │   └── references react-app/
            └── resource permissions
                └── references Job
```

---

## Data Flow

### Deployment Flow
```
1. Developer commits code changes
2. Git push triggers GitHub Actions workflow
3. Workflow checks out code
4. Databricks CLI validates bundle
   - Loads databricks.yml
   - Resolves includes (resources/jobs/*.yml, resources/apps/*.yml)
   - Substitutes variables from target profile
   - Validates schema and references
5. CLI deploys to target workspace
   - Uploads notebooks to workspace
   - Creates/updates job definition
   - Creates/updates app configuration
6. Databricks creates/updates resources
   - Job appears in Jobs UI
   - App appears in Apps UI
7. Deployment state saved in workspace .bundle directory
```

### Runtime Flow
```
1. User triggers job from UI or API
2. Databricks provisions cluster per job.new_cluster spec
3. Cluster loads notebook from workspace path
4. Notebook receives base_parameters as widgets
5. Notebook executes data generation pipeline
6. Output written to Unity Catalog (catalog.schema.table)
7. Job completes, cluster terminates
```

---

## Variable Substitution Examples

**Bundle Definition**:
```yaml
variables:
  catalog_name:
    default: bryan_li
  schema_name:
    default: synthetic_datasets

resources:
  jobs:
    data_gen:
      tasks:
        - notebook_task:
            base_parameters:
              catalog: "${var.catalog_name}"
              schema: "${var.schema_name}"
```

**Dev Target Override**:
```yaml
targets:
  dev:
    variables:
      schema_name: synthetic_datasets_dev
```

**Result**: Job in dev environment receives `schema: "synthetic_datasets_dev"`

---

## Idempotency Guarantees

Bundle deployments are idempotent:
- Deploying same bundle twice produces same result
- Only changed resources are updated
- No duplicate resources created
- Safe to run deployment repeatedly

**Change Detection**:
- CLI compares bundle definition vs deployed state
- Creates resources that don't exist
- Updates resources that changed
- Deletes resources removed from bundle (if `--auto-approve` flag set)
- Skips resources that match exactly

---

**Next**: See [contracts/](contracts/) for validation schemas and [quickstart.md](quickstart.md) for deployment procedures.
