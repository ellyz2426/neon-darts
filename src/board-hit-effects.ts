// Board hit effects — flash and glow when darts land
import { Object3D, PointLight, Color, MeshBasicMaterial, SphereGeometry, Mesh, AdditiveBlending } from '@iwsdk/core';

interface HitFlash {
  light: PointLight;
  glow: Mesh;
  timer: number;
  duration: number;
  maxIntensity: number;
}

const HIT_FLASH_DURATION = 0.35;
const TRIPLE_FLASH_DURATION = 0.5;
const BULL_FLASH_DURATION = 0.6;

export class BoardHitEffects {
  private container: Object3D;
  private flashes: HitFlash[] = [];
  private flashPool: HitFlash[] = [];
  private glowGeometry: SphereGeometry;

  constructor(parent: Object3D) {
    this.container = new Object3D();
    (parent as any).add(this.container);
    this.glowGeometry = new SphereGeometry(0.03, 8, 8);

    // Pre-create pool of 5 flash effects
    for (let i = 0; i < 5; i++) {
      this.flashPool.push(this.createFlash());
    }
  }

  private createFlash(): HitFlash {
    const light = new PointLight(0x00ffff, 0, 0.5);
    light.visible = false;
    (this.container as any).add(light);

    const material = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    });
    const glow = new Mesh(this.glowGeometry, material);
    glow.visible = false;
    this.container.add(glow);

    return { light, glow, timer: 0, duration: HIT_FLASH_DURATION, maxIntensity: 2 };
  }

  triggerHit(x: number, y: number, z: number, multiplier: number, isBull: boolean): void {
    let flash: HitFlash;

    if (this.flashPool.length > 0) {
      flash = this.flashPool.pop()!;
    } else {
      flash = this.createFlash();
    }

    // Color based on hit type
    let color: Color;
    let duration: number;
    let intensity: number;
    let glowScale: number;

    if (isBull) {
      color = new Color(0xff4444);
      duration = BULL_FLASH_DURATION;
      intensity = 4;
      glowScale = 2.5;
    } else if (multiplier === 3) {
      color = new Color(0xff00ff);
      duration = TRIPLE_FLASH_DURATION;
      intensity = 3;
      glowScale = 2;
    } else if (multiplier === 2) {
      color = new Color(0x00ff88);
      duration = HIT_FLASH_DURATION;
      intensity = 2.5;
      glowScale = 1.5;
    } else {
      color = new Color(0x00ffff);
      duration = HIT_FLASH_DURATION;
      intensity = 2;
      glowScale = 1;
    }

    flash.light.color.copy(color);
    flash.light.position.set(x, y, z + 0.02);
    flash.light.intensity = intensity;
    flash.light.visible = true;

    const glowMat = flash.glow.material as MeshBasicMaterial;
    glowMat.color.copy(color);
    glowMat.opacity = 0.8;
    flash.glow.position.set(x, y, z + 0.01);
    flash.glow.scale.setScalar(glowScale);
    flash.glow.visible = true;

    flash.timer = 0;
    flash.duration = duration;
    flash.maxIntensity = intensity;

    this.flashes.push(flash);
  }

  update(dt: number): void {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      flash.timer += dt;

      const progress = flash.timer / flash.duration;
      if (progress >= 1) {
        flash.light.visible = false;
        flash.light.intensity = 0;
        flash.glow.visible = false;
        (flash.glow.material as MeshBasicMaterial).opacity = 0;
        this.flashes.splice(i, 1);
        this.flashPool.push(flash);
        continue;
      }

      // Quick flash up, slow fade down
      const fadeProgress = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
      flash.light.intensity = flash.maxIntensity * fadeProgress;
      (flash.glow.material as MeshBasicMaterial).opacity = 0.8 * fadeProgress;

      // Pulse the glow scale slightly
      const pulse = 1 + 0.2 * Math.sin(progress * Math.PI * 4);
      flash.glow.scale.setScalar(flash.glow.scale.x * pulse / (1 + 0.2 * Math.sin((progress - dt / flash.duration) * Math.PI * 4) || 1));
    }
  }

  dispose(): void {
    [...this.flashes, ...this.flashPool].forEach(flash => {
      (this.container as any).remove(flash.light);
      (this.container as any).remove(flash.glow);
      (flash.glow.material as MeshBasicMaterial).dispose();
    });
    this.flashes = [];
    this.flashPool = [];
    this.glowGeometry.dispose();
  }
}
