/**
 * Databricks Jobs API Client
 * Implements T014 with error handling and retry logic
 *
 * Features:
 * - Job submission, monitoring, and cancellation
 * - Automatic token refresh on 401
 * - Exponential backoff for 429 (rate limiting)
 * - Retry logic for 5xx errors
 * - 30-second timeout
 */

/**
 * Databricks Jobs API Client Class
 */
export class DatabricksJobsClient {
  /**
   * @param {function} getAccessToken - Function to get current access token
   * @param {function} onTokenRefresh - Callback when token needs refresh
   */
  constructor(getAccessToken, onTokenRefresh = null) {
    this.getAccessToken = getAccessToken;
    this.onTokenRefresh = onTokenRefresh;
    // In development, use relative URLs so Vite proxy can handle CORS
    // In production, use full Databricks host URL
    this.baseUrl = import.meta.env.DEV
      ? ''
      : (import.meta.env.VITE_DATABRICKS_HOST || 'https://e2-demo-field-eng.cloud.databricks.com');
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make authenticated API request with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @param {number} retries - Number of retries attempted
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(endpoint, options = {}, retries = 0) {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - Token expired
      if (response.status === 401) {
        if (this.onTokenRefresh && retries === 0) {
          await this.onTokenRefresh();
          return this.makeRequest(endpoint, options, retries + 1);
        }
        throw new Error('Authentication failed - please log in again');
      }

      // Handle 429 - Rate limiting with exponential backoff
      if (response.status === 429) {
        if (retries < 4) {
          const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s, 8s
          console.warn(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, options, retries + 1);
        }
        throw new Error('Rate limit exceeded - please try again later');
      }

      // Handle 5xx - Server errors with retry
      if (response.status >= 500 && retries < 3) {
        const delay = 2000; // 2 seconds
        console.warn(`Server error (${response.status}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retries + 1);
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }

      throw error;
    }
  }

  /**
   * Submit a new generation job
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Job run ID
   */
  async submitJob(config) {
    const jobId = import.meta.env.VITE_FEATURE_001_JOB_ID;

    if (!jobId) {
      throw new Error('Feature 001 Job ID not configured. Please set VITE_FEATURE_001_JOB_ID in .env file.');
    }

    const payload = {
      job_id: parseInt(jobId),
      notebook_params: {
        config: JSON.stringify(config),
      },
    };

    const response = await this.makeRequest('/api/2.0/jobs/run-now', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.run_id;
  }

  /**
   * Get job run status
   * @param {string|number} runId - Job run ID
   * @returns {Promise<Object>} Job run details
   */
  async getJobRun(runId) {
    const response = await this.makeRequest(`/api/2.0/jobs/runs/get?run_id=${runId}`, {
      method: 'GET',
    });

    return {
      runId: response.run_id,
      jobId: response.job_id,
      numberInJob: response.number_in_job,
      lifecycleState: response.state?.life_cycle_state,
      resultState: response.state?.result_state,
      stateMessage: response.state?.state_message,
      startTime: response.start_time,
      setupDuration: response.setup_duration,
      executionDuration: response.execution_duration,
      cleanupDuration: response.cleanup_duration,
      endTime: response.end_time,
      runPageUrl: response.run_page_url,
    };
  }

  /**
   * Cancel a running job
   * @param {string|number} runId - Job run ID
   * @returns {Promise<void>}
   */
  async cancelJobRun(runId) {
    await this.makeRequest('/api/2.0/jobs/runs/cancel', {
      method: 'POST',
      body: JSON.stringify({ run_id: runId }),
    });
  }

  /**
   * Get job output (for error details)
   * @param {string|number} runId - Job run ID
   * @returns {Promise<Object>} Job output
   */
  async getJobOutput(runId) {
    try {
      const response = await this.makeRequest(`/api/2.0/jobs/runs/get-output?run_id=${runId}`, {
        method: 'GET',
      });

      return {
        error: response.error,
        errorTrace: response.error_trace,
        logs: response.logs,
        metadata: response.metadata,
      };
    } catch (error) {
      console.warn('Failed to get job output:', error);
      return { error: 'Could not retrieve job output' };
    }
  }

  /**
   * List recent jobs (useful for debugging)
   * @param {number} limit - Maximum number of runs to return
   * @returns {Promise<Array>} List of job runs
   */
  async listRuns(limit = 25) {
    const response = await this.makeRequest(`/api/2.0/jobs/runs/list?limit=${limit}`, {
      method: 'GET',
    });

    return response.runs || [];
  }
}

/**
 * Create a Databricks Jobs API client instance
 * @param {function} getAccessToken - Function to get access token
 * @param {function} onTokenRefresh - Optional token refresh callback
 * @returns {DatabricksJobsClient} API client instance
 */
export function createDatabricksClient(getAccessToken, onTokenRefresh) {
  return new DatabricksJobsClient(getAccessToken, onTokenRefresh);
}
