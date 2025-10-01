import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Job Error Display Component with troubleshooting guidance
 * Implements FR-043 (error display with troubleshooting steps)
 *
 * @param {Object} props
 * @param {Object} props.jobStatus - Job status object with error information
 * @param {function} props.onRetry - Callback to retry the job
 */
export function JobErrorDisplay({ jobStatus, onRetry }) {
  const [expanded, setExpanded] = useState(false);

  if (!jobStatus || jobStatus.resultState !== 'FAILED') {
    return null;
  }

  const errorMessage = jobStatus.stateMessage || 'An unknown error occurred';
  const errorTrace = jobStatus.errorTrace || null;

  /**
   * Get context-aware troubleshooting steps based on error message
   */
  const getTroubleshootingSteps = () => {
    const lowerMessage = errorMessage.toLowerCase();
    const steps = [];

    // Permission errors
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied') || lowerMessage.includes('access')) {
      steps.push({
        text: 'Verify you have the necessary permissions on the target catalog and schema',
      });
      steps.push({
        text: 'Run: GRANT MODIFY ON CATALOG your_catalog TO `your_user`',
      });
      steps.push({
        text: 'Run: GRANT SELECT ON CATALOG your_catalog TO `your_user`',
      });
    }

    // Catalog/schema not found
    if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
      steps.push({
        text: 'Verify the catalog and schema names are correct',
      });
      steps.push({
        text: 'Check that the catalog exists: SHOW CATALOGS',
      });
      steps.push({
        text: 'Check that the schema exists: SHOW SCHEMAS IN your_catalog',
      });
    }

    // Resource errors
    if (lowerMessage.includes('memory') || lowerMessage.includes('resource')) {
      steps.push({
        text: 'Try reducing the number of households or events per person',
      });
      steps.push({
        text: 'Increase cluster size in the job configuration',
      });
    }

    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      steps.push({
        text: 'Increase the job timeout in the job configuration',
      });
      steps.push({
        text: 'Try reducing the dataset size for faster generation',
      });
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      steps.push({
        text: 'Check your network connection',
      });
      steps.push({
        text: 'Verify the Databricks workspace is accessible',
      });
      steps.push({
        text: 'Try again in a few moments',
      });
    }

    // Generic fallback steps
    if (steps.length === 0) {
      steps.push({
        text: 'Review the detailed error trace below',
      });
      steps.push({
        text: 'Check the Databricks job logs for more information',
      });
      steps.push({
        text: 'Contact your Databricks administrator if the issue persists',
      });
    }

    return steps;
  };

  const troubleshootingSteps = getTroubleshootingSteps();

  return (
    <Card>
      <CardContent>
        {/* Error alert (FR-043) */}
        <Alert severity="error" icon={<ErrorIcon />}>
          <Typography variant="body1" fontWeight={600}>
            Generation Job Failed
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        </Alert>

        {/* Troubleshooting steps */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BuildIcon color="primary" />
            <Typography variant="h6">
              Troubleshooting Steps
            </Typography>
          </Box>

          <List>
            {troubleshootingSteps.map((step, index) => (
              <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={step.text}
                  primaryTypographyProps={{
                    variant: 'body2',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Expandable detailed error trace */}
        {errorTrace && (
          <Accordion
            expanded={expanded}
            onChange={() => setExpanded(!expanded)}
            sx={{ mt: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={600}>
                Detailed Error Trace
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflowX: 'auto',
                }}
              >
                {errorTrace}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Retry button */}
        {onRetry && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry Generation
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
