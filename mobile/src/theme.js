import { Platform } from 'react-native';

/** ElegAI design tokens — same ivory/charcoal/gold palette as the web app. */
export const C = {
  ivory: '#F5F0E8',
  ivoryDark: '#EAE2D4',
  charcoal: '#1F1F1F',
  gold: '#C9A227',
  goldLight: '#E2C763',
  goldDark: '#A8851B',
  white: '#FFFFFF',
  gray: '#666666',
  grayLight: '#9C9C9C',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  success: '#059669',
  successBg: '#D1FAE5',
  amberBg: '#FEF3C7',
  amber: '#B45309',
  blueBg: '#DBEAFE',
  blue: '#1D4ED8',
};

/** Display serif (Georgia on iOS, generic serif on Android). */
export const DISPLAY = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

/** Shared card style — rounded, white, subtle shadow. */
export const card = {
  backgroundColor: C.white,
  borderRadius: 16,
  padding: 16,
  shadowColor: '#1F1F1F',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
