// Dartboard geometry and scoring
import {
  Group,
  Mesh,
  CylinderGeometry,
  RingGeometry,
  CircleGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  DoubleSide,
  AdditiveBlending,
  Color,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  World,
  PlaneGeometry,
  CanvasTexture,
  NearestFilter,
  SRGBColorSpace,
} from '@iwsdk/core';

// Standard dartboard segment order (clockwise from top)
export const BOARD_SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

// Dartboard dimensions (in meters, scaled from standard 451mm diameter)
const BOARD_RADIUS = 0.2255; // 451mm / 2
const DOUBLE_OUTER = 0.170;
const DOUBLE_INNER = 0.162;
const TRIPLE_OUTER = 0.107;
const TRIPLE_INNER = 0.099;
const OUTER_BULL = 0.0159; // outer bull radius
const INNER_BULL = 0.00635; // bullseye radius
const WIRE_WIDTH = 0.001;

// Segment colors — alternating black/white with red/green accents
const SEGMENT_COLORS = {
  black: '#0a0a1a',
  white: '#1a1a2a',
  red: '#cc0033',
  green: '#009933',
  bullRed: '#cc0033',
  bullGreen: '#009933',
  wire: '#444466',
  surround: '#111122',
  neonCyan: '#00ffff',
  neonMagenta: '#ff00ff',
};

export interface ScoreResult {
  segment: number;   // 1-20, or 25 for bull
  multiplier: number; // 1=single, 2=double, 3=triple, 25=outer bull, 50=inner bull
  total: number;
  x: number;
  y: number;
  label: string;
}

export function getScoreForPosition(x: number, y: number): ScoreResult {
  const dist = Math.sqrt(x * x + y * y);
  let angle = Math.atan2(x, y); // Note: x,y not y,x — 20 is at top
  if (angle < 0) angle += Math.PI * 2;

  // Bullseye check
  if (dist <= INNER_BULL) {
    return { segment: 25, multiplier: 2, total: 50, x, y, label: 'BULLSEYE!' };
  }
  if (dist <= OUTER_BULL) {
    return { segment: 25, multiplier: 1, total: 25, x, y, label: 'BULL' };
  }

  // Off the board
  if (dist > BOARD_RADIUS) {
    return { segment: 0, multiplier: 0, total: 0, x, y, label: 'MISS' };
  }

  // Determine segment
  const segmentAngle = (Math.PI * 2) / 20;
  const halfSeg = segmentAngle / 2;
  // Adjust angle so segment 20 is centered at top (angle = 0)
  let adjustedAngle = angle + halfSeg;
  if (adjustedAngle >= Math.PI * 2) adjustedAngle -= Math.PI * 2;
  const segIndex = Math.floor(adjustedAngle / segmentAngle);
  const segment = BOARD_SEGMENTS[segIndex] || 20;

  // Determine ring
  let multiplier = 1;
  let label = `${segment}`;
  if (dist >= DOUBLE_INNER && dist <= DOUBLE_OUTER) {
    multiplier = 2;
    label = `D${segment}`;
  } else if (dist >= TRIPLE_INNER && dist <= TRIPLE_OUTER) {
    multiplier = 3;
    label = `T${segment}`;
  }

  return { segment, multiplier, total: segment * multiplier, x, y, label };
}

export function createDartboard(world: World): Group {
  const board = new Group();

  // Surround ring (dark background beyond scoring area)
  const surroundGeo = new RingGeometry(BOARD_RADIUS, BOARD_RADIUS + 0.04, 64);
  const surroundMat = new MeshStandardMaterial({
    color: SEGMENT_COLORS.surround,
    emissive: new Color(SEGMENT_COLORS.surround),
    emissiveIntensity: 0.3,
    side: DoubleSide,
  });
  const surround = new Mesh(surroundGeo, surroundMat);
  board.add(surround);

  // Outer frame — glowing neon ring
  const frameGeo = new RingGeometry(BOARD_RADIUS + 0.04, BOARD_RADIUS + 0.05, 64);
  const frameMat = new MeshBasicMaterial({
    color: SEGMENT_COLORS.neonCyan,
    transparent: true,
    opacity: 0.8,
    side: DoubleSide,
  });
  const frame = new Mesh(frameGeo, frameMat);
  board.add(frame);

  // Glow ring
  const glowGeo = new RingGeometry(BOARD_RADIUS + 0.05, BOARD_RADIUS + 0.08, 64);
  const glowMat = new MeshBasicMaterial({
    color: SEGMENT_COLORS.neonCyan,
    transparent: true,
    opacity: 0.2,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const glow = new Mesh(glowGeo, glowMat);
  board.add(glow);

  // Draw 20 segments
  const segmentAngle = (Math.PI * 2) / 20;
  for (let i = 0; i < 20; i++) {
    const startAngle = i * segmentAngle - segmentAngle / 2 - Math.PI / 2;
    const isEven = i % 2 === 0;

    // Outer single (between double and triple)
    drawSegmentRing(board, DOUBLE_INNER, TRIPLE_OUTER, startAngle, segmentAngle,
      isEven ? SEGMENT_COLORS.black : SEGMENT_COLORS.white);

    // Inner single (between triple and bull)
    drawSegmentRing(board, TRIPLE_INNER, OUTER_BULL, startAngle, segmentAngle,
      isEven ? SEGMENT_COLORS.black : SEGMENT_COLORS.white);

    // Double ring
    drawSegmentRing(board, DOUBLE_OUTER, DOUBLE_INNER, startAngle, segmentAngle,
      isEven ? SEGMENT_COLORS.red : SEGMENT_COLORS.green);

    // Triple ring
    drawSegmentRing(board, TRIPLE_OUTER, TRIPLE_INNER, startAngle, segmentAngle,
      isEven ? SEGMENT_COLORS.red : SEGMENT_COLORS.green);

    // Single outer (between double and board edge)
    drawSegmentRing(board, BOARD_RADIUS, DOUBLE_OUTER, startAngle, segmentAngle,
      isEven ? SEGMENT_COLORS.black : SEGMENT_COLORS.white);

    // Segment number label — canvas texture for sharp text
    const labelAngle = i * segmentAngle - Math.PI / 2;
    const labelDist = BOARD_RADIUS + 0.03;
    const labelX = Math.cos(labelAngle) * labelDist;
    const labelY = Math.sin(labelAngle) * labelDist;

    const numLabel = createNumberLabel(BOARD_SEGMENTS[i]);
    numLabel.position.set(labelX, labelY, 0.002);
    board.add(numLabel);
  }

  // Outer bull
  const outerBullGeo = new CircleGeometry(OUTER_BULL, 32);
  const outerBullMat = new MeshStandardMaterial({
    color: SEGMENT_COLORS.bullGreen,
    emissive: new Color(SEGMENT_COLORS.bullGreen),
    emissiveIntensity: 0.5,
    side: DoubleSide,
  });
  const outerBull = new Mesh(outerBullGeo, outerBullMat);
  outerBull.position.z = 0.001;
  board.add(outerBull);

  // Inner bull (bullseye)
  const innerBullGeo = new CircleGeometry(INNER_BULL, 32);
  const innerBullMat = new MeshStandardMaterial({
    color: SEGMENT_COLORS.bullRed,
    emissive: new Color(SEGMENT_COLORS.bullRed),
    emissiveIntensity: 0.8,
    side: DoubleSide,
  });
  const innerBull = new Mesh(innerBullGeo, innerBullMat);
  innerBull.position.z = 0.002;
  board.add(innerBull);

  // Bullseye glow
  const bullGlowGeo = new CircleGeometry(INNER_BULL * 2, 32);
  const bullGlowMat = new MeshBasicMaterial({
    color: '#ff3333',
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const bullGlow = new Mesh(bullGlowGeo, bullGlowMat);
  bullGlow.position.z = 0.003;
  board.add(bullGlow);

  // Wire rings
  drawWireRing(board, DOUBLE_OUTER);
  drawWireRing(board, DOUBLE_INNER);
  drawWireRing(board, TRIPLE_OUTER);
  drawWireRing(board, TRIPLE_INNER);
  drawWireRing(board, OUTER_BULL);
  drawWireRing(board, INNER_BULL);

  // Wire spokes (segment dividers)
  for (let i = 0; i < 20; i++) {
    const angle = i * segmentAngle - segmentAngle / 2 - Math.PI / 2;
    drawWireSpoke(board, angle, INNER_BULL, BOARD_RADIUS);
  }

  // Board backing (solid cylinder behind the face)
  const backGeo = new CylinderGeometry(BOARD_RADIUS + 0.04, BOARD_RADIUS + 0.04, 0.04, 64);
  const backMat = new MeshStandardMaterial({
    color: '#0a0a15',
    roughness: 0.9,
  });
  const back = new Mesh(backGeo, backMat);
  back.rotation.x = Math.PI / 2;
  back.position.z = -0.02;
  board.add(back);

  return board;
}

function drawSegmentRing(
  parent: Group, outerR: number, innerR: number,
  startAngle: number, arcAngle: number, color: string
) {
  const segments = 16;
  const geo = new RingGeometry(innerR, outerR, segments, 1, startAngle, arcAngle);
  const mat = new MeshStandardMaterial({
    color,
    emissive: new Color(color),
    emissiveIntensity: 0.3,
    side: DoubleSide,
    roughness: 0.7,
  });
  const mesh = new Mesh(geo, mat);
  mesh.position.z = 0.001;
  parent.add(mesh);
}

function drawWireRing(parent: Group, radius: number) {
  const segments = 64;
  const points: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(Math.cos(a) * radius, Math.sin(a) * radius, 0.003);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(points, 3));
  const mat = new LineBasicMaterial({ color: SEGMENT_COLORS.wire, transparent: true, opacity: 0.6 });
  const line = new LineSegments(geo, mat);
  // Convert to line loop manually
  const loopGeo = new BufferGeometry();
  const loopPts: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    loopPts.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0.003);
    loopPts.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0.003);
  }
  loopGeo.setAttribute('position', new Float32BufferAttribute(loopPts, 3));
  const loop = new LineSegments(loopGeo, mat);
  parent.add(loop);
}

function drawWireSpoke(parent: Group, angle: number, innerR: number, outerR: number) {
  const geo = new BufferGeometry();
  const pts = [
    Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0.003,
    Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0.003,
  ];
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3));
  const mat = new LineBasicMaterial({ color: SEGMENT_COLORS.wire, transparent: true, opacity: 0.6 });
  parent.add(new LineSegments(geo, mat));
}

function createNumberLabel(num: number): Mesh {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx2d = canvas.getContext('2d')!;

  ctx2d.clearRect(0, 0, size, size);
  ctx2d.font = 'bold 40px Arial, sans-serif';
  ctx2d.textAlign = 'center';
  ctx2d.textBaseline = 'middle';

  // Outer glow
  ctx2d.shadowColor = '#00ffff';
  ctx2d.shadowBlur = 8;
  ctx2d.fillStyle = '#00ffff';
  ctx2d.fillText(String(num), size / 2, size / 2);

  // Crisp white fill on top
  ctx2d.shadowBlur = 0;
  ctx2d.fillStyle = '#ffffff';
  ctx2d.fillText(String(num), size / 2, size / 2);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  if ('colorSpace' in texture) {
    (texture as any).colorSpace = SRGBColorSpace;
  }

  const geo = new PlaneGeometry(0.025, 0.025);
  const mat = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });

  return new Mesh(geo, mat);
}
