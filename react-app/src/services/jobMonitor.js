/**
 * Job Monitor Service
 * Implements data-model.md §2 GenerationJob Entity
 * Maps Databricks Jobs API responses and calculates job progress
 */

import { formatDuration } from '../utils/formatters';

/**
 * Map Databricks Jobs API response to GenerationJob entity
 * @param {Object} apiResponse - Databricks /jobs/runs/get API response
 * @param {Object} config - Configuration snapshot at submission time
 * @returns {Object} GenerationJob entity
 */
export function mapJobResponse(apiResponse, config) {
  const { run_id, state, start_time, end_time, run_page_url } = apiResponse;

  return {
    runId: run_id,
    jobId: apiResponse.job_id,
    status: {
      lifecycleState: state.life_cycle_state,
      resultState: state.result_state,
      stateMessage: state.state_message,
    },
    config: config,
    submittedAt: new Date(start_time).toISOString(),
    startedAt: start_time ? new Date(start_time).toISOString() : undefined,
    completedAt: end_time ? new Date(end_time).toISOString() : undefined,
    runPageUrl: run_page_url,
    outputLocation: state.result_state === 'SUCCESS' ? getOutputLocation(config) : undefined,
    error: state.result_state === 'FAILED' ? parseJobError(apiResponse) : undefined,
  };
}

/**
 * Calculate job progress percentage from lifecycle state
 * Implements data-model.md §2 Progress Calculation
 * FR-038: Display progress percentage
 * @param {Object} status - Job status object
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(status) {
  switch (status.lifecycleState) {
    case 'PENDING':
      return 0;
    case 'RUNNING':
      return 50;
    case 'TERMINATING':
      return 90;
    case 'TERMINATED':
      return 100;
    case 'SKIPPED':
      return 100;
    case 'INTERNAL_ERROR':
      return 100;
    default:
      return 0;
  }
}

/**
 * Estimate time remaining for running job
 * Implements data-model.md §2 Estimated Time Remaining
 * FR-039: Display estimated time remaining
 * @param {Object} status - Job status object
 * @param {Object} config - Job configuration
 * @param {number} elapsedSeconds - Elapsed time since job start
 * @returns {string|null} Human-readable time estimate or null
 */
export function estimateTimeRemaining(status, config, elapsedSeconds) {
  if (status.lifecycleState !== 'RUNNING') {
    return null;
  }

  // Estimate based on Feature 001 benchmarks
  const totalEstimatedSeconds = estimateGenerationSeconds(config.household.numHouseholds);
  const remainingSeconds = Math.max(0, totalEstimatedSeconds - elapsedSeconds);

  return formatDuration(remainingSeconds);
}

/**
 * Estimate total generation time in seconds based on household count
 * Heuristic from Feature 001 performance benchmarks
 * @param {number} numHouseholds - Number of households
 * @returns {number} Estimated seconds
 */
function estimateGenerationSeconds(numHouseholds) {
  if (numHouseholds < 50000) return 120; // <2 min
  if (numHouseholds < 100000) return 180; // 2-4 min (avg 3 min)
  if (numHouseholds < 500000) return 210; // 3-4 min (avg 3.5 min)
  return 270; // 4-5 min (avg 4.5 min)
}

/**
 * Calculate elapsed time since job started
 * @param {string} startedAt - ISO 8601 timestamp
 * @returns {number} Elapsed seconds
 */
export function calculateElapsedTime(startedAt) {
  if (!startedAt) return 0;
  const now = new Date();
  const start = new Date(startedAt);
  return Math.floor((now - start) / 1000);
}

/**
 * Get output location for successful job
 * @param {Object} config - Job configuration
 * @returns {string} Unity Catalog table path
 */
function getOutputLocation(config) {
  const { catalog, schema } = config.output;
  return `${catalog}.${schema}.synthetic_identity_graph`;
}

/**
 * Parse job error details from API response
 * FR-043: Display error message when job fails
 * @param {Object} apiResponse - Databricks API response
 * @returns {Object} JobError entity
 */
function parseJobError(apiResponse) {
  const { state } = apiResponse;

  return {
    errorCode: state.result_state || 'UNKNOWN_ERROR',
    errorMessage: state.state_message || 'Job failed with unknown error',
    troubleshootingSteps: getTroubleshootingSteps(state.state_message),
  };
}

/**
 * Get troubleshooting steps based on error message
 * @param {string} errorMessage - Error message from Databricks
 * @returns {Array<string>} List of troubleshooting steps
 */
function getTroubleshootingSteps(errorMessage) {
  const steps = [];

  if (!errorMessage) {
    return ['Check Databricks workspace for detailed logs', 'Verify job configuration is correct'];
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Permission errors
  if (lowerMessage.includes('permission') || lowerMessage.includes('access denied') || lowerMessage.includes('unauthorized')) {
    steps.push('Run: GRANT MODIFY ON CATALOG your_catalog TO `your_user`');
    steps.push('Run: GRANT CREATE TABLE ON SCHEMA your_catalog.your_schema TO `your_user`');
    steps.push('Verify you have SELECT and MODIFY privileges on the target catalog');
  }

  // Catalog/schema not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
    steps.push('Verify the catalog and schema names are correct');
    steps.push('Create the schema if it does not exist: CREATE SCHEMA IF NOT EXISTS catalog.schema');
    steps.push('Check catalog is accessible: SHOW CATALOGS');
  }

  // Resource errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('resource')) {
    steps.push('Try reducing the number of households');
    steps.push('Increase cluster size or timeout settings');
    steps.push('Retry the job after a few minutes');
  }

  // Configuration errors
  if (lowerMessage.includes('invalid') || lowerMessage.includes('configuration')) {
    steps.push('Review configuration values for invalid entries');
    steps.push('Verify all distribution sliders sum to 100%');
    steps.push('Check that min values are less than max values');
  }

  // Generic fallback
  if (steps.length === 0) {
    steps.push('Check Databricks workspace logs for detailed error information');
    steps.push('Verify job parameters are correct');
    steps.push('Contact support if the issue persists');
  }

  return steps;
}

/**
 * Check if job is in terminal state
 * @param {Object} status - Job status object
 * @returns {boolean} True if job is complete (success or failure)
 */
export function isJobTerminal(status) {
  return status.lifecycleState === 'TERMINATED' || status.lifecycleState === 'SKIPPED' || status.lifecycleState === 'INTERNAL_ERROR';
}

/**
 * Check if job succeeded
 * @param {Object} status - Job status object
 * @returns {boolean} True if job completed successfully
 */
export function isJobSuccessful(status) {
  return status.lifecycleState === 'TERMINATED' && status.resultState === 'SUCCESS';
}

/**
 * Check if job failed
 * @param {Object} status - Job status object
 * @returns {boolean} True if job failed
 */
export function isJobFailed(status) {
  return (
    (status.lifecycleState === 'TERMINATED' && status.resultState === 'FAILED') ||
    status.lifecycleState === 'INTERNAL_ERROR'
  );
}

/**
 * Get user-friendly status message
 * @param {Object} status - Job status object
 * @returns {string} Human-readable status message
 */
export function getStatusMessage(status) {
  const { lifecycleState, resultState, stateMessage } = status;

  if (lifecycleState === 'PENDING') {
    return 'Job is queued and waiting to start...';
  }

  if (lifecycleState === 'RUNNING') {
    return 'Generating synthetic data...';
  }

  if (lifecycleState === 'TERMINATING') {
    return 'Job is finishing up...';
  }

  if (lifecycleState === 'TERMINATED') {
    if (resultState === 'SUCCESS') {
      return 'Data generation completed successfully!';
    }
    if (resultState === 'FAILED') {
      return stateMessage || 'Job failed. See error details below.';
    }
    if (resultState === 'TIMEDOUT') {
      return 'Job timed out. Try reducing the number of households.';
    }
    if (resultState === 'CANCELED') {
      return 'Job was canceled.';
    }
  }

  if (lifecycleState === 'INTERNAL_ERROR') {
    return 'An internal error occurred. Please try again.';
  }

  return stateMessage || 'Unknown job status';
}
