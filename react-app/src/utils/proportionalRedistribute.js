// Proportional redistribution algorithm for auto-adjusting sliders
// Implements research.md §6 Proportional Redistribution Algorithm
// Algorithm validated in Feature 001 Streamlit implementation

/**
 * Redistributes distribution values proportionally when one value changes
 * Ensures sum = 1.0 for distribution sliders (FR-010, FR-013, FR-015, FR-022)
 *
 * @param {Array<string>} categories - All category names (e.g., ['< $30K', '$30K - $60K', ...])
 * @param {string} changedCategory - The category that changed
 * @param {number} newValue - New value for the changed category (0-1)
 * @param {Object} previousValues - Previous values for all categories
 * @returns {Object} New distribution values with sum = 1.0
 */
export function redistributeProportionally(categories, changedCategory, newValue, previousValues) {
  // Other categories (not the one that changed)
  const otherCategories = categories.filter((c) => c !== changedCategory);

  // Calculate previous total of other categories
  const oldTotalOthers = otherCategories.reduce(
    (sum, category) => sum + (previousValues[category] || 0),
    0
  );

  // Calculate new total needed for other categories (1.0 - changed value)
  const newTotalOthers = 1.0 - newValue;

  // Initialize result with the changed category
  const newValues = { [changedCategory]: newValue };

  // Edge case: if newTotalOthers is negative or zero, distribute evenly
  if (newTotalOthers <= 0 || oldTotalOthers <= 0) {
    const evenDistribution = Math.max(0, newTotalOthers) / otherCategories.length;
    otherCategories.forEach((category) => {
      newValues[category] = Math.round(evenDistribution * 100) / 100;
    });
  } else {
    // Proportional redistribution: maintain ratios among other categories
    otherCategories.forEach((category) => {
      const oldValue = previousValues[category] || 0;
      const proportion = oldValue / oldTotalOthers;
      newValues[category] = Math.round(newTotalOthers * proportion * 100) / 100; // Round to 2 decimals
    });
  }

  // Correct rounding errors to ensure exact sum = 1.0
  const actualSum = Object.values(newValues).reduce((sum, val) => sum + val, 0);
  const correction = 1.0 - actualSum;

  // Apply correction to the first "other" category if needed (small rounding error)
  if (Math.abs(correction) > 0.001 && otherCategories.length > 0) {
    newValues[otherCategories[0]] = Math.round((newValues[otherCategories[0]] + correction) * 100) / 100;
  }

  return newValues;
}

/**
 * Validate that distribution values sum to 1.0 (within tolerance)
 * @param {Object} distribution - Distribution object (e.g., {category1: 0.5, category2: 0.5})
 * @param {number} tolerance - Acceptable deviation from 1.0 (default: 0.01)
 * @returns {boolean} True if sum is valid
 */
export function validateDistributionSum(distribution, tolerance = 0.01) {
  const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
  return sum >= 1.0 - tolerance && sum <= 1.0 + tolerance;
}

/**
 * Get the sum of distribution values
 * @param {Object} distribution - Distribution object
 * @returns {number} Sum of all values
 */
export function getDistributionSum(distribution) {
  return Object.values(distribution).reduce((acc, val) => acc + val, 0);
}
