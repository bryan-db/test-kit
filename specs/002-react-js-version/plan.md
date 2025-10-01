
# Implementation Plan: React.js Web Application with Material Design 3

**Branch**: `002-react-js-version` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/bryan.li/Projects/Claude Demos/spec-kit-demo/test-kit/specs/002-react-js-version/spec.md`

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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a React.js web application with Material Design 3 styling to replace the existing Streamlit-based synthetic identity graph dataset generator. The application provides a 5-step wizard interface for configuring dataset parameters (households, demographics, engagement, campaigns) with intelligent auto-adjusting sliders, client-side metric calculations (<100ms), browser localStorage persistence, and direct integration with Databricks Jobs API for generation job submission and monitoring. The app uses OAuth 2.0 for authentication and is deployable to Databricks Apps platform.

## Technical Context
**Language/Version**: JavaScript ES6+ (React 18.x, Node.js 18+)
**Primary Dependencies**: React, Material-UI (MUI) v5, React Router, Databricks SDK for JavaScript, Vite (build tool)
**Storage**: Browser localStorage for configuration persistence, Unity Catalog (Delta Lake) for generated datasets via Feature 001 backend
**Testing**: Vitest (unit tests), React Testing Library (component tests), Playwright (E2E tests)
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), deployable to Databricks Apps platform
**Project Type**: Web (frontend-only, direct API integration to Databricks Jobs API)
**Performance Goals**: <100ms client-side metric calculations, <200ms UI state transitions, 5-second polling interval for job status
**Constraints**: OAuth 2.0 authentication required, must handle token expiration, localStorage must survive browser crashes, no custom backend (direct Databricks Jobs API integration)
**Scale/Scope**: 10 concurrent users, 5-step wizard with 59 functional requirements, support for 10M household configurations, ~15 React components, ~8 service modules

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Lakehouse-First Architecture (Constitution I)
**Status**: ✅ PASS

**Analysis**:
- React frontend submits jobs to existing Feature 001 Databricks notebook/job that writes to Unity Catalog
- No separate data storage introduced by this feature (localStorage is UI-only config persistence)
- Data generation pipeline already uses Delta Lake format (Feature 001 implementation)
- Frontend references workspace `e2-demo-field-eng.cloud.databricks.com` and catalog `bryan_li`
- No violations of lakehouse-first principles

**Integration Points**:
- Databricks Jobs API: Submit and monitor generation jobs
- Unity Catalog: Target catalog/schema validation before submission
- OAuth 2.0: Workspace authentication flow
- Feature 001 notebook: Backend execution engine (already lakehouse-compliant)

### Environment Configuration (Constitution)
**Status**: ✅ PASS

**Analysis**:
- Workspace: `e2-demo-field-eng.cloud.databricks.com` (hardcoded in OAuth config)
- Default catalog: `bryan_li` (validated in permission checks)
- API endpoint: `https://e2-demo-field-eng.cloud.databricks.com/api/2.0` (Jobs API base URL)
- Authentication: OAuth 2.0 with token refresh (follows security policy)

**Configuration Validation**:
- UI validates catalog/schema permissions before job submission (FR-034)
- OAuth tokens are workspace-scoped and time-limited
- All job parameters reference Feature 001's Unity Catalog writer

### Complexity Assessment
**Status**: ✅ PASS (No violations)

**Justification**: This is a pure frontend application that enhances user experience without introducing architectural complexity. It delegates all data operations to the existing Feature 001 lakehouse-compliant backend.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
react-app/                          # New React frontend application
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── wizard/                 # Wizard step components
│   │   │   ├── HouseholdConfig.jsx
│   │   │   ├── DemographicsConfig.jsx
│   │   │   ├── EngagementConfig.jsx
│   │   │   ├── CampaignConfig.jsx
│   │   │   └── ReviewSubmit.jsx
│   │   ├── common/                 # Shared UI components
│   │   │   ├── ProgressIndicator.jsx
│   │   │   ├── DistributionSlider.jsx
│   │   │   ├── LogScaleSlider.jsx
│   │   │   ├── ValidationMessage.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── layout/                 # Layout components
│   │       ├── AppBar.jsx
│   │       └── WizardLayout.jsx
│   ├── services/                   # Business logic and API integration
│   │   ├── databricksApi.js        # Databricks Jobs API client
│   │   ├── authService.js          # OAuth 2.0 flow
│   │   ├── configService.js        # localStorage persistence
│   │   ├── validationService.js    # Configuration validation
│   │   ├── metricsCalculator.js    # Client-side metric calculations
│   │   └── jobMonitor.js           # Job polling and status tracking
│   ├── hooks/                      # Custom React hooks
│   │   ├── useWizardState.js       # Wizard navigation state
│   │   ├── useConfigPersistence.js # localStorage sync
│   │   ├── useDistributionSlider.js # Auto-adjust slider logic
│   │   └── useJobPolling.js        # Job status polling
│   ├── theme/                      # Material Design 3 theme
│   │   ├── theme.js                # MUI theme configuration
│   │   └── constants.js            # MD3 colors, typography
│   ├── utils/                      # Utility functions
│   │   ├── proportionalRedistribute.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.jsx                     # Root component with routing
│   ├── main.jsx                    # Application entry point
│   └── config.js                   # Environment configuration
├── tests/
│   ├── contract/                   # API contract tests
│   │   ├── databricksJobsApi.test.js
│   │   └── oauthFlow.test.js
│   ├── integration/                # Component integration tests
│   │   ├── wizardFlow.test.jsx
│   │   └── jobSubmission.test.jsx
│   └── unit/                       # Unit tests
│       ├── services/
│       ├── hooks/
│       └── utils/
├── public/                         # Static assets
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite build configuration
├── vitest.config.js                # Vitest test configuration
└── databricks-app.yml              # Databricks Apps deployment manifest

databricks_app/                     # Existing Streamlit app (Feature 001)
└── [unchanged]
```

**Structure Decision**: Web application with frontend-only architecture. The React app is a separate application directory (`react-app/`) that coexists with the existing Streamlit implementation (`databricks_app/`). This allows side-by-side comparison and gradual migration. The frontend communicates directly with Databricks Jobs API without a custom backend layer, leveraging OAuth 2.0 for secure authentication and the existing Feature 001 notebook for data generation logic.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Infrastructure Setup** (3 tasks):
   - Initialize React project with Vite, MUI v5, React Router
   - Configure Vitest + React Testing Library
   - Set up Material Design 3 theme configuration

2. **Contract Tests** (4 tasks, all [P] parallel):
   - Contract test: OAuth 2.0 flow (authorize + token endpoints)
   - Contract test: Jobs API /jobs/run-now
   - Contract test: Jobs API /jobs/runs/get
   - Contract test: Jobs API /jobs/runs/cancel

3. **Data Models & Services** (8 tasks):
   - Implement Configuration entity with localStorage serialization [P]
   - Implement GenerationJob entity with API mapping [P]
   - Implement WizardStep entity with validation rules [P]
   - Implement DatasetMetrics calculator (<100ms performance) [P]
   - Implement AuthToken service with OAuth 2.0 + PKCE flow
   - Implement databricksApi.js client (fetch-based)
   - Implement configService.js (localStorage persistence)
   - Implement validationService.js (distribution sum checks)

4. **Custom React Hooks** (4 tasks, all [P]):
   - Implement useWizardState hook (navigation + validation)
   - Implement useConfigPersistence hook (localStorage sync)
   - Implement useDistributionSlider hook (proportional redistribution)
   - Implement useJobPolling hook (5-second polling with abort)

5. **Wizard Step Components** (5 tasks, all [P] after hooks complete):
   - Implement HouseholdConfig component (log scale slider, income distribution)
   - Implement DemographicsConfig component (age range, gender/education sliders)
   - Implement EngagementConfig component (time period, content categories, temporal pattern)
   - Implement CampaignConfig component (duration, channels, reach, response rate)
   - Implement ReviewSubmit component (summary, permission validation, job submission)

6. **Common UI Components** (5 tasks, all [P]):
   - Implement ProgressIndicator component (5-step stepper)
   - Implement DistributionSlider component (auto-adjust slider group)
   - Implement LogScaleSlider component (1K-10M scale)
   - Implement ValidationMessage component (inline error display)
   - Implement LoadingSpinner component (Material Design 3 circular)

7. **Job Monitoring UI** (2 tasks):
   - Implement JobStatusDisplay component (progress bar, lifecycle states)
   - Implement JobErrorDisplay component (troubleshooting guidance)

8. **Integration Tests** (3 tasks):
   - Integration test: Full wizard flow (5 steps, localStorage persistence)
   - Integration test: Job submission and polling (mock API)
   - Integration test: Token refresh on 401 response

9. **Deployment Configuration** (2 tasks):
   - Create databricks-app.yml manifest
   - Configure Vite build for Databricks Apps deployment

10. **Quickstart Validation** (1 task):
    - Execute quickstart.md end-to-end test (manual validation)

**Ordering Strategy**:
- Phase 1: Infrastructure (tasks 1-3)
- Phase 2: Contract tests (tasks 4-7) [P]
- Phase 3: Models & services (tasks 8-15)
- Phase 4: Hooks (tasks 16-19) [P]
- Phase 5: Wizard components (tasks 20-24) [P]
- Phase 6: Common components (tasks 25-29) [P]
- Phase 7: Job monitoring (tasks 30-31)
- Phase 8: Integration tests (tasks 32-34)
- Phase 9: Deployment (tasks 35-36)
- Phase 10: Quickstart (task 37)

**Estimated Output**: 37 numbered tasks in tasks.md with clear dependencies

**TDD Approach**: Contract tests (Phase 2) → Models/Services (Phase 3) → Components (Phases 5-7) → Integration tests (Phase 8)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A (no violations) ✅

**Artifacts Generated**:
- [x] `/specs/002-react-js-version/plan.md` (this file)
- [x] `/specs/002-react-js-version/research.md` (9 research decisions)
- [x] `/specs/002-react-js-version/data-model.md` (5 entities)
- [x] `/specs/002-react-js-version/contracts/databricks-jobs-api.yaml` (OpenAPI 3.0.3)
- [x] `/specs/002-react-js-version/contracts/oauth-api.yaml` (OpenAPI 3.0.3)
- [x] `/specs/002-react-js-version/quickstart.md` (8 test scenarios)
- [x] `/specs/002-react-js-version/tasks.md` (39 tasks, 24 parallel, 15 sequential)
- [x] `/CLAUDE.md` updated with React + Material-UI v5 stack

---
*Based on Constitution v1.1.0 - See `.specify/memory/constitution.md`*
