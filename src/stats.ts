// Statistics tracker
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalDartsThrown: number;
  bullseyes: number;
  triples: number;
  doubles: number;
  misses: number;
  highestSingleTurn: number;
  oneEighties: number; // 3x T20 = 180
  bestGameBy501: number; // least darts to finish
  cricketWins: number;
  shanghaiWins: number;
  aroundTheClockWins: number;
  fiveOhOneWins: number;
  totalScore: number;
  perfectLegs: number; // 501 in 9 darts or less
}

const STATS_KEY = 'neon-darts-stats';

export class StatsTracker {
  stats: GameStats;

  constructor() {
    this.stats = this.load();
  }

  private load(): GameStats {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalDartsThrown: 0,
      bullseyes: 0,
      triples: 0,
      doubles: 0,
      misses: 0,
      highestSingleTurn: 0,
      oneEighties: 0,
      bestGameBy501: 999,
      cricketWins: 0,
      shanghaiWins: 0,
      aroundTheClockWins: 0,
      fiveOhOneWins: 0,
      totalScore: 0,
      perfectLegs: 0,
    };
  }

  save() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
    } catch {}
  }

  recordThrow(total: number, multiplier: number, segment: number) {
    this.stats.totalDartsThrown++;
    this.stats.totalScore += total;
    if (total === 0) this.stats.misses++;
    if (segment === 25 && multiplier === 2) this.stats.bullseyes++;
    if (multiplier === 3) this.stats.triples++;
    if (multiplier === 2 && segment !== 25) this.stats.doubles++;
    this.save();
  }

  recordTurn(turnScore: number) {
    if (turnScore > this.stats.highestSingleTurn) {
      this.stats.highestSingleTurn = turnScore;
    }
    if (turnScore === 180) this.stats.oneEighties++;
    this.save();
  }

  recordGame(mode: string, won: boolean) {
    this.stats.gamesPlayed++;
    if (won) {
      this.stats.gamesWon++;
      switch (mode) {
        case '501': this.stats.fiveOhOneWins++; break;
        case 'cricket': this.stats.cricketWins++; break;
        case 'shanghai': this.stats.shanghaiWins++; break;
        case 'around-the-clock': this.stats.aroundTheClockWins++; break;
      }
    }
    this.save();
  }

  getWinRate(): number {
    if (this.stats.gamesPlayed === 0) return 0;
    return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
  }

  getAccuracy(): number {
    if (this.stats.totalDartsThrown === 0) return 0;
    const hits = this.stats.totalDartsThrown - this.stats.misses;
    return Math.round((hits / this.stats.totalDartsThrown) * 100);
  }

  getAverageScore(): number {
    if (this.stats.totalDartsThrown === 0) return 0;
    return Math.round((this.stats.totalScore / this.stats.totalDartsThrown) * 3); // per turn
  }
}
