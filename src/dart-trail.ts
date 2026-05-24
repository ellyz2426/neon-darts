// Dart trail effects — neon vapor trail behind darts in flight
import { Object3D, MeshBasicMaterial, BufferGeometry, Float32BufferAttribute, Mesh, AdditiveBlending, Color, Vector3 } from '@iwsdk/core';

interface TrailPoint {
  position: Vector3;
  age: number;
  opacity: number;
}

interface DartTrail {
  points: TrailPoint[];
  color: Color;
  mesh: Mesh;
  geometry: BufferGeometry;
  material: MeshBasicMaterial;
  active: boolean;
}

const MAX_TRAIL_POINTS = 20;
const TRAIL_LIFETIME = 0.4;
const TRAIL_WIDTH = 0.008;

export class DartTrailManager {
  private trails: Map<string, DartTrail> = new Map();
  private container: Object3D;
  private trailColors: Color[] = [
    new Color(0x00ffff),
    new Color(0xff00ff),
    new Color(0x00ff88),
    new Color(0xff4444),
    new Color(0xffaa00),
  ];

  constructor(parent: Object3D) {
    this.container = new Object3D();
    (parent as any).add(this.container);
  }

  startTrail(dartId: string, skinIndex: number = 0): void {
    if (this.trails.has(dartId)) return;

    const color = this.trailColors[skinIndex % this.trailColors.length];
    const geometry = new BufferGeometry();
    const positions = new Float32Array(MAX_TRAIL_POINTS * 6); // 2 verts per point (ribbon)
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new Mesh(geometry, material);
    (this.container as any).add(mesh);

    this.trails.set(dartId, {
      points: [],
      color,
      mesh,
      geometry,
      material,
      active: true,
    });
  }

  updateTrail(dartId: string, position: Vector3, dt: number): void {
    const trail = this.trails.get(dartId);
    if (!trail || !trail.active) return;

    // Add new point
    trail.points.unshift({
      position: position.clone(),
      age: 0,
      opacity: 1,
    });

    // Age and cull points
    for (let i = trail.points.length - 1; i >= 0; i--) {
      trail.points[i].age += dt;
      trail.points[i].opacity = 1 - trail.points[i].age / TRAIL_LIFETIME;
      if (trail.points[i].age > TRAIL_LIFETIME) {
        trail.points.splice(i, 1);
      }
    }

    // Limit length
    if (trail.points.length > MAX_TRAIL_POINTS) {
      trail.points.length = MAX_TRAIL_POINTS;
    }

    // Update geometry — build ribbon from points
    this.rebuildTrailGeometry(trail);
  }

  private rebuildTrailGeometry(trail: DartTrail): void {
    const posAttr = trail.geometry.getAttribute('position') as any;
    const positions = posAttr.array as Float32Array;
    positions.fill(0);

    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < trail.points.length && i < MAX_TRAIL_POINTS; i++) {
      const p = trail.points[i];
      const width = TRAIL_WIDTH * p.opacity;

      // Direction perpendicular to trail direction and up
      let dir: Vector3;
      if (i < trail.points.length - 1) {
        dir = new Vector3().subVectors(trail.points[i].position, trail.points[i + 1].position).normalize();
      } else if (i > 0) {
        dir = new Vector3().subVectors(trail.points[i - 1].position, trail.points[i].position).normalize();
      } else {
        dir = new Vector3(0, 0, 1);
      }

      const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width);

      const idx = i * 6;
      positions[idx] = p.position.x + side.x;
      positions[idx + 1] = p.position.y + side.y;
      positions[idx + 2] = p.position.z + side.z;
      positions[idx + 3] = p.position.x - side.x;
      positions[idx + 4] = p.position.y - side.y;
      positions[idx + 5] = p.position.z - side.z;
    }

    posAttr.needsUpdate = true;
    trail.material.opacity = trail.points.length > 0 ? 0.6 * trail.points[0].opacity : 0;
  }

  endTrail(dartId: string): void {
    const trail = this.trails.get(dartId);
    if (trail) {
      trail.active = false;
    }
  }

  update(dt: number): void {
    const toRemove: string[] = [];
    this.trails.forEach((trail, id) => {
      if (!trail.active) {
        // Fade out remaining points
        for (const p of trail.points) {
          p.age += dt * 2; // Faster fade when not active
          p.opacity = 1 - p.age / TRAIL_LIFETIME;
        }
        trail.points = trail.points.filter(p => p.opacity > 0);
        this.rebuildTrailGeometry(trail);

        if (trail.points.length === 0) {
          toRemove.push(id);
        }
      }
    });

    for (const id of toRemove) {
      const trail = this.trails.get(id)!;
      this.container.remove(trail.mesh as any);
      trail.geometry.dispose();
      trail.material.dispose();
      this.trails.delete(id);
    }
  }

  dispose(): void {
    this.trails.forEach(trail => {
      this.container.remove(trail.mesh as any);
      trail.geometry.dispose();
      trail.material.dispose();
    });
    this.trails.clear();
  }
}
