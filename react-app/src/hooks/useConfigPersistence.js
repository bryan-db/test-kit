import { useState, useEffect, useCallback } from 'react';
import { loadConfiguration, saveConfiguration, DEFAULT_CONFIG } from '../services/configService';

/**
 * Custom hook for configuration persistence with localStorage
 * Implements FR-005a (persist after step change), FR-005b (restore on load)
 *
 * @param {number} debounceMs - Debounce delay for saves (default: 500ms)
 * @returns {Object} { config, updateConfig, resetConfig, loading }
 */
export function useConfigPersistence(debounceMs = 500) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Load configuration on mount (FR-005b)
  useEffect(() => {
    const loaded = loadConfiguration();
    setConfig(loaded);
    setLoading(false);
  }, []);

  // Debounced save to localStorage
  const debouncedSave = useCallback(
    (newConfig) => {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for save
      const timeout = setTimeout(() => {
        const success = saveConfiguration(newConfig);
        if (!success) {
          console.warn('Failed to save configuration to localStorage');
        }
      }, debounceMs);

      setSaveTimeout(timeout);
    },
    [debounceMs, saveTimeout]
  );

  // Update configuration (triggers debounced save)
  const updateConfig = useCallback(
    (updates) => {
      setConfig((prevConfig) => {
        const newConfig = typeof updates === 'function' ? updates(prevConfig) : { ...prevConfig, ...updates };
        debouncedSave(newConfig);
        return newConfig;
      });
    },
    [debouncedSave]
  );

  // Reset to default configuration (FR-005c "Start Fresh")
  const resetConfig = useCallback(() => {
    const fresh = { ...DEFAULT_CONFIG, lastModified: new Date().toISOString() };
    setConfig(fresh);
    saveConfiguration(fresh);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    config,
    updateConfig,
    resetConfig,
    loading,
  };
}
