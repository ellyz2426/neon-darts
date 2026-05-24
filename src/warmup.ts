// Warm-up system — 3 practice throws before each game
import { ScoreResult } from './dartboard';

export interface WarmupState {
  active: boolean;
  throwsRemaining: number;
  throwResults: ScoreResult[];
  totalScore: number;
}

const WARMUP_THROWS = 3;

export class WarmupManager {
  private state: WarmupState = {
    active: false,
    throwsRemaining: WARMUP_THROWS,
    throwResults: [],
    totalScore: 0,
  };

  private onComplete: (() => void) | null = null;
  private onThrow: ((state: WarmupState) => void) | null = null;

  constructor() {}

  startWarmup(onComplete: () => void, onThrow?: (state: WarmupState) => void): void {
    this.state = {
      active: true,
      throwsRemaining: WARMUP_THROWS,
      throwResults: [],
      totalScore: 0,
    };
    this.onComplete = onComplete;
    this.onThrow = onThrow || null;
  }

  isActive(): boolean {
    return this.state.active;
  }

  getState(): WarmupState {
    return { ...this.state };
  }

  registerThrow(result: ScoreResult): void {
    if (!this.state.active) return;

    this.state.throwResults.push(result);
    this.state.totalScore += result.total;
    this.state.throwsRemaining--;

    this.onThrow?.(this.getState());

    if (this.state.throwsRemaining <= 0) {
      this.state.active = false;
      this.onComplete?.();
    }
  }

  getAverageScore(): number {
    if (this.state.throwResults.length === 0) return 0;
    return this.state.totalScore / this.state.throwResults.length;
  }

  getResultSummary(): string {
    const results = this.state.throwResults;
    if (results.length === 0) return 'No warm-up throws';

    const scores = results.map(r => r.total);
    const avg = Math.round(this.getAverageScore());
    const best = Math.max(...scores);

    return `Warm-up: ${scores.join(', ')} (avg ${avg}, best ${best})`;
  }

  skip(): void {
    this.state.active = false;
    this.state.throwsRemaining = 0;
    this.onComplete?.();
  }

  reset(): void {
    this.state = {
      active: false,
      throwsRemaining: WARMUP_THROWS,
      throwResults: [],
      totalScore: 0,
    };
    this.onComplete = null;
    this.onThrow = null;
  }
}
