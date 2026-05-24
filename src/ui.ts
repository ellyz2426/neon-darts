// UI Manager — all spatial PanelUI panels
import {
  World,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  Follower,
  FollowBehavior,
  ScreenSpace,
  Vector3,
  Entity,
} from '@iwsdk/core';

import { GameManager, GameMode, GameState } from './game';
import { DartManager } from './darts';
import { AudioManager } from './audio';
import { AchievementManager, Achievement } from './achievements';
import { StatsTracker } from './stats';
import { AIOpponent, AIDifficulty } from './ai';
import { getCheckoutSuggestion, isCheckoutPossible } from './checkout';
import { DartSkinManager } from './skins';
import { ScoreResult } from './dartboard';
import { TournamentManager } from './tournament';
import { DailyChallengeManager } from './daily-challenge';
import { BoardThemeManager } from './board-themes';

type PanelName = 'title' | 'modeselect' | 'difficulty' | 'hud' | 'pause' | 'gameover'
  | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'message' | 'power'
  | 'throwhistory' | 'cricket' | 'checkout' | 'announce'
  | 'tournament' | 'tournhud' | 'tournresult' | 'daily' | 'dailyhud';

function setText(el: any, text: string) {
  if (!el) return;
  if (el.text && typeof el.text === 'object' && 'value' in el.text) {
    el.text.value = text;
  } else if ('innerText' in el) {
    el.innerText = text;
  }
}

export class UIManager {
  private world: World;
  private game: GameManager;
  private dartManager: DartManager;
  private audio: AudioManager;
  private achievements: AchievementManager;
  private stats: StatsTracker;
  private ai: AIOpponent;
  private tournament: TournamentManager;
  private daily: DailyChallengeManager;
  private boardThemeManager: BoardThemeManager;
  public skinManager: DartSkinManager;

  private panels: Map<PanelName, Entity> = new Map();
  private docs: Map<PanelName, UIKitDocument | null> = new Map();

  private messageTimer = 0;
  private announceTimer = 0;
  private currentPanel: PanelName | null = null;
  private throwHistory: ScoreResult[] = [];

  // External callbacks
  public onTournamentPlay: (() => void) | null = null;
  public onTournamentNext: (() => void) | null = null;
  public onTournamentQuit: (() => void) | null = null;
  public onDailyStart: (() => void) | null = null;

  constructor(
    world: World, game: GameManager, dartManager: DartManager,
    audio: AudioManager, achievements: AchievementManager,
    stats: StatsTracker, ai: AIOpponent,
    tournament: TournamentManager, daily: DailyChallengeManager,
    boardThemeManager: BoardThemeManager
  ) {
    this.world = world;
    this.game = game;
    this.dartManager = dartManager;
    this.audio = audio;
    this.achievements = achievements;
    this.stats = stats;
    this.ai = ai;
    this.tournament = tournament;
    this.daily = daily;
    this.boardThemeManager = boardThemeManager;
    this.skinManager = new DartSkinManager();

    this.createPanels();
    this.setupAchievementToast();
  }

  private createPanels() {
    // Title screen
    this.createPanel('title', '/ui/title.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.0,
    });

    // Mode select
    this.createPanel('modeselect', '/ui/modeselect.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.4,
    });

    // Difficulty select
    this.createPanel('difficulty', '/ui/difficulty.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7, maxHeight: 1.0,
    });

    // HUD
    this.createPanel('hud', '/ui/hud.json', {
      follower: true,
      offsetPosition: [0.25, -0.12, -0.5],
      maxWidth: 0.3, maxHeight: 0.15,
    });

    // Power bar
    this.createPanel('power', '/ui/power.json', {
      follower: true,
      offsetPosition: [0, -0.2, -0.5],
      maxWidth: 0.15, maxHeight: 0.04,
    });

    // Throw history
    this.createPanel('throwhistory', '/ui/throwhistory.json', {
      follower: true,
      offsetPosition: [-0.28, -0.12, -0.5],
      maxWidth: 0.2, maxHeight: 0.12,
    });

    // Checkout suggestion
    this.createPanel('checkout', '/ui/checkout.json', {
      follower: true,
      offsetPosition: [0.25, -0.22, -0.5],
      maxWidth: 0.22, maxHeight: 0.06,
    });

    // Cricket scoreboard
    this.createPanel('cricket', '/ui/cricket.json', {
      position: new Vector3(0.6, 1.7, -2.3),
      maxWidth: 0.5, maxHeight: 0.7,
    });

    // Turn announcement
    this.createPanel('announce', '/ui/announce.json', {
      follower: true,
      offsetPosition: [0, 0.05, -0.6],
      maxWidth: 0.4, maxHeight: 0.15,
    });

    // Pause
    this.createPanel('pause', '/ui/pause.json', {
      position: new Vector3(0, 1.7, -1.2),
      maxWidth: 0.6, maxHeight: 0.6,
    });

    // Game over
    this.createPanel('gameover', '/ui/gameover.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 0.8,
    });

    // Leaderboard
    this.createPanel('leaderboard', '/ui/leaderboard.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.0,
    });

    // Achievements
    this.createPanel('achievements', '/ui/achievements.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.2,
    });

    // Settings
    this.createPanel('settings', '/ui/settings.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7, maxHeight: 1.2,
    });

    // Help
    this.createPanel('help', '/ui/help.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.0,
    });

    // Stats
    this.createPanel('stats', '/ui/stats.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.0,
    });

    // Message toast
    this.createPanel('message', '/ui/message.json', {
      follower: true,
      offsetPosition: [0, 0.1, -0.5],
      maxWidth: 0.3, maxHeight: 0.06,
    });

    // Tournament bracket
    this.createPanel('tournament', '/ui/tournament.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8, maxHeight: 1.2,
    });

    // Tournament HUD
    this.createPanel('tournhud', '/ui/tournhud.json', {
      follower: true,
      offsetPosition: [-0.28, -0.2, -0.5],
      maxWidth: 0.18, maxHeight: 0.08,
    });

    // Tournament result
    this.createPanel('tournresult', '/ui/tournresult.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7, maxHeight: 0.8,
    });

    // Daily challenge panel
    this.createPanel('daily', '/ui/daily.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7, maxHeight: 1.0,
    });

    // Daily challenge HUD
    this.createPanel('dailyhud', '/ui/dailyhud.json', {
      follower: true,
      offsetPosition: [-0.28, -0.2, -0.5],
      maxWidth: 0.18, maxHeight: 0.08,
    });
  }

  private createPanel(name: PanelName, config: string, opts: {
    position?: Vector3;
    follower?: boolean;
    offsetPosition?: [number, number, number];
    maxWidth: number;
    maxHeight: number;
  }) {
    const entity = this.world.createTransformEntity(undefined, { persistent: true });

    if (opts.position) {
      entity.object3D.position.copy(opts.position);
    }

    entity.addComponent(PanelUI, {
      config,
      maxWidth: opts.maxWidth,
      maxHeight: opts.maxHeight,
    });

    if (opts.follower) {
      entity.addComponent(Follower, {
        target: (this.world as any).player?.head,
        offsetPosition: opts.offsetPosition || [0, 0, -0.5],
        behavior: FollowBehavior.PivotY,
        speed: 5,
        tolerance: 0.3,
      });
    }

    entity.object3D.visible = false;
    this.panels.set(name, entity);
    this.docs.set(name, null);
  }

  private getDoc(name: PanelName): UIKitDocument | null {
    let doc = this.docs.get(name);
    if (doc) return doc;

    const entity = this.panels.get(name);
    if (!entity) return null;

    doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined ?? null;
    if (doc) {
      this.docs.set(name, doc);
      this.bindEvents(name, doc);
    }
    return doc;
  }

  private bindEvents(name: PanelName, doc: UIKitDocument) {
    switch (name) {
      case 'title': {
        doc.getElementById('btn-play')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('modeselect');
        });
        doc.getElementById('btn-leaderboard')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.updateLeaderboard();
          this.showPanel('leaderboard');
        });
        doc.getElementById('btn-achievements')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.updateAchievements();
          this.showPanel('achievements');
        });
        doc.getElementById('btn-settings')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.updateSettingsDisplay();
          this.showPanel('settings');
        });
        doc.getElementById('btn-help')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('help');
        });
        doc.getElementById('btn-stats')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.updateStatsPanel();
          this.showPanel('stats');
        });
        break;
      }
      case 'modeselect': {
        doc.getElementById('btn-501')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.game.mode = GameMode.FiveOhOne;
          this.showPanel('difficulty');
        });
        doc.getElementById('btn-cricket')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.game.mode = GameMode.Cricket;
          this.showPanel('difficulty');
        });
        doc.getElementById('btn-around')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.game.mode = GameMode.AroundTheClock;
          this.showPanel('difficulty');
        });
        doc.getElementById('btn-shanghai')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.game.mode = GameMode.Shanghai;
          this.showPanel('difficulty');
        });
        doc.getElementById('btn-practice')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.throwHistory = [];
          this.game.startGame(GameMode.Practice, false);
          this.showPanel('hud');
        });
        doc.getElementById('btn-tournament')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.tournament.startTournament();
          this.showTournamentBracket();
        });
        doc.getElementById('btn-daily')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showDailyPanel();
        });
        doc.getElementById('btn-mode-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('title');
        });
        break;
      }
      case 'difficulty': {
        doc.getElementById('btn-easy')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.ai.difficulty = AIDifficulty.Easy;
          this.throwHistory = [];
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
          this.showTurnAnnouncement();
        });
        doc.getElementById('btn-medium')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.ai.difficulty = AIDifficulty.Medium;
          this.throwHistory = [];
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
          this.showTurnAnnouncement();
        });
        doc.getElementById('btn-hard')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.ai.difficulty = AIDifficulty.Hard;
          this.throwHistory = [];
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
          this.showTurnAnnouncement();
        });
        doc.getElementById('btn-friend')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.throwHistory = [];
          this.game.startGame(this.game.mode, false);
          this.showPanel('hud');
          this.showTurnAnnouncement();
        });
        doc.getElementById('btn-diff-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('modeselect');
        });
        break;
      }
      case 'pause': {
        doc.getElementById('btn-resume')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.game.setState(GameState.Playing);
          this.showPanel('hud');
        });
        doc.getElementById('btn-quit')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          this.daily.active = false;
          this.tournament.state.active = false;
          this.game.setState(GameState.Title);
          this.showPanel('title');
        });
        break;
      }
      case 'gameover': {
        doc.getElementById('btn-rematch')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          this.throwHistory = [];
          this.game.startGame(this.game.mode, this.game.vsAI);
          this.showPanel('hud');
          this.showTurnAnnouncement();
        });
        doc.getElementById('btn-menu')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          this.game.setState(GameState.Title);
          this.showPanel('title');
        });
        break;
      }
      case 'leaderboard':
      case 'achievements':
      case 'help':
      case 'stats': {
        doc.getElementById('btn-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('title');
        });
        break;
      }
      case 'settings': {
        doc.getElementById('btn-master-up')?.addEventListener('click', () => {
          this.audio.setVolume('master', this.audio.masterVolume + 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-master-down')?.addEventListener('click', () => {
          this.audio.setVolume('master', this.audio.masterVolume - 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-sfx-up')?.addEventListener('click', () => {
          this.audio.setVolume('sfx', this.audio.sfxVolume + 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-sfx-down')?.addEventListener('click', () => {
          this.audio.setVolume('sfx', this.audio.sfxVolume - 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-music-up')?.addEventListener('click', () => {
          this.audio.setVolume('music', this.audio.musicVolume + 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-music-down')?.addEventListener('click', () => {
          this.audio.setVolume('music', this.audio.musicVolume - 0.1);
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-skin-next')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.skinManager.nextSkin();
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-skin-prev')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.skinManager.prevSkin();
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-theme-next')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.boardThemeManager.nextTheme();
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-theme-prev')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.boardThemeManager.prevTheme();
          this.updateSettingsDisplay();
        });
        doc.getElementById('btn-settings-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('title');
        });
        break;
      }
      case 'tournament': {
        doc.getElementById('btn-tourn-play')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          if (this.onTournamentPlay) this.onTournamentPlay();
        });
        doc.getElementById('btn-tourn-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          if (this.onTournamentQuit) this.onTournamentQuit();
        });
        break;
      }
      case 'tournresult': {
        doc.getElementById('btn-tr-next')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          if (this.onTournamentNext) this.onTournamentNext();
        });
        doc.getElementById('btn-tr-menu')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          if (this.onTournamentQuit) this.onTournamentQuit();
        });
        break;
      }
      case 'daily': {
        doc.getElementById('btn-daily-start')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          if (this.onDailyStart) this.onDailyStart();
        });
        doc.getElementById('btn-daily-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('modeselect');
        });
        break;
      }
    }
  }

  showPanel(name: PanelName | 'hud') {
    const hudPanels: PanelName[] = ['hud', 'power', 'message', 'throwhistory', 'checkout', 'cricket', 'announce', 'tournhud', 'dailyhud'];

    for (const [pName, entity] of this.panels) {
      if (hudPanels.includes(pName)) continue;
      entity.object3D.visible = false;
    }

    if (name === 'hud') {
      const hud = this.panels.get('hud');
      if (hud) hud.object3D.visible = true;

      const hist = this.panels.get('throwhistory');
      if (hist) hist.object3D.visible = true;

      if (this.game.mode === GameMode.FiveOhOne) {
        this.updateCheckout();
      } else {
        const co = this.panels.get('checkout');
        if (co) co.object3D.visible = false;
      }

      if (this.game.mode === GameMode.Cricket) {
        const cric = this.panels.get('cricket');
        if (cric) cric.object3D.visible = true;
        this.updateCricketScoreboard();
      } else {
        const cric = this.panels.get('cricket');
        if (cric) cric.object3D.visible = false;
      }

      // Show tournament HUD if in tournament
      if (this.tournament.state.active && !this.tournament.state.completed) {
        const thud = this.panels.get('tournhud');
        if (thud) thud.object3D.visible = true;
        this.updateTournamentHud();
      } else {
        const thud = this.panels.get('tournhud');
        if (thud) thud.object3D.visible = false;
      }

      // Show daily HUD if in daily challenge
      if (this.daily.active) {
        const dhud = this.panels.get('dailyhud');
        if (dhud) dhud.object3D.visible = true;
        this.updateDailyHud();
      } else {
        const dhud = this.panels.get('dailyhud');
        if (dhud) dhud.object3D.visible = false;
      }

      this.updateGameState();
      this.updateThrowHistory();
      this.currentPanel = 'hud';

      for (const [pName, entity] of this.panels) {
        if (!hudPanels.includes(pName)) {
          entity.object3D.visible = false;
        }
      }
    } else {
      for (const n of hudPanels) {
        const p = this.panels.get(n);
        if (p) p.object3D.visible = false;
      }

      const panel = this.panels.get(name);
      if (panel) panel.object3D.visible = true;
      this.currentPanel = name;

      if (name === 'gameover') this.updateGameOverPanel();
      if (name === 'settings') this.updateSettingsDisplay();
    }
  }

  showPowerBar(visible: boolean) {
    const power = this.panels.get('power');
    if (power) power.object3D.visible = visible;
  }

  updatePower(power: number) {
    const doc = this.getDoc('power');
    if (!doc) return;
    const bar = doc.getElementById('power-fill');
    const label = doc.getElementById('power-label');
    const pct = Math.round(power * 100);
    setText(label, `${pct}%`);
    const filled = Math.round(power * 10);
    const blocks = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
    setText(bar, blocks);
  }

  recordThrow(result: ScoreResult) {
    this.throwHistory.push(result);
    if (this.throwHistory.length > 3) {
      this.throwHistory = this.throwHistory.slice(-3);
    }
    this.updateThrowHistory();

    if (this.game.mode === GameMode.FiveOhOne) {
      this.updateCheckout();
    }
    if (this.game.mode === GameMode.Cricket) {
      this.updateCricketScoreboard();
    }
  }

  clearThrowHistory() {
    this.throwHistory = [];
    this.updateThrowHistory();
  }

  private updateThrowHistory() {
    const doc = this.getDoc('throwhistory');
    if (!doc) return;

    for (let i = 0; i < 3; i++) {
      const result = this.throwHistory[i];
      const labelEl = doc.getElementById(`hist-label-${i}`);
      const scoreEl = doc.getElementById(`hist-score-${i}`);
      if (result) {
        setText(labelEl, result.label);
        setText(scoreEl, `${result.total}`);
      } else {
        setText(labelEl, '---');
        setText(scoreEl, '-');
      }
    }
  }

  private updateCheckout() {
    const co = this.panels.get('checkout');
    if (!co) return;

    const player = this.game.players[this.game.currentPlayer];
    if (!player) {
      co.object3D.visible = false;
      return;
    }

    const remaining = player.remaining501 || 0;
    if (remaining <= 170 && remaining >= 2 && isCheckoutPossible(remaining)) {
      co.object3D.visible = true;
      const doc = this.getDoc('checkout');
      if (doc) {
        setText(doc.getElementById('co-remaining'), `Remaining: ${remaining}`);
        const route = getCheckoutSuggestion(remaining);
        setText(doc.getElementById('co-route'), route || '---');
      }
    } else {
      co.object3D.visible = false;
    }
  }

  private updateCricketScoreboard() {
    const doc = this.getDoc('cricket');
    if (!doc) return;

    if (this.game.players.length < 2) return;

    const p1 = this.game.players[0];
    const p2 = this.game.players[1];

    setText(doc.getElementById('cric-p1-name'), p1.name);
    setText(doc.getElementById('cric-p2-name'), p2.name);

    const cricketNums = [20, 19, 18, 17, 16, 15, 25];
    for (const num of cricketNums) {
      const p1Marks = p1.cricketMarks?.[num] || 0;
      const p2Marks = p2.cricketMarks?.[num] || 0;
      setText(doc.getElementById(`cric-p1-${num}`), this.marksToSymbol(p1Marks));
      setText(doc.getElementById(`cric-p2-${num}`), this.marksToSymbol(p2Marks));
    }

    setText(doc.getElementById('cric-p1-pts'), `${p1.cricketPoints || 0}`);
    setText(doc.getElementById('cric-p2-pts'), `${p2.cricketPoints || 0}`);
  }

  private marksToSymbol(marks: number): string {
    if (marks === 0) return '---';
    if (marks === 1) return '/';
    if (marks === 2) return 'X';
    return '\u2718\u2718\u2718';
  }

  showTurnAnnouncement() {
    const player = this.game.players[this.game.currentPlayer];
    if (!player) return;

    const announce = this.panels.get('announce');
    if (announce) announce.object3D.visible = true;

    const doc = this.getDoc('announce');
    if (doc) {
      setText(doc.getElementById('announce-text'), player.isAI ? `${player.name}'S TURN` : `${player.name.toUpperCase()}'S TURN`);
      setText(doc.getElementById('announce-sub'), '3 darts remaining');
    }

    this.announceTimer = 1.5;
    this.audio.playTurnChange();
  }

  updateGameState() {
    const doc = this.getDoc('hud');
    if (!doc) return;

    setText(doc.getElementById('hud-mode'), this.game.getModeLabel());
    setText(doc.getElementById('hud-player'), this.game.players[this.game.currentPlayer]?.name || '');
    setText(doc.getElementById('hud-score'), this.game.getPlayerDisplay(this.game.currentPlayer));
    setText(doc.getElementById('hud-round'), this.game.getRoundInfo());
    setText(doc.getElementById('hud-darts'), `Darts: ${3 - this.game.dartsThisRound}/3`);
    setText(doc.getElementById('hud-turn'), `Turn: ${this.game.turnScore}`);
  }

  private updateGameOverPanel() {
    const doc = this.getDoc('gameover');
    if (!doc) return;

    const winner = this.game.getWinner();
    const winnerName = this.game.players[winner - 1]?.name || 'Player';
    setText(doc.getElementById('go-winner'), `${winnerName} WINS!`);
    setText(doc.getElementById('go-mode'), this.game.getModeLabel());

    const p1 = this.game.getPlayerDisplay(0);
    const p2 = this.game.players.length > 1 ? this.game.getPlayerDisplay(1) : '';
    setText(doc.getElementById('go-p1-score'), `${this.game.players[0]?.name}: ${p1}`);
    if (this.game.players.length > 1) {
      setText(doc.getElementById('go-p2-score'), `${this.game.players[1]?.name}: ${p2}`);
    }
  }

  private updateLeaderboard() {
    const doc = this.getDoc('leaderboard');
    if (!doc) return;

    try {
      const saved = localStorage.getItem('neon-darts-leaderboard');
      const entries: { mode: string; winner: string; score: string; date: string }[] = saved ? JSON.parse(saved) : [];
      for (let i = 0; i < 10; i++) {
        const entry = entries[i];
        const el = doc.getElementById(`lb-${i}`);
        if (el && entry) {
          setText(el, `${i + 1}. ${entry.mode} - ${entry.winner} (${entry.score})`);
        } else if (el) {
          setText(el, `${i + 1}. ---`);
        }
      }
    } catch {}
  }

  private updateAchievements() {
    const doc = this.getDoc('achievements');
    if (!doc) return;

    setText(doc.getElementById('ach-count'),
      `${this.achievements.getUnlockedCount()} / ${this.achievements.getTotalCount()}`);

    for (let i = 0; i < this.achievements.achievements.length; i++) {
      const a = this.achievements.achievements[i];
      const el = doc.getElementById(`ach-${i}`);
      if (el) {
        setText(el, `${a.unlocked ? '[X]' : '[ ]'} ${a.name} - ${a.description}`);
      }
    }
  }

  private updateSettingsDisplay() {
    const doc = this.getDoc('settings');
    if (!doc) return;

    setText(doc.getElementById('vol-master'), `Master: ${Math.round(this.audio.masterVolume * 100)}%`);
    setText(doc.getElementById('vol-sfx'), `SFX: ${Math.round(this.audio.sfxVolume * 100)}%`);
    setText(doc.getElementById('vol-music'), `Music: ${Math.round(this.audio.musicVolume * 100)}%`);
    setText(doc.getElementById('skin-name'), this.skinManager.currentSkin.name);
    setText(doc.getElementById('theme-name'), this.boardThemeManager.currentTheme.name);
  }

  private updateStatsPanel() {
    const doc = this.getDoc('stats');
    if (!doc) return;

    const s = this.stats.stats;
    setText(doc.getElementById('stat-games'), `Games Played: ${s.gamesPlayed}`);
    setText(doc.getElementById('stat-wins'), `Wins: ${s.gamesWon} (${this.stats.getWinRate()}%)`);
    setText(doc.getElementById('stat-darts'), `Darts Thrown: ${s.totalDartsThrown}`);
    setText(doc.getElementById('stat-accuracy'), `Accuracy: ${this.stats.getAccuracy()}%`);
    setText(doc.getElementById('stat-bullseyes'), `Bullseyes: ${s.bullseyes}`);
    setText(doc.getElementById('stat-triples'), `Triples: ${s.triples}`);
    setText(doc.getElementById('stat-doubles'), `Doubles: ${s.doubles}`);
    setText(doc.getElementById('stat-180s'), `180s: ${s.oneEighties}`);
    setText(doc.getElementById('stat-best-turn'), `Best Turn: ${s.highestSingleTurn}`);
    setText(doc.getElementById('stat-avg'), `Avg Turn: ${this.stats.getAverageScore()}`);
  }

  showMessage(text: string, duration = 2.0) {
    const panel = this.panels.get('message');
    if (panel) panel.object3D.visible = true;
    this.messageTimer = duration;

    const doc = this.getDoc('message');
    if (doc) setText(doc.getElementById('msg-text'), text);
  }

  // Tournament UI
  showTournamentBracket() {
    this.showPanel('tournament');
    const doc = this.getDoc('tournament');
    if (!doc) return;

    const bracket = this.tournament.getBracketDisplay();
    for (let i = 0; i < 8; i++) {
      const el = doc.getElementById(`tourn-bracket-${i}`);
      if (el && bracket[i]) {
        setText(el, bracket[i]);
      }
    }

    setText(doc.getElementById('tourn-status'), this.tournament.getRoundLabel());
  }

  showTournamentResult(won: boolean) {
    this.showPanel('tournresult');
    const doc = this.getDoc('tournresult');
    if (!doc) return;

    if (this.tournament.isChampion()) {
      setText(doc.getElementById('tr-title'), 'CHAMPION!');
      setText(doc.getElementById('tr-result'), 'You defeated all challengers!');
    } else if (this.tournament.isEliminated()) {
      setText(doc.getElementById('tr-title'), 'ELIMINATED');
      setText(doc.getElementById('tr-result'), 'Better luck next time!');
    } else {
      setText(doc.getElementById('tr-title'), won ? 'ROUND WON!' : 'ROUND LOST');
      setText(doc.getElementById('tr-result'), won ? 'Advancing to next round...' : 'Tournament over!');
    }

    const p1 = this.game.getPlayerDisplay(0);
    const p2 = this.game.getPlayerDisplay(1);
    setText(doc.getElementById('tr-scores'), `${this.game.players[0]?.name}: ${p1} | ${this.game.players[1]?.name}: ${p2}`);
    setText(doc.getElementById('tr-record'), `Record: ${this.tournament.state.totalWins} - ${this.tournament.state.totalLosses}`);
  }

  private updateTournamentHud() {
    const doc = this.getDoc('tournhud');
    if (!doc) return;

    setText(doc.getElementById('thud-round'), this.tournament.getRoundLabel());
    setText(doc.getElementById('thud-opponent'), `vs ${this.tournament.getCurrentOpponentName()}`);
  }

  // Daily challenge UI
  showDailyPanel() {
    this.showPanel('daily');
    const doc = this.getDoc('daily');
    if (!doc) return;

    const ch = this.daily.currentChallenge;
    setText(doc.getElementById('daily-date'), ch.date);
    setText(doc.getElementById('daily-name'), ch.title);
    setText(doc.getElementById('daily-desc'), ch.description);
    setText(doc.getElementById('daily-progress'), this.daily.getProgressText());
    setText(doc.getElementById('daily-darts'), `Darts: ${ch.dartsAllowed}`);
    setText(doc.getElementById('daily-reward'), `Reward: ${ch.reward}`);
    setText(doc.getElementById('daily-history'), `Completed: ${this.daily.getCompletedCount()} | Attempts today: ${this.daily.getTodayAttempts()}`);
  }

  showDailyHud(visible: boolean) {
    const dhud = this.panels.get('dailyhud');
    if (dhud) dhud.object3D.visible = visible;
  }

  updateDailyHud() {
    const doc = this.getDoc('dailyhud');
    if (!doc) return;

    setText(doc.getElementById('dhud-title'), this.daily.currentChallenge.title);
    setText(doc.getElementById('dhud-progress'), this.daily.getProgressText());
    setText(doc.getElementById('dhud-darts'), `${this.daily.getDartsRemaining()} darts left`);
  }

  private setupAchievementToast() {
    this.achievements.onUnlock = (achievement: Achievement) => {
      this.showMessage(`UNLOCKED: ${achievement.name}`, 3.0);
      this.audio.playAchievement();
    };
  }

  update(dt: number) {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        const panel = this.panels.get('message');
        if (panel) panel.object3D.visible = false;
      }
    }

    if (this.announceTimer > 0) {
      this.announceTimer -= dt;
      if (this.announceTimer <= 0) {
        const panel = this.panels.get('announce');
        if (panel) panel.object3D.visible = false;
      }
    }

    for (const [name] of this.panels) {
      if (!this.docs.get(name as PanelName)) {
        this.getDoc(name as PanelName);
      }
    }
  }
}
