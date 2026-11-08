// Single source of truth for the city. Coordinates are map units (800x560 map);
// the 3D world uses the same numbers, with map y becoming world z.

export const WEST_PTS = [[120, 80], [230, 60], [300, 110], [310, 200], [280, 300], [300, 380], [250, 470], [160, 500], [110, 430], [130, 340], [90, 250], [100, 150]];
export const EAST_PTS = [[470, 40], [560, 30], [620, 70], [640, 150], [600, 220], [650, 300], [700, 380], [680, 470], [600, 520], [520, 500], [500, 420], [540, 340], [480, 270], [450, 180]];
export const ISLETS = [
  { cx: 390, cy: 300, rx: 46, ry: 28 },
  { cx: 402, cy: 130, rx: 26, ry: 16 },
];

// Where each stop sits; the tour route passes through these in order
export const MAP_POINTS = {
  home: [185, 455],
  about: [200, 360],
  skills: [192, 250],
  projects: [250, 180],
  experience: [575, 150],
  contact: [632, 440],
  freeroam: [596, 478],
};

export const ROUTE_POINTS = [
  [185, 455], [195, 410], [200, 360], [197, 305], [192, 250], [200, 205], [250, 180],
  [305, 190], [380, 192], [455, 186], [520, 165], [575, 150], [570, 230], [590, 310], [622, 385], [632, 440], [596, 478],
];

export const SIDE_ROADS = [
  [[130, 410], [280, 410]],
  [[100, 300], [300, 300]],
  [[95, 205], [200, 205]],
  [[140, 100], [220, 115], [250, 180]],
  [[480, 75], [575, 150]],
  [[575, 150], [622, 122]],
  [[492, 262], [572, 245], [636, 290]],
  [[552, 345], [600, 342]],
  [[520, 478], [632, 440], [682, 425]],
];

// Roads over water (map draws them dashed, 3D gives them pillars)
export const BRIDGES = [
  [[300, 300], [352, 300]],
  [[352, 300], [428, 300]],
  [[428, 300], [552, 345]],
];

export const ROAD_WIDTH = { route: 12, side: 9 };

// Closed Catmull-Rom through the points
export function smoothClosed(pts, steps = 10) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  return out;
}

export const WEST_OUTLINE = smoothClosed(WEST_PTS);
export const EAST_OUTLINE = smoothClosed(EAST_PTS);
export const ISLET_OUTLINES = ISLETS.map(({ cx, cy, rx, ry }) =>
  Array.from({ length: 36 }, (_, i) => [cx + Math.cos((i / 36) * Math.PI * 2) * rx, cy + Math.sin((i / 36) * Math.PI * 2) * ry]),
);
export const LAND_OUTLINES = [WEST_OUTLINE, EAST_OUTLINE, ...ISLET_OUTLINES];

export const outlinePath = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}Z`;
export const polylinePath = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const onLand = (x, y) => LAND_OUTLINES.some((poly) => pointInPolygon(x, y, poly));

export function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolyline(px, py, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, distToSegment(px, py, pts[i - 1], pts[i]));
  return best;
}

export function distToCoast(px, py) {
  let best = Infinity;
  for (const poly of LAND_OUTLINES) {
    for (let i = 0; i < poly.length; i++) best = Math.min(best, distToSegment(px, py, poly[i], poly[(i + 1) % poly.length]));
  }
  return best;
}

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
