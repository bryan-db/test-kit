import React from 'react';
import { Box, Stepper, Step, StepLabel, StepIcon as MuiStepIcon } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/**
 * Progress Indicator Component with 5-step stepper
 * Implements FR-002 (5-step wizard flow visualization)
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current step index (0-4)
 * @param {Set<number>} props.completedSteps - Set of completed step indices
 */
export function ProgressIndicator({ currentStep = 0, completedSteps = new Set() }) {
  const steps = [
    { index: 0, label: 'Household' },
    { index: 1, label: 'Demographics' },
    { index: 2, label: 'Engagement' },
    { index: 3, label: 'Campaign' },
    { index: 4, label: 'Review' },
  ];

  /**
   * Custom step icon to show visual states
   * - Completed: green checkmark
   * - Current: highlighted primary color circle
   * - Pending: gray outline circle
   */
  const CustomStepIcon = ({ active, completed, icon }) => {
    if (completed) {
      return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />;
    }
    if (active) {
      return (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {icon}
        </Box>
      );
    }
    return <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 28 }} />;
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={currentStep} alternativeLabel>
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.index);
          const isActive = currentStep === step.index;

          return (
            <Step key={step.index} completed={isCompleted}>
              <StepLabel
                StepIconComponent={CustomStepIcon}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: isActive
                      ? 'primary.main'
                      : isCompleted
                      ? 'text.primary'
                      : 'text.disabled',
                    fontWeight: isActive ? 600 : 400,
                  },
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
