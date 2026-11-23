import type { TaskPriority } from './types/task';

/** Marca de la app. */
export const BRAND = {
  name: 'Taskify',
  tagline: 'Gestor de tareas',
};

/**
 * Paleta refinada de Taskify:
 *  - Índigo profundo (#1E1B4B): Panel izquierdo, tarjetas oscuras y branding
 *  - Durazno/coral (#FFA27F): Tildes, checks, acentos y detalles vibrantes
 *  - Lavanda casi blanco (#FAF8FF): Fondo general y formularios
 *  - Violeta (#5B3FD9): Botones y links principales (hover/pressed: #482EC0 / #3C24A8)
 *  - Inputs blancos (#FFFFFF) con borde violeta suave (#DDD6FE)
 */
export const colors = {
  bg: '#FAF8FF',
  surface: '#FFFFFF',
  border: '#E8E3FA',
  inputBorder: '#DDD6FE',
  inputBorderFocus: '#5B3FD9',
  text: '#1E1B4B',
  bodyText: '#37306B',
  textMuted: '#6B668C',
  textFaint: '#A5A1C2',
  placeholder: '#9D98BA',

  primary: '#5B3FD9',
  primaryDark: '#482EC0',
  primaryPressed: '#3C24A8',
  primarySoft: '#EDE9FE',

  accent: '#FFA27F',
  accentCoral: '#FFA27F',
  accentSoft: '#FFF1EB',

  dark: '#1E1B4B',
  indigoDeep: '#1E1B4B',
  onDark: '#FFFFFF',
  onDarkMuted: '#E0DAFC',
  onDarkAccent: '#FFA27F',
  onDarkTrack: 'rgba(255,255,255,0.18)',
  onDarkChip: 'rgba(255,255,255,0.12)',

  neutralSoft: '#F1EEFD',
  neutralPressed: '#E5E0FA',
  neutralChip: '#E0DAFC',
  checkBorder: '#C4B5FD',

  danger: '#DC2626',
  dangerDark: '#991B1B',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  olive: '#059669',
  oliveSoft: '#D1FAE5',
  success: '#10B981',
  successSoft: '#D1FAE5',
};

export const priorityStyle: Record<TaskPriority, { label: string; fg: string; bg: string; bar: string }> = {
  alta: { label: 'Alta', fg: colors.danger, bg: colors.dangerSoft, bar: colors.danger },
  media: { label: 'Media', fg: '#C25E38', bg: colors.accentSoft, bar: colors.accentCoral },
  baja: { label: 'Baja', fg: colors.olive, bg: colors.oliveSoft, bar: colors.olive },
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };

/** Altura mínima recomendada para elementos táctiles (≈48dp). */
export const TOUCH = 48;
