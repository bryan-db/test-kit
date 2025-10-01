import { useState, useCallback, useRef, useEffect } from 'react';
import { redistributeProportionally } from '../utils/proportionalRedistribute';

/**
 * Custom hook for auto-adjusting distribution sliders
 * Implements FR-010, FR-013, FR-015, FR-022 (proportional redistribution)
 *
 * @param {Array<string>} categories - Category names (e.g., ['< $30K', '$30K - $60K', ...])
 * @param {Object} initialValues - Initial distribution values
 * @param {function} onChange - Callback when distribution changes
 * @returns {Object} { values, handleChange, getSum }
 */
export function useDistributionSlider(categories, initialValues, onChange) {
  const [values, setValues] = useState(initialValues);
  const previousValuesRef = useRef(initialValues);

  // Update previous values ref when initialValues change from external source
  useEffect(() => {
    if (JSON.stringify(initialValues) !== JSON.stringify(previousValuesRef.current)) {
      previousValuesRef.current = initialValues;
      setValues(initialValues);
    }
  }, [initialValues]);

  /**
   * Handle slider value change with auto-adjustment
   * @param {string} category - Category that changed
   * @param {number} newValue - New value (0-1)
   */
  const handleChange = useCallback(
    (category, newValue) => {
      // Detect which category changed
      const previousValues = previousValuesRef.current;

      // Redistribute proportionally
      const newValues = redistributeProportionally(categories, category, newValue, previousValues);

      // Update state
      setValues(newValues);
      previousValuesRef.current = newValues;

      // Notify parent component
      if (onChange) {
        onChange(newValues);
      }
    },
    [categories, onChange]
  );

  /**
   * Get current sum of distribution
   * @returns {number} Sum of all values
   */
  const getSum = useCallback(() => {
    return Object.values(values).reduce((sum, val) => sum + val, 0);
  }, [values]);

  /**
   * Reset to specific values (e.g., from config restore)
   * @param {Object} newValues - New distribution values
   */
  const reset = useCallback((newValues) => {
    setValues(newValues);
    previousValuesRef.current = newValues;
  }, []);

  return {
    values,
    handleChange,
    getSum,
    reset,
  };
}
