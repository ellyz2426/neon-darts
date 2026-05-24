// Power-up system — temporary bonuses earned during gameplay
import { GameMode } from './game';

export type PowerUpType =
  | 'steady_hand'    // Reduced scatter for 3 throws
  | 'double_score'   // 2x points for next throw
  | 'triple_threat'  // Next throw hits triple ring guaranteed zone boost
  | 'zen_focus'      // Slow-mo aim for 5 seconds
  | 'lucky_bounce'   // Miss goes to nearest scoring segment
  | 'second_wind';   // Extra 3 darts in a round

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  icon: string;
  duration: number; // throws or seconds depending on type
  color: string;
}

export interface ActivePowerUp extends PowerUp {
  remaining: number;
  active: boolean;
}

const POWER_UP_DEFS: Record<PowerUpType, Omit<PowerUp, 'type'>> = {
  steady_hand: {
    name: 'Steady Hand',
    description: 'Reduced scatter for 3 throws',
    icon: '✋',
    duration: 3,
    color: '#00ffaa',
  },
  double_score: {
    name: 'Double Score',
    description: '2× points on next throw',
    icon: '✨',
    duration: 1,
    color: '#ffaa00',
  },
  triple_threat: {
    name: 'Triple Threat',
    description: 'Improved triple zone accuracy',
    icon: '🎯',
    duration: 2,
    color: '#ff00ff',
  },
  zen_focus: {
    name: 'Zen Focus',
    description: 'Time slows during aim',
    icon: '🧘',
    duration: 5, // seconds
    color: '#00aaff',
  },
  lucky_bounce: {
    name: 'Lucky Bounce',
    description: 'Near-miss correction',
    icon: '🍀',
    duration: 2,
    color: '#44ff44',
  },
  second_wind: {
    name: 'Second Wind',
    description: 'Extra darts this round',
    icon: '💨',
    duration: 3,
    color: '#ff4488',
  },
};

export class PowerUpManager {
  private activePowerUps: ActivePowerUp[] = [];
  private availablePowerUps: PowerUp[] = [];
  private enabled = true;
  private comboThreshold = 3; // Combos needed to earn a power-up
  private onPowerUpGained: ((pu: PowerUp) => void) | null = null;
  private onPowerUpExpired: ((pu: PowerUp) => void) | null = null;

  constructor() {
    // Build available power-ups from defs
    for (const [type, def] of Object.entries(POWER_UP_DEFS)) {
      this.availablePowerUps.push({ type: type as PowerUpType, ...def });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setCallbacks(
    onGain: (pu: PowerUp) => void,
    onExpire: (pu: PowerUp) => void,
  ): void {
    this.onPowerUpGained = onGain;
    this.onPowerUpExpired = onExpire;
  }

  // Called when combo reaches threshold
  onComboReached(comboCount: number): void {
    if (!this.enabled) return;
    if (comboCount >= this.comboThreshold && comboCount % this.comboThreshold === 0) {
      this.grantRandom();
    }
  }

  grantRandom(): void {
    if (!this.enabled || this.activePowerUps.length >= 2) return; // Max 2 active

    const available = this.availablePowerUps.filter(
      pu => !this.activePowerUps.some(a => a.type === pu.type)
    );
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.grant(chosen.type);
  }

  grant(type: PowerUpType): void {
    const def = POWER_UP_DEFS[type];
    if (!def) return;

    const active: ActivePowerUp = {
      type,
      ...def,
      remaining: def.duration,
      active: true,
    };

    this.activePowerUps.push(active);
    this.onPowerUpGained?.(active);
  }

  // Call after each throw
  onThrow(): void {
    const throwBased: PowerUpType[] = ['steady_hand', 'double_score', 'triple_threat', 'lucky_bounce', 'second_wind'];

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const pu = this.activePowerUps[i];
      if (throwBased.includes(pu.type)) {
        pu.remaining--;
        if (pu.remaining <= 0) {
          pu.active = false;
          this.activePowerUps.splice(i, 1);
          this.onPowerUpExpired?.(pu);
        }
      }
    }
  }

  // Call every frame for time-based power-ups
  updateTimeBased(dt: number): void {
    const timeBased: PowerUpType[] = ['zen_focus'];

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const pu = this.activePowerUps[i];
      if (timeBased.includes(pu.type)) {
        pu.remaining -= dt;
        if (pu.remaining <= 0) {
          pu.active = false;
          this.activePowerUps.splice(i, 1);
          this.onPowerUpExpired?.(pu);
        }
      }
    }
  }

  hasActive(type: PowerUpType): boolean {
    return this.activePowerUps.some(pu => pu.type === type && pu.active);
  }

  getActive(): ActivePowerUp[] {
    return [...this.activePowerUps];
  }

  getScatterMultiplier(): number {
    return this.hasActive('steady_hand') ? 0.5 : 1;
  }

  getScoreMultiplier(): number {
    return this.hasActive('double_score') ? 2 : 1;
  }

  getTimeScale(): number {
    return this.hasActive('zen_focus') ? 0.4 : 1;
  }

  clearAll(): void {
    this.activePowerUps = [];
  }

  isAllowedInMode(mode: GameMode): boolean {
    // Power-ups only in casual modes
    const casualModes: GameMode[] = [GameMode.Practice, GameMode.Killer];
    return casualModes.includes(mode);
  }
}
