import { createTheme } from '@mui/material/styles';
import { MD3_TYPOGRAPHY, MD3_SHAPE } from './constants';

// Modern Dark Color Palette with Gradients
const MODERN_DARK = {
  primary: '#8B5CF6',      // Purple
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#06B6D4',    // Cyan
  secondaryLight: '#22D3EE',
  accent: '#F59E0B',       // Amber
  background: {
    main: '#0F172A',       // Slate 900
    elevated: '#1E293B',   // Slate 800
    card: '#1E293B',
  },
  surface: {
    main: 'rgba(30, 41, 59, 0.8)',
    elevated: 'rgba(51, 65, 85, 0.8)',
  },
  text: {
    primary: '#F1F5F9',    // Slate 100
    secondary: '#CBD5E1',  // Slate 300
    tertiary: '#94A3B8',   // Slate 400
  },
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: MODERN_DARK.primary,
      light: MODERN_DARK.primaryLight,
      dark: MODERN_DARK.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: MODERN_DARK.secondary,
      light: MODERN_DARK.secondaryLight,
      dark: '#0E7490',
      contrastText: '#FFFFFF',
    },
    background: {
      default: MODERN_DARK.background.main,
      paper: MODERN_DARK.background.card,
    },
    text: {
      primary: MODERN_DARK.text.primary,
      secondary: MODERN_DARK.text.secondary,
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { ...MD3_TYPOGRAPHY.displayLarge, fontWeight: 700 },
    h2: { ...MD3_TYPOGRAPHY.displayMedium, fontWeight: 700 },
    h3: { ...MD3_TYPOGRAPHY.displaySmall, fontWeight: 700 },
    h4: { ...MD3_TYPOGRAPHY.headlineLarge, fontWeight: 600 },
    h5: { ...MD3_TYPOGRAPHY.headlineMedium, fontWeight: 600 },
    h6: { ...MD3_TYPOGRAPHY.headlineSmall, fontWeight: 600 },
    subtitle1: MD3_TYPOGRAPHY.titleLarge,
    subtitle2: MD3_TYPOGRAPHY.titleMedium,
    body1: MD3_TYPOGRAPHY.bodyLarge,
    body2: MD3_TYPOGRAPHY.bodyMedium,
    caption: MD3_TYPOGRAPHY.bodySmall,
    button: { ...MD3_TYPOGRAPHY.labelLarge, fontWeight: 600 },
    overline: MD3_TYPOGRAPHY.labelSmall,
  },
  shape: {
    borderRadius: MD3_SHAPE.large,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        body: {
          background: `linear-gradient(-45deg, #0F172A, #1E1B4B, #312E81, #4C1D95, #5B21B6, #1E1B4B)`,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
            animation: 'float 20s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
        '#root': {
          position: 'relative',
          zIndex: 1,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.full,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${MODERN_DARK.primary} 0%, ${MODERN_DARK.primaryDark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${MODERN_DARK.primaryLight} 0%, ${MODERN_DARK.primary} 100%)`,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: MODERN_DARK.primary,
          color: MODERN_DARK.primaryLight,
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: MODERN_DARK.primaryLight,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.extraLarge,
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'fadeInUp 0.6s ease-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 25px 60px -10px rgba(139, 92, 246, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'rgba(51, 65, 85, 0.8)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.large,
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: MODERN_DARK.primary,
          height: 6,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            backgroundColor: MODERN_DARK.text.primary,
            border: `3px solid ${MODERN_DARK.background.main}`,
            boxShadow: `0 0 0 0 rgba(139, 92, 246, 0.4)`,
            transition: 'all 0.2s ease',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px rgba(139, 92, 246, 0.16)`,
            },
            '&.Mui-active': {
              boxShadow: `0 0 0 14px rgba(139, 92, 246, 0.24)`,
            },
          },
          '& .MuiSlider-track': {
            border: 'none',
            height: 6,
            background: `linear-gradient(90deg, ${MODERN_DARK.primary} 0%, ${MODERN_DARK.primaryLight} 100%)`,
            boxShadow: `0 2px 8px rgba(139, 92, 246, 0.4)`,
          },
          '& .MuiSlider-rail': {
            height: 6,
            opacity: 0.3,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
          },
          '& .MuiSlider-mark': {
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            height: 10,
            width: 2,
            '&.MuiSlider-markActive': {
              backgroundColor: MODERN_DARK.primaryLight,
              boxShadow: `0 0 6px rgba(139, 92, 246, 0.8)`,
            },
          },
          '& .MuiSlider-markLabel': {
            color: MODERN_DARK.text.secondary,
            fontSize: '0.75rem',
            fontWeight: 500,
          },
          '& .MuiSlider-valueLabel': {
            backgroundColor: MODERN_DARK.primary,
            color: '#FFFFFF',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: MD3_SHAPE.medium,
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.large,
          backdropFilter: 'blur(10px)',
          fontWeight: 500,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.5)',
          color: '#86EFAC',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          color: '#FCA5A5',
        },
        standardInfo: {
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          borderColor: 'rgba(139, 92, 246, 0.5)',
          color: MODERN_DARK.primaryLight,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h3: {
          background: `linear-gradient(135deg, #FFFFFF 0%, ${MODERN_DARK.primaryLight} 50%, ${MODERN_DARK.primary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      },
    },
  },
});

export default theme;
