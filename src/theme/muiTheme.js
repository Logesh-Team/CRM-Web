import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1A1A18',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#534AB7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F6F3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A18',
      secondary: '#5A5A56',
    },
    divider: '#E3E1DA',
    error: { main: '#A32D2D' },
    success: { main: '#3B6D11' },
    warning: { main: '#BA7517' },
    info: { main: '#185FA5' },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'DM Sans', sans-serif" },
    h2: { fontFamily: "'DM Sans', sans-serif" },
    h3: { fontFamily: "'DM Sans', sans-serif" },
    h4: { fontFamily: "'DM Sans', sans-serif" },
    h5: { fontFamily: "'DM Sans', sans-serif" },
    h6: { fontFamily: "'DM Sans', sans-serif" },
    body1: { fontFamily: "'DM Sans', sans-serif" },
    body2: { fontFamily: "'DM Sans', sans-serif" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: 8,
          '&.MuiButton-sizeMedium': {
            height: 40,
            padding: '0 16px',
          },
          '&.MuiButton-sizeSmall': {
            height: 32,
            padding: '0 12px',
            fontSize: 13,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#E3E1DA',
            },
            '&:hover fieldset': {
              borderColor: '#5A5A56',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E3E1DA',
          boxShadow: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: 11,
          textTransform: 'uppercase',
          color: '#5A5A56',
          letterSpacing: '0.05em',
          backgroundColor: '#F7F6F3',
          borderBottom: '1px solid #E3E1DA',
        },
        body: {
          fontSize: 13,
          color: '#1A1A18',
          borderBottom: '1px solid #F0EEE9',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F7F6F3',
            cursor: 'pointer',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E3E1DA',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Sans', sans-serif",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
        },
      },
    },
  },
});

export default muiTheme;
