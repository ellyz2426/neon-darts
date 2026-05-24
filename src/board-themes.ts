// Board themes — selectable visual styles for the dartboard
import {
  Color,
} from '@iwsdk/core';

export interface BoardTheme {
  id: string;
  name: string;
  segmentDark: string;
  segmentLight: string;
  doubleA: string;
  doubleB: string;
  tripleA: string;
  tripleB: string;
  outerBull: string;
  innerBull: string;
  wireColor: string;
  frameColor: string;
  frameGlow: string;
  numberColor: string;
  numberGlow: string;
  surroundColor: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'neon',
    name: 'Neon Holodeck',
    segmentDark: '#0a0a1a',
    segmentLight: '#1a1a2a',
    doubleA: '#cc0033',
    doubleB: '#009933',
    tripleA: '#cc0033',
    tripleB: '#009933',
    outerBull: '#009933',
    innerBull: '#cc0033',
    wireColor: '#444466',
    frameColor: '#00ffff',
    frameGlow: '#00ffff',
    numberColor: '#00ffff',
    numberGlow: '#00ffff',
    surroundColor: '#111122',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    segmentDark: '#0d0015',
    segmentLight: '#1a0030',
    doubleA: '#ff00ff',
    doubleB: '#ff6600',
    tripleA: '#ff00ff',
    tripleB: '#ff6600',
    outerBull: '#ff6600',
    innerBull: '#ff00ff',
    wireColor: '#553388',
    frameColor: '#ff00ff',
    frameGlow: '#ff00ff',
    numberColor: '#ff88ff',
    numberGlow: '#ff00ff',
    surroundColor: '#0d0020',
  },
  {
    id: 'arctic',
    name: 'Arctic Frost',
    segmentDark: '#0a1520',
    segmentLight: '#152535',
    doubleA: '#4488ff',
    doubleB: '#88ccff',
    tripleA: '#4488ff',
    tripleB: '#88ccff',
    outerBull: '#88ccff',
    innerBull: '#4488ff',
    wireColor: '#336688',
    frameColor: '#aaddff',
    frameGlow: '#88ccff',
    numberColor: '#aaddff',
    numberGlow: '#88ccff',
    surroundColor: '#0a1822',
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    segmentDark: '#1a0a00',
    segmentLight: '#2a1500',
    doubleA: '#ff4400',
    doubleB: '#ffcc00',
    tripleA: '#ff4400',
    tripleB: '#ffcc00',
    outerBull: '#ffcc00',
    innerBull: '#ff4400',
    wireColor: '#664422',
    frameColor: '#ff8800',
    frameGlow: '#ff6600',
    numberColor: '#ffcc44',
    numberGlow: '#ff8800',
    surroundColor: '#150a00',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    segmentDark: '#000800',
    segmentLight: '#001a00',
    doubleA: '#00ff00',
    doubleB: '#00cc44',
    tripleA: '#00ff00',
    tripleB: '#00cc44',
    outerBull: '#00cc44',
    innerBull: '#00ff00',
    wireColor: '#225522',
    frameColor: '#00ff44',
    frameGlow: '#00ff00',
    numberColor: '#88ff88',
    numberGlow: '#00ff00',
    surroundColor: '#001000',
  },
];

const BOARD_THEME_KEY = 'neon-darts-board-theme';

export class BoardThemeManager {
  currentTheme: BoardTheme;

  constructor() {
    const savedId = this.loadTheme();
    this.currentTheme = BOARD_THEMES.find(t => t.id === savedId) || BOARD_THEMES[0];
  }

  private loadTheme(): string {
    try {
      return localStorage.getItem(BOARD_THEME_KEY) || 'neon';
    } catch {
      return 'neon';
    }
  }

  setTheme(id: string) {
    const theme = BOARD_THEMES.find(t => t.id === id);
    if (theme) {
      this.currentTheme = theme;
      try { localStorage.setItem(BOARD_THEME_KEY, id); } catch {}
    }
  }

  nextTheme() {
    const idx = BOARD_THEMES.indexOf(this.currentTheme);
    this.setTheme(BOARD_THEMES[(idx + 1) % BOARD_THEMES.length].id);
  }

  prevTheme() {
    const idx = BOARD_THEMES.indexOf(this.currentTheme);
    this.setTheme(BOARD_THEMES[(idx - 1 + BOARD_THEMES.length) % BOARD_THEMES.length].id);
  }
}
