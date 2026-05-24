// Effects manager — particles, hit effects
import {
  World,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
  AdditiveBlending,
  Group,
} from '@iwsdk/core';

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 80;

export class EffectsManager {
  private world: World;
  private particles: Particle[] = [];
  private particleGroup: Group;
  private sharedGeo = new SphereGeometry(0.004, 4, 4);

  constructor(world: World) {
    this.world = world;
    this.particleGroup = new Group();
    world.scene.add(this.particleGroup);
  }

  spawnHitParticles(position: Vector3, color: string, count = 12) {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const mat = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(this.sharedGeo, mat);
      mesh.position.copy(position);
      this.particleGroup.add(mesh);

      const speed = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;

      this.particles.push({
        mesh,
        velocity: new Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 0.2,
          Math.sin(angle) * Math.cos(elevation) * speed * 0.3
        ),
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        (p.mesh.material as MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 1.5 * dt; // gravity
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

      const alpha = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = alpha * 0.8;
    }
  }
}
