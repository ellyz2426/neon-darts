// Killer darts game mode
// Players each get assigned a number (their target). Hit doubles of your number to gain lives (max 5).
// Once you have lives, you're a "killer" — hit other players' doubles to reduce their lives.
// Last player standing wins.

import { ScoreResult } from './dartboard';

export interface KillerPlayer {
  name: string;
  isAI: boolean;
  targetNumber: number;
  lives: number;
  isKiller: boolean;
  eliminated: boolean;
}

export class KillerManager {
  players: KillerPlayer[] = [];
  currentPlayerIndex = 0;
  dartsThisRound = 0;
  round = 1;
  gameOver = false;
  winner: KillerPlayer | null = null;
  lastAction = '';

  startGame(playerNames: string[], isAI: boolean[]) {
    // Assign unique random target numbers (1-20)
    const numbers = this.shuffleNumbers();
    this.players = playerNames.map((name, i) => ({
      name,
      isAI: isAI[i] || false,
      targetNumber: numbers[i],
      lives: 0,
      isKiller: false,
      eliminated: false,
    }));
    this.currentPlayerIndex = 0;
    this.dartsThisRound = 0;
    this.round = 1;
    this.gameOver = false;
    this.winner = null;
    this.lastAction = '';
  }

  private shuffleNumbers(): number[] {
    const nums = Array.from({ length: 20 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums;
  }

  get currentPlayer(): KillerPlayer {
    return this.players[this.currentPlayerIndex];
  }

  get activePlayers(): KillerPlayer[] {
    return this.players.filter(p => !p.eliminated);
  }

  recordThrow(result: ScoreResult): string {
    this.dartsThisRound++;
    const player = this.currentPlayer;
    let action = '';

    if (result.segment === player.targetNumber && result.multiplier === 2) {
      // Hit your own double — gain a life (max 5)
      if (player.lives < 5) {
        player.lives++;
        action = `${player.name} gained a life! (${player.lives}/5)`;
        if (!player.isKiller && player.lives > 0) {
          player.isKiller = true;
          action = `${player.name} is now a KILLER! (${player.lives}/5)`;
        }
      } else {
        action = `${player.name} already at max lives.`;
      }
    } else if (player.isKiller && result.multiplier === 2) {
      // Killer hitting someone else's double
      const target = this.players.find(
        p => p.targetNumber === result.segment && !p.eliminated && p !== player
      );
      if (target) {
        target.lives--;
        if (target.lives <= 0) {
          target.eliminated = true;
          target.isKiller = false;
          action = `${player.name} ELIMINATED ${target.name}!`;
        } else {
          action = `${player.name} hit ${target.name}! (${target.lives} lives left)`;
        }
      } else {
        action = result.total > 0 ? `${result.total} — no effect` : 'Miss!';
      }
    } else if (player.isKiller && result.segment === player.targetNumber && result.multiplier !== 2) {
      // Hitting your own number (non-double) as a killer — lose a life!
      player.lives--;
      if (player.lives <= 0) {
        player.eliminated = true;
        player.isKiller = false;
        action = `${player.name} hit own number and is OUT!`;
      } else {
        action = `${player.name} hit own number — lost a life! (${player.lives})`;
      }
    } else {
      action = result.total > 0 ? `${result.total} — no effect` : 'Miss!';
    }

    this.lastAction = action;
    this.checkGameOver();
    return action;
  }

  private checkGameOver() {
    const alive = this.activePlayers;
    if (alive.length <= 1 && this.players.length > 1) {
      this.gameOver = true;
      this.winner = alive[0] || null;
    }
  }

  endTurn() {
    this.dartsThisRound = 0;
    // Skip eliminated players
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      if (this.currentPlayerIndex === 0) this.round++;
    } while (this.currentPlayer.eliminated && !this.gameOver);
  }

  getAITarget(): { segment: number; multiplier: number } {
    const player = this.currentPlayer;
    if (!player.isKiller) {
      // AI tries to hit own double
      return { segment: player.targetNumber, multiplier: 2 };
    }
    // Find target with most lives to attack
    const targets = this.players.filter(p => !p.eliminated && p !== player && p.lives > 0);
    if (targets.length > 0) {
      targets.sort((a, b) => b.lives - a.lives);
      return { segment: targets[0].targetNumber, multiplier: 2 };
    }
    return { segment: player.targetNumber, multiplier: 2 };
  }

  getStatusText(): string {
    return this.players.map(p => {
      if (p.eliminated) return `${p.name}: ☠️ ELIMINATED`;
      const hearts = '❤️'.repeat(p.lives) + '🖤'.repeat(5 - p.lives);
      const label = p.isKiller ? ' [KILLER]' : '';
      return `${p.name} (#${p.targetNumber}): ${hearts}${label}`;
    }).join('\n');
  }
}
