// src/theme.ts
import type { PaletteMode, ThemeOptions } from '@mui/material';
import { blue, grey, pink } from '@mui/material/colors';

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
          // Qorong'u rejim uchun palitra
          primary: {
            main: blue[300], // Asosiy rang - och ko'k
            light: blue[100],
            dark: blue[400],
          },
          secondary: {
            main: pink[400],
          },
          background: {
            default: '#121828', // Orqa fon - juda to'q ko'k-qora
            paper: '#1a223f', // Qog'oz (kartalar) foni - to'q ko'k
          },
          text: {
            primary: '#e3e3e3',
            secondary: grey[500],
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
    borderRadius: 12, // Barcha burchaklarni yumaloqroq qilamiz
  },
  components: {
    // Tugma (Button) uchun yangi standart stillar
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 22px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Yumshoq soya
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)', // Hover effekti uchun soya
          },
        },
      },
      defaultProps: {
        disableElevation: true, // MUI ning standart soyasini o'chiramiz
      },
    },
    // Karta (Card) va Qog'oz (Paper) uchun yangi stillar
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // MUI ning standart gradientini o'chiramiz
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', // Chiroyliroq standart soya
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Hover uchun kuchliroq soya
          },
        },
      },
    },
    // Kiritish maydoni (TextField) uchun
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px', // Fokus bo'lganda ramka qalinligi
          },
        },
      },
    },
  },
});
