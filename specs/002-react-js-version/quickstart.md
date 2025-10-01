# Quickstart Guide: React Synthetic Data Generator

**Feature**: 002-react-js-version | **Purpose**: End-to-end validation of wizard flow and job submission

## Prerequisites
- Node.js 18+ installed
- Databricks workspace access (`e2-demo-field-eng.cloud.databricks.com`)
- OAuth 2.0 client registered (client ID configured in `.env`)
- Feature 001 job ID available
- Permissions: `jobs:read`, `jobs:write`, `catalogs:read` on `bryan_li` catalog

## Setup

```bash
# Navigate to React app directory
cd react-app

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_DATABRICKS_HOST=https://e2-demo-field-eng.cloud.databricks.com
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_FEATURE_001_JOB_ID=123456789
VITE_DEFAULT_CATALOG=bryan_li
VITE_DEFAULT_SCHEMA=synthetic_datasets
EOF

# Start development server
npm run dev
```

## End-to-End Wizard Flow Test

### Step 1: Authentication (FR-056)
1. Open http://localhost:3000 in browser
2. Click "Login with Databricks"
3. **Expected**: Redirect to Databricks OAuth login
4. Enter credentials and authorize
5. **Expected**: Redirect back to app with access token stored in memory

### Step 2: Household Configuration (FR-006-FR-010)
1. View wizard progress indicator showing "Household Configuration" (step 1 of 5)
2. Adjust "Number of Households" slider to 50,000
3. **Expected**: Estimated individuals updates instantly (<100ms, NFR-001)
4. Adjust "< $30K" income bracket slider to 0.4
5. **Expected**: Other income brackets auto-adjust proportionally (sum = 1.0, FR-010)
6. Click "Next"
7. **Expected**: Configuration saved to localStorage (FR-005a), navigate to step 2

### Step 3: Demographics Configuration (FR-011-FR-016)
1. Set age range: min=25, max=65
2. Adjust "Male" gender slider to 0.6
3. **Expected**: Other gender sliders auto-adjust (sum = 1.0, FR-013)
4. Set education sliders manually
5. **Expected**: Validation error if sum ≠ 1.0 (FR-044)
6. Click "Previous"
7. **Expected**: Return to step 1 with configuration preserved (FR-003)
8. Click "Next" twice to reach step 3

### Step 4: Engagement Configuration (FR-017-FR-023)
1. Set time period: 180 days
2. Set events per person: 200
3. **Expected**: Total estimated events updates instantly (50,000 * 2.5 * 200 = 25M)
4. Select content categories: ["News", "Sports", "Technology"]
5. Adjust engagement type sliders
6. **Expected**: Auto-adjust to sum = 1.0 (FR-022)
7. Select temporal pattern: "weekly"
8. Click "Next"

### Step 5: Campaign Configuration (FR-024-FR-028)
1. Set number of campaigns: 20
2. Set duration range: min=14, max=45
3. Select channels: ["Email", "Social Media"]
4. Set reach percentage: 0.3
5. Set response rate range: min=0.02, max=0.08
6. Click "Next"

### Step 6: Review & Submit (FR-029-FR-035)
1. **Expected**: See comprehensive summary with all configured values
2. **Expected**: See estimated metrics:
   - Households: 50,000
   - Individuals: ~125,000 (50K * 2.5)
   - Total Events: ~25M
   - Generation Time: "2-4 minutes" (FR-031)
3. View auto-generated random seed (or enter custom seed)
4. Verify catalog: "bryan_li", schema: "synthetic_datasets"
5. Click "Submit Generation Job"
6. **Expected**: Permission validation passes (FR-034)
7. **Expected**: Job submission succeeds, receive run_id

### Step 7: Job Monitoring (FR-036-FR-043)
1. **Expected**: See "Job Status: PENDING" (0% progress)
2. Wait 5-10 seconds
3. **Expected**: Auto-refresh shows "Job Status: RUNNING" (50% progress, FR-037, FR-038)
4. **Expected**: Estimated time remaining: "~3 minutes" (FR-039)
5. **Expected**: UI polls every 5 seconds (FR-037)
6. **Expected**: See link to Databricks workspace job run (FR-041)
7. Wait for job completion (2-4 minutes)
8. **Expected**: "Job Status: TERMINATED - SUCCESS" (100% progress)
9. **Expected**: Success message with output location (FR-042)
   - Example: "Data written to bryan_li.synthetic_datasets.*"

### Step 8: localStorage Persistence (FR-005b)
1. Refresh browser (Ctrl+R or Cmd+R)
2. **Expected**: Wizard restores to "Review & Submit" step (step 5)
3. **Expected**: All configuration values preserved
4. Click "Start Fresh" button (FR-005c)
5. **Expected**: localStorage cleared, wizard resets to step 1 with default values

## Error Scenarios

### Invalid Configuration (FR-044-FR-048)
1. On Demographics step, set gender sliders to sum = 0.8
2. Click "Next"
3. **Expected**: Inline error message: "Gender distribution must sum to 1.0"
4. **Expected**: Cannot navigate to next step (FR-004)
5. Fix sliders (auto-adjust to sum = 1.0)
6. **Expected**: Error clears, can proceed

### Permission Denied (FR-034, FR-043)
1. Change catalog to "restricted_catalog" (catalog without write permissions)
2. Click "Submit Generation Job"
3. **Expected**: Permission validation fails before submission
4. **Expected**: Error message: "You do not have MODIFY permission on catalog 'restricted_catalog'. Run: GRANT MODIFY ON CATALOG restricted_catalog TO `user@example.com`"

### Job Failure (FR-043)
1. Submit job with invalid configuration (e.g., empty content categories)
2. **Expected**: Job submits successfully (API accepts)
3. Wait for job to fail (~30 seconds)
4. **Expected**: "Job Status: TERMINATED - FAILED"
5. **Expected**: Detailed error message in expandable section
6. **Expected**: Troubleshooting steps provided

### Token Expiration (FR-058)
1. Wait 1 hour (token expires)
2. Submit new job
3. **Expected**: 401 Unauthorized response detected
4. **Expected**: Automatic token refresh attempt
5. **Expected**: If refresh succeeds, job submission retries transparently
6. **Expected**: If refresh fails, redirect to login

### Network Failure (NFR-006)
1. Disconnect network
2. Submit job
3. **Expected**: Error message: "Unable to connect to Databricks. Please check your network connection."
4. **Expected**: "Retry" button shown
5. Reconnect network, click "Retry"
6. **Expected**: Job submission succeeds

## Performance Validation

### Metric Calculation Performance (NFR-001)
```javascript
// Add to browser console
const start = performance.now();
// Adjust numHouseholds slider
const end = performance.now();
console.log(`Calculation time: ${end - start}ms`); // Should be <100ms
```

**Expected**: All metric updates complete in <100ms

### UI State Transition Performance (Performance Goals)
1. Navigate between wizard steps
2. **Expected**: Step transition animation completes in <200ms
3. Open browser DevTools Performance tab
4. Record step navigation
5. **Expected**: Frame rate >30 FPS during animation

### Job Polling Network Traffic
1. Open browser DevTools Network tab
2. Submit job
3. **Expected**: GET /jobs/runs/get requests every 5 seconds (±500ms)
4. **Expected**: Polling stops when job terminates (FR-040)

## Data Validation (Feature 001 Integration)

After job completes successfully:

```sql
-- Verify tables created in Unity Catalog
USE CATALOG bryan_li;
USE SCHEMA synthetic_datasets;

SHOW TABLES;
-- Expected: 10 tables (households, individuals, identity_mappings, etc.)

-- Verify household count matches configuration
SELECT COUNT(*) FROM households;
-- Expected: ~50,000 (exact count may vary due to sampling)

-- Verify income distribution
SELECT income_bracket, COUNT(*) / (SELECT COUNT(*) FROM households) AS proportion
FROM households
GROUP BY income_bracket;
-- Expected: Proportions close to configured values (±5%)
```

## Acceptance Criteria

✅ **Pass Criteria**:
- All 8 wizard flow steps complete without errors
- Metrics calculate in <100ms
- Job submits successfully and completes
- localStorage persistence works across browser refresh
- Error messages are user-friendly
- Token refresh handles expiration
- Polling respects 5-second interval

❌ **Fail Criteria**:
- Wizard navigation broken
- Metrics calculation >100ms
- Job submission fails with valid configuration
- localStorage doesn't restore state
- Error messages show technical stack traces
- Token refresh fails to renew
- Polling interval inconsistent or doesn't stop

## Troubleshooting

**Issue**: OAuth redirect fails
**Solution**: Verify redirect URI matches OAuth app configuration

**Issue**: Job submission returns 404
**Solution**: Verify VITE_FEATURE_001_JOB_ID is correct

**Issue**: Permission validation fails
**Solution**: Run `GRANT MODIFY ON CATALOG bryan_li TO <user>`

**Issue**: localStorage not persisting
**Solution**: Check browser privacy settings, disable "Block third-party cookies"

---

**Estimated Completion Time**: 15-20 minutes (including 2-4 minute job execution)

**Dependencies**: Feature 001 job must be deployed and accessible
