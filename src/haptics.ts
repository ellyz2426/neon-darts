// Haptic feedback for VR controllers
import { World } from '@iwsdk/core';

export class HapticManager {
  private world: World;
  private enabled = true;

  constructor(world: World) {
    this.world = world;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private getXRSession(): XRSession | null {
    try {
      const renderer = (this.world as any).renderer;
      return renderer?.xr?.getSession?.() || null;
    } catch {
      return null;
    }
  }

  private vibrate(hand: 'left' | 'right', intensity: number, duration: number) {
    if (!this.enabled) return;

    const session = this.getXRSession();
    if (!session) return;

    try {
      for (const source of session.inputSources) {
        if (source.handedness === hand && source.gamepad) {
          const actuator = (source.gamepad as any).hapticActuators?.[0];
          if (actuator) {
            actuator.pulse(intensity, duration);
          }
        }
      }
    } catch {
      // Haptic not supported — fail silently
    }
  }

  // Throw feedback — medium pulse on throw
  onThrow(power: number) {
    const intensity = 0.3 + power * 0.5;
    this.vibrate('right', intensity, 80);
  }

  // Hit feedback — varies by score
  onHit(multiplier: number, segment: number) {
    if (segment === 25) {
      // Bullseye — strong double pulse
      this.vibrate('right', 0.9, 100);
      setTimeout(() => this.vibrate('right', 0.9, 100), 120);
    } else if (multiplier === 3) {
      // Triple — strong pulse
      this.vibrate('right', 0.8, 120);
    } else if (multiplier === 2) {
      // Double — medium pulse
      this.vibrate('right', 0.6, 80);
    } else {
      // Single — light tap
      this.vibrate('right', 0.3, 40);
    }
  }

  // Miss — very light pulse
  onMiss() {
    this.vibrate('right', 0.15, 30);
  }

  // Achievement unlock — celebration pattern
  onAchievement() {
    this.vibrate('right', 0.5, 60);
    setTimeout(() => this.vibrate('left', 0.5, 60), 80);
    setTimeout(() => this.vibrate('right', 0.7, 80), 200);
    setTimeout(() => this.vibrate('left', 0.7, 80), 280);
  }

  // Killer elimination — dramatic feedback
  onElimination() {
    this.vibrate('right', 1.0, 200);
    this.vibrate('left', 1.0, 200);
  }

  // Game over
  onGameOver(won: boolean) {
    if (won) {
      // Victory pattern
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.vibrate('right', 0.6, 60);
          this.vibrate('left', 0.6, 60);
        }, i * 150);
      }
    } else {
      // Defeat — single low rumble
      this.vibrate('right', 0.3, 300);
    }
  }

  // Charging feedback — escalating pulses while charging throw
  onCharging(power: number) {
    // Only pulse at certain thresholds
    const threshold = Math.floor(power * 10);
    if (threshold > 0 && threshold % 2 === 0) {
      this.vibrate('right', 0.1 + power * 0.3, 20);
    }
  }

  // Button click feedback
  onClick() {
    this.vibrate('right', 0.2, 15);
  }
}
