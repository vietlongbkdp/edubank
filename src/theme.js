import { createTheme } from '@mui/material/styles';

// Bảng màu EduBank: indigo → violet, trẻ trung hiện đại
export const buildTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#4F46E5' },
    secondary: { main: '#7C3AED' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: mode === 'light'
      ? { default: '#F6F7FB', paper: '#FFFFFF' }
      : { default: '#0F1222', paper: '#171A2E' }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' ? '0 4px 20px rgba(79,70,229,.07)' : '0 4px 20px rgba(0,0,0,.4)',
          transition: 'transform .18s ease, box-shadow .18s ease'
        }
      }
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } }
  }
});

export const GRADIENT = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #A855F7 100%)';
