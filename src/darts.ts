// Dart throwing and flight
import {
  World,
  Group,
  Mesh,
  CylinderGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  Vector3,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
} from '@iwsdk/core';

import { getScoreForPosition, ScoreResult } from './dartboard';
import { AudioManager } from './audio';
import { EffectsManager } from './effects';

interface Dart {
  group: Group;
  velocity: Vector3;
  state: 'flying' | 'stuck' | 'idle';
  trail: Vector3[];
  trailMesh: LineSegments | null;
}

export class DartManager {
  private world: World;
  private boardGroup: Group;
  private audio: AudioManager;
  private effects: EffectsManager;
  private darts: Dart[] = [];
  private maxDarts = 3;
  private throwCount = 0;

  public onDartHit: ((result: ScoreResult) => void) | null = null;

  constructor(world: World, boardGroup: Group, audio: AudioManager, effects: EffectsManager) {
    this.world = world;
    this.boardGroup = boardGroup;
    this.audio = audio;
    this.effects = effects;
  }

  canThrow(): boolean {
    return this.throwCount < this.maxDarts;
  }

  throwDart(aimX: number, aimY: number, power: number) {
    if (!this.canThrow()) return;

    // Add some natural scatter based on power (more power = more steady)
    const scatter = 0.015 * (1 - power * 0.5) + 0.005;
    const finalX = aimX + (Math.random() - 0.5) * scatter;
    const finalY = aimY + (Math.random() - 0.5) * scatter;

    // Create dart mesh
    const dart = this.createDartMesh();
    
    // Start from player position
    const startPos = new Vector3(0, 1.6, -0.3);
    dart.group.position.copy(startPos);
    this.world.scene.add(dart.group);

    // Calculate target on board
    const targetPos = new Vector3(
      this.boardGroup.position.x + finalX,
      this.boardGroup.position.y + finalY,
      this.boardGroup.position.z + 0.02
    );

    // Flight velocity — dart travels to board
    const direction = targetPos.clone().sub(startPos);
    const distance = direction.length();
    const flightTime = 0.15 + 0.15 * (1 - power); // faster throw = less time
    const speed = distance / flightTime;
    direction.normalize().multiplyScalar(speed);

    dart.velocity = direction;
    dart.state = 'flying';
    this.darts.push(dart);
    this.throwCount++;

    // Throw sound
    this.audio.playThrow(power);

    // Calculate score immediately for where it will land
    const result = getScoreForPosition(finalX, finalY);

    // Schedule hit after flight time
    setTimeout(() => {
      if (dart.state === 'flying') {
        dart.state = 'stuck';
        dart.group.position.copy(targetPos);
        dart.group.rotation.x = 0;
        dart.velocity.set(0, 0, 0);

        // Hit sound
        if (result.total > 0) {
          this.audio.playHit(result);
        } else {
          this.audio.playMiss();
        }

        if (this.onDartHit) {
          this.onDartHit(result);
        }
      }
    }, flightTime * 1000);
  }

  private createDartMesh(): Dart {
    const group = new Group();

    // Dart body (barrel) — glowing neon cylinder
    const barrelGeo = new CylinderGeometry(0.003, 0.004, 0.05, 8);
    const barrelMat = new MeshStandardMaterial({
      color: '#00ffff',
      emissive: new Color('#00ffff'),
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const barrel = new Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    group.add(barrel);

    // Dart point (tip) — sharp cone
    const tipGeo = new ConeGeometry(0.003, 0.02, 8);
    const tipMat = new MeshStandardMaterial({
      color: '#ffffff',
      emissive: new Color('#ffffff'),
      emissiveIntensity: 0.4,
      metalness: 0.9,
    });
    const tip = new Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.035;
    group.add(tip);

    // Flights (fins) — flat panels
    for (let i = 0; i < 4; i++) {
      const flightGeo = new CylinderGeometry(0, 0.008, 0.02, 3);
      const flightMat = new MeshBasicMaterial({
        color: '#ff00ff',
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
      color: '#00ffff',
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
    });
    const glowMesh = new Mesh(glowGeo, glowMat);
    glowMesh.rotation.x = Math.PI / 2;
    group.add(glowMesh);

    // Point toward -Z (board direction)
    group.rotation.x = 0;

    return {
      group,
      velocity: new Vector3(),
      state: 'idle',
      trail: [],
      trailMesh: null,
    };
  }

  update(dt: number) {
    for (const dart of this.darts) {
      if (dart.state === 'flying') {
        // Add slight gravity
        dart.velocity.y -= 0.5 * dt;
        
        // Move
        dart.group.position.add(dart.velocity.clone().multiplyScalar(dt));

        // Point dart in flight direction
        if (dart.velocity.lengthSq() > 0.01) {
          const dir = dart.velocity.clone().normalize();
          dart.group.lookAt(dart.group.position.clone().add(dir));
        }

        // Trail
        dart.trail.push(dart.group.position.clone());
        if (dart.trail.length > 20) dart.trail.shift();
        this.updateTrail(dart);

        // Bounds check — if dart goes past the board
        if (dart.group.position.z < -3) {
          dart.state = 'stuck';
          dart.velocity.set(0, 0, 0);
        }
      }
    }
  }

  private updateTrail(dart: Dart) {
    if (dart.trailMesh) {
      this.world.scene.remove(dart.trailMesh);
      dart.trailMesh.geometry.dispose();
    }

    if (dart.trail.length < 2) return;

    const pts: number[] = [];
    for (let i = 0; i < dart.trail.length - 1; i++) {
      pts.push(dart.trail[i].x, dart.trail[i].y, dart.trail[i].z);
      pts.push(dart.trail[i + 1].x, dart.trail[i + 1].y, dart.trail[i + 1].z);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pts, 3));
    const mat = new LineBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.3,
    });
    dart.trailMesh = new LineSegments(geo, mat);
    this.world.scene.add(dart.trailMesh);
  }

  clearDarts() {
    for (const dart of this.darts) {
      this.world.scene.remove(dart.group);
      if (dart.trailMesh) {
        this.world.scene.remove(dart.trailMesh);
        dart.trailMesh.geometry.dispose();
      }
    }
    this.darts = [];
    this.throwCount = 0;
  }
}
