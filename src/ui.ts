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

type PanelName = 'title' | 'modeselect' | 'difficulty' | 'hud' | 'pause' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'message' | 'power';

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

  private panels: Map<PanelName, Entity> = new Map();
  private docs: Map<PanelName, UIKitDocument | null> = new Map();

  private messageTimer = 0;
  private currentPanel: PanelName | null = null;

  constructor(
    world: World, game: GameManager, dartManager: DartManager,
    audio: AudioManager, achievements: AchievementManager,
    stats: StatsTracker, ai: AIOpponent
  ) {
    this.world = world;
    this.game = game;
    this.dartManager = dartManager;
    this.audio = audio;
    this.achievements = achievements;
    this.stats = stats;
    this.ai = ai;

    this.createPanels();
    this.setupAchievementToast();
  }

  private createPanels() {
    // Title screen — world-space, floating in front of the board
    this.createPanel('title', '/ui/title.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Mode select
    this.createPanel('modeselect', '/ui/modeselect.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Difficulty select
    this.createPanel('difficulty', '/ui/difficulty.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7,
      maxHeight: 0.8,
    });

    // HUD — head-following
    this.createPanel('hud', '/ui/hud.json', {
      follower: true,
      offsetPosition: [0.25, -0.12, -0.5] as [number, number, number],
      maxWidth: 0.3,
      maxHeight: 0.15,
    });

    // Power bar — head-following, bottom center
    this.createPanel('power', '/ui/power.json', {
      follower: true,
      offsetPosition: [0, -0.2, -0.5] as [number, number, number],
      maxWidth: 0.15,
      maxHeight: 0.04,
    });

    // Pause
    this.createPanel('pause', '/ui/pause.json', {
      position: new Vector3(0, 1.7, -1.2),
      maxWidth: 0.6,
      maxHeight: 0.6,
    });

    // Game over
    this.createPanel('gameover', '/ui/gameover.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 0.8,
    });

    // Leaderboard
    this.createPanel('leaderboard', '/ui/leaderboard.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Achievements
    this.createPanel('achievements', '/ui/achievements.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Settings
    this.createPanel('settings', '/ui/settings.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.7,
      maxHeight: 0.9,
    });

    // Help
    this.createPanel('help', '/ui/help.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Stats
    this.createPanel('stats', '/ui/stats.json', {
      position: new Vector3(0, 1.7, -1.5),
      maxWidth: 0.8,
      maxHeight: 1.0,
    });

    // Message toast — head-following, top
    this.createPanel('message', '/ui/message.json', {
      follower: true,
      offsetPosition: [0, 0.1, -0.5] as [number, number, number],
      maxWidth: 0.3,
      maxHeight: 0.06,
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

    // Hide initially
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
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
        });
        doc.getElementById('btn-medium')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.ai.difficulty = AIDifficulty.Medium;
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
        });
        doc.getElementById('btn-hard')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.ai.difficulty = AIDifficulty.Hard;
          this.game.startGame(this.game.mode, true);
          this.showPanel('hud');
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
          this.game.setState(GameState.Title);
          this.showPanel('title');
        });
        break;
      }
      case 'gameover': {
        doc.getElementById('btn-rematch')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.dartManager.clearDarts();
          this.game.startGame(this.game.mode, this.game.vsAI);
          this.showPanel('hud');
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
        doc.getElementById('btn-settings-back')?.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.showPanel('title');
        });
        break;
      }
    }
  }

  showPanel(name: PanelName | 'hud') {
    // Hide all non-HUD panels
    for (const [pName, entity] of this.panels) {
      if (pName === 'hud' || pName === 'power' || pName === 'message') continue;
      entity.object3D.visible = false;
    }

    if (name === 'hud') {
      // Show HUD only
      const hud = this.panels.get('hud');
      if (hud) hud.object3D.visible = true;
      this.updateGameState();
      this.currentPanel = 'hud';
      // Hide other panels
      for (const [pName, entity] of this.panels) {
        if (pName !== 'hud' && pName !== 'power' && pName !== 'message') {
          entity.object3D.visible = false;
        }
      }
    } else {
      // Hide HUD when showing menu panels
      const hud = this.panels.get('hud');
      if (hud) hud.object3D.visible = false;
      const power = this.panels.get('power');
      if (power) power.object3D.visible = false;

      const panel = this.panels.get(name);
      if (panel) panel.object3D.visible = true;
      this.currentPanel = name;

      // Update panel content
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
    // Update bar width visually by changing text
    const filled = Math.round(power * 10);
    const blocks = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
    setText(bar, blocks);
  }

  updateGameState() {
    const doc = this.getDoc('hud');
    if (!doc) return;

    const mode = doc.getElementById('hud-mode');
    const player = doc.getElementById('hud-player');
    const score = doc.getElementById('hud-score');
    const round = doc.getElementById('hud-round');
    const darts = doc.getElementById('hud-darts');
    const turnScore = doc.getElementById('hud-turn');

    setText(mode, this.game.getModeLabel());
    setText(player, this.game.players[this.game.currentPlayer]?.name || '');
    setText(score, this.game.getPlayerDisplay(this.game.currentPlayer));
    setText(round, this.game.getRoundInfo());
    setText(darts, `Darts: ${3 - this.game.dartsThisRound}/3`);
    setText(turnScore, `Turn: ${this.game.turnScore}`);
  }

  private updateGameOverPanel() {
    const doc = this.getDoc('gameover');
    if (!doc) return;

    const winner = this.game.getWinner();
    const winnerName = this.game.players[winner - 1]?.name || 'Player';
    setText(doc.getElementById('go-winner'), `${winnerName} WINS!`);
    setText(doc.getElementById('go-mode'), this.game.getModeLabel());

    // Final scores
    const p1 = this.game.getPlayerDisplay(0);
    const p2 = this.game.getPlayerDisplay(1);
    setText(doc.getElementById('go-p1-score'), `${this.game.players[0]?.name}: ${p1}`);
    setText(doc.getElementById('go-p2-score'), `${this.game.players[1]?.name}: ${p2}`);
  }

  private updateLeaderboard() {
    // Leaderboard from localStorage
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

  private setupAchievementToast() {
    this.achievements.onUnlock = (achievement: Achievement) => {
      this.showMessage(`UNLOCKED: ${achievement.name}`, 3.0);
      this.audio.playAchievement();
    };
  }

  update(dt: number) {
    // Message timer
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        const panel = this.panels.get('message');
        if (panel) panel.object3D.visible = false;
      }
    }

    // Re-try getting docs for panels that haven't loaded yet
    for (const [name] of this.panels) {
      if (!this.docs.get(name as PanelName)) {
        this.getDoc(name as PanelName);
      }
    }
  }
}
