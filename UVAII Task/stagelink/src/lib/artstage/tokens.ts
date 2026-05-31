export const tokens = {
  colors: {
    background: '#FAF9F6',
    surface: '#FFFFFF',
    border: '#E8E5DE',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    accent: '#a9000f',
    verified: '#1D9E75',
    live: '#C8312A',
  },
  fonts: {
    ui: 'Inter, system-ui, sans-serif',
    display: 'Newsreader, Georgia, serif',
  },
  radius: {
    card: '8px',
    input: '6px',
    pill: '9999px',
  },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64] as const,
} as const;

export type TokenColors = typeof tokens.colors;
