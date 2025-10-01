import React, { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Container, Box, Typography, AppBar, Toolbar, Button, ThemeProvider } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { HouseholdConfig } from './components/wizard/HouseholdConfig';
import { DemographicsConfig } from './components/wizard/DemographicsConfig';
import { EngagementConfig } from './components/wizard/EngagementConfig';
import { CampaignConfig } from './components/wizard/CampaignConfig';
import { ReviewSubmit } from './components/wizard/ReviewSubmit';
import { ProgressIndicator } from './components/common/ProgressIndicator';
import { useConfigPersistence } from './hooks/useConfigPersistence';
import { updateConfigSection } from './services/configService';
import { theme } from './theme/theme';

/**
 * Wizard Step Router Component
 * Handles routing between wizard steps with progress tracking
 */
function WizardRouter() {
  const navigate = useNavigate();
  const { step } = useParams();
  const currentStep = parseInt(step) || 0;

  const { config, updateConfig, resetConfig, loading } = useConfigPersistence();
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Generic section update handler
  const handleSectionUpdate = useCallback(
    (sectionName) => (updates) => {
      updateConfig((prevConfig) => updateConfigSection(prevConfig, sectionName, updates));
    },
    [updateConfig]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < 4) {
      navigate(`/wizard/${currentStep + 1}`);
    }
  }, [currentStep, navigate]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      navigate(`/wizard/${currentStep - 1}`);
    }
  }, [currentStep, navigate]);

  // Handle "Start Fresh" button
  const handleStartFresh = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all configuration to defaults?')) {
      resetConfig();
      setCompletedSteps(new Set());
      navigate('/wizard/0');
    }
  }, [resetConfig, navigate]);

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
      {/* App Bar - Sticky */}
      <AppBar position="sticky" elevation={0} sx={{ top: 0, borderRadius: 0 }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            <Typography variant="h6">
              Synthetic Data Configuration
            </Typography>
          </Box>
          <Button color="inherit" onClick={handleStartFresh} startIcon={<RefreshIcon />}>
            Start Fresh
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />

        {/* Wizard Step Content */}
        <Box sx={{ mt: 4 }}>
          {currentStep === 0 && (
            <HouseholdConfig
              config={config?.config}
              onUpdate={handleSectionUpdate('household')}
              onNext={handleNext}
            />
          )}
          {currentStep === 1 && (
            <DemographicsConfig
              config={config?.config}
              onUpdate={handleSectionUpdate('demographics')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && (
            <EngagementConfig
              config={config?.config}
              onUpdate={handleSectionUpdate('engagement')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <CampaignConfig
              config={config?.config}
              onUpdate={handleSectionUpdate('campaign')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <ReviewSubmit
              config={config?.config}
              onUpdate={handleSectionUpdate('output')}
              onBack={handleBack}
            />
          )}
        </Box>

        {/* Debug Info - Hidden by default, styled for dark theme */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: 2, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Typography variant="caption" component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Current Step: {currentStep} | Completed: {Array.from(completedSteps).join(', ')}
              <br />
              Last Modified: {config?.lastModified}
              <br />
              Config saved to localStorage automatically
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}

/**
 * Main App Component with Router
 */
function App() {
  const basename = process.env.NODE_ENV === 'production'
    ? '/apps/synthetic-data-generator-react'
    : '/';

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/wizard/:step" element={<WizardRouter />} />
          <Route path="/" element={<Navigate to="/wizard/0" replace />} />
          <Route path="*" element={<Navigate to="/wizard/0" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
