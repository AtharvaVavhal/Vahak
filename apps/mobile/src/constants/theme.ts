import { Platform } from 'react-native';

/**
 * Vahak design tokens. Values match the design-system blueprint exactly.
 * `background` = canvas (page bg), `surface` = white (card bg) — intentionally
 * inverted from a "white screen, gray card" layout to "gray canvas, white cards".
 */
export const colors = {
  primary: '#1E3A8A',
  primaryHover: '#152B66',
  primaryTint: '#EAF0FD',
  onPrimary: '#FFFFFF',

  ink900: '#0B1220',
  ink700: '#33415C',
  ink500: '#64748B',
  ink300: '#CBD5E1',
  ink150: '#E7EAF0',

  background: '#F4F6FA',
  surface: '#FFFFFF',

  text: '#0B1220',
  textSecondary: '#33415C',
  textMuted: '#64748B',
  border: '#E7EAF0',

  success: '#15803D',
  successTint: '#DCFCE7',
  warning: '#B45309',
  warningTint: '#FEF3C7',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  verify: '#6D28D9',
  verifyTint: '#EDE4FB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** Blueprint's "2xl" — reserved for PIN reveal / confirmation screens. */
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

const monoFontFamily = Platform.select({ ios: 'Courier', android: 'monospace' });

export const typography = {
  size: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
  },
  weight: {
    regular: '400',
    medium: '600',
    bold: '700',
    heavy: '800',
  },
  monoFontFamily,
  /** Named semantic text styles per the design blueprint's type scale. */
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyEmphasis: { fontSize: 15, lineHeight: 21, fontWeight: '500' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  code: { fontSize: 15, fontWeight: '600' as const, fontFamily: monoFontFamily },
  codeEmphasis: { fontSize: 20, fontWeight: '700' as const, fontFamily: monoFontFamily },
  codePin: { fontSize: 32, fontWeight: '800' as const, fontFamily: monoFontFamily, letterSpacing: 6 },
} as const;

/** Default surfaces get no shadow — only overlays (bottom sheets, modals) use this. */
export const elevation = {
  overlay: {
    elevation: 6,
    shadowColor: '#0B1220',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
} as const;
