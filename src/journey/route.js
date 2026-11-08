import { MAP_POINTS, ROUTE_POINTS, polylinePath } from '../city/layout.js';
import { stops } from '../data/portfolio.js';

export { MAP_POINTS };

const STEPS = 24;

// Open Catmull-Rom: control point i lands exactly on dense index i * STEPS
function catmullOpen(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < STEPS; k++) {
      const t = k / STEPS;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export const ROUTE_DENSE = catmullOpen(ROUTE_POINTS);
const CUMULATIVE = ROUTE_DENSE.reduce((acc, p, i) => {
  acc.push(i ? acc[i - 1] + Math.hypot(p[0] - ROUTE_DENSE[i - 1][0], p[1] - ROUTE_DENSE[i - 1][1]) : 0);
  return acc;
}, []);
export const ROUTE_LENGTH = CUMULATIVE[CUMULATIVE.length - 1];

export const STOP_LENGTHS = stops.map((st) => {
  const [x, y] = MAP_POINTS[st.id];
  const i = ROUTE_POINTS.findIndex((p) => p[0] === x && p[1] === y);
  if (i < 0) throw new Error(`route.js: stop "${st.id}" must be one of ROUTE_POINTS`);
  return CUMULATIVE[i * STEPS];
});

export const ROUTE_PATH = polylinePath(ROUTE_DENSE.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));

export function pointAtLength(L) {
  const len = Math.min(Math.max(L, 0), ROUTE_LENGTH);
  let lo = 0;
  let hi = CUMULATIVE.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUMULATIVE[mid] <= len) lo = mid;
    else hi = mid;
  }
  const span = CUMULATIVE[hi] - CUMULATIVE[lo] || 1;
  const t = (len - CUMULATIVE[lo]) / span;
  const a = ROUTE_DENSE[lo];
  const b = ROUTE_DENSE[hi];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Clockwise degrees from north (map up), the convention the radar uses
export function headingAtLength(L) {
  const a = pointAtLength(L - 4);
  const b = pointAtLength(L + 4);
  return (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI;
}

export function lengthAtStop(s) {
  const last = STOP_LENGTHS.length - 1;
  const ss = Math.min(Math.max(s, 0), last);
  const i = Math.min(Math.floor(ss), last - 1);
  return STOP_LENGTHS[i] + (STOP_LENGTHS[i + 1] - STOP_LENGTHS[i]) * (ss - i);
}

// The drawn road carries on this far past the first and last stop, into the landmarks at each end.
// Traffic uses the extra stretch to drive in and out of view instead of popping at the route ends.
export const ROAD_EXT = { start: 29, end: 34 };
const outward = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const len = Math.hypot(dx, dy);
  return [dx / len, dy / len];
};
const START_OUT = outward(ROUTE_DENSE[0], ROUTE_DENSE[1]);
const END_OUT = outward(ROUTE_DENSE[ROUTE_DENSE.length - 1], ROUTE_DENSE[ROUTE_DENSE.length - 2]);
export const ROAD_MIN = -ROAD_EXT.start;
export const ROAD_MAX = ROUTE_LENGTH + ROAD_EXT.end;

// pointAtLength / headingAtLength that also cover the stretches past both ends (L < 0 or > ROUTE_LENGTH)
export function pointAtLengthExt(L) {
  if (L < 0) return [ROUTE_DENSE[0][0] + START_OUT[0] * -L, ROUTE_DENSE[0][1] + START_OUT[1] * -L];
  if (L > ROUTE_LENGTH) {
    const e = ROUTE_DENSE[ROUTE_DENSE.length - 1];
    return [e[0] + END_OUT[0] * (L - ROUTE_LENGTH), e[1] + END_OUT[1] * (L - ROUTE_LENGTH)];
  }
  return pointAtLength(L);
}
export function headingAtLengthExt(L) {
  if (L < 0) return (Math.atan2(-START_OUT[0], START_OUT[1]) * 180) / Math.PI;
  if (L > ROUTE_LENGTH) return (Math.atan2(END_OUT[0], -END_OUT[1]) * 180) / Math.PI;
  return headingAtLength(L);
}

// Inverse of lengthAtStop: route length back to stop-space
export function stopAtLength(L) {
  const last = STOP_LENGTHS.length - 1;
  if (L <= STOP_LENGTHS[0]) return 0;
  for (let i = 0; i < last; i++) {
    if (L <= STOP_LENGTHS[i + 1]) return i + (L - STOP_LENGTHS[i]) / (STOP_LENGTHS[i + 1] - STOP_LENGTHS[i]);
  }
  return last;
}

// s is the stop-space position: 0 = first stop, 1 = second, fractions are on the road between
export function routeAt(s) {
  const L = lengthAtStop(s);
  const [x, y] = pointAtLength(L);
  return { x, y, heading: headingAtLength(L) };
}

export function nearestStop(x, y) {
  let best = 0;
  let bestD = Infinity;
  stops.forEach((st, i) => {
    const [sx, sy] = MAP_POINTS[st.id];
    const d = Math.hypot(sx - x, sy - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return { index: best, distance: bestD };
}
