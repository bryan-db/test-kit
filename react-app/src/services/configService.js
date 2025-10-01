// Configuration service with localStorage persistence
// Implements data-model.md §1 Configuration Entity

const STORAGE_KEY = 'syntheticDataGeneratorConfig_v1';
const CURRENT_VERSION = 1;

// Default configuration from data-model.md
export const DEFAULT_CONFIG = {
  version: CURRENT_VERSION,
  currentStep: 0,
  config: {
    household: {
      numHouseholds: 10000,
      householdSizeMean: 2.5,
      householdSizeStdDev: 1.2,
      incomeBrackets: {
        '< $30K': 0.2,
        '$30K - $60K': 0.25,
        '$60K - $100K': 0.3,
        '$100K - $150K': 0.15,
        '> $150K': 0.1,
      },
    },
    demographics: {
      ageRange: { min: 18, max: 80 },
      genderDistribution: {
        Male: 0.48,
        Female: 0.48,
        'Non-Binary': 0.02,
        'Prefer not to say': 0.02,
      },
      educationDistribution: {
        'High School': 0.3,
        'Some College': 0.2,
        "Bachelor's": 0.3,
        "Master's": 0.15,
        Doctorate: 0.05,
      },
      identityMappingsPerPerson: 5,
    },
    engagement: {
      timePeriodDays: 365,
      eventsPerPerson: 100,
      contentCategories: ['News', 'Sports', 'Entertainment', 'Technology', 'Lifestyle'],
      engagementTypeDistribution: {
        view: 0.5,
        click: 0.25,
        share: 0.1,
        like: 0.1,
        comment: 0.05,
      },
      temporalPattern: 'daily',
    },
    campaign: {
      numCampaigns: 10,
      durationRange: { min: 7, max: 30 },
      channels: ['Email', 'Social Media', 'Display Ads'],
      reachPercentage: 0.5,
      responseRateRange: { min: 0.01, max: 0.05 },
    },
    output: {
      randomSeed: null,
      catalog: 'bryan_li',
      schema: 'synthetic_datasets',
    },
  },
  lastModified: new Date().toISOString(),
};

/**
 * Load configuration from localStorage
 * @returns {Object} Configuration object (restored or default)
 */
export function loadConfiguration() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { ...DEFAULT_CONFIG, lastModified: new Date().toISOString() };
    }

    const parsed = JSON.parse(stored);

    // Validate version and migrate if needed
    if (parsed.version !== CURRENT_VERSION) {
      console.warn(`Config version mismatch: ${parsed.version} !== ${CURRENT_VERSION}. Using default.`);
      return { ...DEFAULT_CONFIG, lastModified: new Date().toISOString() };
    }

    // Validate structure (basic check)
    if (!parsed.config || !parsed.config.household || !parsed.config.demographics) {
      console.warn('Invalid config structure. Using default.');
      return { ...DEFAULT_CONFIG, lastModified: new Date().toISOString() };
    }

    return parsed;
  } catch (error) {
    console.error('Error loading configuration from localStorage:', error);
    return { ...DEFAULT_CONFIG, lastModified: new Date().toISOString() };
  }
}

/**
 * Save configuration to localStorage
 * @param {Object} config - Configuration object to save
 * @returns {boolean} Success status
 */
export function saveConfiguration(config) {
  try {
    const toSave = {
      ...config,
      version: CURRENT_VERSION,
      lastModified: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Unable to save configuration.');
      alert('Storage limit reached. Please clear browser data or use "Start Fresh".');
    } else if (error.name === 'SecurityError') {
      console.error('SecurityError: localStorage not available (private browsing mode?)');
      alert('Unable to save configuration. Please disable private browsing mode.');
    } else {
      console.error('Error saving configuration to localStorage:', error);
    }
    return false;
  }
}

/**
 * Clear configuration from localStorage (FR-005c "Start Fresh")
 * @returns {boolean} Success status
 */
export function clearConfiguration() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing configuration from localStorage:', error);
    return false;
  }
}

/**
 * Update a specific section of the configuration
 * @param {Object} currentConfig - Current full configuration
 * @param {string} section - Section to update (e.g., 'household', 'demographics')
 * @param {Object} updates - Updates to apply to the section
 * @returns {Object} New configuration with updates applied
 */
export function updateConfigSection(currentConfig, section, updates) {
  return {
    ...currentConfig,
    config: {
      ...currentConfig.config,
      [section]: {
        ...currentConfig.config[section],
        ...updates,
      },
    },
    lastModified: new Date().toISOString(),
  };
}

/**
 * Update current wizard step
 * @param {Object} currentConfig - Current full configuration
 * @param {number} step - New step index (0-4)
 * @returns {Object} New configuration with step updated
 */
export function updateCurrentStep(currentConfig, step) {
  return {
    ...currentConfig,
    currentStep: step,
    lastModified: new Date().toISOString(),
  };
}
