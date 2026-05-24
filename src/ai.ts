// AI opponent logic
import { GameManager, GameMode } from './game';
import { BOARD_SEGMENTS } from './dartboard';

export enum AIDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

interface TargetPosition {
  x: number;
  y: number;
}

export class AIOpponent {
  difficulty: AIDifficulty = AIDifficulty.Medium;

  private getNoiseAmount(): number {
    switch (this.difficulty) {
      case AIDifficulty.Easy: return 0.045;
      case AIDifficulty.Medium: return 0.025;
      case AIDifficulty.Hard: return 0.012;
    }
  }

  getTarget(game: GameManager): TargetPosition {
    switch (game.mode) {
      case GameMode.FiveOhOne:
        return this.get501Target(game);
      case GameMode.Cricket:
        return this.getCricketTarget(game);
      case GameMode.AroundTheClock:
        return this.getAroundTheClockTarget(game);
      case GameMode.Shanghai:
        return this.getShanghaiTarget(game);
      default:
        return { x: 0, y: 0 };
    }
  }

  private get501Target(game: GameManager): TargetPosition {
    const player = game.players[game.currentPlayer];
    const remaining = player.remaining501 || 0;

    // If can finish on a double
    if (remaining <= 40 && remaining % 2 === 0) {
      const doubleNeeded = remaining / 2;
      return this.getSegmentPosition(doubleNeeded, 'double');
    }

    // If remaining is 50 — aim for bullseye
    if (remaining === 50) {
      return { x: 0, y: 0 };
    }

    // Otherwise aim for high-value targets
    // T20 is the most efficient
    if (remaining > 60) {
      return this.getSegmentPosition(20, 'triple');
    }

    // Set up for a double finish
    const targetScore = remaining - (remaining % 2 === 0 ? remaining : remaining - 1);
    if (targetScore > 0 && targetScore <= 20) {
      return this.getSegmentPosition(targetScore, 'single');
    }

    return this.getSegmentPosition(20, 'triple');
  }

  private getCricketTarget(game: GameManager): TargetPosition {
    const player = game.players[game.currentPlayer];
    const marks = player.cricketMarks!;

    // Find unclosed numbers, prioritize higher numbers
    const cricketNums = [20, 19, 18, 17, 16, 15, 25];
    for (const num of cricketNums) {
      if (marks[num] < 3) {
        return num === 25
          ? { x: 0, y: 0 }
          : this.getSegmentPosition(num, 'triple');
      }
    }

    // All closed — aim for scoring on opponent's open numbers
    const opponent = game.players[1 - game.currentPlayer];
    const oppMarks = opponent.cricketMarks!;
    for (const num of cricketNums) {
      if (oppMarks[num] < 3) {
        return num === 25
          ? { x: 0, y: 0 }
          : this.getSegmentPosition(num, 'triple');
      }
    }

    return { x: 0, y: 0 };
  }

  private getAroundTheClockTarget(game: GameManager): TargetPosition {
    const player = game.players[game.currentPlayer];
    const target = player.currentTarget || 1;
    return this.getSegmentPosition(target, 'single');
  }

  private getShanghaiTarget(game: GameManager): TargetPosition {
    // Aim for triple of the current round number
    return this.getSegmentPosition(game.round, 'triple');
  }

  private getSegmentPosition(segment: number, ring: 'single' | 'double' | 'triple'): TargetPosition {
    if (segment === 25) {
      return { x: 0, y: 0 }; // Bullseye center
    }

    const segIndex = BOARD_SEGMENTS.indexOf(segment);
    if (segIndex === -1) return { x: 0, y: 0 };

    const segmentAngle = (Math.PI * 2) / 20;
    const angle = segIndex * segmentAngle - Math.PI / 2;

    let radius: number;
    switch (ring) {
      case 'double': radius = 0.166; break;
      case 'triple': radius = 0.103; break;
      default: radius = 0.135; break; // single (outer single area)
    }

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }

  applyNoise(x: number, y: number): { x: number; y: number } {
    const noise = this.getNoiseAmount();
    return {
      x: x + (Math.random() - 0.5) * noise * 2,
      y: y + (Math.random() - 0.5) * noise * 2,
    };
  }
}
