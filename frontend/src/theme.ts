// src/theme.ts
import type { PaletteMode, ThemeOptions } from '@mui/material';
import { blue, grey, pink } from '@mui/material/colors';

// Theme augmentation to add a custom radius scale
declare module '@mui/material/styles' {
  interface CustomShape {
    radius: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  }
  interface Theme {
    customShape: CustomShape;
  }
  interface ThemeOptions {
    customShape?: Partial<CustomShape>;
  }
}

// Bu yerda biz ilovamiz uchun asosiy dizayn "token"larini (qoidalarini) aniqlaymiz.
// Bu bizga butun ilova bo'ylab bir xil ko'rinishni saqlashga yordam beradi.
export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Yorqin rejim uchun palitra
          primary: {
            main: blue[800], // Asosiy rang - to'q ko'k
            light: blue[100],
            dark: blue[900],
          },
          secondary: {
            main: pink[600], // Ikkinchi darajali rang - yorqin pushti
          },
          background: {
            default: '#f4f6f8', // Orqa fon - juda och kulrang
            paper: '#ffffff', // Qog'oz (kartalar) foni - oq
          },
          text: {
            primary: grey[900],
            secondary: grey[700],
          },
        }
      : {
          // Qorong'u rejim uchun palitra - yangilangan
          primary: {
            main: '#60a5fa', // Yorqinroq ko'k (blue-400)
            light: '#93c5fd', // Och ko'k (blue-300)
            dark: '#3b82f6', // To'q ko'k (blue-500)
          },
          secondary: {
            main: '#f472b6', // Yorqin pushti (pink-400)
            light: '#f9a8d4',
            dark: '#ec4899',
          },
          background: {
            default: '#0f172a', // To'qroq slate foni
            paper: '#1e293b', // Biroz ochroq kartalar foni
          },
          text: {
            primary: '#f1f5f9', // Aniqroq oq matn
            secondary: '#94a3b8', // Yaxshilangan ikkinchi matn
          },
          divider: 'rgba(148, 163, 184, 0.12)', // Yumshoq ajratuvchi chiziq
          action: {
            hover: 'rgba(96, 165, 250, 0.08)', // Ko'kimtir hover effekti
            selected: 'rgba(96, 165, 250, 0.16)',
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  // Komponentlarning umumiy ko'rinishini o'zgartiramiz
  shape: {
    borderRadius: 8, // Default radius (was 12)
  },
  // App bo'ylab izchil border radius uchun shaxsiy shkala (slimmer corners)
  customShape: {
    radius: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
  },
  components: {
    // Tugma (Button) uchun yangi standart stillar
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 600,
          padding: theme.spacing(1.5, 3), // 12px 24px
          borderRadius: theme.customShape.radius.sm,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 16px rgba(0,0,0,0.4)'
              : '0 6px 16px rgba(0,0,0,0.12)',
          },
        }),
      },
      defaultProps: {
        disableElevation: true, // MUI ning standart soyasini o'chiramiz
      },
    },
    // Karta (Card) va Qog'oz (Paper) uchun yangi stillar
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none', // MUI ning standart gradientini o'chiramiz
          borderRadius: theme.customShape.radius.md,
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.customShape.radius.md,
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 30px rgba(0,0,0,0.5)'
              : '0 8px 30px rgba(0,0,0,0.1)',
          },
        }),
      },
    },
    // Kiritish maydoni (TextField) uchun
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px', // Fokus bo'lganda ramka qalinligi
          },
          ...(theme.palette.mode === 'dark' && {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(96, 165, 250, 0.5)',
            },
          }),
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.customShape.radius.md,
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09))',
          }),
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          }),
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            borderRight: '1px solid rgba(148, 163, 184, 0.12)',
          }),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            '&.MuiChip-colorSuccess': {
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            },
            '&.MuiChip-colorError': {
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          }),
        }),
      },
    },
  },
});
