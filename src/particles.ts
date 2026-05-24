// Ambient particle system — floating neon particles, grid pulses
import {
  World,
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from '@iwsdk/core';

interface Particle {
  mesh: Mesh | Points;
  velocity: Vector3;
  life: number;
  maxLife: number;
  baseY: number;
  phase: number;
}

export class ParticleSystem {
  private world: World;
  private group: Group;
  private particles: Particle[] = [];
  private dustCloud: Points | null = null;
  private dustPositions: Float32Array | null = null;
  private time = 0;

  constructor(world: World) {
    this.world = world;
    this.group = new Group();
    world.scene.add(this.group as any);
    this.createFloatingOrbs();
    this.createDustCloud();
  }

  private createFloatingOrbs() {
    const colors = ['#00ffff', '#ff00ff', '#00ff88', '#ff6600', '#8844ff', '#ffff00'];
    const orbGeo = new SphereGeometry(0.015, 6, 6);

    for (let i = 0; i < 40; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(orbGeo, mat);

      const x = (Math.random() - 0.5) * 12;
      const y = 0.3 + Math.random() * 4;
      const z = -6 + Math.random() * 10;
      mesh.position.set(x, y, z);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
        ),
        life: Math.random() * 10,
        maxLife: 8 + Math.random() * 6,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private createDustCloud() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const dustColors = [
      new Color('#00ffff'),
      new Color('#ff00ff'),
      new Color('#00ff88'),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = -8 + Math.random() * 12;

      const c = dustColors[Math.floor(Math.random() * dustColors.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const mat = new PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.dustCloud = new Points(geo, mat);
    this.dustPositions = positions;
    this.group.add(this.dustCloud);
  }

  update(dt: number) {
    this.time += dt;

    // Animate floating orbs
    for (const p of this.particles) {
      p.life += dt;
      const mesh = p.mesh as Mesh;

      // Gentle floating motion
      mesh.position.y = p.baseY + Math.sin(this.time * 0.5 + p.phase) * 0.3;
      mesh.position.x += p.velocity.x * dt;
      mesh.position.z += p.velocity.z * dt;

      // Pulse opacity
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = (0.3 + Math.sin(this.time * 1.5 + p.phase) * 0.2);

      // Wrap around bounds
      if (mesh.position.x > 7) mesh.position.x = -7;
      if (mesh.position.x < -7) mesh.position.x = 7;
      if (mesh.position.z > 4) mesh.position.z = -6;
      if (mesh.position.z < -8) mesh.position.z = 4;

      // Scale pulse
      const s = 0.8 + Math.sin(this.time * 2 + p.phase * 2) * 0.3;
      mesh.scale.set(s, s, s);
    }

    // Animate dust cloud
    if (this.dustCloud && this.dustPositions) {
      const positions = this.dustPositions;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += dt * 0.05; // Slow rise
        if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = 0;
      }
      (this.dustCloud.geometry.attributes.position as any).needsUpdate = true;

      // Rotate dust cloud slowly
      this.dustCloud.rotation.y += dt * 0.02;
    }
  }

  // Burst effect when something exciting happens
  burst(position: Vector3, color: string, count = 12) {
    const burstGeo = new SphereGeometry(0.01, 4, 4);
    const mat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new Mesh(burstGeo, mat.clone());
      mesh.position.copy(position);
      this.group.add(mesh);

      const dir = new Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(0.5 + Math.random() * 1.5);

      const startTime = this.time;
      const burstLife = 0.6 + Math.random() * 0.4;

      const animate = () => {
        const elapsed = this.time - startTime;
        if (elapsed > burstLife) {
          this.group.remove(mesh);
          return;
        }
        const t = elapsed / burstLife;
        mesh.position.x += dir.x * 0.016 * (1 - t);
        mesh.position.y += dir.y * 0.016 * (1 - t) - 0.005;
        mesh.position.z += dir.z * 0.016 * (1 - t);
        (mesh.material as MeshBasicMaterial).opacity = 0.8 * (1 - t);
        mesh.scale.setScalar(1 - t * 0.5);
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }
}
