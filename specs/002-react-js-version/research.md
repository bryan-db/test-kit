# Research: React.js Web Application with Material Design 3

**Feature**: 002-react-js-version | **Date**: 2025-10-01

## Overview
This document consolidates research findings for implementing a React-based web application with Material Design 3 styling, OAuth 2.0 authentication, and direct Databricks Jobs API integration. All technical unknowns have been resolved through targeted research.

---

## 1. Material-UI (MUI) v5 for Material Design 3

### Decision
Use **Material-UI (MUI) v5.14+** with custom theme configuration to implement Material Design 3 design system.

### Rationale
- MUI v5 provides comprehensive Material Design 3 components out of the box
- Strong TypeScript/JavaScript support with excellent documentation
- Built-in theming system allows full customization of MD3 color palette, typography, and elevation
- Active community (3.5M weekly npm downloads) with regular updates
- Proven integration with React 18.x and modern build tools (Vite)
- Provides both `@mui/material` (components) and `@mui/system` (styling utilities)

### Alternatives Considered
- **React Material Design 3 (rmwc)**: Less mature, smaller community, limited component library
- **Chakra UI**: Different design system (not Material Design), would require custom styling
- **Custom CSS implementation**: High development cost, poor maintainability, no component library

### Implementation Details
- **Package**: `@mui/material` v5.14+, `@mui/icons-material` for icons, `@emotion/react` and `@emotion/styled` for styling
- **Theme customization**: Use `createTheme()` to define MD3 color palette:
  ```javascript
  const theme = createTheme({
    palette: {
      primary: { main: '#6750A4', light: '#EADDFF', dark: '#21005D' },
      secondary: { main: '#625B71', light: '#E8DEF8', dark: '#1D192B' },
      surface: { main: '#FFFBFE' },
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      h1: { fontSize: '57px', fontWeight: 400 }, // Display Large
      h2: { fontSize: '45px', fontWeight: 400 }, // Display Medium
      h3: { fontSize: '36px', fontWeight: 400 }, // Display Small
    },
    shape: { borderRadius: 100 }, // Pill-shaped buttons
  });
  ```
- **Component overrides**: Use `components` key in theme to customize button elevation, text field styling
- **Best practices**: Use `sx` prop for component-level styling, avoid inline styles

### References
- MUI Documentation: https://mui.com/material-ui/getting-started/
- Material Design 3 Guidelines: https://m3.material.io/

---

## 2. Databricks OAuth 2.0 Integration for React

### Decision
Implement **OAuth 2.0 Authorization Code Flow with PKCE** (Proof Key for Code Exchange) for secure browser-based authentication.

### Rationale
- OAuth 2.0 is the standard authentication method for Databricks workspaces
- PKCE extension protects against authorization code interception attacks in public clients (browsers)
- Provides temporary access tokens (1-hour lifetime) with automatic refresh capability
- Workspace-scoped tokens ensure proper access control
- Avoids storing long-lived credentials in browser localStorage

### Alternatives Considered
- **Personal Access Tokens (PAT)**: Security risk (long-lived credentials), no user-specific access control
- **M2M OAuth (Client Credentials)**: Requires backend server, not suitable for frontend-only architecture
- **Implicit Flow**: Deprecated in OAuth 2.1, less secure than Authorization Code Flow with PKCE

### Implementation Details
- **Flow**:
  1. User initiates login → app generates PKCE code verifier and challenge
  2. Redirect to Databricks authorization endpoint: `https://e2-demo-field-eng.cloud.databricks.com/oauth/authorize`
  3. User authenticates → Databricks redirects back with authorization code
  4. App exchanges code + verifier for access token via token endpoint: `https://e2-demo-field-eng.cloud.databricks.com/oauth/token`
  5. Store access token and refresh token in memory (NOT localStorage for security)
  6. Attach token to Jobs API requests via `Authorization: Bearer {token}` header
  7. Refresh token before expiration (55-minute interval for 1-hour tokens)
- **PKCE Libraries**: Use `oauth4webapi` (lightweight, standards-compliant) or implement with `crypto.subtle` for code verifier generation
- **Token Storage**: Store in React Context or state management library (Redux/Zustand), NOT localStorage
- **Expiration Handling**: Intercept 401 responses, attempt refresh, fallback to re-authentication

### Security Considerations
- **PKCE code verifier**: 43-128 character random string, SHA-256 hashed for challenge
- **State parameter**: CSRF protection, verify on callback
- **Token lifetime**: 1 hour access token, 24 hour refresh token
- **Logout**: Clear tokens from memory, revoke via `/api/2.0/oauth/revoke` endpoint

### References
- Databricks OAuth Documentation: https://docs.databricks.com/dev-tools/auth/oauth-m2m.html
- RFC 7636 (PKCE): https://datatracker.ietf.org/doc/html/rfc7636
- OAuth 2.0 Security Best Practices: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics

---

## 3. Databricks Jobs API Integration (JavaScript)

### Decision
Use **Databricks REST API v2.0** with custom fetch-based client (no official JavaScript SDK available).

### Rationale
- Databricks Jobs API v2.0 provides comprehensive job management capabilities
- RESTful design with JSON payloads, easy to integrate with fetch API
- No official JavaScript SDK exists (Python SDK only), but API is well-documented
- Custom client allows fine-grained error handling and retry logic
- Lightweight implementation (~200 LOC) vs. heavy generic API client libraries

### Alternatives Considered
- **Databricks SDK for Python (via proxy)**: Requires backend server, violates frontend-only constraint
- **Generic API clients (Axios, ky)**: Over-engineered for simple REST API, adds bundle size
- **GraphQL wrapper**: Unnecessary abstraction, adds complexity

### Implementation Details
- **Base URL**: `https://e2-demo-field-eng.cloud.databricks.com/api/2.0`
- **Key Endpoints**:
  - `POST /jobs/run-now`: Submit generation job with configuration JSON
  - `GET /jobs/runs/get`: Poll job status by run ID
  - `GET /jobs/runs/get-output`: Retrieve job output/logs on completion
- **Job Configuration**:
  ```javascript
  {
    job_id: 123456789, // Feature 001 job ID (from databricks-app.yml or hardcoded)
    notebook_params: {
      config: JSON.stringify({
        num_households: 10000,
        household_size_mean: 2.5,
        // ... all wizard configuration
      }),
      catalog: "bryan_li",
      schema: "synthetic_datasets"
    }
  }
  ```
- **Polling Strategy**:
  - Initial request → get `run_id`
  - Poll every 5 seconds: `GET /jobs/runs/get?run_id={run_id}`
  - Check `state.life_cycle_state` (PENDING, RUNNING, TERMINATING, TERMINATED, SKIPPED, INTERNAL_ERROR)
  - Check `state.result_state` (SUCCESS, FAILED, TIMEDOUT, CANCELED)
  - Stop polling when `life_cycle_state === 'TERMINATED'`
- **Error Handling**:
  - 401 Unauthorized → trigger token refresh
  - 429 Rate Limit → exponential backoff (2s, 4s, 8s, 16s)
  - 5xx Server Error → retry up to 3 times with 5-second delay
  - Network timeout → 30-second timeout per request
- **Progress Tracking**:
  - Jobs API doesn't provide granular progress percentage (0-100%)
  - Use heuristic: PENDING=0%, RUNNING=50%, TERMINATED=100%
  - For better UX: parse `cluster_log_url` or `run_page_url` for detailed logs (optional enhancement)

### API Client Structure
```javascript
// databricksApi.js
class DatabricksJobsClient {
  constructor(baseUrl, getToken) { /* ... */ }
  async submitJob(config) { /* POST /jobs/run-now */ }
  async getJobRun(runId) { /* GET /jobs/runs/get */ }
  async cancelJobRun(runId) { /* POST /jobs/runs/cancel */ }
  async getJobOutput(runId) { /* GET /jobs/runs/get-output */ }
}
```

### References
- Databricks Jobs API v2.0 Documentation: https://docs.databricks.com/api/workspace/jobs
- Jobs API Reference: https://docs.databricks.com/api/workspace/jobs/runnow

---

## 4. Browser localStorage Best Practices for Configuration Persistence

### Decision
Use **localStorage with JSON serialization** and **structured error handling** for wizard configuration persistence.

### Rationale
- localStorage is synchronous, simple API, supported in all modern browsers
- 5-10 MB storage limit (ample for wizard configuration ~50 KB)
- Persists across browser sessions (unlike sessionStorage)
- No network latency (client-side only)
- Meets NFR-007 requirement: "maintain configuration data integrity on browser crashes"

### Alternatives Considered
- **sessionStorage**: Lost on browser close, doesn't meet FR-005b requirement
- **IndexedDB**: Asynchronous, over-engineered for simple key-value storage
- **Cookies**: 4 KB size limit (too small), sent with every HTTP request (inefficient)
- **Backend persistence**: Requires authentication, adds latency, violates frontend-only architecture

### Implementation Details
- **Storage Key**: `syntheticDataGeneratorConfig` (versioned: `v1` prefix for schema evolution)
- **Data Structure**:
  ```javascript
  {
    version: 1,
    currentStep: 2, // 0-4 (wizard step index)
    config: {
      household: { numHouseholds: 10000, householdSizeMean: 2.5, ... },
      demographics: { minAge: 18, maxAge: 100, genderDistribution: {...}, ... },
      engagement: { timePeriodDays: 365, eventsPerPerson: 100, ... },
      campaign: { numCampaigns: 10, durationRange: [7, 30], ... },
      output: { catalog: "bryan_li", schema: "synthetic_datasets", seed: 42 }
    },
    lastModified: "2025-10-01T12:34:56.789Z" // ISO 8601 timestamp
  }
  ```
- **Write Strategy**:
  - Save on every step navigation (useEffect with wizard state dependency)
  - Debounce slider changes (500ms delay to avoid excessive writes)
  - Validate before save (catch JSON serialization errors)
- **Read Strategy**:
  - Load on app mount (useEffect in root component)
  - Validate schema version (migrate if `version < 1`)
  - Fallback to default configuration if corrupt or missing
- **Error Handling**:
  ```javascript
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Storage limit exceeded → clear old data or warn user
    } else if (error.name === 'SecurityError') {
      // Private browsing mode → fallback to in-memory state
    }
  }
  ```
- **Schema Evolution**:
  - Version 1: Initial schema
  - Future versions: Add migration functions for backward compatibility
  ```javascript
  function migrateConfig(storedConfig) {
    if (storedConfig.version === 1) {
      // v1 → v2 migration logic
    }
    return storedConfig;
  }
  ```
- **Clear on "Start Fresh"**: Remove key via `localStorage.removeItem(key)` (FR-005c)

### Security Considerations
- **DO NOT store OAuth tokens in localStorage**: Use memory-only storage (React Context)
- **Validate data on read**: Never trust localStorage data (user could manually edit)
- **No sensitive data**: Configuration contains no PII or credentials

### Testing Strategy
- **Unit tests**: Mock localStorage with `jest.spyOn(Storage.prototype, 'setItem')`
- **Integration tests**: Verify wizard state restoration after simulated browser refresh
- **Edge cases**: Test quota exceeded, SecurityError (private mode), JSON parse errors

### References
- MDN localStorage Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Web Storage API Security: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage

---

## 5. Client-Side Metric Calculation for <100ms Performance

### Decision
Implement **pure JavaScript calculation functions** with **memoization** for estimated metrics (individuals, events, generation time).

### Rationale
- Client-side calculations eliminate network latency (0ms API overhead)
- Simple arithmetic operations (<10 lines per metric) execute in <10ms on modern browsers
- Memoization prevents redundant calculations when sliders don't change
- Meets NFR-001 requirement: "<100ms to calculate and display estimated metrics"
- Reduces backend load (no API requests for UI-only operations)

### Alternatives Considered
- **Backend API calls**: 50-200ms latency (network + server processing), fails NFR-001
- **Web Workers**: Overkill for simple arithmetic, adds complexity, ~20ms message passing overhead
- **WebAssembly**: Over-engineered, compilation overhead outweighs calculation time for simple math

### Implementation Details
- **Calculation Functions** (metricsCalculator.js):
  ```javascript
  // Example: Estimate total individuals
  function estimateIndividuals(numHouseholds, householdSizeMean, householdSizeStdDev) {
    // Normal distribution approximation (mean * count)
    return Math.round(numHouseholds * householdSizeMean);
  }

  // Example: Estimate total events
  function estimateTotalEvents(numIndividuals, eventsPerPerson, timePeriodDays) {
    return Math.round(numIndividuals * eventsPerPerson * (timePeriodDays / 365));
  }

  // Example: Estimate generation time (heuristic based on Feature 001 benchmarks)
  function estimateGenerationTime(numHouseholds) {
    if (numHouseholds < 50000) return "< 2 minutes";
    if (numHouseholds < 100000) return "2-4 minutes";
    if (numHouseholds < 500000) return "3-4 minutes";
    return "4-5 minutes";
  }
  ```
- **Memoization with useMemo**:
  ```javascript
  const estimatedIndividuals = useMemo(() => {
    return estimateIndividuals(
      config.household.numHouseholds,
      config.household.householdSizeMean,
      config.household.householdSizeStdDev
    );
  }, [config.household.numHouseholds, config.household.householdSizeMean, config.household.householdSizeStdDev]);
  ```
- **Performance Characteristics**:
  - Arithmetic operations: <5ms (single-threaded JavaScript)
  - React re-render: <10ms (virtual DOM diffing)
  - DOM update: <5ms (text content change)
  - **Total**: <20ms (well under 100ms budget)
- **Benchmarking Strategy**:
  - Use `performance.now()` to measure calculation time in development
  - Log warning if calculation exceeds 50ms (early detection of performance regression)
  - Test with maximum configuration (10M households) to verify <100ms

### Formulas Alignment with Feature 001
- **Individuals**: `num_households * household_size_mean` (simplified, actual uses normal distribution sampling)
- **Total Events**: `num_individuals * events_per_person * (time_period / 365)` (assumes annual rate)
- **Generation Time**: Based on Feature 001 benchmarks (T042-T044 performance validation tasks)

### References
- React useMemo Documentation: https://react.dev/reference/react/useMemo
- JavaScript Performance API: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now

---

## 6. Proportional Redistribution Algorithm for Auto-Adjusting Sliders

### Decision
Implement **proportional redistribution algorithm** (already validated in Streamlit implementation) for distribution sliders (income, gender, education, engagement types).

### Rationale
- Algorithm already proven in Feature 001 Streamlit implementation (working in production)
- Maintains sum = 1.0 constraint without user intervention
- Intuitive UX: users adjust one slider, others auto-adjust proportionally
- Simple implementation (<30 lines of code)
- Meets FR-010, FR-013, FR-015, FR-022 requirements

### Algorithm
```javascript
// proportionalRedistribute.js
export function redistributeProportionally(categories, changedCategory, newValue, previousValues) {
  const otherCategories = categories.filter(c => c !== changedCategory);
  const oldTotalOthers = otherCategories.reduce((sum, c) => sum + previousValues[c], 0);
  const newTotalOthers = 1.0 - newValue;

  const newValues = { [changedCategory]: newValue };

  if (oldTotalOthers > 0 && newTotalOthers >= 0) {
    otherCategories.forEach(category => {
      const proportion = previousValues[category] / oldTotalOthers;
      newValues[category] = Math.round(newTotalOthers * proportion * 100) / 100; // Round to 2 decimals
    });
  } else {
    // Edge case: distribute evenly if old total was 0
    const evenDistribution = newTotalOthers / otherCategories.length;
    otherCategories.forEach(category => {
      newValues[category] = Math.round(evenDistribution * 100) / 100;
    });
  }

  // Correct rounding errors to ensure sum = 1.0
  const actualSum = Object.values(newValues).reduce((sum, val) => sum + val, 0);
  const correction = 1.0 - actualSum;
  if (Math.abs(correction) > 0.001) {
    newValues[otherCategories[0]] += correction;
  }

  return newValues;
}
```

### React Integration
- **Custom Hook**: `useDistributionSlider(categories, initialValues)`
- **State Management**: Track previous values to detect changed slider
- **Event Handling**: Trigger redistribution on slider `onChange` event
- **Validation**: Ensure sum within tolerance (0.99 ≤ sum ≤ 1.01) before allowing step navigation

### Edge Cases
- **All sliders at 0**: Redistribute evenly when user increases one
- **Floating-point precision**: Round to 2 decimals, apply correction to first category
- **Maximum value (1.0)**: Set all others to 0

### References
- Feature 001 Streamlit Implementation: `/databricks_app/src/wizard/household_config.py` (lines 45-68)

---

## 7. Vite Build Tool for React Development

### Decision
Use **Vite 5.x** as the build tool and development server for optimal React development experience.

### Rationale
- **Fast cold start**: ESM-based dev server starts in <1 second (vs. 10-30s for Webpack)
- **Instant HMR**: Hot Module Replacement without full page reload (<50ms update time)
- **Optimized production builds**: Rollup-based bundling with tree-shaking and code splitting
- **React Fast Refresh**: Built-in support for preserving component state during development
- **Modern by default**: Targets ES2020+, native ESM, no transpilation overhead
- **Official React support**: `@vitejs/plugin-react` maintained by Vite team
- **Databricks Apps compatibility**: Produces standard static assets (HTML, JS, CSS) for deployment

### Alternatives Considered
- **Create React App (CRA)**: Slow dev server (Webpack), deprecated since 2023, no longer maintained
- **Next.js**: Over-engineered for SPA (includes SSR, routing, API routes), larger bundle size
- **Parcel**: Slower build times, less mature plugin ecosystem, limited customization

### Implementation Details
- **Configuration** (vite.config.js):
  ```javascript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    base: '/apps/synthetic-data-generator/', // Databricks Apps path prefix
    build: {
      outDir: 'dist',
      sourcemap: true, // For debugging production issues
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@mui/material'],
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://e2-demo-field-eng.cloud.databricks.com',
          changeOrigin: true,
        },
      },
    },
  });
  ```
- **Development**: `npm run dev` (starts dev server on http://localhost:3000)
- **Production Build**: `npm run build` (generates optimized static assets in `dist/`)
- **Preview**: `npm run preview` (test production build locally)

### Bundle Optimization
- **Code Splitting**: Lazy load wizard step components with `React.lazy()`
- **Tree Shaking**: Vite automatically removes unused exports
- **Minification**: Terser for JavaScript, cssnano for CSS
- **Gzip Compression**: Enable in Databricks Apps deployment manifest

### Performance Targets
- **Dev server start**: <2 seconds
- **HMR update**: <100ms
- **Production build**: <30 seconds
- **Bundle size**: <500 KB gzipped (main bundle), <200 KB (vendor chunk)

### References
- Vite Documentation: https://vitejs.dev/
- Vite React Plugin: https://github.com/vitejs/vite-plugin-react

---

## 8. Vitest + React Testing Library for Testing

### Decision
Use **Vitest 1.x** (unit tests) and **React Testing Library** (component tests) for comprehensive test coverage.

### Rationale
- **Vitest**: Vite-native test runner, shares same config, instant watch mode (<50ms per test)
- **React Testing Library**: Encourages best practices (test behavior, not implementation), excellent async support
- **Unified tooling**: Same transform pipeline as Vite (no duplicate Babel/SWC config)
- **Fast execution**: Parallel test execution, smart test re-run (only changed files)
- **Modern features**: Native ESM support, TypeScript, JSX without additional setup

### Alternatives Considered
- **Jest**: Slower (requires Babel transpilation), ESM support still experimental, heavier configuration
- **Playwright Component Testing**: Better for E2E, overkill for unit/component tests
- **Cypress Component Testing**: Requires full browser, slower than jsdom-based testing

### Test Structure
```
tests/
├── contract/                     # API contract tests (verify Databricks API integration)
│   ├── databricksJobsApi.test.js # Mock Jobs API responses, verify request formats
│   └── oauthFlow.test.js         # Mock OAuth endpoints, verify PKCE flow
├── integration/                  # Component integration tests
│   ├── wizardFlow.test.jsx       # Full wizard navigation, localStorage persistence
│   └── jobSubmission.test.jsx    # Submit job, poll status, handle completion
└── unit/                         # Pure function tests
    ├── services/
    │   ├── metricsCalculator.test.js
    │   └── validationService.test.js
    ├── hooks/
    │   ├── useDistributionSlider.test.js
    │   └── useConfigPersistence.test.js
    └── utils/
        └── proportionalRedistribute.test.js
```

### Test Configuration (vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simulate browser environment
    globals: true, // Enable global test APIs (describe, it, expect)
    setupFiles: './tests/setup.js', // Mock localStorage, fetch
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        lines: 50, // Minimum 50% line coverage (per constitution)
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
```

### Key Testing Patterns
- **Mock localStorage**: `global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), ... }`
- **Mock fetch**: Use `vi.stubGlobal('fetch', vi.fn())` for API call testing
- **Async testing**: Use `waitFor` from React Testing Library for async state updates
- **User events**: Use `@testing-library/user-event` for realistic user interactions
- **Slider testing**: Verify redistribution algorithm with various input combinations

### Contract Test Example
```javascript
// tests/contract/databricksJobsApi.test.js
import { describe, it, expect, vi } from 'vitest';
import { DatabricksJobsClient } from '../../src/services/databricksApi';

describe('DatabricksJobsClient', () => {
  it('should submit job with correct payload format', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ run_id: 12345 }),
    });
    global.fetch = mockFetch;

    const client = new DatabricksJobsClient('https://example.com', () => 'token');
    const config = { num_households: 10000 };
    const runId = await client.submitJob(config);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/2.0/jobs/run-now',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: expect.any(Number), notebook_params: { config: JSON.stringify(config) } }),
      })
    );
    expect(runId).toBe(12345);
  });
});
```

### References
- Vitest Documentation: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/

---

## 9. Databricks Apps Deployment Manifest

### Decision
Create **databricks-app.yml** manifest for Databricks Apps platform deployment.

### Rationale
- Databricks Apps requires YAML manifest for deployment configuration
- Defines app metadata, resources, environment variables, and entrypoint
- Allows declarative configuration of workspace integration (OAuth, catalog access)
- Supports versioning and rollback via manifest updates

### Manifest Structure (databricks-app.yml)
```yaml
name: synthetic-data-generator-react
display_name: Synthetic Identity Graph Generator (React)
description: React-based web application for configuring and generating synthetic identity graph datasets

# Application type (static site for React SPA)
type: static

# Build configuration
build:
  source_dir: react-app
  build_command: npm install && npm run build
  output_dir: react-app/dist

# Runtime configuration
runtime:
  # Static file serving (no backend process)
  port: 8080
  health_check_path: /

# Environment variables (injected at runtime)
env:
  DATABRICKS_HOST: https://e2-demo-field-eng.cloud.databricks.com
  DATABRICKS_CATALOG: bryan_li
  FEATURE_001_JOB_ID: 123456789 # Replace with actual job ID from Feature 001

# OAuth configuration
oauth:
  enabled: true
  scopes:
    - jobs:read
    - jobs:write
    - catalogs:read

# Resource requirements (minimal for static frontend)
resources:
  memory: 512Mi
  cpu: 0.5

# Permissions (Unity Catalog access)
permissions:
  - catalog: bryan_li
    schema: "*"
    privileges: [SELECT, CREATE_TABLE, MODIFY]
```

### Deployment Process
1. **Build**: `databricks apps build` (runs `npm run build`, packages dist/ directory)
2. **Deploy**: `databricks apps deploy` (uploads assets to Databricks Apps, starts serving)
3. **Access**: `https://e2-demo-field-eng.cloud.databricks.com/apps/synthetic-data-generator-react`

### References
- Databricks Apps Documentation: https://docs.databricks.com/en/dev-tools/databricks-apps/index.html

---

## Summary of Resolutions

| Technical Context Item | Resolution | Research Section |
|------------------------|-----------|------------------|
| Language/Version | JavaScript ES6+ (React 18.x, Node.js 18+) | §7 Vite Build Tool |
| Primary Dependencies | React, MUI v5, React Router, Databricks SDK (custom), Vite | §1 MUI v5, §3 Jobs API, §7 Vite |
| Storage | localStorage (UI config), Unity Catalog (datasets) | §4 localStorage Best Practices |
| Testing | Vitest (unit), React Testing Library (component), Playwright (E2E) | §8 Vitest + RTL |
| Target Platform | Modern browsers, Databricks Apps platform | §9 Databricks Apps Deployment |
| Performance Goals | <100ms metric calculations, <200ms UI transitions, 5s polling | §5 Client-Side Calculations |
| Constraints | OAuth 2.0 auth, token expiration, no custom backend | §2 OAuth 2.0 Integration, §3 Jobs API |
| Scale/Scope | 10 concurrent users, 59 FRs, 10M household support, ~15 components | All sections |

**Status**: ✅ All NEEDS CLARIFICATION items resolved. Ready for Phase 1 (Design & Contracts).

---

**Next Phase**: Phase 1 - Data Model, API Contracts, and Quickstart Design
