import {
  BRIDGES,
  EAST_OUTLINE,
  MAP_POINTS,
  ROAD_WIDTH,
  ROUTE_POINTS,
  SIDE_ROADS,
  WEST_OUTLINE,
  distToCoast,
  distToPolyline,
  onLand,
  pointInPolygon,
  rng,
} from './layout.js';
import { ROAD_EXT, ROUTE_DENSE } from '../journey/route.js';

// The drawn main road runs on past both ends of the tour, through the end plazas up to the landmarks,
// so the camera never sees the road stop under the car
function extendPast(end, inner, by) {
  const dx = end[0] - inner[0];
  const dy = end[1] - inner[1];
  const len = Math.hypot(dx, dy);
  return [end[0] + (dx / len) * by, end[1] + (dy / len) * by];
}
const ROUTE_DRAWN = [
  extendPast(ROUTE_DENSE[0], ROUTE_DENSE[1], ROAD_EXT.start),
  ...ROUTE_DENSE,
  extendPast(ROUTE_DENSE[ROUTE_DENSE.length - 1], ROUTE_DENSE[ROUTE_DENSE.length - 2], ROAD_EXT.end),
];

export const ROADS = [
  { pts: ROUTE_DRAWN, width: ROAD_WIDTH.route, kind: 'route' },
  ...SIDE_ROADS.map((pts) => ({ pts, width: ROAD_WIDTH.side, kind: 'side' })),
  ...BRIDGES.map((pts) => ({ pts, width: ROAD_WIDTH.side, kind: 'bridge' })),
];

// Distance from a point to the nearest road edge (negative = on the road)
export function roadClearance(x, y) {
  let best = Infinity;
  for (const road of ROADS) best = Math.min(best, distToPolyline(x, y, road.pts) - road.width / 2);
  return best;
}

const STOPS = Object.values(MAP_POINTS);
const nearStop = (x, y, r) => STOPS.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < r);

// Landmarks that finish the two ends of the route, just past the first and last stop.
// rot turns a landmark so its local -z faces back along the road toward the stop.
function terminus(from, toward, back, radius, hit) {
  const dx = toward[0] - from[0];
  const dy = toward[1] - from[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const x = from[0] - ux * back;
  const y = from[1] - uy * back;
  // local +z (away from the road) in map space is (-ux, -uy); the landmark's main structure sits that way
  return { x, y, rot: Math.atan2(-ux, -uy), radius, hit: { x: x - ux * hit.off, y: y - uy * hit.off, w: hit.size, d: hit.size } };
}
const R = ROUTE_POINTS;
export const TERMINI = {
  start: terminus(R[0], R[1], 22, 17, { off: 9, size: 12 }),
  end: terminus(R[R.length - 1], R[R.length - 2], 26, 18, { off: 14, size: 18 }),
};
const nearTerminus = (x, y, pad) => Object.values(TERMINI).some((t) => Math.hypot(t.x - x, t.y - y) < t.radius + pad);

// A pit-stop cart beside each stop, right at the road edge: a little ahead of where the car parks, on the
// right if there's room (side roads meet some stops), else the next best spot. rot turns its local -z toward
// the road. Collision is three small boxes along the cart, so it never pokes out into the lane.
function pitStop(id) {
  const [sx, sy] = MAP_POINTS[id];
  const i = R.findIndex((q) => q[0] === sx && q[1] === sy);
  const a = R[Math.max(0, i - 1)];
  const b = R[Math.min(R.length - 1, i + 1)];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const fx = (b[0] - a[0]) / len;
  const fy = (b[1] - a[1]) / len;
  const rx = -fy;
  const ry = fx;
  const tries = [[1, 7], [1, -7], [-1, 7], [-1, -7], [1, 0], [-1, 0], [1, 14], [-1, 14]];
  for (const [side, along] of tries) {
    const off = ROAD_WIDTH.route / 2 + 2.3;
    const x = sx + rx * side * off + fx * along;
    const y = sy + ry * side * off + fy * along;
    if (onLand(x, y) && roadClearance(x, y) > 1.9 && !nearTerminus(x, y, 2)) {
      const ax = Math.cos(Math.atan2(rx * side, ry * side));
      const ay = -Math.sin(Math.atan2(rx * side, ry * side));
      const back = 0.5;
      const hit = [-2, 0, 2].map((k) => ({ x: x + ax * k + rx * side * back, y: y + ay * k + ry * side * back, w: 2.4, d: 2.4 }));
      return { id, x, y, rot: Math.atan2(rx * side, ry * side), toRoad: [-rx * side, -ry * side], fwd: [fx, fy], hit };
    }
  }
  return null;
}
export const PITSTOPS = Object.keys(MAP_POINTS).map(pitStop).filter(Boolean);
const nearPit = (x, y, pad) => PITSTOPS.some((q) => Math.hypot(q.x - x, q.y - y) < 4 + pad);

function buildCity() {
  const r = rng(2026);
  const buildings = [];
  const islands = [
    { poly: WEST_OUTLINE, downtown: () => false },
    { poly: EAST_OUTLINE, downtown: (x, y) => y < 280 },
  ];
  for (const { poly, downtown } of islands) {
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    for (let gx = Math.min(...xs); gx < Math.max(...xs); gx += 12.5) {
      for (let gy = Math.min(...ys); gy < Math.max(...ys); gy += 12.5) {
        const x = gx + (r() - 0.5) * 3;
        const y = gy + (r() - 0.5) * 3;
        const w = 7 + r() * 4;
        const d = 7 + r() * 4;
        const half = Math.hypot(w, d) / 2;
        if (!pointInPolygon(x, y, poly)) continue;
        if (distToCoast(x, y) < half + 5) continue;
        if (roadClearance(x, y) < half + 3.5) continue;
        if (nearStop(x, y, 22)) continue;
        if (nearTerminus(x, y, half + 4) || nearPit(x, y, half + 3)) continue;
        const tall = downtown(x, y);
        const h = 6 + Math.pow(r(), tall ? 1.6 : 2.2) * (tall ? 62 : 28);
        buildings.push({ x, y, w, d, h, tint: r(), neon: r() < 0.3 ? (r() < 0.6 ? 0 : 1) : -1 });
      }
    }
  }

  const blockedByBuilding = (x, y, pad) =>
    buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + pad && Math.abs(b.y - y) < b.d / 2 + pad);

  const palms = [];
  const lights = [];
  for (const road of ROADS) {
    if (road.kind === 'bridge') continue;
    const pts = road.pts;
    let travelled = 0;
    let nextPalm = 6;
    let nextLight = 10;
    let side = 1;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const seg = Math.hypot(bx - ax, by - ay);
      const fx = (bx - ax) / seg;
      const fy = (by - ay) / seg;
      while (nextPalm < travelled + seg || nextLight < travelled + seg) {
        const isPalm = nextPalm < nextLight;
        const at = isPalm ? nextPalm : nextLight;
        const t = (at - travelled) / seg;
        const cx = ax + (bx - ax) * t;
        const cy = ay + (by - ay) * t;
        if (isPalm) {
          for (const sgn of [1, -1]) {
            const px = cx - fy * sgn * (road.width / 2 + 2.4);
            const py = cy + fx * sgn * (road.width / 2 + 2.4);
            if (onLand(px, py) && roadClearance(px, py) > 1 && !blockedByBuilding(px, py, 1) && !nearStop(px, py, 9) && !nearTerminus(px, py, 2) && !nearPit(px, py, 3)) {
              palms.push({ x: px, y: py, h: 8 + r() * 5, lean: (r() - 0.5) * 0.25, spin: r() * Math.PI * 2 });
            }
          }
          nextPalm += 15 + r() * 6;
        } else {
          const px = cx - fy * side * (road.width / 2 + 1.1);
          const py = cy + fx * side * (road.width / 2 + 1.1);
          if (onLand(px, py) && roadClearance(px, py) > 0.3 && !nearStop(px, py, 7) && !nearTerminus(px, py, 0) && !nearPit(px, py, 3)) {
            // Arm points back across the road
            lights.push({ x: px, y: py, ax: fy * side, ay: -fx * side, gx: cx - fy * side * (road.width / 2 - 2.2), gy: cy + fx * side * (road.width / 2 - 2.2) });
          }
          side = -side;
          nextLight += 30;
        }
      }
      travelled += seg;
    }
  }

  // Beach palms around the coastline
  for (const poly of [WEST_OUTLINE, EAST_OUTLINE]) {
    for (let i = 0; i < poly.length; i += 3) {
      if (r() < 0.45) continue;
      const [x, y] = poly[i];
      const [nx, ny] = poly[(i + 1) % poly.length];
      const len = Math.hypot(nx - x, ny - y) || 1;
      // Step inward: polygons are wound so the interior is on one side; test both
      const ix = x + (-(ny - y) / len) * 3.5;
      const iy = y + ((nx - x) / len) * 3.5;
      const ox = x - (-(ny - y) / len) * 3.5;
      const oy = y - ((nx - x) / len) * 3.5;
      const [px, py] = onLand(ix, iy) ? [ix, iy] : [ox, oy];
      if (onLand(px, py) && roadClearance(px, py) > 2 && !blockedByBuilding(px, py, 1) && !nearTerminus(px, py, 2) && !nearPit(px, py, 3)) {
        palms.push({ x: px, y: py, h: 7 + r() * 6, lean: (r() - 0.5) * 0.5, spin: r() * Math.PI * 2 });
      }
    }
  }

  return { buildings, palms, lights };
}

export const CITY = buildCity();

// Spatial hash so free-roam collision only checks nearby buildings (and the two landmarks)
const CELL = 24;
const GRID = new Map();
const OBSTACLES = [...CITY.buildings, ...Object.values(TERMINI).map((t) => t.hit), ...PITSTOPS.flatMap((q) => q.hit)];
OBSTACLES.forEach((b, idx) => {
  const x0 = Math.floor((b.x - b.w / 2) / CELL);
  const x1 = Math.floor((b.x + b.w / 2) / CELL);
  const y0 = Math.floor((b.y - b.d / 2) / CELL);
  const y1 = Math.floor((b.y + b.d / 2) / CELL);
  for (let gx = x0; gx <= x1; gx++) {
    for (let gy = y0; gy <= y1; gy++) {
      const key = `${gx},${gy}`;
      if (!GRID.has(key)) GRID.set(key, []);
      GRID.get(key).push(idx);
    }
  }
});

export function hitsBuilding(x, y, radius) {
  const gx = Math.floor(x / CELL);
  const gy = Math.floor(y / CELL);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (const idx of GRID.get(`${gx + dx},${gy + dy}`) ?? []) {
        const b = OBSTACLES[idx];
        if (Math.abs(b.x - x) < b.w / 2 + radius && Math.abs(b.y - y) < b.d / 2 + radius) return true;
      }
    }
  }
  return false;
}

export const isDrivable = (x, y) => onLand(x, y) || roadClearance(x, y) < 0;
