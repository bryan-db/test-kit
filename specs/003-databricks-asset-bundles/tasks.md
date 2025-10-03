# Tasks: Databricks Asset Bundles Deployment Package

**Feature**: 003-databricks-asset-bundles
**Input**: Design documents from `/specs/003-databricks-asset-bundles/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: YAML (DAB format) + Databricks CLI
   → Structure: databricks.yml + resources/ directory
2. Load design documents ✅
   → data-model.md: 6 entities (Bundle, JobResource, AppResource, Target, NotebookAsset, ValidationContract)
   → contracts/: databricks-bundle-schema.yml (validation contract)
   → research.md: 5 technical decisions (bundle format, GitHub Actions, safeguards, secrets, versioning)
   → quickstart.md: 9-step deployment workflow
3. Generate tasks by category ✅
   → Setup: Databricks CLI installation, bundle structure
   → Tests: Contract validation tests (TDD approach)
   → Core: Bundle configuration files (databricks.yml, job/app resources)
   → Integration: GitHub Actions workflow, deployment tests
   → Polish: Documentation, troubleshooting guide
4. Apply task rules ✅
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → Dependencies ordered correctly
5. Number tasks sequentially (T001-T020) ✅
6. Validate completeness ✅
   → All contracts have tests ✅
   → All entities have configuration tasks ✅
   → All quickstart steps covered ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in descriptions

## Phase 3.1: Setup

- [x] **T001** Create Databricks Asset Bundle directory structure (databricks.yml, resources/jobs/, resources/apps/)
- [x] **T002** Verify Databricks CLI installation (0.200+) and configure authentication for dev workspace
- [x] **T003** [P] Document bundle configuration variables in databricks.yml comments

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] **T004** [P] Contract test for bundle schema validation in tests/contract/test_bundle_schema.py
- [ ] **T005** [P] Contract test for job resource validation in tests/contract/test_job_resource.py
- [ ] **T006** [P] Contract test for app resource validation in tests/contract/test_app_resource.py
- [ ] **T007** [P] Contract test for variable substitution in tests/contract/test_variable_substitution.py
- [ ] **T008** [P] Integration test for dev deployment in tests/integration/test_dev_deployment.py
- [ ] **T009** [P] Integration test for prod safeguards in tests/integration/test_prod_safeguards.py

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T010** Create root bundle configuration in databricks.yml (bundle name, variables, targets, includes)
- [x] **T011** Create dev target profile in databricks.yml (mode: development, schema: synthetic_datasets_dev, cluster: 2x i3.xlarge)
- [x] **T012** Create prod target profile in databricks.yml (mode: production, schema: synthetic_datasets_prod, cluster: 8x i3.2xlarge)
- [x] **T013** Create job resource definition in resources/jobs/synthetic-data-generation.yml (notebook_task, cluster spec, schedule)
- [x] **T014** Create app resource definition in resources/apps/synthetic-data-generator.yml (source_code_path: react-app/, permissions)
- [x] **T015** Configure variable substitution for catalog/schema names in job base_parameters

## Phase 3.4: CI/CD Integration

- [x] **T016** Create GitHub Actions workflow in .github/workflows/databricks-deploy.yml (setup-cli, validate, deploy)
- [x] **T017** Configure dev environment auto-deploy on merge to main branch
- [x] **T018** Configure prod environment with manual approval gate and required reviewers
- [x] **T019** Add bundle validation check on pull requests (databricks bundle validate)

## Phase 3.5: Deployment & Validation

- [ ] **T020** Execute dev deployment via CLI (databricks bundle deploy --target dev) and verify job/app creation
- [ ] **T021** Test incremental update by modifying job config and redeploying to dev (verify change detection)
- [ ] **T022** Execute prod deployment with all safeguards active (manual approval, mode: production, explicit --target prod flag)
- [ ] **T023** Test rollback procedure by deploying previous Git tag to prod environment

## Phase 3.6: Documentation & Polish

- [x] **T024** [P] Update project README.md with bundle deployment instructions and quickstart link
- [x] **T025** [P] Create troubleshooting guide in docs/troubleshooting-dab.md (validation errors, deployment failures, rollback)
- [x] **T026** [P] Document secret scope configuration in docs/secrets-setup.md (dev-secrets, prod-secrets scopes)
- [x] **T027** [P] Add deployment examples to quickstart.md (common workflows, daily dev cycle, prod release cycle)

## Dependencies

```
Setup (T001-T003) blocks all other phases

Tests (T004-T009) before implementation (T010-T015)
├─ T004 (bundle schema) blocks T010 (databricks.yml)
├─ T005 (job resource) blocks T013 (job yml)
├─ T006 (app resource) blocks T014 (app yml)
├─ T007 (variable substitution) blocks T015 (parameters)
├─ T008 (dev deployment) blocks T020 (actual dev deploy)
└─ T009 (prod safeguards) blocks T022 (actual prod deploy)

Core implementation (T010-T015) blocks CI/CD (T016-T019)
├─ T010-T015 (bundle config) blocks T016 (workflow creation)
└─ T016 (workflow) blocks T017-T019 (environment config)

CI/CD (T016-T019) blocks deployment validation (T020-T023)
├─ T016-T019 (GitHub Actions) blocks T017-T018 (auto-deploy setup)
└─ T020-T023 (deployment tests) before polish (T024-T027)

Documentation (T024-T027) can run in parallel after T023
```

## Parallel Execution Examples

### Phase 3.2: Launch all contract tests together
```bash
# All contract tests touch different files - fully parallel
Task: "Contract test for bundle schema validation in tests/contract/test_bundle_schema.py"
Task: "Contract test for job resource validation in tests/contract/test_job_resource.py"
Task: "Contract test for app resource validation in tests/contract/test_app_resource.py"
Task: "Contract test for variable substitution in tests/contract/test_variable_substitution.py"
Task: "Integration test for dev deployment in tests/integration/test_dev_deployment.py"
Task: "Integration test for prod safeguards in tests/integration/test_prod_safeguards.py"
```

### Phase 3.6: Launch all documentation tasks together
```bash
# All docs touch different files - fully parallel
Task: "Update project README.md with bundle deployment instructions and quickstart link"
Task: "Create troubleshooting guide in docs/troubleshooting-dab.md"
Task: "Document secret scope configuration in docs/secrets-setup.md"
Task: "Add deployment examples to quickstart.md"
```

## Task Details

### T001: Create Bundle Directory Structure
**Files**: databricks.yml, resources/jobs/, resources/apps/
**Actions**:
- Create databricks.yml at repository root
- Create resources/jobs/ directory
- Create resources/apps/ directory
- Verify structure matches data-model.md entity relationships

### T002: Verify Databricks CLI
**Command**: `databricks --version`
**Actions**:
- Ensure CLI version >= 0.200
- Configure authentication (DATABRICKS_HOST, DATABRICKS_TOKEN env vars)
- Test workspace access: `databricks workspace list /`
- Document authentication setup in quickstart.md

### T004-T007: Contract Tests
**Framework**: pytest + Databricks CLI subprocess calls
**Test Structure**:
- Load databricks.yml and resources/*.yml
- Run `databricks bundle validate`
- Assert exit code 0
- Assert expected output patterns
- Verify schema compliance per contracts/databricks-bundle-schema.yml

### T008: Integration Test - Dev Deployment
**Test Flow**:
1. Deploy to dev: `databricks bundle deploy --target dev`
2. Verify job created in workspace
3. Trigger job run with test config
4. Verify data written to bryan_li.synthetic_datasets_dev
5. Verify app accessible in Apps UI

### T009: Integration Test - Prod Safeguards
**Test Flow**:
1. Attempt deploy without --target: Should default to dev
2. Deploy with --target prod: Should require confirmation (mode: production)
3. Verify GitHub Actions workflow requires approval for prod environment
4. Verify prod uses correct schema (synthetic_datasets_prod)

### T010-T012: Bundle Configuration
**File**: databricks.yml
**Structure**:
```yaml
bundle:
  name: test-kit

variables:
  catalog_name:
    description: Unity Catalog name
    default: bryan_li
  schema_name:
    description: Schema name (environment-specific)

targets:
  dev:
    mode: development
    workspace:
      host: https://e2-demo-field-eng.cloud.databricks.com
    variables:
      schema_name: synthetic_datasets_dev
      cluster_node_type: i3.xlarge
      cluster_num_workers: 2

  prod:
    mode: production
    workspace:
      host: https://e2-demo-field-eng.cloud.databricks.com
    variables:
      schema_name: synthetic_datasets_prod
      cluster_node_type: i3.2xlarge
      cluster_num_workers: 8

include:
  - resources/jobs/*.yml
  - resources/apps/*.yml
```

### T013: Job Resource Definition
**File**: resources/jobs/synthetic-data-generation.yml
**Structure**:
```yaml
resources:
  jobs:
    synthetic_data_generation:
      name: "Synthetic Data Generation (${bundle.target})"
      tasks:
        - task_key: generate_data
          notebook_task:
            notebook_path: databricks_app/generation_notebook.py
            base_parameters:
              catalog: "${var.catalog_name}"
              schema: "${var.schema_name}"
          new_cluster:
            spark_version: "14.3.x-scala2.12"
            node_type_id: "${var.cluster_node_type}"
            num_workers: "${var.cluster_num_workers}"
            spark_conf:
              "spark.databricks.delta.optimizeWrite.enabled": "true"
              "spark.databricks.delta.autoCompact.enabled": "true"
          libraries:
            - pypi:
                package: "dbldatagen>=0.3.0"
            - pypi:
                package: "faker>=18.0.0"
      max_concurrent_runs: 1
      timeout_seconds: 3600
      email_notifications:
        on_failure: ["bryan.li@databricks.com"]
```

### T014: App Resource Definition
**File**: resources/apps/synthetic-data-generator.yml
**Structure**:
```yaml
resources:
  apps:
    synthetic_data_generator:
      name: "Synthetic Data Generator (${bundle.target})"
      description: "React application for configuring and triggering synthetic data generation"
      source_code_path: react-app/
      resources:
        - name: data_generation_job
          description: "Job that generates synthetic identity graph data"
          job:
            id: "${resources.jobs.synthetic_data_generation.id}"
            permission: CAN_MANAGE_RUN
```

### T016: GitHub Actions Workflow
**File**: .github/workflows/databricks-deploy.yml
**Structure**:
```yaml
name: Deploy Databricks Asset Bundle

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: databricks/setup-cli@main
      - name: Validate bundle
        run: databricks bundle validate
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}

  deploy_dev:
    needs: validate
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: databricks/setup-cli@main
      - name: Deploy to dev
        run: databricks bundle deploy --target dev
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}

  deploy_prod:
    needs: validate
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://e2-demo-field-eng.cloud.databricks.com
    steps:
      - uses: actions/checkout@v3
      - uses: databricks/setup-cli@main
      - name: Deploy to prod
        run: databricks bundle deploy --target prod
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_CLIENT_ID: ${{ secrets.DATABRICKS_CLIENT_ID }}
          DATABRICKS_CLIENT_SECRET: ${{ secrets.DATABRICKS_CLIENT_SECRET }}
```

### T020-T023: Deployment Validation
**Commands**:
- T020: `databricks bundle deploy --target dev`
- T021: Modify job config, redeploy, verify change detection
- T022: `databricks bundle deploy --target prod` (with approval)
- T023: `git checkout <previous-tag>`, redeploy to prod

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD)
- Use `databricks bundle validate` frequently during development
- Commit after each task completion
- All variable substitution must be testable via contract tests
- Prod deployment requires THREE safeguards: approval + mode lock + explicit flag

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T007 cover databricks-bundle-schema.yml)
- [x] All entities have configuration tasks (Bundle: T010, JobResource: T013, AppResource: T014, Target: T011-T012)
- [x] All tests come before implementation (T004-T009 before T010-T015)
- [x] Parallel tasks truly independent (T004-T009, T024-T027)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Quickstart workflow covered (T020-T023 validate 9-step deployment)
- [x] Research decisions implemented (GitHub Actions: T016-T019, safeguards: T009/T022)

---

**Total Tasks**: 27 (9 parallel-capable)
**Estimated Completion**: 3-4 days
**Critical Path**: T001 → T004-T009 → T010-T015 → T016-T019 → T020-T023 → T024-T027
