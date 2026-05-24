// Game state and logic for dart game modes
import { ScoreResult } from './dartboard';
import { StatsTracker } from './stats';
import { AchievementManager } from './achievements';
import { AudioManager } from './audio';

export enum GameMode {
  FiveOhOne = '501',
  Cricket = 'cricket',
  AroundTheClock = 'around-the-clock',
  Shanghai = 'shanghai',
}

export enum GameState {
  Title = 'title',
  ModeSelect = 'mode-select',
  DifficultySelect = 'difficulty-select',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameover',
  Leaderboard = 'leaderboard',
  Achievements = 'achievements',
  Settings = 'settings',
  Help = 'help',
  Stats = 'stats',
}

export interface Player {
  name: string;
  score: number;
  isAI: boolean;
  // 501 specific
  remaining501?: number;
  // Cricket specific
  cricketMarks?: Record<number, number>; // segment -> marks (0-3)
  cricketPoints?: number;
  // Around the Clock specific
  currentTarget?: number;
  // Shanghai specific
  shanghaiRound?: number;
  shanghaiScore?: number;
}

export interface TurnHistory {
  player: number;
  throws: ScoreResult[];
  turnScore: number;
}

export class GameManager {
  state: GameState = GameState.Title;
  mode: GameMode = GameMode.FiveOhOne;
  players: Player[] = [];
  currentPlayer = 0;
  dartsThisRound = 0;
  round = 1;
  turnHistory: TurnHistory[] = [];
  currentTurnThrows: ScoreResult[] = [];
  turnScore = 0;
  maxRounds = 20; // for Shanghai
  vsAI = true;
  
  private stats: StatsTracker;
  private achievements: AchievementManager;
  private audio: AudioManager;

  constructor(stats: StatsTracker, achievements: AchievementManager, audio: AudioManager) {
    this.stats = stats;
    this.achievements = achievements;
    this.audio = audio;
  }

  setState(state: GameState) {
    this.state = state;
  }

  startGame(mode: GameMode, vsAI: boolean) {
    this.mode = mode;
    this.vsAI = vsAI;
    this.currentPlayer = 0;
    this.dartsThisRound = 0;
    this.round = 1;
    this.turnHistory = [];
    this.currentTurnThrows = [];
    this.turnScore = 0;

    // Initialize players
    this.players = [
      this.createPlayer('Player 1', false),
    ];
    if (vsAI) {
      this.players.push(this.createPlayer('CPU', true));
    } else {
      this.players.push(this.createPlayer('Player 2', false));
    }

    this.state = GameState.Playing;
    this.audio.playGameStart();
  }

  private createPlayer(name: string, isAI: boolean): Player {
    const player: Player = { name, score: 0, isAI };
    switch (this.mode) {
      case GameMode.FiveOhOne:
        player.remaining501 = 501;
        break;
      case GameMode.Cricket:
        player.cricketMarks = { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 };
        player.cricketPoints = 0;
        break;
      case GameMode.AroundTheClock:
        player.currentTarget = 1;
        break;
      case GameMode.Shanghai:
        player.shanghaiRound = 1;
        player.shanghaiScore = 0;
        break;
    }
    return player;
  }

  recordThrow(result: ScoreResult) {
    this.dartsThisRound++;
    this.currentTurnThrows.push(result);
    const player = this.players[this.currentPlayer];

    switch (this.mode) {
      case GameMode.FiveOhOne:
        this.handle501Throw(player, result);
        break;
      case GameMode.Cricket:
        this.handleCricketThrow(player, result);
        break;
      case GameMode.AroundTheClock:
        this.handleAroundTheClockThrow(player, result);
        break;
      case GameMode.Shanghai:
        this.handleShanghaiThrow(player, result);
        break;
    }
  }

  private handle501Throw(player: Player, result: ScoreResult) {
    if (result.total === 0) return;

    const newRemaining = (player.remaining501 || 0) - result.total;

    // Must finish on a double (or bullseye)
    if (newRemaining === 0 && (result.multiplier === 2 || result.segment === 25)) {
      player.remaining501 = 0;
      this.turnScore += result.total;
    } else if (newRemaining > 0) {
      player.remaining501 = newRemaining;
      this.turnScore += result.total;
    } else {
      // Bust — score goes back to what it was at the start of turn
      player.remaining501 = (player.remaining501 || 0) + this.turnScore;
      this.turnScore = 0;
      this.dartsThisRound = 3; // End turn early
    }
  }

  private handleCricketThrow(player: Player, result: ScoreResult) {
    const cricketNumbers = [15, 16, 17, 18, 19, 20, 25];
    if (!cricketNumbers.includes(result.segment)) return;

    const marks = player.cricketMarks!;
    const otherPlayer = this.players[1 - this.currentPlayer];
    const otherMarks = otherPlayer.cricketMarks!;

    const hitsToAdd = result.segment === 25 ? (result.multiplier === 2 ? 2 : 1) : result.multiplier;

    for (let i = 0; i < hitsToAdd; i++) {
      if (marks[result.segment] < 3) {
        marks[result.segment]++;
      } else if (otherMarks[result.segment] < 3) {
        // Score points if this number is open and opponent hasn't closed it
        player.cricketPoints = (player.cricketPoints || 0) + (result.segment === 25 ? 25 : result.segment);
      }
    }
  }

  private handleAroundTheClockThrow(player: Player, result: ScoreResult) {
    if (result.segment === player.currentTarget) {
      player.currentTarget = (player.currentTarget || 1) + 1;
      this.turnScore += result.total;
    }
  }

  private handleShanghaiThrow(player: Player, result: ScoreResult) {
    // In Shanghai, you can only score on the current round number
    if (result.segment === this.round) {
      player.shanghaiScore = (player.shanghaiScore || 0) + result.total;
      this.turnScore += result.total;
    }

    // Shanghai! — hit single, double, and triple of the current round in one turn
    const roundThrows = this.currentTurnThrows.filter(t => t.segment === this.round);
    const hasSingle = roundThrows.some(t => t.multiplier === 1);
    const hasDouble = roundThrows.some(t => t.multiplier === 2);
    const hasTriple = roundThrows.some(t => t.multiplier === 3);
    if (hasSingle && hasDouble && hasTriple) {
      // Instant win
      player.shanghaiScore = (player.shanghaiScore || 0) + 1000; // Big bonus
    }
  }

  endTurn() {
    this.turnHistory.push({
      player: this.currentPlayer,
      throws: [...this.currentTurnThrows],
      turnScore: this.turnScore,
    });

    this.currentTurnThrows = [];
    this.turnScore = 0;
    this.dartsThisRound = 0;

    // Switch players
    this.currentPlayer = 1 - this.currentPlayer;
    if (this.currentPlayer === 0) {
      this.round++;
    }
  }

  isAITurn(): boolean {
    return this.players[this.currentPlayer]?.isAI || false;
  }

  isGameOver(): boolean {
    switch (this.mode) {
      case GameMode.FiveOhOne:
        return this.players.some(p => p.remaining501 === 0);
      case GameMode.Cricket:
        return this.players.some(p => {
          const marks = p.cricketMarks!;
          return Object.values(marks).every(m => m >= 3);
        });
      case GameMode.AroundTheClock:
        return this.players.some(p => (p.currentTarget || 1) > 20);
      case GameMode.Shanghai:
        return this.round > this.maxRounds;
      default:
        return false;
    }
  }

  getWinner(): number {
    switch (this.mode) {
      case GameMode.FiveOhOne:
        if (this.players[0].remaining501 === 0) return 1;
        if (this.players[1].remaining501 === 0) return 2;
        return this.players[0].remaining501! < this.players[1].remaining501! ? 1 : 2;
      case GameMode.Cricket: {
        const p1Closed = Object.values(this.players[0].cricketMarks!).every(m => m >= 3);
        const p2Closed = Object.values(this.players[1].cricketMarks!).every(m => m >= 3);
        if (p1Closed && !p2Closed) return 1;
        if (p2Closed && !p1Closed) return 2;
        return (this.players[0].cricketPoints || 0) >= (this.players[1].cricketPoints || 0) ? 1 : 2;
      }
      case GameMode.AroundTheClock:
        return (this.players[0].currentTarget || 1) >= (this.players[1].currentTarget || 1) ? 1 : 2;
      case GameMode.Shanghai:
        return (this.players[0].shanghaiScore || 0) >= (this.players[1].shanghaiScore || 0) ? 1 : 2;
      default:
        return 1;
    }
  }

  getPlayerDisplay(playerIndex: number): string {
    const p = this.players[playerIndex];
    switch (this.mode) {
      case GameMode.FiveOhOne:
        return `${p.remaining501}`;
      case GameMode.Cricket:
        return `${p.cricketPoints || 0} pts`;
      case GameMode.AroundTheClock:
        return `Target: ${p.currentTarget}`;
      case GameMode.Shanghai:
        return `${p.shanghaiScore || 0}`;
      default:
        return '';
    }
  }

  getModeLabel(): string {
    switch (this.mode) {
      case GameMode.FiveOhOne: return '501';
      case GameMode.Cricket: return 'CRICKET';
      case GameMode.AroundTheClock: return 'AROUND THE CLOCK';
      case GameMode.Shanghai: return 'SHANGHAI';
    }
  }

  getRoundInfo(): string {
    switch (this.mode) {
      case GameMode.Shanghai:
        return `Round ${this.round} / ${this.maxRounds} (Target: ${this.round})`;
      default:
        return `Round ${this.round}`;
    }
  }
}
