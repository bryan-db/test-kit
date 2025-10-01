# Tasks: Synthetic Identity Graph Dataset Generator

**Input**: Design documents from `/specs/001-create-a-databricks/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/app_interface.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Databricks App**: `databricks_app/` at repository root
- **Tests**: `tests/` at repository root
- Paths shown below use repository root structure from plan.md

## Phase 3.1: Setup

- [x] **T001**: Create project directory structure
  - Create `databricks_app/` directory
  - Create subdirectories: `src/wizard/`, `src/generators/`, `src/models/`, `src/storage/`, `src/utils/`
  - Create `tests/` directory with subdirectories: `contract/`, `integration/`, `unit/`

- [x] **T002**: Initialize Python project dependencies in `databricks_app/requirements.txt`
  - Add: `databricks-sdk>=0.18.0`
  - Add: `dbldatagen>=0.3.5`
  - Add: `Faker>=20.0.0`
  - Add: `streamlit>=1.28.0`
  - Add: `pyspark>=3.5.0`
  - Add: `pytest>=7.4.0`
  - Add: `pytest-spark>=0.6.0`

- [x] **T003** [P]: Configure linting and formatting in `databricks_app/pyproject.toml`
  - Add black formatter config (line-length: 100)
  - Add ruff linter config
  - Add mypy type checking config

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T004** [P]: App interface contract test in `tests/contract/test_app_interface.py`
  - Load contract schema from `specs/001-create-a-databricks/contracts/app_interface.yaml`
  - Assert WizardStep enum values match contract
  - Assert SessionState schema fields (session_id, current_step, config, job_id, job_status)
  - Assert GenerationConfig required fields (seed, catalog_name, schema_name, all config objects)
  - Test MUST FAIL (no implementation yet)

- [x] **T005** [P]: Household configuration validation test in `tests/contract/test_household_config.py`
  - Assert HouseholdConfig schema (num_households, size_distribution, income_brackets)
  - Test num_households range validation (1000-10000000)
  - Test income bracket weights sum validation
  - Test MUST FAIL (no validation implementation yet)

- [x] **T006** [P]: Demographics configuration validation test in `tests/contract/test_demographics_config.py`
  - Assert DemographicsConfig schema (age_range, gender_distribution, education_distribution, identity_mappings)
  - Test age range validation (18-100)
  - Test gender distribution weights sum to 1.0
  - Test identifiers_per_person range (2-15)
  - Test MUST FAIL (no validation implementation yet)

- [x] **T007** [P]: Integration test for household generation in `tests/integration/test_household_generation.py`
  - ✅ Test scenario: Generate 1000 households with seed 42
  - ✅ Assert table `bryan_li.synthetic_data.households` created
  - ✅ Assert row count = 1000
  - ✅ Assert all required columns exist and schema validation
  - ✅ Assert no NULL values in NOT NULL columns
  - ✅ Test deterministic generation with same seed
  - ✅ Test household_size within valid range (1-10)

- [x] **T008** [P]: Integration test for full pipeline in `tests/integration/test_full_pipeline.py`
  - ✅ Test scenario from quickstart.md: 10K households end-to-end
  - ✅ Configure wizard with all 5 steps (household, demographics, engagement, audience, campaign)
  - ✅ Execute full pipeline with timing validation (< 5 minutes)
  - ✅ Assert all 10 tables created with correct row counts
  - ✅ Assert referential integrity (no orphaned records)
  - ✅ Test deterministic full pipeline with seed

- [x] **T009** [P]: Integration test for catalog permissions in `tests/integration/test_catalog_permissions.py`
  - ✅ Test permission check before generation (USE_CATALOG, USE_SCHEMA, CREATE_TABLE)
  - ✅ Mock insufficient permissions scenarios
  - ✅ Assert error message includes missing privilege
  - ✅ Assert no job submitted when permissions lacking
  - ✅ Test API error handling
  - ✅ Test permission error message format with GRANT statements

## Phase 3.3: Core Data Models ✅ COMPLETE

- [x] **T010** [P]: Define Household schema in `databricks_app/src/models/schemas.py`
  - Create `HouseholdSchema` class with fields: household_id (BIGINT), location_city (STRING), location_state (STRING), location_zip (STRING), income_bracket (STRING), household_size (INT), housing_type (STRING), created_at (TIMESTAMP)
  - Add StructType for PySpark DataFrame schema
  - Add validation constraints (income_bracket CHECK, household_size BETWEEN 1 AND 10)

- [x] **T011** [P]: Define Individual schema in `databricks_app/src/models/schemas.py`
  - Create `IndividualSchema` class with fields: individual_id (BIGINT), household_id (BIGINT FK), age (INT), gender (STRING), education_level (STRING), employment_status (STRING), income_individual (DECIMAL), created_at (TIMESTAMP)
  - Add CHECK constraint for age BETWEEN 18 AND 100
  - Add gender CHECK constraint

- [x] **T012** [P]: Define IdentityMapping schema in `databricks_app/src/models/schemas.py`
  - Create `IdentityMappingSchema` class with fields: mapping_id (BIGINT), individual_id (BIGINT FK), identifier_type (STRING), identifier_value (STRING), first_seen (TIMESTAMP), last_seen (TIMESTAMP), active (BOOLEAN)
  - Add CHECK constraint for identifier_type enum
  - Add CHECK constraint last_seen >= first_seen

- [x] **T013** [P]: Define ContentEngagement schema in `databricks_app/src/models/schemas.py`
  - Create `ContentEngagementSchema` class with fields: event_id (BIGINT), individual_id (BIGINT FK), content_id (STRING), content_category (STRING), engagement_type (STRING), timestamp (TIMESTAMP), duration_seconds (INT), device_type (STRING), session_id (STRING)
  - Add CHECK constraint for engagement_type enum
  - Add CHECK constraint duration_seconds >= 0

- [x] **T014** [P]: Define ViewershipPattern schema in `databricks_app/src/models/schemas.py`
  - Create `ViewershipPatternSchema` class with fields: pattern_id (BIGINT), individual_id (BIGINT FK UNIQUE), total_engagements (BIGINT), frequency_daily_avg (DOUBLE), recency_last_engagement (TIMESTAMP), preferred_categories (ARRAY<STRING>), preferred_device (STRING), peak_hour (INT), computed_at (TIMESTAMP)
  - Add CHECK constraint peak_hour BETWEEN 0 AND 23

- [x] **T015** [P]: Define AudienceAttribute schema in `databricks_app/src/models/schemas.py`
  - Create `AudienceAttributeSchema` class with fields: attribute_id (BIGINT), individual_id (BIGINT FK UNIQUE), segment_primary (STRING), segment_secondary (ARRAY<STRING>), affinity_scores (MAP<STRING, DOUBLE>), behavioral_classification (STRING), propensity_to_convert (DOUBLE), lifetime_value_estimate (DECIMAL), computed_at (TIMESTAMP)
  - Add CHECK constraint propensity_to_convert BETWEEN 0.0 AND 1.0

- [x] **T016** [P]: Define Campaign schema in `databricks_app/src/models/schemas.py`
  - Create `CampaignSchema` class with fields: campaign_id (BIGINT), campaign_name (STRING), start_date (DATE), end_date (DATE), target_segment (ARRAY<STRING>), channels (ARRAY<STRING>), budget (DECIMAL), goal (STRING), created_at (TIMESTAMP)
  - Add CHECK constraint end_date >= start_date
  - Add CHECK constraint budget > 0

- [x] **T017** [P]: Define CampaignExposure schema in `databricks_app/src/models/schemas.py`
  - Create `CampaignExposureSchema` class with fields: exposure_id (BIGINT), individual_id (BIGINT FK), campaign_id (BIGINT FK), exposure_timestamp (TIMESTAMP), channel (STRING), frequency (INT), placement (STRING), cost (DECIMAL)
  - Add CHECK constraint for channel enum
  - Add CHECK constraint frequency > 0, cost >= 0

- [x] **T018** [P]: Define ResponseEvent schema in `databricks_app/src/models/schemas.py`
  - Create `ResponseEventSchema` class with fields: response_id (BIGINT), individual_id (BIGINT FK), campaign_id (BIGINT FK), exposure_id (BIGINT FK), response_type (STRING), response_timestamp (TIMESTAMP), exposure_timestamp (TIMESTAMP), time_to_conversion_hours (DOUBLE), value (DECIMAL)
  - Add CHECK constraint response_timestamp >= exposure_timestamp (temporal consistency)
  - Add CHECK constraint for response_type enum

- [x] **T019** [P]: Define OutcomeMetric schema in `databricks_app/src/models/schemas.py`
  - Create `OutcomeMetricSchema` class with fields: outcome_id (BIGINT), response_id (BIGINT FK UNIQUE), campaign_id (BIGINT FK), conversion_status (STRING), revenue (DECIMAL), engagement_score (DOUBLE), attribution_model (STRING), attribution_weight (DOUBLE), computed_at (TIMESTAMP)
  - Add CHECK constraints for conversion_status enum, engagement_score BETWEEN 0.0 AND 1.0, attribution_weight BETWEEN 0.0 AND 1.0

## Phase 3.4: Synthetic Data Generators (Sequential - dependencies exist)

- [x] **T020**: Implement household generator in `databricks_app/src/generators/household_generator.py`
  - ✅ Use dbldatagen to generate households with configurable num_households
  - ✅ Implement size_distribution (normal distribution with mean/std_dev)
  - ✅ Implement income_bracket distribution with configurable weights
  - ✅ Use Faker Pandas UDF for location_city, location_state, location_zip
  - ✅ Return PySpark DataFrame matching HouseholdSchema
  - ✅ Apply seed for deterministic generation

- [x] **T021**: Implement individual generator in `databricks_app/src/generators/individual_generator.py`
  - ✅ Use dbldatagen to generate individuals linked to households
  - ✅ Implement age_range distribution
  - ✅ Implement gender_distribution with configurable weights
  - ✅ Implement education_level and employment_status distributions
  - ✅ Return PySpark DataFrame matching IndividualSchema
  - ✅ Maintain referential integrity with households (FK constraint)

- [x] **T022**: Implement identity mapping generator in `databricks_app/src/generators/individual_generator.py` (continues T021)
  - ✅ Generate 2-15 identifiers per individual (configurable mean)
  - ✅ Implement identifier_type distribution with configurable weights
  - ✅ Use MD5 hashing for identifier_value generation (deterministic)
  - ✅ Set first_seen and last_seen timestamps
  - ✅ Return PySpark DataFrame matching IdentityMappingSchema

- [x] **T023**: Implement engagement generator in `databricks_app/src/generators/engagement_generator.py`
  - ✅ Use dbldatagen to generate content_engagement events
  - ✅ Implement events_per_person distribution with configurable mean/std_dev
  - ✅ Spread events across time_period_days with realistic temporal patterns (uniform, daily, weekly)
  - ✅ Implement content_category distribution
  - ✅ Implement engagement_type weights (view, click, share, like, comment)
  - ✅ Set duration_seconds for 'view' engagements only
  - ✅ Return PySpark DataFrame matching ContentEngagementSchema

- [x] **T024**: Implement audience attribute derivation in `databricks_app/src/generators/audience_generator.py`
  - ✅ Aggregate content_engagements to compute viewership_patterns (total_engagements, frequency_daily_avg, recency, preferred_categories, preferred_device, peak_hour)
  - ✅ Derive audience_attributes from viewership_patterns (segment_primary based on top category, affinity_scores, behavioral_classification thresholds, propensity_to_convert)
  - ✅ Return two PySpark DataFrames: viewership_patterns and audience_attributes

- [x] **T025**: Implement campaign generator in `databricks_app/src/generators/campaign_generator.py`
  - ✅ Use dbldatagen to generate campaigns with configurable num_campaigns
  - ✅ Set campaign_duration_days (random between min/max)
  - ✅ Assign target_segment from available segments
  - ✅ Assign channels from configured list
  - ✅ Set realistic budget values
  - ✅ Return PySpark DataFrame matching CampaignSchema

- [x] **T026**: Implement campaign exposure generator in `databricks_app/src/generators/campaign_generator.py` (continues T025)
  - ✅ Join individuals with campaigns to create exposures
  - ✅ Implement reach_percentage (random sample of individuals per campaign)
  - ✅ Set exposure_timestamp within campaign start_date/end_date
  - ✅ Implement frequency distribution (1-10 exposures per individual-campaign pair)
  - ✅ Calculate cost based on CPM model
  - ✅ Return PySpark DataFrame matching CampaignExposureSchema

- [x] **T027**: Implement response generator in `databricks_app/src/generators/response_generator.py`
  - ✅ Sample exposures to generate response_events based on response_rate_range
  - ✅ Correlate response likelihood with propensity_to_convert from audience_attributes
  - ✅ Set response_timestamp AFTER exposure_timestamp (temporal consistency)
  - ✅ Calculate time_to_conversion_hours
  - ✅ Assign value for 'conversion' response_type
  - ✅ Derive outcome_metrics from response_events (conversion_status, revenue, engagement_score, attribution_weight)
  - ✅ Return two PySpark DataFrames: response_events and outcome_metrics

## Phase 3.5: Unity Catalog Storage Layer ✅ COMPLETE

- [x] **T028**: Implement Unity Catalog writer in `databricks_app/src/storage/catalog_writer.py`
  - ✅ Create `CatalogWriter` class with SparkSession
  - ✅ Implement `write_table(df, catalog, schema, table_name, mode='overwrite')` method
  - ✅ Use `df.write.format("delta").mode(mode).saveAsTable()` for Delta Lake writes
  - ✅ Enable optimized writes and auto-compaction in constructor
  - ✅ Implement Z-Order optimization after write with configurable columns
  - ✅ Handle write errors with retry logic (exponential backoff, max 3 retries)
  - ✅ Additional utility methods: create_schema_if_not_exists, table_exists, get_table_stats, vacuum_table

- [x] **T029**: Implement permission checks in `databricks_app/src/utils/auth.py`
  - ✅ Create `verify_catalog_permissions(catalog_name, schema_name, user_principal)` function
  - ✅ Use Databricks SDK `w.grants.get()` to check permissions
  - ✅ Verify USE_CATALOG, USE_SCHEMA, CREATE_TABLE privileges
  - ✅ Return `(has_permission: bool, missing_privileges: List[str])`
  - ✅ Handle API errors gracefully with informative messages
  - ✅ Implement `format_permission_error()` helper with GRANT SQL statements
  - ✅ Implement `check_permissions_and_fail_fast()` for early validation

## Phase 3.6: Streamlit Wizard UI (Sequential - steps depend on each other)

- [ ] **T030**: Create Streamlit app entry point in `databricks_app/app.py`
  - Initialize Streamlit session_state with wizard_step=0, config={}
  - Load checkpoint from Unity Catalog Volumes if exists
  - Display progress indicator (5 steps)
  - Route to appropriate wizard step component
  - Handle navigation (Next, Previous buttons)

- [ ] **T031**: Implement household configuration step in `databricks_app/src/wizard/household_config.py`
  - Create `render_household_config()` function
  - Display num_households slider (1K-10M, log scale)
  - Display household size distribution inputs (mean, std_dev)
  - Display income bracket weights (5 sliders summing to 1.0)
  - Validate inputs using HouseholdConfig schema
  - Save config to session_state on Next click
  - Return validation result

- [ ] **T032**: Implement demographics configuration step in `databricks_app/src/wizard/demographics_config.py`
  - Create `render_demographics_config()` function
  - Display age range inputs (min, max sliders)
  - Display gender distribution weights (4 sliders summing to 1.0)
  - Display education distribution select boxes
  - Display identifiers_per_person slider (2-15)
  - Display identifier type distribution weights
  - Validate inputs using DemographicsConfig schema
  - Save config to session_state on Next click

- [ ] **T033**: Implement engagement configuration step in `databricks_app/src/wizard/engagement_config.py`
  - Create `render_engagement_config()` function
  - Display time_period_days slider (7-730)
  - Display events_per_person inputs (mean, distribution select)
  - Display content categories multi-select
  - Display engagement type weights (5 sliders summing to 1.0)
  - Validate inputs using EngagementConfig schema
  - Save config to session_state on Next click

- [ ] **T034**: Implement campaign configuration step in `databricks_app/src/wizard/campaign_config.py`
  - Create `render_campaign_config()` function
  - Display num_campaigns slider (1-100)
  - Display campaign_duration_days range (min/max sliders)
  - Display channels multi-select (email, social, display, video, ctv)
  - Display reach_percentage slider (1%-100%)
  - Display response_rate_range inputs (min/max)
  - Validate inputs using CampaignConfig schema
  - Save config to session_state on Next click

- [ ] **T035**: Implement validation utilities in `databricks_app/src/wizard/validation.py`
  - Create `validate_step(step_name, config)` function
  - Check required fields present
  - Check value ranges (min/max constraints)
  - Check distribution weights sum to 1.0 where applicable
  - Return `ValidationResult` with errors/warnings list
  - Display validation errors in UI with clear messages

## Phase 3.7: Integration & Orchestration

- [ ] **T036**: Wire generators to wizard in `databricks_app/app.py`
  - Create review/submit step displaying full configuration summary
  - Add random seed input for deterministic generation (default random)
  - Add catalog/schema inputs (default bryan_li.synthetic_data)
  - Implement permission check on "Generate Dataset" button click (call `verify_catalog_permissions()`)
  - Display permission error if insufficient privileges
  - If permissions OK, submit Databricks Job with generation notebook

- [ ] **T037**: Create generation notebook in `databricks_app/generation_notebook.py`
  - Parse config_json from job parameters (passed by wizard)
  - Initialize Spark session with Photon and optimized writes
  - Execute generation phases in order:
    1. Generate households → write to catalog
    2. Generate individuals + identity_mappings → write to catalog
    3. Generate content_engagements → write to catalog
    4. Derive viewership_patterns + audience_attributes → write to catalog
    5. Generate campaigns + campaign_exposures → write to catalog
    6. Generate response_events + outcome_metrics → write to catalog
  - Log progress after each phase
  - Return job result with table names and row counts

- [ ] **T038**: Implement progress tracking in `databricks_app/src/utils/progress.py`
  - Create `poll_job_status(job_id)` function using Databricks Jobs API
  - Return `JobStatus` with life_cycle_state, result_state, percent_complete
  - Display Streamlit progress bar with status updates
  - Poll every 5 seconds until job completes or fails
  - Display final result (success with table links or error message)

## Phase 3.8: Polish

- [ ] **T039** [P]: Add unit tests for generators in `tests/unit/test_generators.py`
  - Test household generator with various size distributions
  - Test individual generator age/income correlation
  - Test identity mapping type distribution
  - Test engagement event temporal patterns
  - Test audience segmentation logic
  - Test campaign exposure reach calculations
  - Test response event temporal consistency

- [ ] **T040** [P]: Add unit tests for validation logic in `tests/unit/test_validation.py`
  - Test validate_step() for each wizard step
  - Test required field validation
  - Test range constraint validation
  - Test weight sum validation (must equal 1.0)
  - Test error message clarity

- [ ] **T041** [P]: Add unit tests for auth utilities in `tests/unit/test_auth.py`
  - Test verify_catalog_permissions() with mocked Databricks SDK
  - Test all permission combinations (USE_CATALOG, USE_SCHEMA, CREATE_TABLE)
  - Test API error handling
  - Test missing privilege detection

- [ ] **T042**: Run quickstart scenario 1 (small dataset) from `specs/001-create-a-databricks/quickstart.md`
  - Execute: Generate 10K households end-to-end
  - Verify all 10 tables created with expected row counts
  - Verify referential integrity (0 orphaned records)
  - Verify temporal consistency (0 violations)
  - Verify generation time < 2 minutes
  - Document actual timings and row counts

- [ ] **T043**: Run quickstart scenario 3 (large-scale performance) from `specs/001-create-a-databricks/quickstart.md`
  - Execute: Generate 1M households with warm cluster
  - Measure end-to-end generation time
  - Verify generation time < 5 minutes (NFR-001 requirement)
  - Verify Delta Lake file optimization (< 1000 files per table)
  - Document performance breakdown (cluster startup, generation phases, write times)

- [ ] **T044**: Performance optimization pass
  - Tune Spark partitions (200 partitions for 1M households)
  - Verify Photon acceleration enabled
  - Verify optimized writes and auto-compaction enabled
  - Run Z-Order optimization on all tables
  - Measure query performance on common patterns (identity resolution, campaign attribution)

## Dependencies

**Setup Phase (T001-T003)**: No dependencies, can run in parallel after T001

**Test Phase (T004-T009)**: Depends on T001-T003 (project structure and dependencies)

**Model Phase (T010-T019)**: Depends on T001-T003, can run in parallel

**Generator Phase (T020-T027)**: Sequential dependencies
- T020 (households) → no dependencies beyond models
- T021-T022 (individuals + identity mappings) → depends on T020
- T023 (engagements) → depends on T021
- T024 (audience attributes) → depends on T023
- T025-T026 (campaigns + exposures) → depends on T021, T025
- T027 (responses) → depends on T024, T026

**Storage Phase (T028-T029)**: Depends on models (T010-T019), can run in parallel

**Wizard Phase (T030-T035)**: Sequential dependencies (each step builds on previous), depends on T028-T029

**Integration Phase (T036-T038)**: Depends on generators (T020-T027), wizard (T030-T035), storage (T028-T029)

**Polish Phase (T039-T044)**: Depends on all implementation (T020-T038)

## Parallel Execution Examples

### Round 1: Setup (after T001 completes)
```bash
# Launch T002 and T003 together
# T002: Initialize requirements.txt
# T003: Configure linting
```

### Round 2: Tests (after setup completes)
```bash
# Launch T004-T009 together (all contract and integration tests)
# These are independent test files that can be written in parallel
```

### Round 3: Models (after setup completes)
```bash
# Launch T010-T019 together (all schema definitions)
# These are all in the same schemas.py file but define different classes
# Can be written in parallel if using branches or pair programming
```

### Round 4: Storage utilities (after models complete)
```bash
# Launch T028-T029 together
# T028: catalog_writer.py
# T029: auth.py
# Different files, no dependencies
```

### Round 5: Unit tests (after implementation completes)
```bash
# Launch T039-T041 together
# T039: test_generators.py
# T040: test_validation.py
# T041: test_auth.py
# Different test files, can run in parallel
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Run integration tests (T007-T009) frequently during implementation
- Performance target: < 5 minutes for 1M households (T043 validates this)

## Task Generation Rules Applied

1. **From Contract** (app_interface.yaml):
   - T004: Main contract test
   - T005-T006: Configuration schema tests

2. **From Data Model** (data-model.md - 10 entities):
   - T010-T019: Schema definitions (one per entity)
   - T020-T027: Generators (one per entity or entity group)

3. **From User Stories** (quickstart.md - 6 scenarios):
   - T007: Household generation scenario
   - T008: Full pipeline scenario
   - T009: Permission validation scenario
   - T042: Small dataset validation
   - T043: Large-scale performance validation

4. **Ordering**:
   - Setup → Tests → Models → Generators → Storage → Wizard → Integration → Polish
   - Dependencies enforced via sequential phases

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have model tasks (T010-T019)
- [x] All entities have generator tasks (T020-T027)
- [x] All tests come before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (schemas.py exception: different classes)

## Estimated Timeline

- **Setup** (T001-T003): 1 hour
- **Tests First** (T004-T009): 4 hours
- **Models** (T010-T019): 3 hours
- **Generators** (T020-T027): 12 hours (most complex)
- **Storage** (T028-T029): 2 hours
- **Wizard** (T030-T035): 8 hours
- **Integration** (T036-T038): 4 hours
- **Polish** (T039-T044): 6 hours

**Total**: ~40 hours (5 days for single developer, 2-3 days with parallelization)

## Success Criteria

All tasks complete AND:
- ✅ All integration tests pass (T007-T009)
- ✅ Quickstart scenarios validate successfully (T042-T043)
- ✅ Performance target met: < 5 minutes for 1M households
- ✅ Constitutional compliance maintained (Delta Lake, Unity Catalog, Databricks SDK)
- ✅ Referential integrity enforced (0 orphaned records)
- ✅ Temporal consistency enforced (0 violations)
