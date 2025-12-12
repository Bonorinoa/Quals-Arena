import { ThemeName } from '../types';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;
  
  // Glass effect overlays
  glassLight: string;
  glassMedium: string;
  
  // Glow effects
  glowColor: string;
  glowRgba: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: ThemeColors;
}

export const themes: Record<ThemeName, Theme> = {
  founder: {
    name: 'founder',
    displayName: 'Founder',
    description: 'Deep ocean aesthetic. For action, growth, and determination.',
    colors: {
      bgPrimary: '#05050a',
      bgSecondary: '#0a1628',
      bgTertiary: '#162d4d',
      accentPrimary: '#10b981',
      accentSecondary: '#059669',
      accentHover: '#047857',
      glassLight: 'rgba(255, 255, 255, 0.03)',
      glassMedium: 'rgba(255, 255, 255, 0.05)',
      glowColor: '#10b981',
      glowRgba: '16, 185, 129',
      textPrimary: '#e4e4e7',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
    },
  },
  calm: {
    name: 'calm',
    displayName: 'Calm',
    description: 'Blue-purple palette. For tranquility, focus, and meditation.',
    colors: {
      bgPrimary: '#0a0a18',
      bgSecondary: '#141428',
      bgTertiary: '#1e1e3f',
      accentPrimary: '#6366f1',
      accentSecondary: '#4f46e5',
      accentHover: '#4338ca',
      glassLight: 'rgba(255, 255, 255, 0.03)',
      glassMedium: 'rgba(255, 255, 255, 0.05)',
      glowColor: '#6366f1',
      glowRgba: '99, 102, 241',
      textPrimary: '#e4e4e7',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
    },
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themes[themeName] || themes.founder;
};

export const applyTheme = (themeName: ThemeName): void => {
  const theme = getTheme(themeName);
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
  root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
  root.style.setProperty('--color-bg-tertiary', theme.colors.bgTertiary);
  root.style.setProperty('--color-accent-primary', theme.colors.accentPrimary);
  root.style.setProperty('--color-accent-secondary', theme.colors.accentSecondary);
  root.style.setProperty('--color-accent-hover', theme.colors.accentHover);
  root.style.setProperty('--color-glass-light', theme.colors.glassLight);
  root.style.setProperty('--color-glass-medium', theme.colors.glassMedium);
  root.style.setProperty('--color-glow', theme.colors.glowColor);
  root.style.setProperty('--color-glow-rgba', theme.colors.glowRgba);
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  
  // Update body background for theme
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${themeName}`);
};
