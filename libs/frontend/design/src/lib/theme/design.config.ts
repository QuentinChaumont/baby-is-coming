import { DesignConfig } from './theme.types';

/**
 * Brand charter « Brocante en savane » (piste A, `DESIGN.md`).
 *
 * Mirror any change in `_tokens.scss` (same folder): the SCSS is what the
 * browser reads. The site is light only (PRODUCT D18), so `darkColors`
 * repeats the light palette — it exists only because the shared
 * `DesignConfig` shape requires it.
 */
const colors = {
  primary: '#22301f',
  onPrimary: '#fbf7ee',
  secondary: '#f3de9a',
  onSecondary: '#22301f',
  error: '#a4442a',
  onError: '#ffffff',
  background: '#fbf7ee',
  surface: '#ffffff',
  onSurface: '#22301f',
  surfaceVariant: '#f1eadb',
  outline: '#6f7d69',
};

export const designConfig: DesignConfig = {
  colors,
  darkColors: colors,
  radius: {
    sm: '4px',
    md: '10px',
    lg: '12px',
    pill: '999px',
  },
  density: 0,
  typography: {
    fontFamily: "'Nunito Variable', 'Nunito', 'Helvetica Neue', Arial, sans-serif",
  },
};
