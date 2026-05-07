/**
 * Theme color definitions for Tetris Classic.
 * Each theme provides board background, grid line color, and piece colors.
 */
import type { PieceType, ThemeName } from './types';
import { PIECE_DEFINITIONS } from './pieces';

export interface ThemeColors {
  board: string;
  gridLine: string;
  pieces: Record<PieceType, string>;
}

const darkTheme: ThemeColors = {
  board: '#0a0a1a',
  gridLine: 'rgba(255,255,255,0.05)',
  pieces: {
    I: PIECE_DEFINITIONS.I.color,
    O: PIECE_DEFINITIONS.O.color,
    T: PIECE_DEFINITIONS.T.color,
    S: PIECE_DEFINITIONS.S.color,
    Z: PIECE_DEFINITIONS.Z.color,
    J: PIECE_DEFINITIONS.J.color,
    L: PIECE_DEFINITIONS.L.color,
  },
};

const neonTheme: ThemeColors = {
  board: '#020208',
  gridLine: 'rgba(100,50,255,0.1)',
  pieces: {
    I: '#00ffff',
    O: '#ffff00',
    T: '#ff00ff',
    S: '#00ff66',
    Z: '#ff0044',
    J: '#4488ff',
    L: '#ff8800',
  },
};

const pastelTheme: ThemeColors = {
  board: '#0d0d20',
  gridLine: 'rgba(180,140,220,0.08)',
  pieces: {
    I: '#7ec8e3',
    O: '#e8d06e',
    T: '#b088cc',
    S: '#6ec4a0',
    Z: '#e07078',
    J: '#6898d0',
    L: '#d09060',
  },
};

const THEMES: Record<ThemeName, ThemeColors> = {
  dark: darkTheme,
  neon: neonTheme,
  pastel: pastelTheme,
};

export function getThemeColors(theme: ThemeName): ThemeColors {
  return THEMES[theme] ?? THEMES.dark;
}
