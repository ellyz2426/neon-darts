// Daily Challenge — seeded daily challenge with target conditions
export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetType: 'score' | 'hits' | 'accuracy' | 'streak';
  targetValue: number;
  dartsAllowed: number;
  reward: string;
}

export interface DailyChallengeResult {
  date: string;
  completed: boolean;
  bestScore: number;
  bestStreak: number;
  dartsUsed: number;
}

const DAILY_CHALLENGE_KEY = 'neon-darts-daily';
const DAILY_RESULTS_KEY = 'neon-darts-daily-results';

// Pseudo-random from date seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const CHALLENGE_TEMPLATES = [
  {
    title: 'Triple Frenzy',
    description: 'Hit {target} triples in {darts} darts',
    targetType: 'hits' as const,
    targetBase: 5,
    dartsBase: 15,
    reward: 'Triple Master',
  },
  {
    title: 'Bullseye Blitz',
    description: 'Hit {target} bullseyes in {darts} darts',
    targetType: 'hits' as const,
    targetBase: 3,
    dartsBase: 12,
    reward: 'Eye of the Bull',
  },
  {
    title: 'Score Rush',
    description: 'Score {target}+ total points in {darts} darts',
    targetType: 'score' as const,
    targetBase: 300,
    dartsBase: 18,
    reward: 'Score Chaser',
  },
  {
    title: 'Precision Run',
    description: 'Achieve {target}%+ accuracy over {darts} darts (no misses)',
    targetType: 'accuracy' as const,
    targetBase: 85,
    dartsBase: 15,
    reward: 'Laser Focus',
  },
  {
    title: 'Hot Streak',
    description: 'Hit {target} consecutive scoring darts (no misses)',
    targetType: 'streak' as const,
    targetBase: 8,
    dartsBase: 15,
    reward: 'On Fire',
  },
  {
    title: 'Double Down',
    description: 'Hit {target} doubles in {darts} darts',
    targetType: 'hits' as const,
    targetBase: 4,
    dartsBase: 15,
    reward: 'Double Agent',
  },
  {
    title: 'High Average',
    description: 'Average {target}+ per dart over {darts} darts',
    targetType: 'score' as const,
    targetBase: 250,
    dartsBase: 15,
    reward: 'Consistent',
  },
];

export class DailyChallengeManager {
  currentChallenge: DailyChallenge;
  results: DailyChallengeResult[] = [];

  // Live tracking state
  dartsThrown = 0;
  totalScore = 0;
  hitsOfType = 0;
  currentStreak = 0;
  bestStreak = 0;
  misses = 0;
  active = false;

  constructor() {
    this.currentChallenge = this.generateChallenge(this.getTodayStr());
    this.loadResults();
  }

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  generateChallenge(dateStr: string): DailyChallenge {
    const seed = dateToSeed(dateStr);
    const rand = seededRandom(seed);

    const templateIdx = Math.floor(rand() * CHALLENGE_TEMPLATES.length);
    const template = CHALLENGE_TEMPLATES[templateIdx];

    // Scale difficulty slightly by day-of-month
    const dayNum = parseInt(dateStr.split('-')[2], 10);
    const difficultyScale = 1 + (dayNum % 10) * 0.05;

    const targetValue = Math.round(template.targetBase * difficultyScale);
    const dartsAllowed = template.dartsBase + Math.floor(rand() * 6) - 3;

    const description = template.description
      .replace('{target}', String(targetValue))
      .replace('{darts}', String(dartsAllowed));

    return {
      date: dateStr,
      title: template.title,
      description,
      targetType: template.targetType,
      targetValue,
      dartsAllowed: Math.max(9, dartsAllowed),
      reward: template.reward,
    };
  }

  startChallenge() {
    this.currentChallenge = this.generateChallenge(this.getTodayStr());
    this.dartsThrown = 0;
    this.totalScore = 0;
    this.hitsOfType = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.misses = 0;
    this.active = true;
  }

  recordThrow(total: number, multiplier: number, segment: number) {
    if (!this.active) return;
    this.dartsThrown++;
    this.totalScore += total;

    if (total === 0) {
      this.misses++;
      this.currentStreak = 0;
    } else {
      this.currentStreak++;
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }
    }

    // Track type-specific hits
    const ch = this.currentChallenge;
    if (ch.title.includes('Triple') && multiplier === 3) this.hitsOfType++;
    if (ch.title.includes('Bullseye') && segment === 25 && multiplier === 2) this.hitsOfType++;
    if (ch.title.includes('Double') && multiplier === 2 && segment !== 25) this.hitsOfType++;

    // Check completion
    if (this.dartsThrown >= ch.dartsAllowed) {
      this.endChallenge();
    }
  }

  isCompleted(): boolean {
    const ch = this.currentChallenge;
    switch (ch.targetType) {
      case 'score': return this.totalScore >= ch.targetValue;
      case 'hits': return this.hitsOfType >= ch.targetValue;
      case 'accuracy': {
        if (this.dartsThrown === 0) return false;
        const acc = ((this.dartsThrown - this.misses) / this.dartsThrown) * 100;
        return acc >= ch.targetValue;
      }
      case 'streak': return this.bestStreak >= ch.targetValue;
    }
  }

  getProgressText(): string {
    const ch = this.currentChallenge;
    switch (ch.targetType) {
      case 'score': return `${this.totalScore} / ${ch.targetValue} pts`;
      case 'hits': return `${this.hitsOfType} / ${ch.targetValue} hits`;
      case 'accuracy': {
        if (this.dartsThrown === 0) return '0% / ' + ch.targetValue + '%';
        const acc = Math.round(((this.dartsThrown - this.misses) / this.dartsThrown) * 100);
        return `${acc}% / ${ch.targetValue}%`;
      }
      case 'streak': return `${this.bestStreak} / ${ch.targetValue} streak`;
    }
  }

  getDartsRemaining(): number {
    return Math.max(0, this.currentChallenge.dartsAllowed - this.dartsThrown);
  }

  endChallenge() {
    this.active = false;
    const result: DailyChallengeResult = {
      date: this.currentChallenge.date,
      completed: this.isCompleted(),
      bestScore: this.totalScore,
      bestStreak: this.bestStreak,
      dartsUsed: this.dartsThrown,
    };
    this.results.push(result);
    this.saveResults();
  }

  hasTodayResult(): boolean {
    const today = this.getTodayStr();
    return this.results.some(r => r.date === today && r.completed);
  }

  getTodayAttempts(): number {
    const today = this.getTodayStr();
    return this.results.filter(r => r.date === today).length;
  }

  getCompletedCount(): number {
    return this.results.filter(r => r.completed).length;
  }

  private loadResults() {
    try {
      const saved = localStorage.getItem(DAILY_RESULTS_KEY);
      if (saved) this.results = JSON.parse(saved);
    } catch {}
  }

  private saveResults() {
    try {
      // Keep only last 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      this.results = this.results.filter(r => r.date >= cutoffStr);
      localStorage.setItem(DAILY_RESULTS_KEY, JSON.stringify(this.results));
    } catch {}
  }
}
