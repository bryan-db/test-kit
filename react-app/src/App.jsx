import React, { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Container, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { HouseholdConfig } from './components/wizard/HouseholdConfig';
import { DemographicsConfig } from './components/wizard/DemographicsConfig';
import { EngagementConfig } from './components/wizard/EngagementConfig';
import { CampaignConfig } from './components/wizard/CampaignConfig';
import { ReviewSubmit } from './components/wizard/ReviewSubmit';
import { ProgressIndicator } from './components/common/ProgressIndicator';
import { JobMonitor } from './pages/JobMonitor';
import { useConfigPersistence } from './hooks/useConfigPersistence';
import { updateConfigSection } from './services/configService';
import { AuthProvider } from './services/authService.jsx';
import theme from './theme/theme';

// Feature 004: Analytics Dashboards
import Navigation from './components/shared/Navigation';
import CampaignPerformance from './components/dashboards/CampaignPerformance';
import DataOverview from './components/dashboards/DataOverview';
import AudienceInsights from './components/dashboards/AudienceInsights';
import ContentEngagement from './components/dashboards/ContentEngagement';
import AttributionAnalysis from './components/dashboards/AttributionAnalysis';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

  // Handle job submission - navigate to job monitor
  const handleJobSubmitted = useCallback((runId) => {
    console.log('Job submitted with run ID:', runId);
    navigate(`/job/${runId}`);
  }, [navigate]);

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
              onJobSubmitted={handleJobSubmitted}
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
 * Dashboard Layout Component with Navigation
 */
function DashboardLayout({ children }) {
  return (
    <>
      <Navigation />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {children}
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

  // Create QueryClient for TanStack Query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={basename}>
            <Routes>
              {/* Wizard Routes */}
              <Route path="/wizard/:step" element={<WizardRouter />} />
              <Route path="/job/:runId" element={<JobMonitor />} />

              {/* Dashboard Routes */}
              <Route path="/dashboards/overview" element={
                <DashboardLayout>
                  <DataOverview />
                </DashboardLayout>
              } />
              <Route path="/dashboards/campaigns" element={
                <DashboardLayout>
                  <CampaignPerformance />
                </DashboardLayout>
              } />
              <Route path="/dashboards/audience" element={
                <DashboardLayout>
                  <AudienceInsights />
                </DashboardLayout>
              } />
              <Route path="/dashboards/content" element={
                <DashboardLayout>
                  <ContentEngagement />
                </DashboardLayout>
              } />
              <Route path="/dashboards/attribution" element={
                <DashboardLayout>
                  <AttributionAnalysis />
                </DashboardLayout>
              } />

              {/* Root - redirect to data overview */}
              <Route path="/" element={<Navigate to="/dashboards/overview" replace />} />
              <Route path="*" element={<Navigate to="/dashboards/overview" replace />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
