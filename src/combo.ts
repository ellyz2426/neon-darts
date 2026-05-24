// Combo system — tracks consecutive high-scoring throws
export interface ComboState {
  count: number;
  multiplier: number;
  lastScore: number;
  active: boolean;
  label: string;
}

const COMBO_THRESHOLDS = [
  { min: 40, label: 'NICE!', multiplier: 1.0 },
  { min: 60, label: 'GREAT!', multiplier: 1.0 },
  { min: 100, label: 'AMAZING!', multiplier: 1.0 },
  { min: 140, label: 'INCREDIBLE!', multiplier: 1.0 },
  { min: 180, label: 'PERFECT!', multiplier: 1.0 },
];

export class ComboTracker {
  private consecutiveGoodThrows = 0;
  private consecutiveGoodTurns = 0;

  // Called after each individual dart hit
  onThrow(score: number): ComboState | null {
    if (score >= 40) {
      this.consecutiveGoodThrows++;
    } else if (score === 0) {
      this.consecutiveGoodThrows = 0;
    }

    // Single throw feedback
    if (score >= 40) {
      const tier = COMBO_THRESHOLDS.filter(t => score >= t.min).pop();
      if (tier) {
        return {
          count: this.consecutiveGoodThrows,
          multiplier: tier.multiplier,
          lastScore: score,
          active: true,
          label: this.consecutiveGoodThrows >= 3
            ? `${tier.label} x${this.consecutiveGoodThrows} STREAK`
            : tier.label,
        };
      }
    }
    return null;
  }

  // Called after each turn (3 darts)
  onTurnEnd(turnScore: number): ComboState | null {
    if (turnScore >= 60) {
      this.consecutiveGoodTurns++;
      if (this.consecutiveGoodTurns >= 2) {
        return {
          count: this.consecutiveGoodTurns,
          multiplier: 1.0,
          lastScore: turnScore,
          active: true,
          label: `${this.consecutiveGoodTurns} TURN STREAK!`,
        };
      }
    } else {
      this.consecutiveGoodTurns = 0;
    }
    return null;
  }

  reset() {
    this.consecutiveGoodThrows = 0;
    this.consecutiveGoodTurns = 0;
  }
}
