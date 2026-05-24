// Score Popup — floating 3D score text at hit location
import {
  World,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
  Vector3,
  CanvasTexture,
  NearestFilter,
  SRGBColorSpace,
} from '@iwsdk/core';

interface ScorePopup {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  startScale: number;
}

export class ScorePopupManager {
  private world: World;
  private popups: ScorePopup[] = [];
  private group: Group;

  constructor(world: World) {
    this.world = world;
    this.group = new Group();
    world.scene.add(this.group);
  }

  spawn(position: Vector3, text: string, color: string, size = 1.0) {
    const canvas = document.createElement('canvas');
    const canvasSize = 256;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.font = `bold ${Math.round(80 * size)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, canvasSize / 2, canvasSize / 2);

    // Sharp text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, canvasSize / 2, canvasSize / 2);

    const texture = new CanvasTexture(canvas);
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = SRGBColorSpace;
    }

    const geo = new PlaneGeometry(0.12 * size, 0.12 * size);
    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });

    const mesh = new Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.z += 0.05; // in front of board
    this.group.add(mesh);

    this.popups.push({
      mesh,
      velocity: new Vector3(
        (Math.random() - 0.5) * 0.2,
        0.3 + Math.random() * 0.2,
        0.2
      ),
      life: 1.2,
      maxLife: 1.2,
      startScale: size,
    });
  }

  spawnScorePopup(position: Vector3, total: number, multiplier: number, segment: number) {
    if (total === 0) {
      this.spawn(position, 'MISS', '#ff3333', 0.8);
      return;
    }

    let color = '#00ffff';
    let size = 1.0;
    let text = `${total}`;

    if (segment === 25 && multiplier === 2) {
      color = '#ff4444';
      size = 1.4;
      text = 'BULL!';
    } else if (segment === 25) {
      color = '#44ff44';
      size = 1.2;
      text = '25';
    } else if (multiplier === 3) {
      color = '#ff00ff';
      size = 1.3;
      text = `T${segment}`;
    } else if (multiplier === 2) {
      color = '#00ff44';
      size = 1.1;
      text = `D${segment}`;
    }

    this.spawn(position, text, color, size);
  }

  update(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        (p.mesh.material as MeshBasicMaterial).dispose();
        p.mesh.geometry.dispose();
        this.popups.splice(i, 1);
        continue;
      }

      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= 0.3 * dt; // gentle slow-down

      const alpha = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = alpha;

      // Scale up slightly then fade
      const t = 1 - (p.life / p.maxLife);
      const scale = p.startScale * (1 + t * 0.5);
      p.mesh.scale.set(scale, scale, scale);
    }
  }
}
