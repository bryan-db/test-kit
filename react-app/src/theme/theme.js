import { createTheme } from '@mui/material/styles';
import { MD3_COLORS, MD3_TYPOGRAPHY, MD3_ELEVATION, MD3_SHAPE } from './constants';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: MD3_COLORS.primary.main,
      light: MD3_COLORS.primary.light,
      dark: MD3_COLORS.primary.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: MD3_COLORS.secondary.main,
      light: MD3_COLORS.secondary.light,
      dark: MD3_COLORS.secondary.dark,
      contrastText: '#FFFFFF',
    },
    error: {
      main: MD3_COLORS.error.main,
      light: MD3_COLORS.error.light,
      dark: MD3_COLORS.error.dark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: MD3_COLORS.background,
      paper: '#FFFFFF',
    },
    text: {
      primary: MD3_COLORS.onSurface,
      secondary: MD3_COLORS.onBackground,
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: MD3_TYPOGRAPHY.displayLarge,
    h2: MD3_TYPOGRAPHY.displayMedium,
    h3: MD3_TYPOGRAPHY.displaySmall,
    h4: MD3_TYPOGRAPHY.headlineLarge,
    h5: MD3_TYPOGRAPHY.headlineMedium,
    h6: MD3_TYPOGRAPHY.headlineSmall,
    subtitle1: MD3_TYPOGRAPHY.titleLarge,
    subtitle2: MD3_TYPOGRAPHY.titleMedium,
    body1: MD3_TYPOGRAPHY.bodyLarge,
    body2: MD3_TYPOGRAPHY.bodyMedium,
    caption: MD3_TYPOGRAPHY.bodySmall,
    button: MD3_TYPOGRAPHY.labelLarge,
    overline: MD3_TYPOGRAPHY.labelSmall,
  },
  shape: {
    borderRadius: MD3_SHAPE.medium,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.full,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.extraLarge,
          boxShadow: MD3_ELEVATION.level1,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.large,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: MD3_SHAPE.medium,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: MD3_COLORS.primary.main,
          height: 4,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px rgba(103, 80, 164, 0.16)`,
            },
          },
          '& .MuiSlider-track': {
            border: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: MD3_SHAPE.medium,
        },
      },
    },
  },
});

export default theme;
