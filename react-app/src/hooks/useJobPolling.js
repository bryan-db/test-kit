import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateProgress, estimateTimeRemaining } from '../services/jobMonitor';
import { useAuth } from '../services/authService.jsx';
import { createDatabricksClient } from '../services/databricksApi';

/**
 * Custom hook for polling Databricks job status
 * Implements FR-030 (real-time job monitoring) with 5-second polling interval
 *
 * @param {string} jobRunId - Databricks job run ID
 * @param {Object} config - Generation configuration (for time estimation)
 * @param {Object} options - Polling options
 * @param {number} options.pollingInterval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} options.enabled - Whether to enable polling (default: true)
 * @returns {Object} Job status, progress, and control functions
 */
export function useJobPolling(jobRunId, config, options = {}) {
  const {
    pollingInterval = 5000, // 5 seconds (FR-030)
    enabled = true,
  } = options;

  const { getAccessToken } = useAuth();
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const clientRef = useRef(null);

  // Initialize Databricks API client when getAccessToken becomes available
  useEffect(() => {
    console.log('useJobPolling: getAccessToken available:', !!getAccessToken);

    if (getAccessToken && !clientRef.current) {
      console.log('Initializing Databricks API client in useJobPolling');
      clientRef.current = createDatabricksClient(getAccessToken);
      console.log('useJobPolling: clientRef initialized:', !!clientRef.current);
    }
  }, [getAccessToken]);

  /**
   * Fetch job status from Databricks API
   */
  const fetchJobStatus = useCallback(async () => {
    if (!clientRef.current) {
      console.error('Databricks API client not initialized');
      return null;
    }

    try {
      console.log('Fetching job status for run ID:', jobRunId);

      // Call real Databricks API
      const response = await clientRef.current.getJobRun(jobRunId);

      console.log('Job status response:', response);

      const status = {
        runId: response.run_id,
        jobId: response.job_id,
        lifecycleState: response.state?.life_cycle_state || 'PENDING',
        resultState: response.state?.result_state,
        stateMessage: response.state?.state_message || '',
        startTime: response.start_time,
        setupDuration: response.setup_duration,
        executionDuration: response.execution_duration,
        endTime: response.end_time,
      };

      setJobStatus(status);

      // Calculate progress based on lifecycle state
      const calculatedProgress = calculateProgress(status);
      setProgress(calculatedProgress);

      // Stop polling if job is complete
      if (['TERMINATED', 'SKIPPED', 'INTERNAL_ERROR'].includes(status.lifecycleState)) {
        stopPolling();
      }

      setError(null);
      return status;
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err.message || 'Failed to fetch job status');
      return null;
    }
  }, [jobRunId]);

  /**
   * Start polling for job status
   */
  const startPolling = useCallback(() => {
    if (!jobRunId || !enabled) return;

    setIsPolling(true);
    setStartTime(Date.now());

    // Fetch immediately
    fetchJobStatus();

    // Set up interval for polling
    intervalRef.current = setInterval(() => {
      fetchJobStatus();
    }, pollingInterval);

    // Set up timer for elapsed time tracking
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [jobRunId, enabled, pollingInterval, fetchJobStatus]);

  /**
   * Stop polling for job status
   */
  const stopPolling = useCallback(() => {
    console.log('stopPolling called');
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Manually refresh job status (outside polling interval)
   */
  const refresh = useCallback(async () => {
    if (!clientRef.current) return null;

    try {
      console.log('Manual refresh for run ID:', jobRunId);
      const response = await clientRef.current.getJobRun(jobRunId);

      const status = {
        runId: response.run_id,
        jobId: response.job_id,
        lifecycleState: response.state?.life_cycle_state || 'PENDING',
        resultState: response.state?.result_state,
        stateMessage: response.state?.state_message || '',
        startTime: response.start_time,
        setupDuration: response.setup_duration,
        executionDuration: response.execution_duration,
        endTime: response.end_time,
      };

      setJobStatus(status);
      const calculatedProgress = calculateProgress(status);
      setProgress(calculatedProgress);
      setError(null);
      return status;
    } catch (err) {
      console.error('Error refreshing job status:', err);
      setError(err.message || 'Failed to refresh job status');
      return null;
    }
  }, [jobRunId]);

  /**
   * Reset polling state
   */
  const reset = useCallback(() => {
    stopPolling();
    setJobStatus(null);
    setProgress(0);
    setError(null);
    setStartTime(null);
    setElapsedSeconds(0);
  }, [stopPolling]);

  // Auto-start polling when jobRunId changes
  useEffect(() => {
    if (!jobRunId || !enabled) return;

    console.log('Starting job polling for run ID:', jobRunId);
    setIsPolling(true);
    setStartTime(Date.now());

    // Fetch immediately
    fetchJobStatus();

    // Set up interval for polling
    intervalRef.current = setInterval(() => {
      fetchJobStatus();
    }, pollingInterval);

    // Set up timer for elapsed time tracking
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Cleanup on unmount or when jobRunId changes
    return () => {
      console.log('Cleanup: Stopping job polling for run ID:', jobRunId);
      setIsPolling(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRunId, enabled, pollingInterval]);

  // Calculate estimated time remaining
  const timeRemaining = jobStatus && config
    ? estimateTimeRemaining(jobStatus, config, elapsedSeconds)
    : null;

  // Determine if job is complete
  const isComplete = jobStatus?.lifecycleState === 'TERMINATED' &&
                     jobStatus?.resultState === 'SUCCESS';

  // Determine if job failed
  const isFailed = ['INTERNAL_ERROR'].includes(jobStatus?.lifecycleState) ||
                   (jobStatus?.lifecycleState === 'TERMINATED' &&
                    jobStatus?.resultState === 'FAILED');

  // Determine if job was cancelled
  const isCancelled = jobStatus?.lifecycleState === 'TERMINATED' &&
                      jobStatus?.resultState === 'CANCELED';

  return {
    // Status data
    jobStatus,
    progress,
    error,

    // Timing data
    elapsedSeconds,
    timeRemaining,

    // State flags
    isPolling,
    isComplete,
    isFailed,
    isCancelled,

    // Control functions
    startPolling,
    stopPolling,
    refresh,
    reset,
  };
}
