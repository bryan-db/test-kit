# Data Model: React.js Web Application with Material Design 3

**Feature**: 002-react-js-version | **Date**: 2025-10-01

## Overview
This document defines the data models and entities for the React-based synthetic data generator application. All models represent client-side state or API payloads for Databricks Jobs API integration.

---

## 1. Configuration Entity

### Purpose
Represents the complete user configuration across all wizard steps. Persisted to localStorage and passed to Databricks Jobs API as job parameters.

### Schema
```typescript
interface Configuration {
  version: number;                      // Schema version for migration (default: 1)
  currentStep: number;                  // Current wizard step index (0-4)
  config: {
    household: HouseholdConfig;
    demographics: DemographicsConfig;
    engagement: EngagementConfig;
    campaign: CampaignConfig;
    output: OutputConfig;
  };
  lastModified: string;                 // ISO 8601 timestamp
}

interface HouseholdConfig {
  numHouseholds: number;                // Range: 1,000 - 10,000,000 (FR-006)
  householdSizeMean: number;            // Mean household size (default: 2.5)
  householdSizeStdDev: number;          // Standard deviation (default: 1.2)
  incomeBrackets: {                     // Distribution must sum to 1.0 (FR-009, FR-010)
    "< $30K": number;
    "$30K - $60K": number;
    "$60K - $100K": number;
    "$100K - $150K": number;
    "> $150K": number;
  };
}

interface DemographicsConfig {
  ageRange: {
    min: number;                        // Range: 18-100 (FR-011)
    max: number;
  };
  genderDistribution: {                 // Distribution must sum to 1.0 (FR-012, FR-013)
    "Male": number;
    "Female": number;
    "Non-Binary": number;
    "Prefer not to say": number;
  };
  educationDistribution: {              // Distribution must sum to 1.0 (FR-014, FR-015)
    "High School": number;
    "Some College": number;
    "Bachelor's": number;
    "Master's": number;
    "Doctorate": number;
  };
  identityMappingsPerPerson: number;    // Range: 2-15 (FR-016)
}

interface EngagementConfig {
  timePeriodDays: number;               // Range: 7-730 (FR-017)
  eventsPerPerson: number;              // Range: 10-1000 (FR-018)
  contentCategories: string[];          // Selected from predefined list (FR-020)
  engagementTypeDistribution: {         // Distribution must sum to 1.0 (FR-021, FR-022)
    "view": number;
    "click": number;
    "share": number;
    "like": number;
    "comment": number;
  };
  temporalPattern: "uniform" | "daily" | "weekly"; // (FR-023)
}

interface CampaignConfig {
  numCampaigns: number;                 // Range: 1-100 (FR-024)
  durationRange: {                      // (FR-025)
    min: number;
    max: number;
  };
  channels: string[];                   // Selected marketing channels (FR-026)
  reachPercentage: number;              // Range: 0.01-1.0 (FR-027)
  responseRateRange: {                  // (FR-028)
    min: number;
    max: number;
  };
}

interface OutputConfig {
  randomSeed: number | null;            // User-provided or auto-generated (FR-032)
  catalog: string;                      // Target Unity Catalog (FR-033)
  schema: string;                       // Target schema within catalog
}
```

### Validation Rules
- **Household**:
  - `numHouseholds`: Integer, 1,000 ≤ value ≤ 10,000,000
  - `householdSizeMean`: Float, > 0
  - `householdSizeStdDev`: Float, > 0
  - `incomeBrackets`: 0.99 ≤ sum(values) ≤ 1.01 (FR-044)

- **Demographics**:
  - `ageRange.min` < `ageRange.max` (FR-045)
  - 18 ≤ `ageRange.min` ≤ 100, 18 ≤ `ageRange.max` ≤ 100
  - `genderDistribution`: 0.99 ≤ sum(values) ≤ 1.01
  - `educationDistribution`: 0.99 ≤ sum(values) ≤ 1.01
  - `identityMappingsPerPerson`: Integer, 2 ≤ value ≤ 15

- **Engagement**:
  - `timePeriodDays`: Integer, 7 ≤ value ≤ 730
  - `eventsPerPerson`: Integer, 10 ≤ value ≤ 1000
  - `contentCategories`: Non-empty array
  - `engagementTypeDistribution`: 0.99 ≤ sum(values) ≤ 1.01
  - `temporalPattern`: Must be one of ["uniform", "daily", "weekly"]

- **Campaign**:
  - `numCampaigns`: Integer, 1 ≤ value ≤ 100
  - `durationRange.min` < `durationRange.max`
  - `channels`: Non-empty array
  - `reachPercentage`: 0.01 ≤ value ≤ 1.0
  - `responseRateRange.min` < `responseRateRange.max`

- **Output**:
  - `randomSeed`: Integer or null (auto-generated if null)
  - `catalog`: Non-empty string
  - `schema`: Non-empty string, valid SQL identifier

### State Transitions
1. **Initial State**: Default values loaded from constants
2. **User Input**: User modifies sliders/inputs → triggers validation
3. **Auto-Adjustment**: Distribution sliders trigger proportional redistribution
4. **Validation**: Before step navigation → check validation rules
5. **Persistence**: After step navigation → save to localStorage (FR-005a)
6. **Restoration**: On page load → restore from localStorage (FR-005b)
7. **Submission**: On job submit → serialize to JSON, pass to Jobs API

### localStorage Serialization
```javascript
// Key: "syntheticDataGeneratorConfig_v1"
// Value: JSON.stringify(Configuration)
{
  "version": 1,
  "currentStep": 2,
  "config": { /* ... */ },
  "lastModified": "2025-10-01T15:30:00.000Z"
}
```

### Default Values
```javascript
const DEFAULT_CONFIG = {
  version: 1,
  currentStep: 0,
  config: {
    household: {
      numHouseholds: 10000,
      householdSizeMean: 2.5,
      householdSizeStdDev: 1.2,
      incomeBrackets: {
        "< $30K": 0.2,
        "$30K - $60K": 0.25,
        "$60K - $100K": 0.3,
        "$100K - $150K": 0.15,
        "> $150K": 0.1
      }
    },
    demographics: {
      ageRange: { min: 18, max: 80 },
      genderDistribution: {
        "Male": 0.48,
        "Female": 0.48,
        "Non-Binary": 0.02,
        "Prefer not to say": 0.02
      },
      educationDistribution: {
        "High School": 0.3,
        "Some College": 0.2,
        "Bachelor's": 0.3,
        "Master's": 0.15,
        "Doctorate": 0.05
      },
      identityMappingsPerPerson: 5
    },
    engagement: {
      timePeriodDays: 365,
      eventsPerPerson: 100,
      contentCategories: ["News", "Sports", "Entertainment", "Technology", "Lifestyle"],
      engagementTypeDistribution: {
        "view": 0.5,
        "click": 0.25,
        "share": 0.1,
        "like": 0.1,
        "comment": 0.05
      },
      temporalPattern: "daily"
    },
    campaign: {
      numCampaigns: 10,
      durationRange: { min: 7, max: 30 },
      channels: ["Email", "Social Media", "Display Ads"],
      reachPercentage: 0.5,
      responseRateRange: { min: 0.01, max: 0.05 }
    },
    output: {
      randomSeed: null,
      catalog: "bryan_li",
      schema: "synthetic_datasets"
    }
  },
  lastModified: new Date().toISOString()
};
```

---

## 2. GenerationJob Entity

### Purpose
Represents a submitted data generation job. Tracks job status, progress, and results from Databricks Jobs API.

### Schema
```typescript
interface GenerationJob {
  runId: number;                        // Databricks job run ID
  jobId: number;                        // Databricks job definition ID (from Feature 001)
  status: JobStatus;
  config: Configuration["config"];      // Snapshot of configuration at submission time
  submittedAt: string;                  // ISO 8601 timestamp
  startedAt?: string;                   // When job transitioned to RUNNING
  completedAt?: string;                 // When job reached terminal state
  error?: JobError;                     // Error details if job failed
  outputLocation?: string;              // Unity Catalog table path on success
  runPageUrl?: string;                  // Databricks workspace link to job run
}

interface JobStatus {
  lifecycleState: "PENDING" | "RUNNING" | "TERMINATING" | "TERMINATED" | "SKIPPED" | "INTERNAL_ERROR"; // (FR-036)
  resultState?: "SUCCESS" | "FAILED" | "TIMEDOUT" | "CANCELED"; // Available when lifecycleState = TERMINATED
  stateMessage?: string;                // Human-readable status message
}

interface JobError {
  errorCode: string;                    // Databricks error code
  errorMessage: string;                 // Detailed error message (FR-043)
  troubleshootingSteps?: string[];      // Guidance for resolving error
}
```

### State Transitions
```
PENDING → RUNNING → TERMINATING → TERMINATED (SUCCESS)
                 ↓                 ↓
                 →→→→→→→→→→→→→→→→→ TERMINATED (FAILED/TIMEDOUT/CANCELED)
```

### API Mapping
```javascript
// Databricks Jobs API Response → GenerationJob
function mapJobResponse(apiResponse) {
  return {
    runId: apiResponse.run_id,
    jobId: apiResponse.job_id,
    status: {
      lifecycleState: apiResponse.state.life_cycle_state,
      resultState: apiResponse.state.result_state,
      stateMessage: apiResponse.state.state_message
    },
    submittedAt: new Date(apiResponse.start_time).toISOString(),
    startedAt: apiResponse.execution_duration ? new Date(apiResponse.start_time).toISOString() : undefined,
    completedAt: apiResponse.end_time ? new Date(apiResponse.end_time).toISOString() : undefined,
    error: apiResponse.state.result_state === "FAILED" ? {
      errorCode: apiResponse.state.state_message,
      errorMessage: apiResponse.state.state_message
    } : undefined,
    runPageUrl: apiResponse.run_page_url
  };
}
```

### Progress Calculation
```javascript
// FR-038: Display progress percentage
function calculateProgress(status) {
  switch (status.lifecycleState) {
    case "PENDING": return 0;
    case "RUNNING": return 50;
    case "TERMINATING": return 90;
    case "TERMINATED":
      return status.resultState === "SUCCESS" ? 100 : 100;
    default: return 0;
  }
}
```

### Estimated Time Remaining
```javascript
// FR-039: Display estimated time remaining (heuristic)
function estimateTimeRemaining(status, config, elapsedSeconds) {
  if (status.lifecycleState !== "RUNNING") return null;

  // Estimate based on Feature 001 benchmarks
  const totalEstimatedSeconds = estimateGenerationSeconds(config.household.numHouseholds);
  const remainingSeconds = Math.max(0, totalEstimatedSeconds - elapsedSeconds);

  return formatDuration(remainingSeconds); // "2m 30s"
}

function estimateGenerationSeconds(numHouseholds) {
  if (numHouseholds < 50000) return 120;    // <2 min
  if (numHouseholds < 100000) return 180;   // 2-4 min
  if (numHouseholds < 500000) return 210;   // 3-4 min
  return 270;                                // 4-5 min
}
```

---

## 3. WizardStep Entity

### Purpose
Represents metadata for each wizard step, including validation state and navigation rules.

### Schema
```typescript
interface WizardStep {
  index: number;                        // Step index (0-4)
  name: string;                         // Step display name
  path: string;                         // React Router path
  component: React.ComponentType;       // Step component
  isComplete: boolean;                  // Has step been completed?
  validationErrors: ValidationError[];  // Current validation errors
}

interface ValidationError {
  field: string;                        // Configuration field path (e.g., "household.numHouseholds")
  message: string;                      // User-friendly error message (FR-048)
  severity: "error" | "warning";        // Error prevents navigation, warning does not
}
```

### Step Definitions
```javascript
const WIZARD_STEPS = [
  {
    index: 0,
    name: "Household Configuration",
    path: "/wizard/household",
    component: HouseholdConfig,
    validationRules: [
      { field: "numHouseholds", rule: (v) => v >= 1000 && v <= 10000000, message: "Must be between 1,000 and 10,000,000" },
      { field: "incomeBrackets", rule: validateDistributionSum, message: "Income brackets must sum to 1.0" }
    ]
  },
  {
    index: 1,
    name: "Demographics Configuration",
    path: "/wizard/demographics",
    component: DemographicsConfig,
    validationRules: [
      { field: "ageRange", rule: (v) => v.min < v.max, message: "Minimum age must be less than maximum age" },
      { field: "genderDistribution", rule: validateDistributionSum, message: "Gender distribution must sum to 1.0" }
    ]
  },
  {
    index: 2,
    name: "Engagement Configuration",
    path: "/wizard/engagement",
    component: EngagementConfig,
    validationRules: [
      { field: "timePeriodDays", rule: (v) => v >= 7 && v <= 730, message: "Must be between 7 and 730 days" },
      { field: "engagementTypeDistribution", rule: validateDistributionSum, message: "Engagement types must sum to 1.0" }
    ]
  },
  {
    index: 3,
    name: "Campaign Configuration",
    path: "/wizard/campaign",
    component: CampaignConfig,
    validationRules: [
      { field: "numCampaigns", rule: (v) => v >= 1 && v <= 100, message: "Must be between 1 and 100" },
      { field: "durationRange", rule: (v) => v.min < v.max, message: "Minimum duration must be less than maximum" }
    ]
  },
  {
    index: 4,
    name: "Review & Submit",
    path: "/wizard/review",
    component: ReviewSubmit,
    validationRules: [
      { field: "catalog", rule: (v) => v.length > 0, message: "Catalog is required" },
      { field: "schema", rule: (v) => v.length > 0, message: "Schema is required" }
    ]
  }
];
```

### Navigation Rules
- **Next**: Can navigate to step N+1 if step N has no validation errors (FR-004)
- **Previous**: Can always navigate to step N-1 (FR-003)
- **Jump**: Can jump to any completed step (isComplete = true)

---

## 4. DatasetMetrics Entity

### Purpose
Represents client-side calculated metrics for estimated output size and generation time.

### Schema
```typescript
interface DatasetMetrics {
  estimatedIndividuals: number;         // Calculated from numHouseholds * householdSizeMean (FR-007)
  estimatedTotalEvents: number;         // Calculated from individuals * eventsPerPerson (FR-019)
  estimatedGenerationTime: string;      // Human-readable time estimate (FR-031)
  estimatedStorageSize: string;         // Estimated Delta Lake table size (MB/GB)
  estimatedCampaignExposures: number;   // campaigns * individuals * reachPercentage
}
```

### Calculation Functions
```javascript
// metricsCalculator.js (client-side, <100ms execution per NFR-001)
export function calculateMetrics(config) {
  const estimatedIndividuals = Math.round(
    config.household.numHouseholds * config.household.householdSizeMean
  );

  const estimatedTotalEvents = Math.round(
    estimatedIndividuals *
    config.engagement.eventsPerPerson *
    (config.engagement.timePeriodDays / 365)
  );

  const estimatedGenerationTime = (() => {
    const n = config.household.numHouseholds;
    if (n < 50000) return "< 2 minutes";
    if (n < 100000) return "2-4 minutes";
    if (n < 500000) return "3-4 minutes";
    return "4-5 minutes";
  })();

  const estimatedStorageSize = (() => {
    const totalRows = estimatedIndividuals + estimatedTotalEvents;
    const bytesPerRow = 200; // Average row size in bytes
    const megabytes = (totalRows * bytesPerRow) / (1024 * 1024);
    if (megabytes < 1024) return `${megabytes.toFixed(0)} MB`;
    return `${(megabytes / 1024).toFixed(2)} GB`;
  })();

  const estimatedCampaignExposures = Math.round(
    config.campaign.numCampaigns *
    estimatedIndividuals *
    config.campaign.reachPercentage
  );

  return {
    estimatedIndividuals,
    estimatedTotalEvents,
    estimatedGenerationTime,
    estimatedStorageSize,
    estimatedCampaignExposures
  };
}
```

---

## 5. AuthToken Entity

### Purpose
Represents OAuth 2.0 access token and refresh token for Databricks API authentication.

### Schema
```typescript
interface AuthToken {
  accessToken: string;                  // Bearer token for API requests
  refreshToken: string;                 // Token for refreshing access token
  expiresAt: number;                    // Unix timestamp (milliseconds) when token expires
  tokenType: "Bearer";
  scope: string[];                      // Granted scopes (e.g., ["jobs:read", "jobs:write"])
}
```

### Storage
- **Storage Location**: React Context (memory-only, NOT localStorage for security)
- **Lifecycle**: Cleared on logout or browser close
- **Refresh Strategy**: Auto-refresh 5 minutes before expiration (FR-058)

### Token Refresh Flow
```javascript
// authService.js
export async function refreshTokenIfNeeded(currentToken) {
  const now = Date.now();
  const timeUntilExpiry = currentToken.expiresAt - now;
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  if (timeUntilExpiry < REFRESH_THRESHOLD) {
    return await refreshAccessToken(currentToken.refreshToken);
  }

  return currentToken;
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://e2-demo-field-eng.cloud.databricks.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.REACT_APP_OAUTH_CLIENT_ID
    })
  });

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope.split(' ')
  };
}
```

---

## Entity Relationships

```
Configuration (1) --- (0..1) GenerationJob
    |
    ├─── (5) WizardStep
    └─── (1) DatasetMetrics (calculated)

AuthToken (1) --- (0..*) GenerationJob (via API requests)
```

**Cardinality**:
- 1 Configuration per user session
- 1 Configuration can have 0 or 1 active GenerationJob
- 1 Configuration spans 5 WizardSteps
- 1 Configuration generates 1 DatasetMetrics (computed)
- 1 AuthToken can be used for multiple GenerationJob submissions

---

## Data Flow

1. **Initial Load**:
   ```
   App Mount → configService.loadFromLocalStorage() → Configuration (restored or default)
   ```

2. **Wizard Navigation**:
   ```
   User Input → Configuration Update → Validation → Step Navigation → localStorage.setItem()
   ```

3. **Metric Calculation**:
   ```
   Configuration Change → metricsCalculator.calculateMetrics() → DatasetMetrics (memo)
   ```

4. **Job Submission**:
   ```
   Configuration → JSON.stringify() → Databricks Jobs API (POST /jobs/run-now) → GenerationJob
   ```

5. **Job Polling**:
   ```
   setInterval(5000) → Databricks Jobs API (GET /jobs/runs/get) → GenerationJob Update → UI Refresh
   ```

---

## Validation Service Interface

```javascript
// validationService.js
export function validateConfiguration(config, step) {
  const errors = [];
  const rules = WIZARD_STEPS[step].validationRules;

  for (const rule of rules) {
    const value = getNestedValue(config, rule.field);
    if (!rule.rule(value)) {
      errors.push({
        field: rule.field,
        message: rule.message,
        severity: "error"
      });
    }
  }

  return errors;
}

function validateDistributionSum(distribution) {
  const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
  return sum >= 0.99 && sum <= 1.01;
}
```

---

## Summary

**Entities Defined**: 5
- Configuration (user input, localStorage)
- GenerationJob (Databricks Jobs API)
- WizardStep (navigation metadata)
- DatasetMetrics (calculated estimates)
- AuthToken (OAuth 2.0 credentials)

**Key Design Decisions**:
- Configuration persisted to localStorage (FR-005a, FR-005b)
- AuthToken in memory only (security best practice)
- GenerationJob polled every 5 seconds (FR-037)
- DatasetMetrics calculated client-side (<100ms, NFR-001)
- All distributions validated for sum = 1.0 (FR-044)

**Next Phase**: API Contracts (OpenAPI schema for Databricks Jobs API integration)
