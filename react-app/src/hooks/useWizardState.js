/**
 * useWizardState Hook
 * Manages wizard navigation, step completion, and validation
 * Implements FR-002 (5-step wizard), FR-003 (back navigation), FR-004 (next with validation)
 */

import { useState, useCallback, useMemo } from 'react';
import { validateConfiguration, isStepValid, WIZARD_STEPS } from '../services/validationService';

/**
 * Custom hook for managing wizard state and navigation
 * @param {Object} config - Current configuration object
 * @param {Function} onStepChange - Callback when step changes
 * @returns {Object} Wizard state and navigation functions
 */
export function useWizardState(config, onStepChange) {
  const [currentStep, setCurrentStep] = useState(config?.currentStep || 0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Total number of steps
  const totalSteps = WIZARD_STEPS.length;

  // Current step metadata
  const currentStepInfo = useMemo(() => {
    return WIZARD_STEPS[currentStep] || WIZARD_STEPS[0];
  }, [currentStep]);

  /**
   * Validate current step configuration
   * @returns {boolean} True if current step is valid
   */
  const validateCurrentStep = useCallback(() => {
    if (!config?.config) {
      return false;
    }

    const errors = validateConfiguration(config.config, currentStep);
    setValidationErrors(errors);
    return isStepValid(errors);
  }, [config, currentStep]);

  /**
   * Navigate to next step (FR-004: validate before navigation)
   */
  const goNext = useCallback(() => {
    // Validate current step before allowing navigation
    const isValid = validateCurrentStep();

    if (!isValid) {
      // Validation errors are already set by validateCurrentStep
      return false;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    // Navigate to next step
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setValidationErrors([]); // Clear errors for new step

      // Notify parent component of step change
      if (onStepChange) {
        onStepChange(nextStep);
      }

      return true;
    }

    return false;
  }, [currentStep, totalSteps, validateCurrentStep, onStepChange]);

  /**
   * Navigate to previous step (FR-003: back navigation without validation)
   */
  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setValidationErrors([]); // Clear errors when going back

      // Notify parent component of step change
      if (onStepChange) {
        onStepChange(prevStep);
      }

      return true;
    }

    return false;
  }, [currentStep, onStepChange]);

  /**
   * Jump to a specific step (only if step has been completed)
   * @param {number} step - Target step index
   */
  const jumpToStep = useCallback(
    (step) => {
      // Can only jump to completed steps or the next uncompleted step
      if (step < 0 || step >= totalSteps) {
        return false;
      }

      // Allow jumping to any previous step or the current step
      if (step <= currentStep || completedSteps.has(step)) {
        setCurrentStep(step);
        setValidationErrors([]); // Clear errors when jumping

        // Notify parent component of step change
        if (onStepChange) {
          onStepChange(step);
        }

        return true;
      }

      return false;
    },
    [currentStep, totalSteps, completedSteps, onStepChange]
  );

  /**
   * Reset wizard to first step
   */
  const reset = useCallback(() => {
    setCurrentStep(0);
    setValidationErrors([]);
    setCompletedSteps(new Set());

    if (onStepChange) {
      onStepChange(0);
    }
  }, [onStepChange]);

  /**
   * Check if a specific step has been completed
   * @param {number} step - Step index to check
   * @returns {boolean} True if step is completed
   */
  const isStepCompleted = useCallback(
    (step) => {
      return completedSteps.has(step);
    },
    [completedSteps]
  );

  /**
   * Check if wizard is on first step
   */
  const isFirstStep = useMemo(() => {
    return currentStep === 0;
  }, [currentStep]);

  /**
   * Check if wizard is on last step
   */
  const isLastStep = useMemo(() => {
    return currentStep === totalSteps - 1;
  }, [currentStep, totalSteps]);

  /**
   * Get progress percentage (0-100)
   */
  const progress = useMemo(() => {
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  /**
   * Check if current step has validation errors
   */
  const hasErrors = useMemo(() => {
    return validationErrors.some((error) => error.severity === 'error');
  }, [validationErrors]);

  /**
   * Get warnings (non-blocking validation messages)
   */
  const warnings = useMemo(() => {
    return validationErrors.filter((error) => error.severity === 'warning');
  }, [validationErrors]);

  return {
    // Current state
    currentStep,
    currentStepInfo,
    validationErrors,
    completedSteps: Array.from(completedSteps),
    progress,

    // Navigation functions
    goNext,
    goPrevious,
    jumpToStep,
    reset,

    // Validation
    validateCurrentStep,
    hasErrors,
    warnings,

    // Helper booleans
    isFirstStep,
    isLastStep,
    isStepCompleted,

    // Step metadata
    totalSteps,
    steps: WIZARD_STEPS,
  };
}
