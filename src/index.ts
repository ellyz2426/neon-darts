// Neon Darts VR — Main entry point
import {
  World,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  Follower,
  FollowBehavior,
  ScreenSpace,
  Mesh,
  Group,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  ConeGeometry,
  TorusGeometry,
  RingGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector3,
  Quaternion,
  Euler,
  Matrix4,
  Fog,
  AmbientLight,
  PointLight,
  DirectionalLight,
  BufferGeometry,
  Float32BufferAttribute,
  EdgesGeometry,
  LineSegments,
  AdditiveBlending,
  DoubleSide,
  BackSide,
  FrontSide,
  MathUtils,
  Raycaster,
  Vector2,
  Object3D,
  CircleGeometry,
} from '@iwsdk/core';

import { createDartboard, BOARD_SEGMENTS, getScoreForPosition, ScoreResult } from './dartboard';
import { DartManager } from './darts';
import { AudioManager } from './audio';
import { createEnvironment } from './environment';
import { GameManager, GameMode, GameState } from './game';
import { AIOpponent, AIDifficulty } from './ai';
import { UIManager } from './ui';
import { AchievementManager } from './achievements';
import { StatsTracker } from './stats';
import { EffectsManager } from './effects';
import { ComboTracker } from './combo';
import { ScorePopupManager } from './score-popup';
import { AimCursor } from './aim-cursor';
import { TournamentManager } from './tournament';
import { DailyChallengeManager } from './daily-challenge';
import { BoardThemeManager } from './board-themes';
import { ParticleSystem } from './particles';
import { KillerManager } from './killer';
import { MatchHistoryManager } from './match-history';
import { ProfileManager } from './profile';
import { HapticManager } from './haptics';
import { StreakEffects } from './streak-effects';
import { DartTrailManager } from './dart-trail';
import { BoardHitEffects } from './board-hit-effects';
import { CameraShake } from './camera-shake';
import { WarmupManager } from './warmup';
import { ModeLeaderboardManager } from './mode-leaderboard';
import { ThrowReplaySystem } from './throw-replay';
import { PowerUpManager } from './power-ups';
import { TutorialManager } from './tutorial';
import { SoundVisualizer } from './sound-visualizer';
import { TrainingDrillManager } from './training-drills';
import { CommentatorManager } from './commentator';

async function main() {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' as const },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: true,
      locomotion: false,
      physics: true,
      spatialUI: true,
    },
    render: {
      near: 0.01,
      far: 200,
      camera: { position: [0, 1.6, 0], lookAt: [0, 1.73, -2.37] },
    },
  } as any);

  // Core systems
  const audio = new AudioManager();
  const stats = new StatsTracker();
  const effects = new EffectsManager(world);
  const achievements = new AchievementManager(stats);
  const scorePopups = new ScorePopupManager(world);
  const aimCursor = new AimCursor(world);
  const tournament = new TournamentManager();
  const daily = new DailyChallengeManager();
  const boardThemeManager = new BoardThemeManager();

  // Create environment
  createEnvironment(world);

  // Ambient particles
  const particles = new ParticleSystem(world);

  // Create dartboard at standard distance (2.37m away, center at 1.73m height)
  const boardGroup = createDartboard(world);
  boardGroup.position.set(0, 1.73, -2.37);
  world.scene.add(boardGroup);

  // Dart manager
  const dartManager = new DartManager(world, boardGroup, audio, effects);

  // Game manager
  const game = new GameManager(stats, achievements, audio);

  // AI opponent
  const ai = new AIOpponent();

  // UI manager
  const ui = new UIManager(world, game, dartManager, audio, achievements, stats, ai, tournament, daily, boardThemeManager);

  // Connect dart skin manager
  dartManager.setSkinManager(ui.skinManager);

  // Haptic feedback
  const haptics = new HapticManager(world);
  haptics.setEnabled(ui.profileManager.profile.hapticEnabled);

  // Streak visual effects
  const streakEffects = new StreakEffects(world, boardGroup.position);

  // Dart trail effects
  const dartTrails = new DartTrailManager(world.scene as any);

  // Board hit flash effects
  const boardHitEffects = new BoardHitEffects(world.scene as any);

  // Camera shake
  const cameraShake = new CameraShake();
  const cam = (world as any).camera;
  if (cam) cameraShake.setCamera(cam);

  // Warm-up system
  const warmup = new WarmupManager();

  // Per-mode leaderboard
  const modeLeaderboard = new ModeLeaderboardManager();

  // Throw replay
  const throwReplay = new ThrowReplaySystem();

  // Power-ups
  const powerUps = new PowerUpManager();
  powerUps.setCallbacks(
    (pu) => ui.showMessage(`${pu.icon} ${pu.name}!`, 2.0),
    (pu) => ui.showMessage(`${pu.icon} ${pu.name} expired`, 1.5),
  );

  // Tutorial system
  const tutorial = new TutorialManager();

  // Sound visualizer
  const soundVisualizer = new SoundVisualizer(world.scene as any, boardGroup.position);

  // Training drills
  const drills = new TrainingDrillManager();

  // Commentator
  const commentator = new CommentatorManager();

  // Combo tracker
  const combo = new ComboTracker();

  // Input state
  let isCharging = false;
  let chargeStart = 0;
  let aimX = 0;
  let aimY = 0;
  const maxCharge = 1500;
  let mouseX = 0;
  let mouseY = 0;

  // Browser mouse input
  const canvas = container.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0 && game.state === GameState.Playing && !game.isAITurn()) {
        if (dartManager.canThrow()) {
          isCharging = true;
          chargeStart = performance.now();
          ui.showPowerBar(true);
        }
      }
    });

    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0 && isCharging) {
        const chargeDuration = Math.min(performance.now() - chargeStart, maxCharge);
        const power = chargeDuration / maxCharge;
        dartManager.throwDart(aimX, aimY, power);
        haptics.onThrow(power);
        dartTrails.startTrail('mouse-throw-' + Date.now(), 0);
        throwReplay.startRecording();
        soundVisualizer.pulse(power);
        isCharging = false;
        ui.showPowerBar(false);
        ui.updatePower(0);
        aimCursor.hide();
      }
    });

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (game.state === GameState.Playing) {
        const rect = canvas.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(mouseX, mouseY), (world as any).camera || (world as any).renderer?.xr?.getCamera?.() || world.scene.children.find((c: any) => c.isCamera));

        const boardPlane = new PlaneGeometry(1, 1);
        const boardMesh = new Mesh(boardPlane, new MeshBasicMaterial({ visible: false }));
        boardMesh.position.copy(boardGroup.position);
        world.scene.add(boardMesh);

        const intersects = raycaster.intersectObject(boardMesh);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          aimX = point.x - boardGroup.position.x;
          aimY = point.y - boardGroup.position.y;

          // Update aim cursor
          if (!game.isAITurn()) {
            aimCursor.setPosition(boardGroup.position, aimX, aimY);
            aimCursor.show();
          }
        }
        world.scene.remove(boardMesh);
        boardMesh.geometry.dispose();
      }
    });
  }

  // Keyboard input
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (game.state === GameState.Playing) {
          game.setState(GameState.Paused);
          ui.showPanel('pause');
          aimCursor.hide();
        } else if (game.state === GameState.Paused) {
          game.setState(GameState.Playing);
          ui.showPanel('hud');
        }
        break;
    }
  });

  // Dart hit callback
  dartManager.onDartHit = (result: ScoreResult) => {
    // Track for match history
    ui.trackThrowForStats(result);

    // Board hit flash
    boardHitEffects.triggerHit(
      boardGroup.position.x + result.x,
      boardGroup.position.y + result.y,
      boardGroup.position.z,
      result.multiplier,
      result.segment === 25
    );

    // Camera shake based on hit type
    if (result.segment === 25) {
      cameraShake.shake('bullseye');
    } else if (result.multiplier === 3) {
      cameraShake.shake('triple');
    } else if (result.total > 0) {
      cameraShake.shake('hit');
    } else {
      cameraShake.shake('miss');
    }

    // Sound visualizer pulse
    soundVisualizer.hitPulse(result.multiplier);

    // Commentary
    let commentary: string | null = null;
    if (result.segment === 25) {
      commentary = commentator.getComment('throw_bullseye');
    } else if (result.multiplier === 3) {
      if (result.segment === 20) {
        commentary = commentator.getComment('triple_20');
      } else {
        commentary = commentator.getComment('throw_triple');
      }
    } else if (result.multiplier === 2) {
      commentary = commentator.getComment('throw_double');
    } else if (result.total === 0) {
      commentary = commentator.getComment('throw_miss');
    }

    // Training drill tracking
    if (drills.isActive()) {
      const drillResult = drills.registerThrow(result);
      if (drillResult.message) {
        ui.showMessage(drillResult.message, 1.5);
      }
    }

    // Stop recording throw trajectory
    throwReplay.stopRecording(
      new Vector3(boardGroup.position.x + result.x, boardGroup.position.y + result.y, boardGroup.position.z),
      result.total,
      result.multiplier,
      result.segment
    );

    // Power-up score modification
    const scoreMultiplier = powerUps.getScoreMultiplier();
    if (scoreMultiplier > 1 && result.total > 0) {
      result.total = Math.round(result.total * scoreMultiplier);
    }
    powerUps.onThrow();

    // Haptic feedback
    if (result.total > 0) {
      haptics.onHit(result.multiplier, result.segment);
    } else {
      haptics.onMiss();
    }

    // Handle Killer mode specifically
    if (game.mode === GameMode.Killer) {
      ui.handleKillerThrow(result);
    }

    game.recordThrow(result);
    ui.recordThrow(result);
    ui.updateGameState();
    effects.spawnHitParticles(
      new Vector3(
        boardGroup.position.x + result.x,
        boardGroup.position.y + result.y,
        boardGroup.position.z + 0.02
      ),
      result.multiplier === 3 ? '#ff00ff' : result.multiplier === 2 ? '#00ff00' : '#00ffff'
    );

    // Floating score popup
    scorePopups.spawnScorePopup(
      new Vector3(
        boardGroup.position.x + result.x,
        boardGroup.position.y + result.y,
        boardGroup.position.z
      ),
      result.total, result.multiplier, result.segment
    );

    // Track stats
    stats.recordThrow(result.total, result.multiplier, result.segment);

    // Particle burst for high-value hits
    if (result.multiplier === 3 || result.segment === 25) {
      const hitPos = new Vector3(
        boardGroup.position.x + result.x,
        boardGroup.position.y + result.y,
        boardGroup.position.z + 0.05
      );
      const burstColor = result.segment === 25 ? '#ffff00' : '#ff00ff';
      particles.burst(hitPos, burstColor, result.multiplier === 3 ? 20 : 15);
    }

    // Daily challenge tracking
    if (daily.active) {
      daily.recordThrow(result.total, result.multiplier, result.segment);
      ui.updateDailyHud();

      if (!daily.active) {
        // Challenge ended (ran out of darts)
        setTimeout(() => {
          if (daily.isCompleted()) {
            achievements.unlockDaily();
            achievements.unlockDailyStreak(daily.getCompletedCount());
            ui.showMessage('CHALLENGE COMPLETE!', 3.0);
            audio.playAchievement();
          } else {
            ui.showMessage('CHALLENGE FAILED', 2.0);
          }
          setTimeout(() => {
            dartManager.clearDarts();
            game.setState(GameState.Title);
            ui.showPanel('title');
          }, 2000);
        }, 800);
        return;
      }
    }

    // Combo feedback
    const comboResult = combo.onThrow(result.total);
    if (comboResult) {
      ui.showMessage(comboResult.label, 1.5);
      streakEffects.triggerStreak(comboResult.count || 1);
      powerUps.onComboReached(comboResult.count || 1);
    }

    // Streak effect on triples and bullseyes
    if (result.multiplier === 3) {
      streakEffects.triggerHighlight(result.x, result.y, '#ff00ff');
    } else if (result.segment === 25) {
      streakEffects.triggerHighlight(result.x, result.y, '#ffff00');
    }

    // Check achievements
    achievements.checkAll(game, result);

    // Check if turn is over (3 darts thrown)
    if (game.dartsThisRound >= 3) {
      stats.recordTurn(game.turnScore);

      const turnCombo = combo.onTurnEnd(game.turnScore);
      if (turnCombo) {
        ui.showMessage(turnCombo.label, 2.0);
      }

      setTimeout(() => {
        // Handle killer turn end
        if (game.mode === GameMode.Killer) {
          ui.killer.endTurn();
          ui.updateKillerPanel();
        }

        game.endTurn();
        dartManager.clearDarts();
        ui.clearThrowHistory();

        if (game.isGameOver() || (game.mode === GameMode.Killer && ui.killer.gameOver)) {
          const won = game.mode === GameMode.Killer
            ? (ui.killer.winner?.name === ui.profileManager.nickname)
            : game.getWinner() === 1;

          // Record match history
          ui.recordMatchResult(won);

          // Particle celebration burst on win
          if (won) {
            particles.burst(boardGroup.position.clone(), '#00ff88', 30);
          }

          // Tournament handling
          if (tournament.state.active) {
            const playerScore = game.getPlayerDisplay(0);
            const oppScore = game.getPlayerDisplay(1);
            tournament.recordResult(won, playerScore, oppScore);

            if (tournament.isChampion()) {
              achievements.unlockTournament();
            }

            ui.showTournamentResult(won);
            audio.playGameOver(won);
            stats.recordGame(game.mode, won);
            achievements.checkAll(game, null);
            return;
          }

          game.setState(GameState.GameOver);
          ui.showPanel('gameover');
          audio.playGameOver(won);
          haptics.onGameOver(won);
          cameraShake.shake('gameWin');
          stats.recordGame(game.mode, won);
          achievements.checkAll(game, null);
          saveToLeaderboard(game);
          // Per-mode leaderboard
          const modeScore = parseInt(game.getPlayerDisplay(0)) || game.turnScore;
          modeLeaderboard.addScore(game.mode, ui.profileManager.nickname, modeScore);
        } else if (game.isAITurn()) {
          ui.showTurnAnnouncement();
          setTimeout(() => performAITurn(), 1800);
        } else {
          ui.showTurnAnnouncement();
        }

        ui.updateGameState();
      }, 600);
    }
  };

  // Save result to leaderboard
  function saveToLeaderboard(game: GameManager) {
    try {
      const saved = localStorage.getItem('neon-darts-leaderboard');
      const entries: { mode: string; winner: string; score: string; date: string }[] = saved ? JSON.parse(saved) : [];
      const winner = game.getWinner();
      entries.unshift({
        mode: game.getModeLabel(),
        winner: game.players[winner - 1]?.name || 'Player',
        score: game.getPlayerDisplay(winner - 1),
        date: new Date().toISOString().split('T')[0],
      });
      while (entries.length > 50) entries.pop();
      localStorage.setItem('neon-darts-leaderboard', JSON.stringify(entries));
    } catch {}
  }

  // AI turn
  function performAITurn() {
    if (!game.isAITurn() || game.state !== GameState.Playing) return;

    const target = ai.getTarget(game);
    const { x, y } = ai.applyNoise(target.x, target.y);

    dartManager.throwDart(x, y, 0.7 + Math.random() * 0.2);

    if (game.dartsThisRound < 2) {
      setTimeout(() => {
        if (game.isAITurn() && game.state === GameState.Playing && game.dartsThisRound < 3) {
          performAITurn();
        }
      }, 1200);
    }
  }

  // Tournament: start round game
  ui.onTournamentPlay = () => {
    const round = tournament.getCurrentRound();
    if (!round) return;
    ai.difficulty = round.difficulty;
    game.startGame(round.mode, true);
    game.players[1].name = round.opponentName;
    ui.showPanel('hud');
    ui.showTurnAnnouncement();
  };

  // Tournament: advance to next round
  ui.onTournamentNext = () => {
    if (tournament.state.completed) {
      ui.showPanel('title');
      return;
    }
    ui.showTournamentBracket();
  };

  // Tournament: quit
  ui.onTournamentQuit = () => {
    tournament.state.active = false;
    tournament.state.completed = true;
    dartManager.clearDarts();
    game.setState(GameState.Title);
    ui.showPanel('title');
  };

  // Daily challenge: start
  ui.onDailyStart = () => {
    daily.startChallenge();
    game.startGame(GameMode.Practice, false);
    ui.showPanel('hud');
    ui.showDailyHud(true);
  };

  // XR input handling
  let xrCharging = false;
  let xrChargeStart = 0;

  // Animated environment state
  let animTime = 0;

  // Update loop
  let lastTime = 0;
  function update(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    // Update charging power bar
    if (isCharging) {
      const elapsed = Math.min(performance.now() - chargeStart, maxCharge);
      ui.updatePower(elapsed / maxCharge);
    }

    // XR input
    const rightGamepad = (world.input as any)?.xr?.gamepads?.right;
    if (rightGamepad) {
      const triggerDown = rightGamepad.getButtonDown?.(0);
      const triggerUp = rightGamepad.getButtonUp?.(0);
      const triggerValue = rightGamepad.getButtonValue?.(0) ?? 0;
      const bDown = rightGamepad.getButtonDown?.(4);

      if (game.state === GameState.Playing && !game.isAITurn()) {
        if (triggerDown && dartManager.canThrow()) {
          xrCharging = true;
          xrChargeStart = performance.now();
          ui.showPowerBar(true);
        }

        if (xrCharging) {
          const elapsed = Math.min(performance.now() - xrChargeStart, maxCharge);
          const chargePower = elapsed / maxCharge;
          ui.updatePower(chargePower);
          haptics.onCharging(chargePower);

          if (triggerUp || triggerValue < 0.1) {
            const power = elapsed / maxCharge;
            const spaces = (world as any).playerSpaceEntities;
            if (spaces?.raySpaces?.right) {
              const raySpace = spaces.raySpaces.right;
              const dir = new Vector3(0, 0, -1).applyQuaternion(raySpace.object3D.quaternion);
              const origin = raySpace.object3D.position.clone();

              const t = (boardGroup.position.z - origin.z) / dir.z;
              if (t > 0) {
                const hitX = origin.x + dir.x * t - boardGroup.position.x;
                const hitY = origin.y + dir.y * t - boardGroup.position.y;
                dartManager.throwDart(hitX, hitY, power);
              }
            } else {
              dartManager.throwDart(0, 0, power);
            }
            xrCharging = false;
            ui.showPowerBar(false);
            ui.updatePower(0);
          }
        }
      }

      if (bDown) {
        if (game.state === GameState.Playing) {
          game.setState(GameState.Paused);
          ui.showPanel('pause');
        } else if (game.state === GameState.Paused) {
          game.setState(GameState.Playing);
          ui.showPanel('hud');
        }
      }
    }

    // Update systems
    effects.update(dt);
    dartManager.update(dt);
    scorePopups.update(dt);
    aimCursor.update(dt);
    particles.update(dt);
    streakEffects.update(dt);
    dartTrails.update(dt);
    boardHitEffects.update(dt);
    cameraShake.update(dt);
    throwReplay.update(dt);
    powerUps.updateTimeBased(dt);
    soundVisualizer.update(dt);
    commentator.update(dt);
    ui.update(dt);

    // Animate environment elements (gentle rotation)
    animTime += dt;

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);

  // Start with title screen
  game.setState(GameState.Title);
  ui.showPanel('title');
  soundVisualizer.activate();
}

main().catch(console.error);
