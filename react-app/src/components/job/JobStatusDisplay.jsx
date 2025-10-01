import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Link,
  Alert,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { formatDuration } from '../../utils/formatters';
import { useJobPolling } from '../../hooks/useJobPolling';
import { JobErrorDisplay } from './JobErrorDisplay';

/**
 * Job Status Display Component with progress bar and lifecycle states
 * Implements FR-036 through FR-042 (job monitoring UI)
 *
 * @param {Object} props
 * @param {string} props.jobRunId - Databricks job run ID
 * @param {Object} props.config - Generation configuration (for time estimation)
 * @param {string} props.workspaceUrl - Databricks workspace URL
 */
export function JobStatusDisplay({ jobRunId, config, workspaceUrl }) {
  const {
    jobStatus,
    progress,
    isPolling,
    isComplete,
    isFailed,
    isCancelled,
    elapsedSeconds,
    timeRemaining,
  } = useJobPolling(jobRunId, config);

  if (!jobStatus) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Initializing job monitoring...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Determine lifecycle state display (FR-036)
  const getLifecycleChip = () => {
    const lifecycleState = jobStatus.lifecycleState;

    if (lifecycleState === 'PENDING') {
      return (
        <Chip
          icon={<PendingIcon />}
          label="Pending"
          color="default"
          size="small"
        />
      );
    }
    if (lifecycleState === 'RUNNING') {
      return (
        <Chip
          icon={<PlayArrowIcon />}
          label="Running"
          color="primary"
          size="small"
        />
      );
    }
    if (lifecycleState === 'TERMINATED') {
      if (jobStatus.resultState === 'SUCCESS') {
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Success"
            color="success"
            size="small"
          />
        );
      }
      if (jobStatus.resultState === 'FAILED') {
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Failed"
            color="error"
            size="small"
          />
        );
      }
      if (jobStatus.resultState === 'CANCELED') {
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Cancelled"
            color="warning"
            size="small"
          />
        );
      }
    }
    return null;
  };

  // Job run workspace link (FR-041)
  // Use jobId from status if available, otherwise fall back to env var
  const jobId = jobStatus.jobId || import.meta.env.VITE_FEATURE_001_JOB_ID;
  const jobRunUrl = workspaceUrl && jobId
    ? `${workspaceUrl}/#job/${jobId}/run/${jobRunId}`
    : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Generation Job Status
          </Typography>
          {getLifecycleChip()}
        </Box>

        {/* Job state message */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {jobStatus.stateMessage || 'Processing...'}
        </Typography>

        {/* Progress bar (FR-038) */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2" color="primary" fontWeight={600}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isComplete
                  ? 'success.main'
                  : isFailed
                  ? 'error.main'
                  : 'primary.main',
              },
            }}
          />
        </Box>

        {/* Timing information */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Elapsed Time
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatDuration(elapsedSeconds)}
            </Typography>
          </Box>
          {timeRemaining && !isComplete && !isFailed && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Estimated Time Remaining (FR-039)
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {timeRemaining}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Link to Databricks workspace (FR-041) */}
        {jobRunUrl && (
          <Box sx={{ mt: 2 }}>
            <Link href={jobRunUrl} target="_blank" rel="noopener noreferrer">
              View in Databricks Workspace →
            </Link>
          </Box>
        )}

        {/* Success message with output location (FR-042) */}
        {isComplete && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✓ Generation completed successfully!
            </Typography>
            {config?.output?.catalog && config?.output?.schema && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Output location: <strong>{config.output.catalog}.{config.output.schema}</strong>
              </Typography>
            )}
          </Alert>
        )}

        {/* Cancelled message */}
        {isCancelled && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Job was cancelled
            </Typography>
          </Alert>
        )}

        {/* Task-level information */}
        {jobStatus.tasks && jobStatus.tasks.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Task Details
            </Typography>
            {jobStatus.tasks.map((task, index) => (
              <Box key={index} sx={{ mb: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {task.taskKey}
                  </Typography>
                  <Chip
                    label={`Attempt ${task.attemptNumber + 1}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {task.stateMessage && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {task.stateMessage}
                  </Typography>
                )}
                {task.setupDuration > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Setup: {Math.floor(task.setupDuration / 1000)}s | Execution: {Math.floor(task.executionDuration / 1000)}s
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Termination details for failures */}
        {isFailed && jobStatus.terminationDetails && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              {jobStatus.terminationDetails.type || 'Error'}: {jobStatus.terminationDetails.code}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {jobStatus.terminationDetails.message}
            </Typography>
          </Alert>
        )}

        {/* Error display with troubleshooting (FR-043) */}
        {isFailed && (
          <Box sx={{ mt: 2 }}>
            <JobErrorDisplay jobStatus={jobStatus} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
