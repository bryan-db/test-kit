import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, AppBar, Toolbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import { JobStatusDisplay } from '../components/job/JobStatusDisplay';
import { JobErrorDisplay } from '../components/job/JobErrorDisplay';
import { useJobPolling } from '../hooks/useJobPolling';

/**
 * Job Monitor Page
 * Displays real-time job status and progress
 */
export function JobMonitor() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { jobStatus, error, isPolling } = useJobPolling(runId);

  const handleBackToWizard = () => {
    navigate('/wizard/0');
  };

  return (
    <>
      {/* App Bar */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Job Monitor</Typography>
          </Box>
          <Button
            color="inherit"
            onClick={handleBackToWizard}
            startIcon={<HomeIcon />}
          >
            Back to Wizard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Generation Job Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run ID: {runId}
          </Typography>
        </Box>

        {/* Job Status Display */}
        {jobStatus && (
          <JobStatusDisplay
            jobStatus={jobStatus}
            isPolling={isPolling}
          />
        )}

        {/* Error Display */}
        {error && <JobErrorDisplay error={error} runId={runId} />}

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBackToWizard}
            startIcon={<ArrowBackIcon />}
          >
            Back to Wizard
          </Button>
        </Box>
      </Container>
    </>
  );
}
