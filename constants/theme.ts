export const theme = {
  colors: {
    background: '#0D0D0D',
    foreground: '#ffffff',
    card: '#1A1A1A',
    'card-foreground': '#ffffff',
    popover: '#1A1A1A',
    secondary: '#2a2a2a',
    muted: '#404040',
    'muted-foreground': '#a0a0a0',
    primary: '#C5FF00',
    'primary-foreground': '#000000',
    accent: '#C5FF00',
    'accent-foreground': '#000000',
    destructive: '#ff4444',
    'destructive-foreground': '#ffffff',
    border: 'rgba(255,255,255,0.1)',
    'input-background': '#1A1A1A',
    'switch-background': '#404040',
    income: '#22C55E',
    expense: '#EF4444',
    transfer: '#3B82F6',
  },
  borderRadius: {
    sm: '0.75rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px',
  },
} as const;

export const Colors = theme.colors;

export type Theme = typeof theme;