import type { SxProps, Theme } from '@mui/material/styles';

// Shared responsive styles to convert MUI Table into stacked cards only on very small screens (<= 420px)
export const responsiveTableSx: SxProps<Theme> = {
  '@media (max-width:420px)': {
    // Hide table head on very small screens
    '& .MuiTableHead-root': {
      display: 'none',
    },
    // Make each row act like a card
    '& .MuiTableRow-root': {
      display: 'block',
      borderBottom: '1px solid',
      borderColor: 'divider',
    },
    // Cells become key-value rows with data-label prefix
    '& .MuiTableCell-root': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.25,
      px: 2,
      py: 1.25,
      fontSize: '0.95rem',
      borderBottom: '1px solid',
      borderColor: 'divider',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      '&[data-label]::before': {
        content: 'attr(data-label)',
        fontWeight: 600,
        color: 'text.secondary',
        marginRight: 8,
      },
    },
  },
};
