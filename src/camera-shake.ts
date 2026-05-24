// Camera shake — subtle screen shake on impacts
import { Object3D, Vector3 } from '@iwsdk/core';

interface ShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
  decay: number;
}

const SHAKE_PRESETS: Record<string, ShakeConfig> = {
  hit: { intensity: 0.003, duration: 0.15, frequency: 25, decay: 3 },
  triple: { intensity: 0.006, duration: 0.2, frequency: 30, decay: 2.5 },
  bullseye: { intensity: 0.01, duration: 0.3, frequency: 20, decay: 2 },
  miss: { intensity: 0.002, duration: 0.1, frequency: 15, decay: 4 },
  gameWin: { intensity: 0.015, duration: 0.5, frequency: 12, decay: 1.5 },
  elimination: { intensity: 0.012, duration: 0.4, frequency: 18, decay: 2 },
  bust: { intensity: 0.008, duration: 0.25, frequency: 22, decay: 2.5 },
};

export class CameraShake {
  private camera: Object3D | null = null;
  private originalPosition = new Vector3();
  private shaking = false;
  private timer = 0;
  private config: ShakeConfig = SHAKE_PRESETS.hit;
  private enabled = true;
  private shakeQueue: ShakeConfig[] = [];

  constructor() {}

  setCamera(camera: Object3D): void {
    this.camera = camera;
    this.originalPosition.copy(camera.position);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.shaking) {
      this.stopShake();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  shake(preset: string): void {
    if (!this.enabled || !this.camera) return;

    const config = SHAKE_PRESETS[preset];
    if (!config) return;

    if (this.shaking) {
      // Queue or override with stronger shake
      if (config.intensity > this.config.intensity) {
        this.config = config;
        this.timer = 0;
      }
      return;
    }

    this.config = config;
    this.timer = 0;
    this.shaking = true;
    this.originalPosition.copy(this.camera.position);
  }

  shakeCustom(intensity: number, duration: number): void {
    if (!this.enabled || !this.camera) return;

    this.config = {
      intensity: Math.min(intensity, 0.02), // Safety cap
      duration,
      frequency: 20,
      decay: 2,
    };
    this.timer = 0;
    this.shaking = true;
    this.originalPosition.copy(this.camera.position);
  }

  private stopShake(): void {
    if (this.camera) {
      this.camera.position.copy(this.originalPosition);
    }
    this.shaking = false;
    this.timer = 0;
  }

  update(dt: number): void {
    if (!this.shaking || !this.camera) return;

    this.timer += dt;
    if (this.timer >= this.config.duration) {
      this.stopShake();
      return;
    }

    const progress = this.timer / this.config.duration;
    const decay = Math.exp(-this.config.decay * progress);
    const intensity = this.config.intensity * decay;

    // Perlin-like noise using sin combinations
    const t = this.timer * this.config.frequency;
    const offsetX = intensity * (Math.sin(t * 1.1) + Math.sin(t * 2.3) * 0.5);
    const offsetY = intensity * (Math.cos(t * 1.7) + Math.cos(t * 3.1) * 0.5);
    const offsetZ = intensity * 0.3 * Math.sin(t * 0.9);

    this.camera.position.set(
      this.originalPosition.x + offsetX,
      this.originalPosition.y + offsetY,
      this.originalPosition.z + offsetZ
    );
  }

  dispose(): void {
    this.stopShake();
    this.camera = null;
  }
}
