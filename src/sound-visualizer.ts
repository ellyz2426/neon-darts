// Sound visualizer — reactive audio visualization on the dartboard
import { Object3D, Mesh, RingGeometry, MeshBasicMaterial, AdditiveBlending, Color } from '@iwsdk/core';

interface VisualizerRing {
  mesh: Mesh;
  material: MeshBasicMaterial;
  baseScale: number;
  frequency: number;
  phase: number;
}

const RING_COUNT = 5;
const BASE_OPACITY = 0.15;

export class SoundVisualizer {
  private container: Object3D;
  private rings: VisualizerRing[] = [];
  private active = false;
  private audioLevel = 0;
  private smoothedLevel = 0;
  private time = 0;
  private enabled = true;

  constructor(parent: Object3D, boardPosition: { x: number; y: number; z: number }) {
    this.container = new Object3D();
    this.container.position.set(boardPosition.x, boardPosition.y, boardPosition.z + 0.005);
    (parent as any).add(this.container);

    const colors = [0x00ffff, 0xff00ff, 0x00ff88, 0xffaa00, 0x4444ff];

    for (let i = 0; i < RING_COUNT; i++) {
      const innerRadius = 0.05 + i * 0.04;
      const outerRadius = innerRadius + 0.015;
      const geometry = new RingGeometry(innerRadius, outerRadius, 32);
      const material = new MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: BASE_OPACITY,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new Mesh(geometry, material);
      mesh.visible = false;
      (this.container as any).add(mesh);

      this.rings.push({
        mesh,
        material,
        baseScale: 1,
        frequency: 1.5 + i * 0.7,
        phase: (i * Math.PI * 2) / RING_COUNT,
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.deactivate();
  }

  activate(): void {
    if (!this.enabled) return;
    this.active = true;
    this.rings.forEach(r => r.mesh.visible = true);
  }

  deactivate(): void {
    this.active = false;
    this.rings.forEach(r => {
      r.mesh.visible = false;
      r.material.opacity = BASE_OPACITY;
    });
  }

  isActive(): boolean {
    return this.active;
  }

  setAudioLevel(level: number): void {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  // Call on dart throw for a pulse
  pulse(intensity: number = 1): void {
    if (!this.active) return;
    this.audioLevel = Math.min(1, this.audioLevel + 0.3 * intensity);
  }

  // Call on dart hit for a bigger pulse
  hitPulse(multiplier: number): void {
    if (!this.active) return;
    const intensity = multiplier >= 3 ? 1 : multiplier >= 2 ? 0.7 : 0.4;
    this.audioLevel = Math.min(1, intensity);
  }

  update(dt: number): void {
    if (!this.active) return;

    this.time += dt;

    // Smooth the audio level
    this.smoothedLevel += (this.audioLevel - this.smoothedLevel) * dt * 8;
    this.audioLevel *= 0.95; // Decay

    for (const ring of this.rings) {
      const wave = Math.sin(this.time * ring.frequency + ring.phase);
      const scale = 1 + wave * 0.15 * (1 + this.smoothedLevel * 2);
      ring.mesh.scale.setScalar(scale);

      const opacity = BASE_OPACITY + this.smoothedLevel * 0.5 + wave * 0.05;
      ring.material.opacity = Math.max(0, Math.min(0.8, opacity));
    }
  }

  dispose(): void {
    this.rings.forEach(ring => {
      ring.mesh.geometry.dispose();
      ring.material.dispose();
    });
    this.rings = [];
  }
}
