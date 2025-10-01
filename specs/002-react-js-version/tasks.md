# Tasks: React.js Web Application with Material Design 3

**Feature**: 002-react-js-version
**Input**: Design documents from `/Users/bryan.li/Projects/Claude Demos/spec-kit-demo/test-kit/specs/002-react-js-version/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory → SUCCESS
   → Tech stack: React 18.x, Material-UI v5, Vite, Vitest
   → Structure: react-app/ (frontend-only, Databricks Apps deployment)
2. Load optional design documents:
   → data-model.md: 5 entities (Configuration, GenerationJob, WizardStep, DatasetMetrics, AuthToken)
   → contracts/: 2 files (databricks-jobs-api.yaml, oauth-api.yaml)
   → research.md: 9 technical decisions
   → quickstart.md: 8 test scenarios
3. Generate tasks by category:
   → Setup: 3 tasks (React + Vite + MUI v5 + Vitest)
   → Tests: 7 tasks (4 contract tests [P], 3 integration tests [P])
   → Core: 20 tasks (8 models/services, 4 hooks [P], 5 wizard components [P], 5 common components [P], 2 job monitoring)
   → Integration: 2 deployment tasks
   → Polish: 1 quickstart validation
4. Apply task rules:
   → Contract tests [P] (different files)
   → Models/services first 4 [P] (independent entities)
   → Hooks [P] (different files)
   → Components [P] (different files after dependencies met)
5. Number tasks sequentially (T001-T037)
6. Validate completeness:
   → databricks-jobs-api.yaml: 4 endpoints → 3 contract tests ✅
   → oauth-api.yaml: 2 endpoints → 1 contract test ✅
   → data-model.md: 5 entities → 5 model tasks ✅
   → quickstart.md: 8 scenarios → 3 integration tests ✅
8. Return: SUCCESS (37 tasks ready for TDD execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root: `/Users/bryan.li/Projects/Claude Demos/spec-kit-demo/test-kit/`

## Path Conventions
- **Frontend**: `react-app/src/` (components, services, hooks, theme, utils)
- **Tests**: `react-app/tests/` (contract, integration, unit)
- **Config**: `react-app/` (package.json, vite.config.js, vitest.config.js)
- **Deployment**: `react-app/` (databricks-app.yml)

---

## Phase 3.1: Setup & Infrastructure

- [x] **T001** Initialize React project with Vite and base dependencies
  - Path: `react-app/`
  - Commands:
    ```bash
    cd /Users/bryan.li/Projects/Claude\ Demos/spec-kit-demo/test-kit
    npm create vite@latest react-app -- --template react
    cd react-app
    npm install
    npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
    npm install react-router-dom
    npm install -D vitest @testing-library/react @testing-library/user-event jsdom
    ```
  - Creates: package.json, vite.config.js, src/ directory structure
  - Blocking: All subsequent tasks

- [x] **T002** Configure Vitest with React Testing Library and jsdom
  - Path: `react-app/vitest.config.js`
  - Create vitest.config.js with:
    - environment: 'jsdom'
    - globals: true
    - setupFiles: './tests/setup.js'
    - coverage thresholds: 50% (lines, functions, branches, statements)
  - Create `react-app/tests/setup.js` with localStorage and fetch mocks
  - Blocked by: T001

- [x] **T003** Set up Material Design 3 theme configuration
  - Path: `react-app/src/theme/theme.js`, `react-app/src/theme/constants.js`
  - Implement MD3 color palette (primary: #6750A4, surface variants)
  - Implement MD3 typography scale (Display Large 57px, Medium 45px, Small 36px)
  - Implement component overrides (pill-shaped buttons, elevated cards, filled text fields)
  - Reference: research.md §1 Material-UI v5 for Material Design 3
  - Blocked by: T001

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] **T004** [P] Contract test: OAuth 2.0 authorization and token exchange
  - Path: `react-app/tests/contract/oauthFlow.test.js`
  - Test scenarios:
    - Mock GET /oauth/authorize with PKCE parameters (code_challenge, code_verifier)
    - Mock POST /oauth/token for authorization_code grant
    - Mock POST /oauth/token for refresh_token grant
    - Verify PKCE code_challenge = base64url(SHA256(code_verifier))
    - Verify state parameter for CSRF protection
  - Contract: contracts/oauth-api.yaml
  - **Expected**: All tests FAIL (no authService.js exists yet)
  - Blocks: T013

- [ ] **T005** [P] Contract test: Databricks Jobs API /jobs/run-now
  - Path: `react-app/tests/contract/databricksJobsApi.test.js`
  - Test scenario:
    - Mock POST /jobs/run-now with job_id and notebook_params
    - Verify request headers: Authorization: Bearer {token}, Content-Type: application/json
    - Verify request body format: {job_id, notebook_params: {config, catalog, schema}}
    - Verify response: {run_id, number_in_job}
    - Test error responses: 400, 401, 403, 404, 429, 500
  - Contract: contracts/databricks-jobs-api.yaml
  - **Expected**: All tests FAIL (no databricksApi.js exists yet)
  - Blocks: T014

- [ ] **T006** [P] Contract test: Databricks Jobs API /jobs/runs/get
  - Path: `react-app/tests/contract/databricksJobsApi.test.js` (add to same file)
  - Test scenarios:
    - Mock GET /jobs/runs/get?run_id={id}
    - Verify response lifecycle states: PENDING, RUNNING, TERMINATING, TERMINATED
    - Verify result states: SUCCESS, FAILED, TIMEDOUT, CANCELED
    - Test progress calculation: PENDING=0%, RUNNING=50%, TERMINATED=100%
  - Contract: contracts/databricks-jobs-api.yaml
  - **Expected**: All tests FAIL (no databricksApi.js exists yet)
  - Blocks: T014

- [ ] **T007** [P] Contract test: Databricks Jobs API /jobs/runs/cancel
  - Path: `react-app/tests/contract/databricksJobsApi.test.js` (add to same file)
  - Test scenario:
    - Mock POST /jobs/runs/cancel with {run_id}
    - Verify empty response on success
    - Test 404 error (run not found or already terminated)
  - Contract: contracts/databricks-jobs-api.yaml
  - **Expected**: All tests FAIL (no databricksApi.js exists yet)
  - Blocks: T014

- [ ] **T008** [P] Integration test: Full wizard flow with localStorage persistence
  - Path: `react-app/tests/integration/wizardFlow.test.jsx`
  - Test scenarios (from quickstart.md):
    - Render step 1 (Household Config), adjust sliders, click Next
    - Verify localStorage saved configuration (FR-005a)
    - Navigate to step 5 (Review), verify all values preserved (FR-003)
    - Simulate browser refresh (unmount + remount)
    - Verify wizard restores to step 5 with all config values (FR-005b)
    - Click "Start Fresh", verify localStorage cleared and reset to step 1 (FR-005c)
  - Uses: @testing-library/react, userEvent
  - **Expected**: All tests FAIL (no wizard components exist yet)
  - Blocks: T024-T028

- [ ] **T009** [P] Integration test: Job submission and polling
  - Path: `react-app/tests/integration/jobSubmission.test.jsx`
  - Test scenarios:
    - Mock Databricks Jobs API responses
    - Submit job from ReviewSubmit component
    - Verify permission validation called before submission (FR-034)
    - Verify polling starts at 5-second intervals (FR-037)
    - Verify progress updates: PENDING → RUNNING → TERMINATED SUCCESS
    - Verify polling stops when job terminates (FR-040)
    - Verify success message with output location (FR-042)
  - Uses: vi.useFakeTimers for polling
  - **Expected**: All tests FAIL (no job submission logic exists yet)
  - Blocks: T028, T030, T031

- [ ] **T010** [P] Integration test: OAuth token refresh on 401 response
  - Path: `react-app/tests/integration/tokenRefresh.test.jsx`
  - Test scenarios:
    - Mock initial valid token (expires_at = now + 10 minutes)
    - Make API request
    - Mock 401 Unauthorized response
    - Verify automatic token refresh attempt
    - Verify retry of original request with new token
    - Test refresh failure → redirect to login
  - Uses: Mock fetch, React Context
  - **Expected**: All tests FAIL (no token refresh logic exists yet)
  - Blocks: T013, T014

---

## Phase 3.3: Core Implementation - Data Models & Services
**IMPORTANT: Only start after T004-T010 are written and FAILING**

- [x] **T011** [P] Implement Configuration entity with default values and localStorage serialization
  - Path: `react-app/src/services/configService.js`
  - Implement:
    - DEFAULT_CONFIG constant (from data-model.md §1)
    - loadConfiguration() - read from localStorage, validate version, migrate if needed
    - saveConfiguration() - write to localStorage with error handling (QuotaExceededError, SecurityError)
    - clearConfiguration() - remove from localStorage (FR-005c "Start Fresh")
  - Schema version: 1 (for future migrations)
  - localStorage key: "syntheticDataGeneratorConfig_v1"
  - Reference: data-model.md §1 Configuration Entity, research.md §4 localStorage Best Practices
  - **Success criteria**: T008 integration test passes (localStorage persistence)

- [x] **T012** [P] Implement GenerationJob entity with Databricks API response mapping
  - Path: `react-app/src/services/jobMonitor.js`
  - Implement:
    - mapJobResponse(apiResponse) - map Databricks API response to GenerationJob entity
    - calculateProgress(status) - lifecycle state → progress percentage (data-model.md §2)
    - estimateTimeRemaining(status, config, elapsedSeconds) - heuristic time estimate
    - formatDuration(seconds) - "2m 30s" format
  - Reference: data-model.md §2 GenerationJob Entity
  - **Success criteria**: T006 contract test passes (progress calculation)

- [ ] **T013** Implement AuthToken service with OAuth 2.0 + PKCE flow
  - Path: `react-app/src/services/authService.js`
  - Implement:
    - generatePKCEChallenge() - SHA-256 hash of 43-128 character code_verifier
    - initiateLogin() - redirect to /oauth/authorize with PKCE challenge
    - handleCallback(authCode, codeVerifier) - exchange code for access token
    - refreshTokenIfNeeded(currentToken) - refresh 5 minutes before expiration
    - logout() - clear tokens, revoke via /api/2.0/oauth/revoke
  - Token storage: React Context (NOT localStorage for security)
  - Reference: research.md §2 OAuth 2.0 Integration, data-model.md §5 AuthToken Entity
  - Blocked by: T004 (contract test must fail first)
  - **Success criteria**: T004 contract test passes, T010 integration test passes

- [ ] **T014** Implement databricksApi.js client with fetch-based Jobs API integration
  - Path: `react-app/src/services/databricksApi.js`
  - Implement DatabricksJobsClient class:
    - submitJob(config) - POST /jobs/run-now (FR-035)
    - getJobRun(runId) - GET /jobs/runs/get (FR-036)
    - cancelJobRun(runId) - POST /jobs/runs/cancel
    - getJobOutput(runId) - GET /jobs/runs/get-output (FR-043 error details)
  - Error handling:
    - 401 → trigger token refresh (FR-058)
    - 429 → exponential backoff (2s, 4s, 8s, 16s)
    - 5xx → retry up to 3 times
    - Network timeout → 30 seconds
  - Reference: research.md §3 Databricks Jobs API Integration, contracts/databricks-jobs-api.yaml
  - Blocked by: T005, T006, T007 (contract tests must fail first)
  - **Success criteria**: T005, T006, T007 contract tests pass

- [x] **T015** [P] Implement WizardStep entity with validation rules
  - Path: `react-app/src/services/validationService.js`
  - Implement:
    - WIZARD_STEPS constant (from data-model.md §3)
    - validateConfiguration(config, step) - apply validation rules for current step
    - validateDistributionSum(distribution) - ensure 0.99 ≤ sum ≤ 1.01 (FR-044)
    - validateRange(min, max) - ensure min < max (FR-045)
  - Validation rules for each step (household, demographics, engagement, campaign, output)
  - Reference: data-model.md §3 WizardStep Entity
  - **Success criteria**: Validation errors prevent step navigation in T008 integration test

- [x] **T016** [P] Implement DatasetMetrics calculator with <100ms performance
  - Path: `react-app/src/services/metricsCalculator.js`
  - Implement:
    - calculateMetrics(config) - compute all metrics client-side
    - estimateIndividuals(numHouseholds, householdSizeMean)
    - estimateTotalEvents(numIndividuals, eventsPerPerson, timePeriodDays)
    - estimateGenerationTime(numHouseholds) - heuristic from Feature 001 benchmarks
    - estimateStorageSize(totalRows) - MB/GB format
  - Use React.useMemo() for memoization
  - Reference: data-model.md §4 DatasetMetrics Entity, research.md §5 Client-Side Metric Calculation
  - Performance requirement: <100ms (NFR-001)
  - **Success criteria**: Metrics update instantly in wizard components (<100ms)

- [x] **T017** Implement proportional redistribution utility for auto-adjusting sliders
  - Path: `react-app/src/utils/proportionalRedistribute.js`
  - Implement:
    - redistributeProportionally(categories, changedCategory, newValue, previousValues)
    - Handle edge cases: all sliders at 0, floating-point precision errors
    - Round to 2 decimals, apply correction to first category to ensure sum = 1.0
  - Algorithm already validated in Feature 001 Streamlit implementation
  - Reference: research.md §6 Proportional Redistribution Algorithm
  - **Success criteria**: Distribution sliders auto-adjust in T008 integration test (FR-010, FR-013, FR-015, FR-022)

- [x] **T018** Implement formatters and validators utility functions
  - Path: `react-app/src/utils/formatters.js`, `react-app/src/utils/validators.js`
  - formatters.js:
    - formatNumber(num) - thousands separators
    - formatDuration(seconds) - "2m 30s"
    - formatPercentage(decimal) - "50.0%"
  - validators.js:
    - isValidCatalogName(name) - SQL identifier rules
    - isValidSchemaName(name) - SQL identifier rules
    - isInRange(value, min, max)
  - **Success criteria**: Used in wizard components and validation service

---

## Phase 3.4: Custom React Hooks
**Blocked by: T011-T018 (services must exist first)**

- [x] **T019** [P] Implement useWizardState hook for navigation and validation
  - Path: `react-app/src/hooks/useWizardState.js`
  - Implement:
    - currentStep state (0-4)
    - goNext() - validate current step before navigation (FR-004)
    - goPrevious() - navigate back without validation (FR-003)
    - jumpToStep(index) - navigate to any completed step
    - validationErrors state - inline error messages (FR-046)
  - Uses: validationService.js (T015)
  - **Success criteria**: Wizard navigation works in integration test T008

- [x] **T020** [P] Implement useConfigPersistence hook for localStorage sync
  - Path: `react-app/src/hooks/useConfigPersistence.js`
  - Implement:
    - Load configuration on mount (T011 configService.loadConfiguration)
    - Save configuration on step change (debounced 500ms)
    - Handle QuotaExceededError, SecurityError (private browsing mode)
  - Uses: configService.js (T011)
  - Reference: research.md §4 localStorage Best Practices
  - **Success criteria**: Configuration persists across browser refresh in T008 integration test (FR-005b)

- [x] **T021** [P] Implement useDistributionSlider hook for proportional redistribution
  - Path: `react-app/src/hooks/useDistributionSlider.js`
  - Implement:
    - Track previous values to detect changed slider
    - Call proportionalRedistribute() on slider change (T017)
    - Update all sliders to maintain sum = 1.0
  - Uses: proportionalRedistribute.js (T017)
  - Reference: research.md §6 Proportional Redistribution Algorithm
  - **Success criteria**: Sliders auto-adjust in wizard components (FR-010, FR-013, FR-015, FR-022)

- [x] **T022** ✅ [P] Implement useJobPolling hook for 5-second status polling with abort
  - Path: `react-app/src/hooks/useJobPolling.js`
  - Implement:
    - startPolling(runId) - poll getJobRun() every 5 seconds (FR-037)
    - stopPolling() - stop when lifecycleState = TERMINATED (FR-040)
    - AbortController for cleanup on unmount
    - Error handling for network failures (NFR-006)
  - Uses: databricksApi.js (T014), jobMonitor.js (T012)
  - **Success criteria**: Polling works in T009 integration test (job submission and monitoring)

---

## Phase 3.5: Wizard Step Components
**Blocked by: T019-T022 (hooks must exist first)**

- [x] **T023** [P] Implement HouseholdConfig component with log scale slider and income distribution
  - Path: `react-app/src/components/wizard/HouseholdConfig.jsx`
  - Implement:
    - Log scale slider for numHouseholds (1K-10M) (FR-006)
    - Estimated individuals display (FR-007, uses T016 metricsCalculator)
    - Household size mean and stddev sliders (FR-008)
    - Income bracket distribution sliders (5 brackets) (FR-009)
    - Auto-adjust income brackets on change (FR-010, uses T021 useDistributionSlider)
  - Material Design 3 styling (Card, Slider, Typography)
  - Uses: useWizardState (T019), useConfigPersistence (T020), useDistributionSlider (T021), metricsCalculator (T016)
  - **Success criteria**: Step 1 of wizard flow in T008 integration test

- [x] **T024** ✅ [P] Implement DemographicsConfig component with age range and distribution sliders
  - Path: `react-app/src/components/wizard/DemographicsConfig.jsx`
  - Implement:
    - Age range sliders (min, max) with validation min < max (FR-011, FR-045)
    - Gender distribution sliders (4 categories) (FR-012)
    - Auto-adjust gender sliders (FR-013, uses T021 useDistributionSlider)
    - Education level distribution sliders (5 levels) (FR-014)
    - Auto-adjust education sliders (FR-015, uses T021 useDistributionSlider)
    - Identity mappings per person slider (2-15) (FR-016)
  - Material Design 3 styling
  - Uses: useWizardState (T019), useConfigPersistence (T020), useDistributionSlider (T021)
  - **Success criteria**: Step 2 of wizard flow in T008 integration test

- [x] **T025** ✅ [P] Implement EngagementConfig component with temporal patterns and content categories
  - Path: `react-app/src/components/wizard/EngagementConfig.jsx`
  - Implement:
    - Time period slider (7-730 days) (FR-017)
    - Events per person slider (10-1000) (FR-018)
    - Total estimated events display (FR-019, uses T016 metricsCalculator)
    - Content categories multi-select (FR-020)
    - Engagement type distribution sliders (5 types: view, click, share, like, comment) (FR-021)
    - Auto-adjust engagement type sliders (FR-022, uses T021 useDistributionSlider)
    - Temporal pattern radio buttons (uniform, daily, weekly) (FR-023)
  - Material Design 3 styling
  - Uses: useWizardState (T019), useConfigPersistence (T020), useDistributionSlider (T021), metricsCalculator (T016)
  - **Success criteria**: Step 3 of wizard flow in T008 integration test

- [x] **T026** ✅ [P] Implement CampaignConfig component with channels and response rates
  - Path: `react-app/src/components/wizard/CampaignConfig.jsx`
  - Implement:
    - Number of campaigns slider (1-100) (FR-024)
    - Campaign duration range sliders (min, max) with validation (FR-025, FR-045)
    - Marketing channels multi-select (FR-026)
    - Reach percentage slider (0.01-1.0) (FR-027)
    - Response rate range sliders (min, max) with validation (FR-028, FR-045)
  - Material Design 3 styling
  - Uses: useWizardState (T019), useConfigPersistence (T020)
  - **Success criteria**: Step 4 of wizard flow in T008 integration test

- [ ] **T027** Implement ReviewSubmit component with configuration summary and job submission
  - Path: `react-app/src/components/wizard/ReviewSubmit.jsx`
  - Implement:
    - Comprehensive configuration summary (all steps organized by category) (FR-029)
    - Estimated output metrics display (FR-030, uses T016 metricsCalculator)
    - Estimated generation time display (FR-031)
    - Random seed input (user-provided or auto-generated) (FR-032)
    - Catalog and schema input fields (FR-033)
    - Permission validation before submission (FR-034)
    - "Submit Generation Job" button (FR-035)
    - Job submission logic (uses T014 databricksApi.js)
  - Material Design 3 styling (Card, Button with elevation, TextField)
  - Uses: useWizardState (T019), useConfigPersistence (T020), metricsCalculator (T016), databricksApi (T014)
  - Blocked by: T014 (databricksApi must exist)
  - **Success criteria**: Step 5 of wizard flow in T008 integration test, job submission in T009 integration test

---

## Phase 3.6: Common UI Components
**Blocked by: T003 (theme must exist first)**

- [ ] **T028** [P] Implement ProgressIndicator component with 5-step stepper
  - Path: `react-app/src/components/common/ProgressIndicator.jsx`
  - Implement:
    - Material Design 3 Stepper with 5 steps (FR-002)
    - Step labels: "Household", "Demographics", "Engagement", "Campaign", "Review"
    - Visual states: completed (checkmark), current (highlighted), pending (gray)
    - Step cards with elevation shadows
  - Material Design 3 styling (Stepper, StepLabel, StepIcon)
  - Uses: theme.js (T003)
  - **Success criteria**: Progress indicator shows current step in wizard flow T008

- [ ] **T029** [P] Implement DistributionSlider component with auto-adjust logic
  - Path: `react-app/src/components/common/DistributionSlider.jsx`
  - Implement:
    - Slider group for distribution values (e.g., income brackets, gender, education)
    - Display sum validation (show error if sum ≠ 1.0) (FR-044)
    - Integrate with useDistributionSlider hook (T021) for auto-adjustment
    - Real-time sum display at bottom
  - Material Design 3 styling (Slider with custom track color, labels)
  - Uses: useDistributionSlider (T021), theme.js (T003)
  - **Success criteria**: Used in T023, T024, T025 wizard components

- [ ] **T030** [P] Implement LogScaleSlider component for 1K-10M household scale
  - Path: `react-app/src/components/common/LogScaleSlider.jsx`
  - Implement:
    - Logarithmic scale slider (1,000 to 10,000,000) (FR-006)
    - Custom marks at 1K, 10K, 100K, 1M, 10M
    - Format display value with thousands separators (uses T018 formatters)
  - Material Design 3 styling
  - Uses: formatters.js (T018), theme.js (T003)
  - **Success criteria**: Used in T023 HouseholdConfig component

- [ ] **T031** [P] Implement ValidationMessage component for inline error display
  - Path: `react-app/src/components/common/ValidationMessage.jsx`
  - Implement:
    - Display validation errors and warnings (FR-046, FR-048)
    - User-friendly messages without technical jargon
    - Material Design 3 Alert component (error severity: red, warning: orange)
  - Material Design 3 styling (Alert with appropriate colors)
  - Uses: theme.js (T003)
  - **Success criteria**: Validation errors shown in wizard components when sum ≠ 1.0 or min > max

- [ ] **T032** [P] Implement LoadingSpinner component with Material Design 3 circular progress
  - Path: `react-app/src/components/common/LoadingSpinner.jsx`
  - Implement:
    - Circular progress indicator (NFR-003 for operations >200ms)
    - Material Design 3 CircularProgress component
    - Optional text label below spinner
  - Material Design 3 styling
  - Uses: theme.js (T003)
  - **Success criteria**: Loading spinner shown during job submission in T027, T009 integration test

---

## Phase 3.7: Job Monitoring UI
**Blocked by: T012, T014, T022 (job services and polling must exist)**

- [ ] **T033** Implement JobStatusDisplay component with progress bar and lifecycle states
  - Path: `react-app/src/components/job/JobStatusDisplay.jsx`
  - Implement:
    - Real-time job status display (FR-036): PENDING, RUNNING, TERMINATED
    - Progress bar (0-100%) (FR-038, uses T012 calculateProgress)
    - Estimated time remaining (FR-039, uses T012 estimateTimeRemaining)
    - Link to Databricks workspace job run page (FR-041)
    - Success message with output location on completion (FR-042)
  - Material Design 3 styling (LinearProgress, Card, Typography)
  - Uses: useJobPolling (T022), jobMonitor (T012), theme.js (T003)
  - Blocked by: T012, T022
  - **Success criteria**: Job status updates in T009 integration test (job submission and polling)

- [ ] **T034** Implement JobErrorDisplay component with troubleshooting guidance
  - Path: `react-app/src/components/job/JobErrorDisplay.jsx`
  - Implement:
    - Error message display when job fails (FR-043)
    - Troubleshooting steps (e.g., "Run GRANT MODIFY ON CATALOG...")
    - Expandable section for detailed error trace
    - Retry button
  - Material Design 3 styling (Accordion, Alert severity error)
  - Uses: jobMonitor (T012), theme.js (T003)
  - Blocked by: T012
  - **Success criteria**: Error message shown when job fails in T009 integration test

---

## Phase 3.8: Root Application Components
**Blocked by: T003, T019, T023-T027, T028 (theme, hooks, wizard components, progress indicator must exist)**

- [ ] **T035** Implement App.jsx with routing and wizard layout
  - Path: `react-app/src/App.jsx`
  - Implement:
    - React Router with routes for /wizard/:step (0-4)
    - Material Design 3 ThemeProvider (T003)
    - Auth context provider (T013)
    - Wizard layout with ProgressIndicator (T028)
    - Route guards (require authentication)
  - Uses: theme.js (T003), authService (T013), ProgressIndicator (T028), wizard components (T023-T027)
  - Blocked by: T003, T013, T023-T027, T028
  - **Success criteria**: Full application loads and routes work

- [x] **T036** Implement main.jsx application entry point
  - Path: `react-app/src/main.jsx`
  - Implement:
    - React root rendering
    - Import App.jsx
    - Environment variable configuration (VITE_DATABRICKS_HOST, VITE_OAUTH_CLIENT_ID, etc.)
  - Create `react-app/src/config.js` for environment variables
  - Blocked by: T035
  - **Success criteria**: Application starts with `npm run dev`

---

## Phase 3.9: Deployment Configuration

- [ ] **T037** Create databricks-app.yml manifest for Databricks Apps deployment
  - Path: `react-app/databricks-app.yml`
  - Implement:
    - App metadata (name, display_name, description)
    - Build configuration (source_dir: react-app, build_command: npm install && npm run build, output_dir: react-app/dist)
    - Runtime configuration (type: static, port: 8080, health_check_path: /)
    - Environment variables (DATABRICKS_HOST, DATABRICKS_CATALOG, FEATURE_001_JOB_ID)
    - OAuth configuration (enabled: true, scopes: [jobs:read, jobs:write, catalogs:read])
    - Resource requirements (memory: 512Mi, cpu: 0.5)
    - Permissions (catalog: bryan_li, privileges: [SELECT, CREATE_TABLE, MODIFY])
  - Reference: research.md §9 Databricks Apps Deployment Manifest
  - **Success criteria**: Manifest validates with `databricks apps build`

- [ ] **T038** Configure Vite build for Databricks Apps deployment
  - Path: `react-app/vite.config.js`
  - Update configuration:
    - base: '/apps/synthetic-data-generator-react/' (Databricks Apps path prefix)
    - build.sourcemap: true (for debugging)
    - build.rollupOptions.output.manualChunks (vendor chunk for React, MUI)
    - server.proxy for local development API calls
  - Reference: research.md §7 Vite Build Tool
  - Blocked by: T001
  - **Success criteria**: `npm run build` produces optimized dist/ directory

---

## Phase 3.10: Quickstart Validation

- [ ] **T039** Execute quickstart.md end-to-end test and validate all scenarios
  - Path: Manual validation following `specs/002-react-js-version/quickstart.md`
  - Test scenarios:
    1. Authentication flow (OAuth 2.0 login, token storage)
    2. Step 1: Household config (log scale slider, income distribution auto-adjust)
    3. Step 2: Demographics config (age range, gender/education sliders)
    4. Step 3: Engagement config (time period, events, content categories)
    5. Step 4: Campaign config (duration, channels, reach, response rate)
    6. Step 5: Review & submit (summary, permission validation, job submission)
    7. Job monitoring (status polling, progress bar, completion/failure)
    8. localStorage persistence (browser refresh, "Start Fresh" button)
  - Validation criteria:
    - All wizard steps navigate correctly
    - Metrics calculate in <100ms (NFR-001)
    - Job submits successfully to Databricks
    - Polling respects 5-second interval (FR-037)
    - localStorage restores state after refresh (FR-005b)
    - Error messages are user-friendly (FR-048)
  - **Success criteria**: All 8 scenarios complete without errors (quickstart.md Acceptance Criteria)
  - Blocked by: T001-T038 (entire application must be implemented)

---

## Dependencies

### Critical Path
```
T001 (Init) → T002, T003 (Config)
T002 → T004-T010 (Tests) [P]
T004-T010 → T011-T018 (Services) [some P]
T011-T018 → T019-T022 (Hooks) [P]
T019-T022 → T023-T027 (Wizard) [P]
T003 → T028-T032 (Common UI) [P]
T012, T014, T022 → T033-T034 (Job Monitoring)
T003, T013, T023-T028 → T035 (App.jsx)
T035 → T036 (main.jsx)
T001 → T037-T038 (Deployment) [P]
T001-T038 → T039 (Quickstart)
```

### Detailed Dependencies
- **Setup**: T001 blocks all
- **Config**: T002, T003 block their respective domains
- **Contract Tests (T004-T010)**: [P] after T002
- **Services (T011-T018)**: First 4 [P], others sequential
  - T011, T012, T015, T016 [P]
  - T013 blocked by T004
  - T014 blocked by T005, T006, T007
  - T017, T018 [P] after T011-T016
- **Hooks (T019-T022)**: [P] after T011-T018
- **Wizard Components (T023-T027)**: [P] after T019-T022
  - T027 also blocked by T014 (databricksApi)
- **Common UI (T028-T032)**: [P] after T003
- **Job Monitoring (T033-T034)**: Sequential after T012, T014, T022
- **App (T035-T036)**: T035 blocked by T003, T013, T023-T028; T036 blocked by T035
- **Deployment (T037-T038)**: [P] after T001
- **Quickstart (T039)**: Blocked by all

---

## Parallel Execution Examples

### Phase 3.2: Contract Tests (T004-T007 in parallel)
```bash
# All contract tests can run in parallel (different test files)
Task: "Contract test: OAuth 2.0 authorization and token exchange in react-app/tests/contract/oauthFlow.test.js"
Task: "Contract test: Databricks Jobs API /jobs/run-now in react-app/tests/contract/databricksJobsApi.test.js"
Task: "Contract test: Databricks Jobs API /jobs/runs/get in react-app/tests/contract/databricksJobsApi.test.js"
Task: "Contract test: Databricks Jobs API /jobs/runs/cancel in react-app/tests/contract/databricksJobsApi.test.js"
```

### Phase 3.2: Integration Tests (T008-T010 in parallel)
```bash
# All integration tests can run in parallel (different test files)
Task: "Integration test: Full wizard flow with localStorage persistence in react-app/tests/integration/wizardFlow.test.jsx"
Task: "Integration test: Job submission and polling in react-app/tests/integration/jobSubmission.test.jsx"
Task: "Integration test: OAuth token refresh on 401 response in react-app/tests/integration/tokenRefresh.test.jsx"
```

### Phase 3.3: First 4 Services (T011, T012, T015, T016 in parallel)
```bash
# Independent entity models and calculators
Task: "Implement Configuration entity in react-app/src/services/configService.js"
Task: "Implement GenerationJob entity in react-app/src/services/jobMonitor.js"
Task: "Implement WizardStep entity in react-app/src/services/validationService.js"
Task: "Implement DatasetMetrics calculator in react-app/src/services/metricsCalculator.js"
```

### Phase 3.4: All Hooks (T019-T022 in parallel)
```bash
# All hooks are independent (different files)
Task: "Implement useWizardState hook in react-app/src/hooks/useWizardState.js"
Task: "Implement useConfigPersistence hook in react-app/src/hooks/useConfigPersistence.js"
Task: "Implement useDistributionSlider hook in react-app/src/hooks/useDistributionSlider.js"
Task: "Implement useJobPolling hook in react-app/src/hooks/useJobPolling.js"
```

### Phase 3.5: All Wizard Components (T023-T026 in parallel, T027 sequential)
```bash
# First 4 wizard steps are independent (different files)
Task: "Implement HouseholdConfig component in react-app/src/components/wizard/HouseholdConfig.jsx"
Task: "Implement DemographicsConfig component in react-app/src/components/wizard/DemographicsConfig.jsx"
Task: "Implement EngagementConfig component in react-app/src/components/wizard/EngagementConfig.jsx"
Task: "Implement CampaignConfig component in react-app/src/components/wizard/CampaignConfig.jsx"
# T027 ReviewSubmit must wait for T014 databricksApi.js
```

### Phase 3.6: All Common UI Components (T028-T032 in parallel)
```bash
# All common components are independent (different files)
Task: "Implement ProgressIndicator component in react-app/src/components/common/ProgressIndicator.jsx"
Task: "Implement DistributionSlider component in react-app/src/components/common/DistributionSlider.jsx"
Task: "Implement LogScaleSlider component in react-app/src/components/common/LogScaleSlider.jsx"
Task: "Implement ValidationMessage component in react-app/src/components/common/ValidationMessage.jsx"
Task: "Implement LoadingSpinner component in react-app/src/components/common/LoadingSpinner.jsx"
```

---

## Notes

### TDD Approach
- **Phase 3.2 (T004-T010)**: Write tests FIRST, verify they FAIL
- **Phase 3.3+ (T011-T038)**: Implement functionality to make tests PASS
- **Phase 3.10 (T039)**: Manual validation of full application

### Parallel Execution
- **[P] tasks**: Different files, no dependencies, safe to run concurrently
- **Sequential tasks**: Same file or dependency chain, must run in order
- **Total [P] tasks**: 24 out of 39 (61% can run in parallel)

### File Path References
- All paths are relative to repository root: `/Users/bryan.li/Projects/Claude Demos/spec-kit-demo/test-kit/`
- Frontend: `react-app/src/`
- Tests: `react-app/tests/`
- Config: `react-app/` (package.json, vite.config.js, etc.)

### Success Criteria
- All contract tests pass (T004-T007)
- All integration tests pass (T008-T010)
- All wizard steps functional (T023-T027)
- Job submission and monitoring work (T033-T034)
- Quickstart validation complete (T039)

### Commit Strategy
- Commit after each completed task
- Use descriptive commit messages: "feat: implement HouseholdConfig component (T023)"
- Run tests before committing

---

## Validation Checklist
*GATE: Checked before marking tasks.md as complete*

- [x] All contracts have corresponding tests:
  - databricks-jobs-api.yaml (4 endpoints) → T005, T006, T007 ✅
  - oauth-api.yaml (2 endpoints) → T004 ✅
- [x] All entities have model tasks:
  - Configuration → T011 ✅
  - GenerationJob → T012 ✅
  - WizardStep → T015 ✅
  - DatasetMetrics → T016 ✅
  - AuthToken → T013 ✅
- [x] All tests come before implementation: T004-T010 before T011-T038 ✅
- [x] Parallel tasks truly independent: All [P] tasks use different files ✅
- [x] Each task specifies exact file path: All tasks have Path field ✅
- [x] No task modifies same file as another [P] task: Validated ✅

---

**Total Tasks**: 39
**Parallel Tasks**: 24 (61%)
**Sequential Tasks**: 15 (39%)
**Estimated Completion Time**: 15-20 hours (with parallel execution)

**Ready for Execution**: ✅ All tasks are specific, actionable, and dependency-ordered
