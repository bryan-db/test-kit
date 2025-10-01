
# Implementation Plan: Synthetic Identity Graph Dataset Generator

**Branch**: `001-create-a-databricks` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-create-a-databricks/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Databricks App for generating synthetic consumer identity graph datasets to support analytics and campaign testing without real customer data. The app provides a multi-step wizard interface for configuring and generating realistic datasets representing households, individuals, demographics, content engagement, audience attributes, campaigns, and response outcomes. All data persists to Unity Catalog tables in Delta Lake format within the `bryan_li` catalog, supporting scales from 1K to 1M+ households with sub-5-minute generation times via distributed compute.

## Technical Context

**Language/Version**: Python 3.11+ (Databricks Runtime 14.3 LTS or higher)
**Primary Dependencies**: Databricks SDK, Faker (synthetic data generation), PySpark, Dash/Streamlit (Databricks Apps frontend), databricks-connect
**Storage**: Unity Catalog tables in `bryan_li` catalog, Delta Lake format
**Testing**: pytest, pytest-spark, Databricks workspace integration tests
**Target Platform**: Databricks workspace `e2-demo-field-eng.cloud.databricks.com`, Databricks Apps runtime
**Project Type**: Web application (Databricks App frontend + backend data generation service)
**Performance Goals**: < 5 minutes for dataset generation regardless of scale (1K-1M+ households), distributed processing via Spark
**Constraints**: Must leverage Unity Catalog governance, workspace authentication, catalog-level permissions, Delta Lake ACID guarantees
**Scale/Scope**: 1K to 1M+ households with configurable individuals per household, engagement events, campaigns, and responses

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Lakehouse-First Architecture Compliance

**✅ PASS**: Delta Lake format for all structured data storage
- All generated datasets will be written as Delta Lake tables
- Unity Catalog governance enforced via `bryan_li` catalog
- Schema evolution supported for incremental features

**✅ PASS**: Unified batch workload
- Spark-based generation supports distributed batch processing
- No separate streaming requirements for this use case

**✅ PASS**: Schema evolution and time travel capabilities
- Delta Lake time travel enables versioning of generated datasets
- Users can regenerate or append to existing datasets

**✅ PASS**: Open formats and standards
- Delta Lake is open-source format
- JDBC/ODBC access available via Unity Catalog
- No proprietary data silos introduced

**✅ PASS**: Environment configuration
- Workspace: `e2-demo-field-eng.cloud.databricks.com`
- Catalog: `bryan_li`
- All tables created in constitutional compliance

### Additional Constitutional Requirements

**✅ PASS**: Databricks SDK usage
- Implementation will use Databricks SDK for Unity Catalog operations
- Workspace authentication inherited from Databricks Apps runtime

**✅ PASS**: Idempotent and reproducible transformations
- Seed-based generation ensures deterministic outputs (FR-011)
- Referential integrity maintained (FR-009)

**Constitution Version**: 1.1.0

## Project Structure

### Documentation (this feature)
```
specs/001-create-a-databricks/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── wizard_api.yaml  # Wizard configuration API
│   └── generation_api.yaml # Data generation API
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
databricks_app/
├── app.py                      # Databricks App entry point (Dash/Streamlit UI)
├── requirements.txt            # Python dependencies
└── src/
    ├── wizard/                 # Multi-step wizard UI components
    │   ├── __init__.py
    │   ├── household_config.py
    │   ├── demographics_config.py
    │   ├── engagement_config.py
    │   ├── campaign_config.py
    │   └── validation.py
    ├── generators/             # Synthetic data generation logic
    │   ├── __init__.py
    │   ├── household_generator.py
    │   ├── individual_generator.py
    │   ├── engagement_generator.py
    │   ├── audience_generator.py
    │   ├── campaign_generator.py
    │   └── response_generator.py
    ├── models/                 # Data models/schemas
    │   ├── __init__.py
    │   └── schemas.py
    ├── storage/                # Unity Catalog persistence
    │   ├── __init__.py
    │   └── catalog_writer.py
    └── utils/
        ├── __init__.py
        ├── auth.py             # Permission checks
        └── progress.py         # Progress indicators

tests/
├── contract/                   # API contract tests
│   ├── test_wizard_contract.py
│   └── test_generation_contract.py
├── integration/                # End-to-end tests
│   ├── test_household_generation.py
│   ├── test_full_pipeline.py
│   └── test_catalog_permissions.py
└── unit/                       # Unit tests
    ├── test_generators.py
    ├── test_validation.py
    └── test_auth.py
```

**Structure Decision**: Web application structure selected because this is a Databricks App with a frontend UI (multi-step wizard) and backend data generation service. The `databricks_app/` directory contains the Databricks App code deployed to the workspace, while `tests/` contains the test suite following TDD principles.

## Phase 0: Outline & Research

*No NEEDS CLARIFICATION markers found in spec - all clarifications resolved via /clarify command*

### Research Areas

1. **Databricks Apps Architecture**
   - Research: Databricks Apps deployment model, runtime environment, and limitations
   - Research: Frontend framework choices (Dash vs Streamlit vs Gradio) for Databricks Apps
   - Research: Session management and state persistence in Databricks Apps

2. **Synthetic Data Generation at Scale**
   - Research: Faker library patterns for realistic demographic and behavioral data
   - Research: Distributed data generation with PySpark for 1M+ household scale
   - Research: Statistical distribution libraries (normal, power law, seasonal) for realistic patterns

3. **Unity Catalog Integration**
   - Research: Unity Catalog table creation API via Databricks SDK
   - Research: Permission verification patterns (CREATE TABLE privilege checks)
   - Research: Schema design for identity graph relationships in Delta Lake

4. **Performance Optimization**
   - Research: Spark partitioning strategies for < 5 minute generation target
   - Research: Broadcast joins vs shuffle joins for identity resolution
   - Research: Progress tracking with Spark UI integration

5. **Identity Graph Patterns**
   - Research: Cross-device identity resolution data structures
   - Research: Temporal consistency patterns for event sequences
   - Research: Referential integrity enforcement in distributed generation

**Output**: research.md with decisions and rationale for each area

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Data Model Design

Extract 10 key entities from spec → `data-model.md`:

**Core Entities**:
- `households`: household_id (PK), location, income_bracket, size, created_at
- `individuals`: individual_id (PK), household_id (FK), age, gender, education, employment
- `identity_mappings`: mapping_id (PK), individual_id (FK), identifier_type, identifier_value

**Engagement Entities**:
- `content_engagements`: event_id (PK), individual_id (FK), content_id, timestamp, engagement_type, duration
- `viewership_patterns`: pattern_id (PK), individual_id (FK), frequency, recency, preferred_categories

**Audience Entities**:
- `audience_attributes`: attribute_id (PK), individual_id (FK), segment, affinity_scores, classifications

**Campaign Entities**:
- `campaigns`: campaign_id (PK), name, start_date, end_date, target_criteria, channels
- `campaign_exposures`: exposure_id (PK), individual_id (FK), campaign_id (FK), timestamp, channel, frequency
- `response_events`: response_id (PK), individual_id (FK), campaign_id (FK), response_type, timestamp, value
- `outcome_metrics`: outcome_id (PK), response_id (FK), conversion_status, revenue, attribution_weight

**Validation Rules**:
- All foreign keys must resolve (referential integrity)
- Timestamps must follow temporal consistency (responses after exposures)
- Demographic combinations must be realistic (age/income validation)

### 2. API Contracts

Generate REST API contracts → `/contracts/`:

**Wizard API** (`wizard_api.yaml`):
- `POST /wizard/session` - Initialize wizard session
- `POST /wizard/step/{step_id}/validate` - Validate step configuration
- `GET /wizard/session/{session_id}` - Retrieve session state
- `POST /wizard/session/{session_id}/submit` - Submit final configuration

**Generation API** (`generation_api.yaml`):
- `POST /generate/start` - Start dataset generation with config
- `GET /generate/status/{job_id}` - Poll generation progress
- `GET /generate/result/{job_id}` - Retrieve generation results
- `POST /generate/cancel/{job_id}` - Cancel running generation

### 3. Contract Tests

Generate failing contract tests:
- `tests/contract/test_wizard_contract.py` - Assert wizard API schemas
- `tests/contract/test_generation_contract.py` - Assert generation API schemas

### 4. Integration Test Scenarios

From acceptance scenarios → `quickstart.md`:
1. Launch wizard → configure 10K households → generate → verify tables created
2. Generate demographics → verify realistic age/income distributions
3. Generate engagement events → verify temporal patterns
4. Derive audience attributes → verify segment calculations
5. Generate campaigns → verify reach and frequency
6. Generate responses → verify correlation with exposures

### 5. Agent File Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to create/update `CLAUDE.md` with:
- Databricks Apps development context
- Unity Catalog `bryan_li` catalog usage
- PySpark distributed generation patterns
- TDD workflow for this feature

**Output**: data-model.md, contracts/wizard_api.yaml, contracts/generation_api.yaml, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs:
  - 2 contract tests (wizard, generation APIs) → 2 test tasks [P]
  - 10 entities in data-model.md → 10 model/schema tasks [P]
  - 6 acceptance scenarios → 6 integration test tasks
  - 6 generator modules → 6 implementation tasks
  - Wizard UI with 5 steps → 5 UI component tasks
  - Storage layer → 2 tasks (catalog operations, permission checks)
  - Progress tracking → 1 task
  - Performance optimization → 1 task
  - Quickstart validation → 1 task

**Ordering Strategy**:
- **Setup** (3 tasks): Project structure, dependencies, Databricks App scaffold
- **Tests First** (8 tasks): Contract tests [P], integration test scaffolds [P]
- **Core Models** (10 tasks): Schema definitions [P]
- **Generators** (6 tasks): Sequential (household → individual → engagement → audience → campaign → response)
- **Storage** (2 tasks): Catalog writer, permission checks
- **Wizard UI** (5 tasks): Sequential wizard steps with validation
- **Integration** (3 tasks): Wire generators to wizard, progress tracking, performance tuning
- **Polish** (3 tasks): Error handling, unit tests [P], quickstart execution

**Estimated Output**: ~40 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation < 5 min for 1M households)

## Complexity Tracking

*No constitutional violations detected - all requirements align with Lakehouse-First Architecture*

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.1.0 - See `.specify/memory/constitution.md`*
