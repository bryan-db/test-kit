/**
 * Validation Service
 * Implements data-model.md §3 WizardStep Entity
 * Provides validation rules for each wizard step
 */

import { validateDistributionSum } from '../utils/proportionalRedistribute';
import { isValidRange, isValidCatalogName, isValidSchemaName, isNonEmptyArray } from '../utils/validators';

/**
 * Wizard step definitions with validation rules
 * FR-002: 5-step wizard flow
 */
export const WIZARD_STEPS = [
  {
    index: 0,
    name: 'Household',
    title: 'Household Configuration',
    path: '/wizard/household',
    description: 'Configure household count and income distribution',
  },
  {
    index: 1,
    name: 'Demographics',
    title: 'Demographics Configuration',
    path: '/wizard/demographics',
    description: 'Configure age, gender, and education distributions',
  },
  {
    index: 2,
    name: 'Engagement',
    title: 'Engagement Configuration',
    path: '/wizard/engagement',
    description: 'Configure content engagement patterns',
  },
  {
    index: 3,
    name: 'Campaign',
    title: 'Campaign Configuration',
    path: '/wizard/campaign',
    description: 'Configure marketing campaigns',
  },
  {
    index: 4,
    name: 'Review',
    title: 'Review & Submit',
    path: '/wizard/review',
    description: 'Review configuration and submit job',
  },
];

/**
 * Validate configuration for a specific step
 * @param {Object} config - Full configuration object
 * @param {number} step - Step index (0-4)
 * @returns {Array<ValidationError>} Array of validation errors
 */
export function validateConfiguration(config, step) {
  const errors = [];

  switch (step) {
    case 0: // Household
      errors.push(...validateHousehold(config.household));
      break;
    case 1: // Demographics
      errors.push(...validateDemographics(config.demographics));
      break;
    case 2: // Engagement
      errors.push(...validateEngagement(config.engagement));
      break;
    case 3: // Campaign
      errors.push(...validateCampaign(config.campaign));
      break;
    case 4: // Output/Review
      errors.push(...validateOutput(config.output));
      break;
    default:
      break;
  }

  return errors;
}

/**
 * Validate household configuration (Step 0)
 * FR-006 through FR-010
 */
function validateHousehold(household) {
  const errors = [];

  // FR-006: Number of households
  if (!household.numHouseholds || household.numHouseholds < 1000 || household.numHouseholds > 10000000) {
    errors.push({
      field: 'household.numHouseholds',
      message: 'Number of households must be between 1,000 and 10,000,000',
      severity: 'error',
    });
  }

  // FR-008: Household size parameters
  if (!household.householdSizeMean || household.householdSizeMean <= 0) {
    errors.push({
      field: 'household.householdSizeMean',
      message: 'Household size mean must be greater than 0',
      severity: 'error',
    });
  }

  if (!household.householdSizeStdDev || household.householdSizeStdDev <= 0) {
    errors.push({
      field: 'household.householdSizeStdDev',
      message: 'Household size standard deviation must be greater than 0',
      severity: 'error',
    });
  }

  // FR-009, FR-010: Income bracket distribution must sum to 1.0
  if (household.incomeBrackets && !validateDistributionSum(household.incomeBrackets)) {
    errors.push({
      field: 'household.incomeBrackets',
      message: 'Income brackets must sum to 100% (currently not equal to 1.0)',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate demographics configuration (Step 1)
 * FR-011 through FR-016
 */
function validateDemographics(demographics) {
  const errors = [];

  // FR-011, FR-045: Age range validation
  if (!demographics.ageRange || !isValidRange(demographics.ageRange.min, demographics.ageRange.max)) {
    errors.push({
      field: 'demographics.ageRange',
      message: 'Minimum age must be less than maximum age',
      severity: 'error',
    });
  }

  if (demographics.ageRange) {
    if (demographics.ageRange.min < 18 || demographics.ageRange.min > 100) {
      errors.push({
        field: 'demographics.ageRange.min',
        message: 'Minimum age must be between 18 and 100',
        severity: 'error',
      });
    }

    if (demographics.ageRange.max < 18 || demographics.ageRange.max > 100) {
      errors.push({
        field: 'demographics.ageRange.max',
        message: 'Maximum age must be between 18 and 100',
        severity: 'error',
      });
    }
  }

  // FR-012, FR-013: Gender distribution must sum to 1.0
  if (demographics.genderDistribution && !validateDistributionSum(demographics.genderDistribution)) {
    errors.push({
      field: 'demographics.genderDistribution',
      message: 'Gender distribution must sum to 100%',
      severity: 'error',
    });
  }

  // FR-014, FR-015: Education distribution must sum to 1.0
  if (demographics.educationDistribution && !validateDistributionSum(demographics.educationDistribution)) {
    errors.push({
      field: 'demographics.educationDistribution',
      message: 'Education distribution must sum to 100%',
      severity: 'error',
    });
  }

  // FR-016: Identity mappings per person
  if (!demographics.identityMappingsPerPerson || demographics.identityMappingsPerPerson < 2 || demographics.identityMappingsPerPerson > 15) {
    errors.push({
      field: 'demographics.identityMappingsPerPerson',
      message: 'Identity mappings per person must be between 2 and 15',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate engagement configuration (Step 2)
 * FR-017 through FR-023
 */
function validateEngagement(engagement) {
  const errors = [];

  // FR-017: Time period
  if (!engagement.timePeriodDays || engagement.timePeriodDays < 7 || engagement.timePeriodDays > 730) {
    errors.push({
      field: 'engagement.timePeriodDays',
      message: 'Time period must be between 7 and 730 days',
      severity: 'error',
    });
  }

  // FR-018: Events per person
  if (!engagement.eventsPerPerson || engagement.eventsPerPerson < 10 || engagement.eventsPerPerson > 1000) {
    errors.push({
      field: 'engagement.eventsPerPerson',
      message: 'Events per person must be between 10 and 1,000',
      severity: 'error',
    });
  }

  // FR-020: Content categories must be non-empty
  if (!engagement.contentCategories || !isNonEmptyArray(engagement.contentCategories)) {
    errors.push({
      field: 'engagement.contentCategories',
      message: 'At least one content category must be selected',
      severity: 'error',
    });
  }

  // FR-021, FR-022: Engagement type distribution must sum to 1.0
  if (engagement.engagementTypeDistribution && !validateDistributionSum(engagement.engagementTypeDistribution)) {
    errors.push({
      field: 'engagement.engagementTypeDistribution',
      message: 'Engagement type distribution must sum to 100%',
      severity: 'error',
    });
  }

  // FR-023: Temporal pattern must be valid
  const validPatterns = ['uniform', 'daily', 'weekly'];
  if (!engagement.temporalPattern || !validPatterns.includes(engagement.temporalPattern)) {
    errors.push({
      field: 'engagement.temporalPattern',
      message: 'Temporal pattern must be one of: uniform, daily, weekly',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate campaign configuration (Step 3)
 * FR-024 through FR-028
 */
function validateCampaign(campaign) {
  const errors = [];

  // FR-024: Number of campaigns
  if (!campaign.numCampaigns || campaign.numCampaigns < 1 || campaign.numCampaigns > 100) {
    errors.push({
      field: 'campaign.numCampaigns',
      message: 'Number of campaigns must be between 1 and 100',
      severity: 'error',
    });
  }

  // FR-025, FR-045: Duration range validation
  if (!campaign.durationRange || !isValidRange(campaign.durationRange.min, campaign.durationRange.max)) {
    errors.push({
      field: 'campaign.durationRange',
      message: 'Minimum duration must be less than maximum duration',
      severity: 'error',
    });
  }

  // FR-026: Channels must be non-empty
  if (!campaign.channels || !isNonEmptyArray(campaign.channels)) {
    errors.push({
      field: 'campaign.channels',
      message: 'At least one marketing channel must be selected',
      severity: 'error',
    });
  }

  // FR-027: Reach percentage
  if (!campaign.reachPercentage || campaign.reachPercentage < 0.01 || campaign.reachPercentage > 1.0) {
    errors.push({
      field: 'campaign.reachPercentage',
      message: 'Reach percentage must be between 0.01 and 1.0',
      severity: 'error',
    });
  }

  // FR-028, FR-045: Response rate range validation
  if (!campaign.responseRateRange || !isValidRange(campaign.responseRateRange.min, campaign.responseRateRange.max)) {
    errors.push({
      field: 'campaign.responseRateRange',
      message: 'Minimum response rate must be less than maximum response rate',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate output configuration (Step 4)
 * FR-032, FR-033
 */
function validateOutput(output) {
  const errors = [];

  // FR-032: Random seed (optional, but must be integer if provided)
  if (output.randomSeed !== null && output.randomSeed !== undefined && !Number.isInteger(output.randomSeed)) {
    errors.push({
      field: 'output.randomSeed',
      message: 'Random seed must be an integer or null',
      severity: 'error',
    });
  }

  // FR-033: Catalog name validation
  if (!output.catalog || !isValidCatalogName(output.catalog)) {
    errors.push({
      field: 'output.catalog',
      message: 'Catalog name must be a valid SQL identifier',
      severity: 'error',
    });
  }

  // FR-033: Schema name validation
  if (!output.schema || !isValidSchemaName(output.schema)) {
    errors.push({
      field: 'output.schema',
      message: 'Schema name must be a valid SQL identifier',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Check if a step has any validation errors
 * @param {Array<ValidationError>} errors - Validation errors
 * @returns {boolean} True if step is valid (no errors)
 */
export function isStepValid(errors) {
  return errors.filter((e) => e.severity === 'error').length === 0;
}

/**
 * Get user-friendly validation message for a field
 * @param {string} field - Field path (e.g., "household.numHouseholds")
 * @param {Array<ValidationError>} errors - Validation errors
 * @returns {string|null} Error message or null if no error
 */
export function getFieldError(field, errors) {
  const error = errors.find((e) => e.field === field && e.severity === 'error');
  return error ? error.message : null;
}

/**
 * Get all warnings for display
 * @param {Array<ValidationError>} errors - Validation errors
 * @returns {Array<ValidationError>} Warning messages
 */
export function getWarnings(errors) {
  return errors.filter((e) => e.severity === 'warning');
}
