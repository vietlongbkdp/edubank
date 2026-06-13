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
  shape: { borderRadius: 8 },
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
          borderRadius: 10,
          boxShadow: mode === 'light' ? '0 2px 10px rgba(15,18,34,.06)' : '0 2px 10px rgba(0,0,0,.35)',
          transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
          border: mode === 'light' ? '1px solid #ECECF3' : '1px solid #262A40'
        }
      }
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } } },
    // Card: bo góc nhỏ hơn + hiệu ứng hover nổi bật để phân biệt các đối tượng
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 10 } } }
  }
});

export const GRADIENT = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #A855F7 100%)';
