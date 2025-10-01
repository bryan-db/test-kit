"""
Progress tracking utilities for Databricks Jobs.

Provides functions to poll job status and display progress in Streamlit UI.
"""

import time
from typing import Dict, Any, Optional, Tuple
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.jobs import Run, RunLifeCycleState, RunResultState


class JobStatus:
    """Job status representation."""

    def __init__(
        self,
        job_id: str,
        run_id: str,
        life_cycle_state: str,
        result_state: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        execution_duration: Optional[int] = None,
        percent_complete: Optional[float] = None,
        state_message: Optional[str] = None,
    ):
        self.job_id = job_id
        self.run_id = run_id
        self.life_cycle_state = life_cycle_state
        self.result_state = result_state
        self.start_time = start_time
        self.end_time = end_time
        self.execution_duration = execution_duration
        self.percent_complete = percent_complete or 0.0
        self.state_message = state_message

    @property
    def is_running(self) -> bool:
        """Check if job is still running."""
        return self.life_cycle_state in [
            RunLifeCycleState.PENDING.value,
            RunLifeCycleState.RUNNING.value,
        ]

    @property
    def is_successful(self) -> bool:
        """Check if job completed successfully."""
        return (
            self.life_cycle_state == RunLifeCycleState.TERMINATED.value
            and self.result_state == RunResultState.SUCCESS.value
        )

    @property
    def is_failed(self) -> bool:
        """Check if job failed."""
        return (
            self.life_cycle_state == RunLifeCycleState.TERMINATED.value
            and self.result_state in [RunResultState.FAILED.value, RunResultState.TIMEDOUT.value]
        )

    @property
    def is_cancelled(self) -> bool:
        """Check if job was cancelled."""
        return (
            self.life_cycle_state == RunLifeCycleState.TERMINATED.value
            and self.result_state == RunResultState.CANCELED.value
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "job_id": self.job_id,
            "run_id": self.run_id,
            "life_cycle_state": self.life_cycle_state,
            "result_state": self.result_state,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "execution_duration": self.execution_duration,
            "percent_complete": self.percent_complete,
            "state_message": self.state_message,
        }


def poll_job_status(run_id: str) -> JobStatus:
    """Poll Databricks Jobs API for job status.

    Args:
        run_id: Databricks job run ID

    Returns:
        JobStatus object with current status

    Raises:
        Exception: If API call fails
    """
    try:
        w = WorkspaceClient()
        run: Run = w.jobs.get_run(run_id=int(run_id))

        # Extract status information
        life_cycle_state = run.state.life_cycle_state.value if run.state else "UNKNOWN"
        result_state = run.state.result_state.value if run.state and run.state.result_state else None
        state_message = run.state.state_message if run.state else None

        # Calculate percent complete (estimate based on state)
        percent_complete = 0.0
        if life_cycle_state == RunLifeCycleState.PENDING.value:
            percent_complete = 5.0
        elif life_cycle_state == RunLifeCycleState.RUNNING.value:
            # Estimate progress (we don't have exact progress from API)
            # Use execution time as proxy
            if run.start_time and run.execution_duration:
                # Assume typical job takes 5 minutes = 300000ms
                estimated_total = 300000
                actual_duration = run.execution_duration
                percent_complete = min(90.0, (actual_duration / estimated_total) * 100)
            else:
                percent_complete = 50.0  # Default mid-point
        elif life_cycle_state == RunLifeCycleState.TERMINATED.value:
            percent_complete = 100.0

        return JobStatus(
            job_id=str(run.job_id) if run.job_id else "unknown",
            run_id=str(run.run_id),
            life_cycle_state=life_cycle_state,
            result_state=result_state,
            start_time=run.start_time,
            end_time=run.end_time,
            execution_duration=run.execution_duration,
            percent_complete=percent_complete,
            state_message=state_message,
        )

    except Exception as e:
        raise Exception(f"Failed to poll job status: {str(e)}")


def wait_for_job_completion(
    run_id: str,
    poll_interval_seconds: int = 5,
    timeout_seconds: Optional[int] = None,
    progress_callback: Optional[callable] = None,
) -> Tuple[JobStatus, bool]:
    """Wait for job to complete, polling at intervals.

    Args:
        run_id: Databricks job run ID
        poll_interval_seconds: Seconds between status polls (default 5)
        timeout_seconds: Maximum wait time in seconds (None = no timeout)
        progress_callback: Optional callback function(JobStatus) called on each poll

    Returns:
        Tuple of (final JobStatus, success boolean)

    Raises:
        TimeoutError: If timeout is reached
        Exception: If API call fails
    """
    start_time = time.time()

    while True:
        status = poll_job_status(run_id)

        # Call progress callback if provided
        if progress_callback:
            progress_callback(status)

        # Check if job is complete
        if not status.is_running:
            return status, status.is_successful

        # Check timeout
        if timeout_seconds:
            elapsed = time.time() - start_time
            if elapsed > timeout_seconds:
                raise TimeoutError(
                    f"Job did not complete within {timeout_seconds} seconds. "
                    f"Current state: {status.life_cycle_state}"
                )

        # Wait before next poll
        time.sleep(poll_interval_seconds)


def format_duration(milliseconds: Optional[int]) -> str:
    """Format duration in milliseconds to human-readable string.

    Args:
        milliseconds: Duration in milliseconds

    Returns:
        Formatted string (e.g., "2m 30s")
    """
    if milliseconds is None:
        return "N/A"

    seconds = milliseconds // 1000
    minutes = seconds // 60
    remaining_seconds = seconds % 60

    if minutes > 0:
        return f"{minutes}m {remaining_seconds}s"
    else:
        return f"{remaining_seconds}s"


def get_job_url(workspace_url: str, run_id: str) -> str:
    """Generate Databricks workspace URL for job run.

    Args:
        workspace_url: Workspace URL (e.g., "https://example.cloud.databricks.com")
        run_id: Job run ID

    Returns:
        Full URL to job run page
    """
    return f"{workspace_url}/#job/{run_id}"


def format_status_message(status: JobStatus) -> str:
    """Format status message for UI display.

    Args:
        status: JobStatus object

    Returns:
        Formatted status message
    """
    if status.is_running:
        if status.life_cycle_state == RunLifeCycleState.PENDING.value:
            return "⏳ Job is pending (waiting for cluster)..."
        else:
            return f"🔄 Job is running ({status.percent_complete:.0f}% complete)..."
    elif status.is_successful:
        duration_str = format_duration(status.execution_duration)
        return f"✅ Job completed successfully in {duration_str}"
    elif status.is_failed:
        return f"❌ Job failed: {status.state_message or 'Unknown error'}"
    elif status.is_cancelled:
        return "⚠️ Job was cancelled"
    else:
        return f"Unknown status: {status.life_cycle_state}"
