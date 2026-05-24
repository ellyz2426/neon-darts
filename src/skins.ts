// Dart skin system — multiple dart visual styles
import {
  Group,
  Mesh,
  CylinderGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
} from '@iwsdk/core';

export interface DartSkin {
  id: string;
  name: string;
  barrelColor: string;
  tipColor: string;
  flightColor: string;
  glowColor: string;
  emissiveIntensity: number;
  metalness: number;
}

export const DART_SKINS: DartSkin[] = [
  {
    id: 'neon-classic',
    name: 'Neon Classic',
    barrelColor: '#00ffff',
    tipColor: '#ffffff',
    flightColor: '#ff00ff',
    glowColor: '#00ffff',
    emissiveIntensity: 0.6,
    metalness: 0.8,
  },
  {
    id: 'fire',
    name: 'Inferno',
    barrelColor: '#ff4400',
    tipColor: '#ffcc00',
    flightColor: '#ff0000',
    glowColor: '#ff6600',
    emissiveIntensity: 0.8,
    metalness: 0.6,
  },
  {
    id: 'ice',
    name: 'Frost Bite',
    barrelColor: '#88ccff',
    tipColor: '#ffffff',
    flightColor: '#4488ff',
    glowColor: '#aaddff',
    emissiveIntensity: 0.5,
    metalness: 0.9,
  },
  {
    id: 'gold',
    name: 'Golden Arrow',
    barrelColor: '#ffcc00',
    tipColor: '#ffffff',
    flightColor: '#ff9900',
    glowColor: '#ffdd44',
    emissiveIntensity: 0.7,
    metalness: 1.0,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    barrelColor: '#9933ff',
    tipColor: '#cc88ff',
    flightColor: '#6600cc',
    glowColor: '#aa44ff',
    emissiveIntensity: 0.6,
    metalness: 0.7,
  },
  {
    id: 'toxic',
    name: 'Toxic Surge',
    barrelColor: '#00ff44',
    tipColor: '#ccffcc',
    flightColor: '#00cc00',
    glowColor: '#44ff88',
    emissiveIntensity: 0.7,
    metalness: 0.5,
  },
  {
    id: 'crimson',
    name: 'Crimson Edge',
    barrelColor: '#cc0022',
    tipColor: '#ff4444',
    flightColor: '#880000',
    glowColor: '#ff2244',
    emissiveIntensity: 0.7,
    metalness: 0.8,
  },
  {
    id: 'starlight',
    name: 'Starlight',
    barrelColor: '#ccccff',
    tipColor: '#ffffff',
    flightColor: '#8888ff',
    glowColor: '#bbbbff',
    emissiveIntensity: 0.9,
    metalness: 0.9,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    barrelColor: '#222222',
    tipColor: '#555555',
    flightColor: '#111111',
    glowColor: '#444444',
    emissiveIntensity: 0.3,
    metalness: 1.0,
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    barrelColor: '#00ffaa',
    tipColor: '#aaffee',
    flightColor: '#00cc88',
    glowColor: '#44ffcc',
    emissiveIntensity: 0.8,
    metalness: 0.6,
  },
  // Premium skins v2
  {
    id: 'void-walker',
    name: 'Void Walker',
    barrelColor: '#1a0033',
    tipColor: '#9933ff',
    flightColor: '#6600cc',
    glowColor: '#6600cc',
    emissiveIntensity: 0.8,
    metalness: 0.7,
  },
  {
    id: 'solar-wind',
    name: 'Solar Wind',
    barrelColor: '#ffcc00',
    tipColor: '#ff4400',
    flightColor: '#ff8800',
    glowColor: '#ffaa00',
    emissiveIntensity: 0.9,
    metalness: 0.6,
  },
  {
    id: 'quantum-shift',
    name: 'Quantum Shift',
    barrelColor: '#00ffaa',
    tipColor: '#0066ff',
    flightColor: '#00aaff',
    glowColor: '#00ffcc',
    emissiveIntensity: 1.0,
    metalness: 0.8,
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    barrelColor: '#660000',
    tipColor: '#ff3333',
    flightColor: '#cc0000',
    glowColor: '#ff2222',
    emissiveIntensity: 0.7,
    metalness: 0.8,
  },
  {
    id: 'diamond-dust',
    name: 'Diamond Dust',
    barrelColor: '#cccccc',
    tipColor: '#aaeeff',
    flightColor: '#ffffff',
    glowColor: '#eeeeff',
    emissiveIntensity: 1.2,
    metalness: 1.0,
  },
];

const SKINS_KEY = 'neon-darts-skin';

export class DartSkinManager {
  currentSkin: DartSkin;

  constructor() {
    const savedId = this.loadSkin();
    this.currentSkin = DART_SKINS.find(s => s.id === savedId) || DART_SKINS[0];
  }

  private loadSkin(): string {
    try {
      return localStorage.getItem(SKINS_KEY) || 'neon-classic';
    } catch {
      return 'neon-classic';
    }
  }

  setSkin(id: string) {
    const skin = DART_SKINS.find(s => s.id === id);
    if (skin) {
      this.currentSkin = skin;
      try { localStorage.setItem(SKINS_KEY, id); } catch {}
    }
  }

  nextSkin() {
    const idx = DART_SKINS.indexOf(this.currentSkin);
    this.setSkin(DART_SKINS[(idx + 1) % DART_SKINS.length].id);
  }

  prevSkin() {
    const idx = DART_SKINS.indexOf(this.currentSkin);
    this.setSkin(DART_SKINS[(idx - 1 + DART_SKINS.length) % DART_SKINS.length].id);
  }

  createDartMesh(): Group {
    const skin = this.currentSkin;
    const group = new Group();

    // Barrel
    const barrelGeo = new CylinderGeometry(0.003, 0.004, 0.05, 8);
    const barrelMat = new MeshStandardMaterial({
      color: skin.barrelColor,
      emissive: new Color(skin.barrelColor),
      emissiveIntensity: skin.emissiveIntensity,
      metalness: skin.metalness,
      roughness: 0.2,
    });
    const barrel = new Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    group.add(barrel);

    // Tip
    const tipGeo = new ConeGeometry(0.003, 0.02, 8);
    const tipMat = new MeshStandardMaterial({
      color: skin.tipColor,
      emissive: new Color(skin.tipColor),
      emissiveIntensity: 0.4,
      metalness: 0.9,
    });
    const tip = new Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.035;
    group.add(tip);

    // Flights
    for (let i = 0; i < 4; i++) {
      const flightGeo = new CylinderGeometry(0, 0.008, 0.02, 3);
      const flightMat = new MeshBasicMaterial({
        color: skin.flightColor,
        transparent: true,
        opacity: 0.7,
        side: 2, // DoubleSide
      });
      const flight = new Mesh(flightGeo, flightMat);
      flight.rotation.x = Math.PI / 2;
      flight.rotation.z = (i / 4) * Math.PI * 2;
      flight.position.z = 0.03;
      group.add(flight);
    }

    // Glow
    const glowGeo = new CylinderGeometry(0.008, 0.008, 0.06, 8);
    const glowMat = new MeshBasicMaterial({
      color: skin.glowColor,
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
    });
    const glowMesh = new Mesh(glowGeo, glowMat);
    glowMesh.rotation.x = Math.PI / 2;
    group.add(glowMesh);

    return group;
  }
}
