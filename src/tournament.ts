// Tournament mode — multi-round bracket tournament
import { GameMode } from './game';
import { AIDifficulty } from './ai';

export interface TournamentRound {
  roundNumber: number;
  mode: GameMode;
  difficulty: AIDifficulty;
  opponentName: string;
  playerScore: string;
  opponentScore: string;
  won: boolean | null; // null = not played yet
}

export interface TournamentState {
  active: boolean;
  currentRound: number;
  rounds: TournamentRound[];
  totalWins: number;
  totalLosses: number;
  completed: boolean;
  championshipMode: GameMode; // primary mode for the tournament
}

// Tournament opponents with increasing difficulty
const TOURNAMENT_OPPONENTS = [
  { name: 'ROOKIE BOT', difficulty: AIDifficulty.Easy },
  { name: 'DART CADET', difficulty: AIDifficulty.Easy },
  { name: 'NEON THROWER', difficulty: AIDifficulty.Medium },
  { name: 'CIRCUIT ACE', difficulty: AIDifficulty.Medium },
  { name: 'VOID STRIKER', difficulty: AIDifficulty.Medium },
  { name: 'PHANTOM ARM', difficulty: AIDifficulty.Hard },
  { name: 'GRID MASTER', difficulty: AIDifficulty.Hard },
  { name: 'CHAMPION X', difficulty: AIDifficulty.Hard },
];

// Modes cycle through the tournament
const TOURNAMENT_MODES: GameMode[] = [
  GameMode.FiveOhOne,
  GameMode.Cricket,
  GameMode.AroundTheClock,
  GameMode.Shanghai,
  GameMode.FiveOhOne,
  GameMode.Cricket,
  GameMode.FiveOhOne,
  GameMode.FiveOhOne, // Final is always 501
];

export class TournamentManager {
  state: TournamentState;

  constructor() {
    this.state = this.createFreshState();
  }

  private createFreshState(): TournamentState {
    return {
      active: false,
      currentRound: 0,
      rounds: [],
      totalWins: 0,
      totalLosses: 0,
      completed: false,
      championshipMode: GameMode.FiveOhOne,
    };
  }

  startTournament() {
    this.state = this.createFreshState();
    this.state.active = true;
    this.state.rounds = TOURNAMENT_OPPONENTS.map((opp, i) => ({
      roundNumber: i + 1,
      mode: TOURNAMENT_MODES[i],
      difficulty: opp.difficulty,
      opponentName: opp.name,
      playerScore: '',
      opponentScore: '',
      won: null,
    }));
  }

  getCurrentRound(): TournamentRound | null {
    if (!this.state.active || this.state.completed) return null;
    return this.state.rounds[this.state.currentRound] || null;
  }

  getCurrentMode(): GameMode {
    const round = this.getCurrentRound();
    return round ? round.mode : GameMode.FiveOhOne;
  }

  getCurrentDifficulty(): AIDifficulty {
    const round = this.getCurrentRound();
    return round ? round.difficulty : AIDifficulty.Medium;
  }

  getCurrentOpponentName(): string {
    const round = this.getCurrentRound();
    return round ? round.opponentName : 'CPU';
  }

  recordResult(won: boolean, playerScore: string, opponentScore: string) {
    const round = this.getCurrentRound();
    if (!round) return;

    round.won = won;
    round.playerScore = playerScore;
    round.opponentScore = opponentScore;

    if (won) {
      this.state.totalWins++;
    } else {
      this.state.totalLosses++;
    }

    // Move to next round or end tournament
    if (this.state.currentRound < this.state.rounds.length - 1) {
      if (!won) {
        // Tournament over on loss (single elimination)
        this.state.completed = true;
      } else {
        this.state.currentRound++;
      }
    } else {
      this.state.completed = true;
    }
  }

  isChampion(): boolean {
    return this.state.completed && this.state.totalWins === this.state.rounds.length;
  }

  isEliminated(): boolean {
    return this.state.completed && this.state.totalLosses > 0;
  }

  getRoundLabel(): string {
    const round = this.state.currentRound;
    const total = this.state.rounds.length;
    if (round === total - 1) return 'CHAMPIONSHIP FINAL';
    if (round === total - 2) return 'SEMI-FINAL';
    if (round === total - 3) return 'QUARTER-FINAL';
    return `ROUND ${round + 1} OF ${total}`;
  }

  getModeLabel(mode: GameMode): string {
    switch (mode) {
      case GameMode.FiveOhOne: return '501';
      case GameMode.Cricket: return 'CRICKET';
      case GameMode.AroundTheClock: return 'AROUND THE CLOCK';
      case GameMode.Shanghai: return 'SHANGHAI';
      default: return '';
    }
  }

  getBracketDisplay(): string[] {
    return this.state.rounds.map((r, i) => {
      const status = r.won === null ? '...' : (r.won ? 'WIN' : 'LOSS');
      const active = i === this.state.currentRound && !this.state.completed ? ' ◀' : '';
      return `R${r.roundNumber}: ${r.opponentName} (${this.getModeLabel(r.mode)}) - ${status}${active}`;
    });
  }
}
