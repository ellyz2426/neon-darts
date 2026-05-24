// Aim Cursor — visual crosshair/reticle on the dartboard
import {
  World,
  Group,
  Mesh,
  RingGeometry,
  CircleGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
  Vector3,
} from '@iwsdk/core';

export class AimCursor {
  private world: World;
  private group: Group;
  private outerRing: Mesh;
  private innerDot: Mesh;
  private pulseTime = 0;
  public visible = false;

  constructor(world: World) {
    this.world = world;
    this.group = new Group();

    // Outer ring
    const ringGeo = new RingGeometry(0.008, 0.01, 32);
    const ringMat = new MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.6,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    this.outerRing = new Mesh(ringGeo, ringMat);
    this.group.add(this.outerRing);

    // Inner dot
    const dotGeo = new CircleGeometry(0.002, 16);
    const dotMat = new MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      side: DoubleSide,
    });
    this.innerDot = new Mesh(dotGeo, dotMat);
    this.innerDot.position.z = 0.001;
    this.group.add(this.innerDot);

    // Crosshair lines (4 thin boxes)
    const lineMat = new MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
    });

    // Vertical lines
    const vGeo = new BoxGeometry(0.001, 0.012, 0.001);
    const vUp = new Mesh(vGeo, lineMat);
    vUp.position.y = 0.015;
    this.group.add(vUp);
    const vDown = new Mesh(vGeo.clone(), lineMat);
    vDown.position.y = -0.015;
    this.group.add(vDown);

    // Horizontal lines
    const hGeo = new BoxGeometry(0.012, 0.001, 0.001);
    const hRight = new Mesh(hGeo, lineMat);
    hRight.position.x = 0.015;
    this.group.add(hRight);
    const hLeft = new Mesh(hGeo.clone(), lineMat);
    hLeft.position.x = -0.015;
    this.group.add(hLeft);

    this.group.visible = false;
    world.scene.add(this.group);
  }

  setPosition(boardPos: Vector3, aimX: number, aimY: number) {
    this.group.position.set(
      boardPos.x + aimX,
      boardPos.y + aimY,
      boardPos.z + 0.015
    );
  }

  show() {
    this.group.visible = true;
    this.visible = true;
  }

  hide() {
    this.group.visible = false;
    this.visible = false;
  }

  update(dt: number) {
    if (!this.visible) return;

    this.pulseTime += dt * 3;
    const pulse = 0.8 + Math.sin(this.pulseTime) * 0.2;

    (this.outerRing.material as MeshBasicMaterial).opacity = 0.4 + pulse * 0.3;

    const scale = 0.9 + Math.sin(this.pulseTime * 0.7) * 0.15;
    this.outerRing.scale.set(scale, scale, 1);
  }
}
