// Streak effects — visual flourishes during hot streaks
import {
  World,
  Group,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  Vector3,
} from '@iwsdk/core';

interface StreakRing {
  mesh: Mesh;
  startTime: number;
  duration: number;
  maxScale: number;
}

export class StreakEffects {
  private world: World;
  private group: Group;
  private rings: StreakRing[] = [];
  private time = 0;
  private boardPosition: Vector3;

  constructor(world: World, boardPosition: Vector3) {
    this.world = world;
    this.boardPosition = boardPosition;
    this.group = new Group();
    this.group.position.copy(boardPosition);
    this.group.position.z += 0.03;
    world.scene.add(this.group as any);
  }

  // Trigger a streak ring effect
  triggerStreak(streakCount: number) {
    const colors = ['#00ffff', '#00ff88', '#ffff00', '#ff8800', '#ff00ff', '#ff0000'];
    const colorIdx = Math.min(streakCount - 1, colors.length - 1);
    const color = colors[colorIdx];

    const ringGeo = new RingGeometry(0.01, 0.02, 32);
    const ringMat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      side: 2, // DoubleSide
    });

    const ring = new Mesh(ringGeo, ringMat);
    this.group.add(ring);

    const maxScale = 0.3 + streakCount * 0.15;
    this.rings.push({
      mesh: ring,
      startTime: this.time,
      duration: 0.8 + streakCount * 0.1,
      maxScale,
    });

    // Extra rings for big streaks
    if (streakCount >= 3) {
      const ring2Geo = new RingGeometry(0.005, 0.015, 32);
      const ring2Mat = new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        side: 2,
      });
      const ring2 = new Mesh(ring2Geo, ring2Mat);
      this.group.add(ring2);
      this.rings.push({
        mesh: ring2,
        startTime: this.time + 0.15,
        duration: 0.6,
        maxScale: maxScale * 0.7,
      });
    }
  }

  // Triple/bullseye highlight — bright flash ring
  triggerHighlight(x: number, y: number, color: string) {
    const ringGeo = new RingGeometry(0.005, 0.012, 24);
    const ringMat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      side: 2,
    });

    const ring = new Mesh(ringGeo, ringMat);
    ring.position.set(x, y, 0.01);
    this.group.add(ring);

    this.rings.push({
      mesh: ring,
      startTime: this.time,
      duration: 0.5,
      maxScale: 0.15,
    });
  }

  update(dt: number) {
    this.time += dt;

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      const elapsed = this.time - ring.startTime;

      if (elapsed < 0) continue; // Not started yet

      if (elapsed > ring.duration) {
        this.group.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        (ring.mesh.material as MeshBasicMaterial).dispose();
        this.rings.splice(i, 1);
        continue;
      }

      const t = elapsed / ring.duration;
      const scale = t * ring.maxScale;
      ring.mesh.scale.set(scale, scale, 1);
      (ring.mesh.material as MeshBasicMaterial).opacity = 0.8 * (1 - t);
    }
  }
}
