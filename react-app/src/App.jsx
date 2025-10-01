import React, { useCallback } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { HouseholdConfig } from './components/wizard/HouseholdConfig';
import { useConfigPersistence } from './hooks/useConfigPersistence';
import { updateConfigSection } from './services/configService';

function App() {
  const { config, updateConfig, resetConfig, loading } = useConfigPersistence();

  // Handle household configuration updates
  const handleHouseholdUpdate = useCallback(
    (updates) => {
      updateConfig((prevConfig) => updateConfigSection(prevConfig, 'household', updates));
    },
    [updateConfig]
  );

  // Handle "Start Fresh" button
  const handleStartFresh = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all configuration to defaults?')) {
      resetConfig();
    }
  }, [resetConfig]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Synthetic Identity Graph Generator
          </Typography>
          <Button color="inherit" onClick={handleStartFresh}>
            Start Fresh
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Synthetic Data Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure household parameters and distribution settings
          </Typography>
        </Box>

        {/* Household Configuration Component */}
        <HouseholdConfig config={config?.config} onUpdate={handleHouseholdUpdate} />

        {/* Debug Info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
            Last Modified: {config?.lastModified}
            <br />
            Config saved to localStorage automatically
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default App;
