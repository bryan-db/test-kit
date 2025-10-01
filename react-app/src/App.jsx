import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { HouseholdConfig } from './components/wizard/HouseholdConfig';
import { useConfigPersistence } from './hooks/useConfigPersistence';
import { updateConfigSection } from './services/configService';

function App() {
  const { config, updateConfig, resetConfig, loading } = useConfigPersistence();
  const [showTitleInAppBar, setShowTitleInAppBar] = useState(false);
  const titleRef = useRef(null);

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

  // Scroll detection to show title in AppBar
  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const rect = titleRef.current.getBoundingClientRect();
        // Show title in AppBar when page title scrolls out of view
        setShowTitleInAppBar(rect.bottom < 80);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* App Bar - Sticky with animated title */}
      <AppBar position="sticky" elevation={0} sx={{ top: 0, borderRadius: 0 }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              opacity: showTitleInAppBar ? 1 : 0,
              transform: showTitleInAppBar ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Synthetic Data Configuration
          </Typography>
          <Button color="inherit" onClick={handleStartFresh}>
            Start Fresh
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box ref={titleRef} sx={{ mb: 4, textAlign: 'center' }}>
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
