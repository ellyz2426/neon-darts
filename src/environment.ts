// Holodeck environment
import {
  World,
  Mesh,
  Group,
  PlaneGeometry,
  BoxGeometry,
  SphereGeometry,
  TorusGeometry,
  ConeGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Color,
  Fog,
  AmbientLight,
  PointLight,
  DirectionalLight,
  DoubleSide,
  AdditiveBlending,
  MathUtils,
  Vector3,
} from '@iwsdk/core';

export function createEnvironment(world: World) {
  // Fog
  world.scene.fog = new Fog(0x000011, 5, 30);

  // Ambient light
  const ambient = new AmbientLight(0x222244, 0.5);
  world.scene.add(ambient as any);

  // Key lights
  const keyLight = new DirectionalLight(0x88aaff, 0.3);
  keyLight.position.set(2, 4, 1);
  world.scene.add(keyLight as any);

  // Board spotlight
  const boardLight = new PointLight(0x00ffff, 2, 5);
  boardLight.position.set(0, 2.5, -2.2);
  world.scene.add(boardLight as any);

  const boardLight2 = new PointLight(0xff00ff, 1, 4);
  boardLight2.position.set(-1, 2, -2);
  world.scene.add(boardLight2 as any);

  const boardLight3 = new PointLight(0x00ff88, 1, 4);
  boardLight3.position.set(1, 2, -2);
  world.scene.add(boardLight3 as any);

  // Neon grid floor
  const floorGeo = new PlaneGeometry(30, 30);
  const floorMat = new MeshStandardMaterial({
    color: '#050510',
    emissive: new Color('#050510'),
    emissiveIntensity: 0.2,
    roughness: 0.9,
    side: DoubleSide,
  });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  world.scene.add(floor);

  // Grid lines on floor
  const gridGroup = new Group();
  const gridMat = new LineBasicMaterial({ color: '#00ffff', transparent: true, opacity: 0.1 });
  for (let i = -15; i <= 15; i++) {
    const geo = new BoxGeometry(0.002, 0.001, 30);
    const mat = new MeshBasicMaterial({ color: '#00ffff', transparent: true, opacity: 0.08 });
    const line = new Mesh(geo, mat);
    line.position.set(i, 0.001, 0);
    gridGroup.add(line);

    const line2 = new Mesh(geo.clone(), mat);
    line2.rotation.y = Math.PI / 2;
    line2.position.set(0, 0.001, i);
    gridGroup.add(line2);
  }
  world.scene.add(gridGroup);

  // Neon grid ceiling
  const ceilGeo = new PlaneGeometry(30, 30);
  const ceilMat = new MeshStandardMaterial({
    color: '#020208',
    emissive: new Color('#020208'),
    emissiveIntensity: 0.1,
    side: DoubleSide,
  });
  const ceiling = new Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  world.scene.add(ceiling);

  // Ceiling grid
  const ceilGridGroup = new Group();
  for (let i = -15; i <= 15; i += 2) {
    const geo = new BoxGeometry(0.002, 0.001, 30);
    const mat = new MeshBasicMaterial({ color: '#0088ff', transparent: true, opacity: 0.05 });
    const line = new Mesh(geo, mat);
    line.position.set(i, 3.999, 0);
    ceilGridGroup.add(line);

    const line2 = new Mesh(geo.clone(), mat);
    line2.rotation.y = Math.PI / 2;
    line2.position.set(0, 3.999, i);
    ceilGridGroup.add(line2);
  }
  world.scene.add(ceilGridGroup);

  // Back wall behind dartboard
  const wallGeo = new PlaneGeometry(6, 4);
  const wallMat = new MeshStandardMaterial({
    color: '#060612',
    emissive: new Color('#060612'),
    emissiveIntensity: 0.2,
    side: DoubleSide,
  });
  const wall = new Mesh(wallGeo, wallMat);
  wall.position.set(0, 2, -2.5);
  world.scene.add(wall);

  // Wall border glow
  const wallBorderGeo = new BoxGeometry(6.05, 4.05, 0.01);
  const wallBorderMat = new MeshBasicMaterial({
    color: '#00ffff',
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending,
  });
  const wallBorder = new Mesh(wallBorderGeo, wallBorderMat);
  wallBorder.position.set(0, 2, -2.49);
  world.scene.add(wallBorder);

  // Throw line (oche) — glowing line on the floor
  const ocheGeo = new BoxGeometry(0.6, 0.005, 0.02);
  const ocheMat = new MeshBasicMaterial({
    color: '#ff00ff',
    transparent: true,
    opacity: 0.8,
  });
  const oche = new Mesh(ocheGeo, ocheMat);
  oche.position.set(0, 0.003, -0.01);
  world.scene.add(oche);

  // Oche glow
  const ocheGlowGeo = new BoxGeometry(0.65, 0.005, 0.06);
  const ocheGlowMat = new MeshBasicMaterial({
    color: '#ff00ff',
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending,
  });
  const ocheGlow = new Mesh(ocheGlowGeo, ocheGlowMat);
  ocheGlow.position.set(0, 0.002, -0.01);
  world.scene.add(ocheGlow);

  // Floating wireframe decorations
  const decorations: { mesh: Mesh; speed: number; axis: Vector3 }[] = [];
  const decoTypes = [
    () => new TorusGeometry(0.15, 0.03, 8, 16),
    () => new BoxGeometry(0.2, 0.2, 0.2),
    () => new SphereGeometry(0.12, 8, 8),
    () => new ConeGeometry(0.12, 0.25, 6),
  ];
  const decoColors = ['#00ffff', '#ff00ff', '#00ff88', '#ffff00', '#ff6600'];

  for (let i = 0; i < 16; i++) {
    const geoFn = decoTypes[i % decoTypes.length];
    const geo = geoFn();
    const color = decoColors[i % decoColors.length];
    const edges = new EdgesGeometry(geo);
    const mat = new LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
    const wireframe = new LineSegments(edges, mat) as any as Mesh;

    const x = (Math.random() - 0.5) * 12;
    const y = 0.5 + Math.random() * 3;
    const z = -5 + Math.random() * 8;
    wireframe.position.set(x, y, z);

    world.scene.add(wireframe);
  }

  // Ambient floating particles
  const particleGroup = new Group();
  for (let i = 0; i < 50; i++) {
    const geo = new SphereGeometry(0.005, 4, 4);
    const color = decoColors[i % decoColors.length];
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.3,
    });
    const particle = new Mesh(geo, mat);
    particle.position.set(
      (Math.random() - 0.5) * 15,
      Math.random() * 4,
      (Math.random() - 0.5) * 15
    );
    particleGroup.add(particle);
  }
  world.scene.add(particleGroup);

  // Side pillars for atmosphere
  for (let side = -1; side <= 1; side += 2) {
    const pillarGeo = new CylinderGeometry(0.05, 0.05, 4, 8);
    const pillarMat = new MeshStandardMaterial({
      color: '#111122',
      emissive: new Color('#00ffff'),
      emissiveIntensity: 0.1,
    });
    const pillar = new Mesh(pillarGeo, pillarMat);
    pillar.position.set(side * 1.5, 2, -2.5);
    world.scene.add(pillar);

    // Pillar top glow
    const topGeo = new SphereGeometry(0.08, 8, 8);
    const topMat = new MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.4,
    });
    const topGlow = new Mesh(topGeo, topMat);
    topGlow.position.set(side * 1.5, 4, -2.5);
    world.scene.add(topGlow);
  }
}
