// Training drills — focused practice for specific skills
import { ScoreResult } from './dartboard';

export type DrillType =
  | 'doubles'     // Hit specific double segments
  | 'triples'     // Hit triple segments
  | 'bullseyes'   // Bullseye practice
  | 'finishing'   // Practice checkout routes
  | 'sectors'     // Hit specific sectors in order
  | 'consistency' // Hit the same target repeatedly
  | 'pressure';   // Timed throws

export interface Drill {
  type: DrillType;
  name: string;
  description: string;
  targets: number[]; // Target segments
  targetMultiplier?: number; // Required multiplier
  timeLimit?: number; // Seconds (for pressure drill)
  requiredHits: number;
  icon: string;
}

export interface DrillProgress {
  drill: Drill;
  hits: number;
  misses: number;
  throws: number;
  startTime: number;
  completed: boolean;
  grade: string;
  accuracy: number;
}

const DRILLS: Drill[] = [
  {
    type: 'doubles',
    name: 'Double Trouble',
    description: 'Hit 5 different doubles',
    targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    targetMultiplier: 2,
    requiredHits: 5,
    icon: '🎯',
  },
  {
    type: 'triples',
    name: 'Triple Threat',
    description: 'Hit 3 triple 20s',
    targets: [20],
    targetMultiplier: 3,
    requiredHits: 3,
    icon: '💥',
  },
  {
    type: 'bullseyes',
    name: 'Bull Rush',
    description: 'Hit the bullseye 5 times',
    targets: [25],
    requiredHits: 5,
    icon: '🐂',
  },
  {
    type: 'finishing',
    name: 'Checkout Practice',
    description: 'Finish from 32 (D16)',
    targets: [16],
    targetMultiplier: 2,
    requiredHits: 3,
    icon: '🏁',
  },
  {
    type: 'sectors',
    name: 'Around the Board',
    description: 'Hit segments 1-10 in order',
    targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    requiredHits: 10,
    icon: '🔄',
  },
  {
    type: 'consistency',
    name: 'Repeat Performance',
    description: 'Hit T19 five times in a row',
    targets: [19],
    targetMultiplier: 3,
    requiredHits: 5,
    icon: '🔁',
  },
  {
    type: 'pressure',
    name: 'Speed Round',
    description: 'Score 100+ in 30 seconds',
    targets: [],
    timeLimit: 30,
    requiredHits: 1, // 100+ total score
    icon: '⏱️',
  },
];

export class TrainingDrillManager {
  private currentDrill: Drill | null = null;
  private progress: DrillProgress | null = null;
  private currentTargetIdx = 0;
  private totalScore = 0;

  constructor() {}

  getDrills(): Drill[] {
    return [...DRILLS];
  }

  startDrill(drillIndex: number): DrillProgress | null {
    if (drillIndex < 0 || drillIndex >= DRILLS.length) return null;

    this.currentDrill = DRILLS[drillIndex];
    this.currentTargetIdx = 0;
    this.totalScore = 0;

    this.progress = {
      drill: this.currentDrill,
      hits: 0,
      misses: 0,
      throws: 0,
      startTime: Date.now(),
      completed: false,
      grade: '-',
      accuracy: 0,
    };

    return this.progress;
  }

  isActive(): boolean {
    return this.currentDrill !== null && this.progress !== null && !this.progress.completed;
  }

  getCurrentTarget(): { segment: number; multiplier?: number } | null {
    if (!this.currentDrill || !this.progress) return null;

    if (this.currentDrill.type === 'sectors') {
      if (this.currentTargetIdx >= this.currentDrill.targets.length) return null;
      return { segment: this.currentDrill.targets[this.currentTargetIdx] };
    }

    if (this.currentDrill.targets.length > 0) {
      return {
        segment: this.currentDrill.targets[0],
        multiplier: this.currentDrill.targetMultiplier,
      };
    }

    return null;
  }

  registerThrow(result: ScoreResult): { hit: boolean; message: string } {
    if (!this.currentDrill || !this.progress) {
      return { hit: false, message: '' };
    }

    this.progress.throws++;
    this.totalScore += result.total;

    let hit = false;
    let message = '';

    switch (this.currentDrill.type) {
      case 'doubles':
      case 'triples':
      case 'finishing':
      case 'consistency': {
        const targetMult = this.currentDrill.targetMultiplier || 1;
        if (this.currentDrill.targets.includes(result.segment) && result.multiplier === targetMult) {
          hit = true;
          this.progress.hits++;
          message = `✅ ${result.label}!`;
        } else {
          this.progress.misses++;
          message = `❌ Needed ${this.currentDrill.targetMultiplier === 3 ? 'T' : 'D'}${this.currentDrill.targets[0]}`;
          // Consistency drill resets on miss
          if (this.currentDrill.type === 'consistency') {
            this.progress.hits = 0;
            message += ' - streak reset!';
          }
        }
        break;
      }
      case 'bullseyes':
        if (result.segment === 25) {
          hit = true;
          this.progress.hits++;
          message = result.multiplier === 2 ? '🎯 INNER BULL!' : '✅ Outer Bull!';
        } else {
          this.progress.misses++;
          message = '❌ Missed the bull';
        }
        break;
      case 'sectors':
        if (result.segment === this.currentDrill.targets[this.currentTargetIdx]) {
          hit = true;
          this.progress.hits++;
          this.currentTargetIdx++;
          message = `✅ ${result.segment}! Next: ${this.currentDrill.targets[this.currentTargetIdx] || 'DONE'}`;
        } else {
          this.progress.misses++;
          message = `❌ Need ${this.currentDrill.targets[this.currentTargetIdx]}`;
        }
        break;
      case 'pressure':
        hit = true;
        this.progress.hits++;
        message = `Score: ${this.totalScore}/100`;
        break;
    }

    // Check completion
    if (this.progress.hits >= this.currentDrill.requiredHits) {
      if (this.currentDrill.type === 'pressure') {
        if (this.totalScore >= 100) {
          this.progress.completed = true;
        }
      } else {
        this.progress.completed = true;
      }
    }

    // Check time limit
    if (this.currentDrill.timeLimit) {
      const elapsed = (Date.now() - this.progress.startTime) / 1000;
      if (elapsed >= this.currentDrill.timeLimit && !this.progress.completed) {
        this.progress.completed = true;
        message = '⏰ Time\'s up!';
      }
    }

    // Calculate accuracy and grade
    this.progress.accuracy = this.progress.throws > 0
      ? Math.round((this.progress.hits / this.progress.throws) * 100)
      : 0;

    if (this.progress.completed) {
      this.progress.grade = this.calculateGrade(this.progress.accuracy);
    }

    return { hit, message };
  }

  private calculateGrade(accuracy: number): string {
    if (accuracy >= 90) return 'S';
    if (accuracy >= 75) return 'A';
    if (accuracy >= 60) return 'B';
    if (accuracy >= 40) return 'C';
    return 'D';
  }

  getProgress(): DrillProgress | null {
    return this.progress ? { ...this.progress } : null;
  }

  getTimeRemaining(): number {
    if (!this.currentDrill?.timeLimit || !this.progress) return 0;
    const elapsed = (Date.now() - this.progress.startTime) / 1000;
    return Math.max(0, this.currentDrill.timeLimit - elapsed);
  }

  reset(): void {
    this.currentDrill = null;
    this.progress = null;
    this.currentTargetIdx = 0;
    this.totalScore = 0;
  }
}
