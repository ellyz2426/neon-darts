// Per-mode leaderboard system — separate top scores for each game mode
import { GameMode } from './game';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  mode: string;
  date: string;
  details: string;
}

interface ModeLeaderboard {
  mode: string;
  entries: LeaderboardEntry[];
}

const STORAGE_KEY = 'neon-darts-leaderboards-v2';
const MAX_ENTRIES_PER_MODE = 20;
const GLOBAL_MAX = 50;

export class ModeLeaderboardManager {
  private leaderboards: Map<string, ModeLeaderboard> = new Map();
  private globalBoard: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.modes) {
          for (const [mode, board] of Object.entries(parsed.modes as Record<string, ModeLeaderboard>)) {
            this.leaderboards.set(mode, board as ModeLeaderboard);
          }
        }
        if (parsed.global) {
          this.globalBoard = parsed.global;
        }
      }
    } catch {
      // Fresh start
    }
  }

  private save(): void {
    try {
      const modes: Record<string, ModeLeaderboard> = {};
      this.leaderboards.forEach((board, mode) => {
        modes[mode] = board;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        modes,
        global: this.globalBoard,
      }));
    } catch {
      // Storage full
    }
  }

  addScore(mode: GameMode, playerName: string, score: number, details: string = ''): number {
    const modeKey = mode as string;
    const entry: LeaderboardEntry = {
      playerName: playerName || 'Player',
      score,
      mode: modeKey,
      date: new Date().toISOString().split('T')[0],
      details,
    };

    // Mode-specific leaderboard
    if (!this.leaderboards.has(modeKey)) {
      this.leaderboards.set(modeKey, { mode: modeKey, entries: [] });
    }
    const modeBoard = this.leaderboards.get(modeKey)!;
    modeBoard.entries.push(entry);
    modeBoard.entries.sort((a, b) => b.score - a.score);
    if (modeBoard.entries.length > MAX_ENTRIES_PER_MODE) {
      modeBoard.entries.length = MAX_ENTRIES_PER_MODE;
    }

    // Global leaderboard
    this.globalBoard.push(entry);
    this.globalBoard.sort((a, b) => b.score - a.score);
    if (this.globalBoard.length > GLOBAL_MAX) {
      this.globalBoard.length = GLOBAL_MAX;
    }

    this.save();

    // Return rank (1-indexed)
    return modeBoard.entries.indexOf(entry) + 1;
  }

  getModeLeaderboard(mode: GameMode, limit: number = 10): LeaderboardEntry[] {
    const modeKey = mode as string;
    const board = this.leaderboards.get(modeKey);
    return board ? board.entries.slice(0, limit) : [];
  }

  getGlobalLeaderboard(limit: number = 10): LeaderboardEntry[] {
    return this.globalBoard.slice(0, limit);
  }

  getAvailableModes(): string[] {
    return Array.from(this.leaderboards.keys()).filter(
      k => (this.leaderboards.get(k)?.entries.length ?? 0) > 0
    );
  }

  getModeRank(mode: GameMode, score: number): number {
    const modeKey = mode as string;
    const board = this.leaderboards.get(modeKey);
    if (!board) return 1;
    const rank = board.entries.filter(e => e.score > score).length + 1;
    return rank;
  }

  getPersonalBest(mode: GameMode, playerName: string): number {
    const modeKey = mode as string;
    const board = this.leaderboards.get(modeKey);
    if (!board) return 0;
    const entries = board.entries.filter(e => e.playerName === playerName);
    return entries.length > 0 ? entries[0].score : 0;
  }

  clearMode(mode: GameMode): void {
    const modeKey = mode as string;
    this.leaderboards.delete(modeKey);
    this.globalBoard = this.globalBoard.filter(e => e.mode !== modeKey);
    this.save();
  }

  clearAll(): void {
    this.leaderboards.clear();
    this.globalBoard = [];
    this.save();
  }
}
