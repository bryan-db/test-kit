// Client-side metrics calculator (<100ms performance requirement - NFR-001)
// Implements data-model.md §4 DatasetMetrics Entity

/**
 * Calculate all dataset metrics from configuration
 * @param {Object} config - Configuration object (household, demographics, engagement, campaign)
 * @returns {Object} Dataset metrics
 */
export function calculateMetrics(config) {
  const { household, engagement, campaign } = config;

  // Estimate total individuals (FR-007)
  const estimatedIndividuals = Math.round(
    household.numHouseholds * household.householdSizeMean
  );

  // Estimate total events (FR-019)
  const estimatedTotalEvents = Math.round(
    estimatedIndividuals * engagement.eventsPerPerson * (engagement.timePeriodDays / 365)
  );

  // Estimate generation time based on Feature 001 benchmarks (FR-031)
  const estimatedGenerationTime = estimateGenerationTime(household.numHouseholds);

  // Estimate storage size
  const estimatedStorageSize = estimateStorageSize(
    estimatedIndividuals,
    estimatedTotalEvents
  );

  // Estimate campaign exposures
  const estimatedCampaignExposures = Math.round(
    campaign.numCampaigns * estimatedIndividuals * campaign.reachPercentage
  );

  return {
    estimatedIndividuals,
    estimatedTotalEvents,
    estimatedGenerationTime,
    estimatedStorageSize,
    estimatedCampaignExposures,
  };
}

/**
 * Estimate generation time based on number of households
 * Heuristic from Feature 001 performance benchmarks
 * @param {number} numHouseholds - Number of households
 * @returns {string} Human-readable time estimate
 */
function estimateGenerationTime(numHouseholds) {
  if (numHouseholds < 50000) return '< 2 minutes';
  if (numHouseholds < 100000) return '2-4 minutes';
  if (numHouseholds < 500000) return '3-4 minutes';
  return '4-5 minutes';
}

/**
 * Estimate storage size for generated data
 * @param {number} numIndividuals - Number of individuals
 * @param {number} numEvents - Number of events
 * @returns {string} Human-readable storage size (MB/GB)
 */
function estimateStorageSize(numIndividuals, numEvents) {
  const totalRows = numIndividuals + numEvents;
  const bytesPerRow = 200; // Average row size in bytes
  const megabytes = (totalRows * bytesPerRow) / (1024 * 1024);

  if (megabytes < 1024) {
    return `${Math.round(megabytes)} MB`;
  }

  const gigabytes = megabytes / 1024;
  return `${gigabytes.toFixed(2)} GB`;
}

/**
 * Format large numbers with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 * @param {number} decimal - Decimal value (e.g., 0.5)
 * @returns {string} Formatted percentage (e.g., "50.0%")
 */
export function formatPercentage(decimal) {
  return `${(decimal * 100).toFixed(1)}%`;
}
