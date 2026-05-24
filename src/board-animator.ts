// Board animation system — idle animations and transitions for the dartboard
import { Object3D, MathUtils, Color, MeshStandardMaterial } from '@iwsdk/core';

interface AnimationState {
  rotateSpeed: number;
  pulsePhase: number;
  glowIntensity: number;
  targetGlow: number;
  wobble: number;
  wobbleDecay: number;
}

export class BoardAnimator {
  private boardGroup: Object3D | null = null;
  private state: AnimationState;
  private time = 0;
  private introPlaying = false;
  private introProgress = 0;
  private introScale = 0.01;
  private idleEnabled = true;

  constructor() {
    this.state = {
      rotateSpeed: 0,
      pulsePhase: 0,
      glowIntensity: 0.3,
      targetGlow: 0.3,
      wobble: 0,
      wobbleDecay: 0,
    };
  }

  setBoard(board: Object3D): void {
    this.boardGroup = board;
  }

  setIdleEnabled(enabled: boolean): void {
    this.idleEnabled = enabled;
  }

  // Call on game start to play intro animation
  playIntro(): void {
    if (!this.boardGroup) return;
    this.introPlaying = true;
    this.introProgress = 0;
    this.introScale = 0.01;
    this.boardGroup.scale.setScalar(this.introScale);
  }

  // Call on hit for impact wobble
  onHit(intensity: number = 1): void {
    this.state.wobble = 0.02 * intensity;
    this.state.wobbleDecay = 0;
    this.state.targetGlow = 0.6;
  }

  // Call on bullseye for big wobble
  onBullseye(): void {
    this.state.wobble = 0.04;
    this.state.wobbleDecay = 0;
    this.state.targetGlow = 1.0;
  }

  // Call on game over
  onGameOver(won: boolean): void {
    if (won) {
      this.state.targetGlow = 0.8;
      this.state.rotateSpeed = 0.5; // Victory spin
    } else {
      this.state.targetGlow = 0.1;
    }
  }

  // Reset to idle state
  resetToIdle(): void {
    this.state.rotateSpeed = 0;
    this.state.targetGlow = 0.3;
    this.state.wobble = 0;
    if (this.boardGroup) {
      this.boardGroup.rotation.set(0, 0, 0);
      this.boardGroup.scale.setScalar(1);
    }
  }

  update(dt: number): void {
    if (!this.boardGroup) return;

    this.time += dt;

    // Intro animation
    if (this.introPlaying) {
      this.introProgress += dt * 2; // 0.5s intro
      if (this.introProgress >= 1) {
        this.introPlaying = false;
        this.boardGroup.scale.setScalar(1);
      } else {
        // Elastic ease out
        const p = this.introProgress;
        const elastic = 1 - Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3));
        this.boardGroup.scale.setScalar(elastic);
      }
      return;
    }

    // Wobble from hits
    if (this.state.wobble > 0.001) {
      this.state.wobbleDecay += dt;
      const decay = Math.exp(-this.state.wobbleDecay * 10);
      const wobbleX = this.state.wobble * Math.sin(this.state.wobbleDecay * 30) * decay;
      const wobbleY = this.state.wobble * Math.cos(this.state.wobbleDecay * 25) * decay;
      this.boardGroup.rotation.x = wobbleX;
      this.boardGroup.rotation.y = wobbleY;

      if (decay < 0.01) {
        this.state.wobble = 0;
        this.boardGroup.rotation.x = 0;
        this.boardGroup.rotation.y = 0;
      }
    }

    // Victory rotation
    if (this.state.rotateSpeed > 0.01) {
      this.boardGroup.rotation.z += this.state.rotateSpeed * dt;
      this.state.rotateSpeed *= 0.98; // Slow down
    }

    // Idle subtle breathing (scale pulse)
    if (this.idleEnabled && !this.introPlaying) {
      const breathe = 1 + Math.sin(this.time * 0.5) * 0.003;
      if (this.state.wobble <= 0.001 && this.state.rotateSpeed <= 0.01) {
        this.boardGroup.scale.setScalar(breathe);
      }
    }

    // Glow interpolation
    this.state.glowIntensity += (this.state.targetGlow - this.state.glowIntensity) * dt * 3;
  }

  getGlowIntensity(): number {
    return this.state.glowIntensity;
  }

  dispose(): void {
    this.boardGroup = null;
  }
}
