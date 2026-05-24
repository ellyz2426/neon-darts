// Match history — persists recent games to localStorage
export interface MatchRecord {
  id: string;
  date: string;
  mode: string;
  result: 'win' | 'loss' | 'draw';
  playerScore: string;
  opponentScore: string;
  opponentName: string;
  dartsThrown: number;
  avgScore: number;
  highThrow: number;
  duration: number; // seconds
}

const HISTORY_KEY = 'neondarts_history';
const MAX_RECORDS = 50;

export class MatchHistoryManager {
  private records: MatchRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch {
      this.records = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.records));
    } catch { /* ignore */ }
  }

  addRecord(record: Omit<MatchRecord, 'id' | 'date'>) {
    const fullRecord: MatchRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    this.records.unshift(fullRecord);
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(0, MAX_RECORDS);
    }
    this.save();
  }

  getRecords(limit = 20): MatchRecord[] {
    return this.records.slice(0, limit);
  }

  getStats(): {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    avgScore: number;
    bestAvg: number;
    totalDarts: number;
    favoriteMode: string;
  } {
    const total = this.records.length;
    const wins = this.records.filter(r => r.result === 'win').length;
    const losses = this.records.filter(r => r.result === 'loss').length;
    const allAvgs = this.records.map(r => r.avgScore).filter(a => a > 0);
    const avgScore = allAvgs.length > 0 ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : 0;
    const bestAvg = allAvgs.length > 0 ? Math.max(...allAvgs) : 0;
    const totalDarts = this.records.reduce((s, r) => s + r.dartsThrown, 0);

    // Find most played mode
    const modeCounts: Record<string, number> = {};
    this.records.forEach(r => {
      modeCounts[r.mode] = (modeCounts[r.mode] || 0) + 1;
    });
    let favoriteMode = 'None';
    let maxCount = 0;
    for (const [mode, count] of Object.entries(modeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteMode = mode;
      }
    }

    return {
      totalGames: total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      avgScore: Math.round(avgScore),
      bestAvg: Math.round(bestAvg),
      totalDarts,
      favoriteMode,
    };
  }

  clearHistory() {
    this.records = [];
    this.save();
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    const month = d.toLocaleString('default', { month: 'short' });
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} ${hour}:${min}`;
  }
}
