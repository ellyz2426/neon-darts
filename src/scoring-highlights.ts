// Scoring highlights — animated per-turn scoring summary
import { Color } from '@iwsdk/core';

interface ThrowRecord {
  score: number;
  multiplier: number;
  segment: number;
  label: string;
}

interface TurnSummary {
  throws: ThrowRecord[];
  totalScore: number;
  averageScore: number;
  bestThrow: ThrowRecord | null;
  hasTriple: boolean;
  hasBull: boolean;
  isMax180: boolean;
  grade: string;
  gradeColor: Color;
}

export class ScoringHighlights {
  private currentTurn: ThrowRecord[] = [];
  private lastSummary: TurnSummary | null = null;
  private summaryVisible = false;
  private summaryTimer = 0;
  private summaryDuration = 3;

  constructor() {}

  recordThrow(score: number, multiplier: number, segment: number, label: string): void {
    this.currentTurn.push({ score, multiplier, segment, label });
  }

  endTurn(): TurnSummary {
    const throws = [...this.currentTurn];
    const totalScore = throws.reduce((sum, t) => sum + t.score, 0);
    const avgScore = throws.length > 0 ? totalScore / throws.length : 0;
    const bestThrow = throws.length > 0 ? throws.reduce((best, t) => t.score > best.score ? t : best) : null;
    const hasTriple = throws.some(t => t.multiplier === 3);
    const hasBull = throws.some(t => t.segment === 25);
    const isMax180 = totalScore === 180;

    let grade: string;
    let gradeColor: Color;

    if (isMax180) {
      grade = 'S+';
      gradeColor = new Color(0xffaa00);
    } else if (totalScore >= 140) {
      grade = 'S';
      gradeColor = new Color(0xff4444);
    } else if (totalScore >= 100) {
      grade = 'A';
      gradeColor = new Color(0xff00ff);
    } else if (totalScore >= 60) {
      grade = 'B';
      gradeColor = new Color(0x00ffff);
    } else if (totalScore >= 30) {
      grade = 'C';
      gradeColor = new Color(0x00ff88);
    } else {
      grade = 'D';
      gradeColor = new Color(0x888888);
    }

    const summary: TurnSummary = {
      throws,
      totalScore,
      averageScore: Math.round(avgScore),
      bestThrow,
      hasTriple,
      hasBull,
      isMax180,
      grade,
      gradeColor,
    };

    this.lastSummary = summary;
    this.summaryVisible = true;
    this.summaryTimer = 0;
    this.currentTurn = [];

    return summary;
  }

  isSummaryVisible(): boolean {
    return this.summaryVisible;
  }

  getLastSummary(): TurnSummary | null {
    return this.lastSummary;
  }

  getSummaryText(): string {
    if (!this.lastSummary) return '';
    const s = this.lastSummary;
    const throwLabels = s.throws.map(t => t.label).join(' + ');
    let text = `${throwLabels} = ${s.totalScore}`;
    if (s.isMax180) text = '🎯 180! ' + text;
    else if (s.grade === 'S') text = '🔥 ' + text;
    return text;
  }

  update(dt: number): void {
    if (this.summaryVisible) {
      this.summaryTimer += dt;
      if (this.summaryTimer >= this.summaryDuration) {
        this.summaryVisible = false;
      }
    }
  }

  reset(): void {
    this.currentTurn = [];
    this.lastSummary = null;
    this.summaryVisible = false;
  }
}
