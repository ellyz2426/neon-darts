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

  // Audio
  const audio = new AudioManager();

  // Stats
  const stats = new StatsTracker();

  // Effects
  const effects = new EffectsManager(world);

  // Achievements
  const achievements = new AchievementManager(stats);

  // Create environment
  createEnvironment(world);

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
  const ui = new UIManager(world, game, dartManager, audio, achievements, stats, ai);

  // Input state
  let isCharging = false;
  let chargeStart = 0;
  let aimX = 0;
  let aimY = 0;
  const maxCharge = 1500; // ms for full power
  let mouseX = 0;
  let mouseY = 0;
  let isPointerLocked = false;

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
        isCharging = false;
        ui.showPowerBar(false);
        ui.updatePower(0);
      }
    });

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (game.state === GameState.Playing) {
        // Map mouse position to aim coordinates on the board
        const rect = canvas.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycaster to find board intersection
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(mouseX, mouseY), (world as any).camera || (world as any).renderer?.xr?.getCamera?.() || world.scene.children.find((c: any) => c.isCamera));
        
        // Use a simple plane at the board position for aim
        const boardPlane = new PlaneGeometry(1, 1);
        const boardMesh = new Mesh(boardPlane, new MeshBasicMaterial({ visible: false }));
        boardMesh.position.copy(boardGroup.position);
        world.scene.add(boardMesh);
        
        const intersects = raycaster.intersectObject(boardMesh);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          aimX = point.x - boardGroup.position.x;
          aimY = point.y - boardGroup.position.y;
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
        } else if (game.state === GameState.Paused) {
          game.setState(GameState.Playing);
          ui.showPanel('hud');
        }
        break;
    }
  });

  // Dart hit callback
  dartManager.onDartHit = (result: ScoreResult) => {
    game.recordThrow(result);
    ui.updateGameState();
    effects.spawnHitParticles(
      new Vector3(
        boardGroup.position.x + result.x,
        boardGroup.position.y + result.y,
        boardGroup.position.z + 0.02
      ),
      result.multiplier === 3 ? '#ff00ff' : result.multiplier === 2 ? '#00ff00' : '#00ffff'
    );

    // Check achievements
    achievements.checkAll(game, result);

    // Check if turn is over (3 darts thrown)
    if (game.dartsThisRound >= 3) {
      setTimeout(() => {
        game.endTurn();
        dartManager.clearDarts();

        if (game.isGameOver()) {
          game.setState(GameState.GameOver);
          ui.showPanel('gameover');
          audio.playGameOver(game.getWinner() === 1);
          stats.recordGame(game.mode, game.getWinner() === 1);
          achievements.checkAll(game, null);
        } else if (game.isAITurn()) {
          // AI throws
          setTimeout(() => performAITurn(), 800);
        }

        ui.updateGameState();
      }, 600);
    }
  };

  // AI turn
  function performAITurn() {
    if (!game.isAITurn() || game.state !== GameState.Playing) return;

    const target = ai.getTarget(game);
    const { x, y } = ai.applyNoise(target.x, target.y);

    dartManager.throwDart(x, y, 0.7 + Math.random() * 0.2);

    // AI throws 3 darts with delays
    if (game.dartsThisRound < 2) {
      setTimeout(() => {
        if (game.isAITurn() && game.state === GameState.Playing && game.dartsThisRound < 3) {
          performAITurn();
        }
      }, 1200);
    }
  }

  // XR input handling
  let xrCharging = false;
  let xrChargeStart = 0;

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
      const triggerDown = rightGamepad.getButtonDown?.(0); // Trigger
      const triggerUp = rightGamepad.getButtonUp?.(0);
      const triggerValue = rightGamepad.getButtonValue?.(0) ?? 0;
      const aDown = rightGamepad.getButtonDown?.(3); // A
      const bDown = rightGamepad.getButtonDown?.(4); // B

      if (game.state === GameState.Playing && !game.isAITurn()) {
        if (triggerDown && dartManager.canThrow()) {
          xrCharging = true;
          xrChargeStart = performance.now();
          ui.showPowerBar(true);
        }

        if (xrCharging) {
          const elapsed = Math.min(performance.now() - xrChargeStart, maxCharge);
          ui.updatePower(elapsed / maxCharge);

          if (triggerUp || triggerValue < 0.1) {
            const power = elapsed / maxCharge;
            // Use controller aim direction
            const spaces = (world as any).playerSpaceEntities;
            if (spaces?.raySpaces?.right) {
              const raySpace = spaces.raySpaces.right;
              const dir = new Vector3(0, 0, -1).applyQuaternion(raySpace.object3D.quaternion);
              const origin = raySpace.object3D.position.clone();

              // Intersect with board plane
              const t = (boardGroup.position.z - origin.z) / dir.z;
              if (t > 0) {
                const hitX = origin.x + dir.x * t - boardGroup.position.x;
                const hitY = origin.y + dir.y * t - boardGroup.position.y;
                dartManager.throwDart(hitX, hitY, power);
              }
            } else {
              // Fallback — aim at center
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

    // Update effects
    effects.update(dt);

    // Update dart flight
    dartManager.update(dt);

    // Update UI animations
    ui.update(dt);

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);

  // Start with title screen
  game.setState(GameState.Title);
  ui.showPanel('title');
}

main().catch(console.error);
