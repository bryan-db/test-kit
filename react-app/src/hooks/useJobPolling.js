import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateProgress, estimateTimeRemaining } from '../services/jobMonitor';

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

  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  /**
   * Fetch job status from Databricks API
   * This is a mock implementation - actual API call will be implemented in databricksApi.js
   */
  const fetchJobStatus = useCallback(async () => {
    try {
      // TODO: Replace with actual Databricks API call when databricksApi.js is implemented
      // const response = await getJobRun(jobRunId);

      // Mock response for development
      const mockStatus = {
        runId: jobRunId,
        lifecycleState: 'RUNNING',
        stateMessage: 'Generating synthetic data...',
        startTime: startTime || Date.now(),
        setupDuration: 15000,
        executionDuration: 30000,
      };

      setJobStatus(mockStatus);

      // Calculate progress based on lifecycle state
      const calculatedProgress = calculateProgress(mockStatus);
      setProgress(calculatedProgress);

      // Stop polling if job is complete
      if (['TERMINATED', 'SKIPPED', 'INTERNAL_ERROR'].includes(mockStatus.lifecycleState)) {
        stopPolling();
      }

      setError(null);
      return mockStatus;
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err.message || 'Failed to fetch job status');
      return null;
    }
  }, [jobRunId, startTime]);

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
  const refresh = useCallback(() => {
    return fetchJobStatus();
  }, [fetchJobStatus]);

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
    if (jobRunId && enabled) {
      startPolling();
    }

    // Cleanup on unmount or when jobRunId changes
    return () => {
      stopPolling();
    };
  }, [jobRunId, enabled, startPolling, stopPolling]);

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
