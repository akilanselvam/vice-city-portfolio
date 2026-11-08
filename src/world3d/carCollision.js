// Cars collide as three overlapping circles along their length (a cheap capsule)
const OFFSETS = [-1.5, 0, 1.5];
const RADIUS = 1.1;

// Returns the push-out normal (from b toward a) and overlap depth, or null if the cars don't touch
export function carsOverlap(ax, ay, ayaw, bx, by, byaw) {
  if (Math.hypot(ax - bx, ay - by) > 7) return null;
  const afx = Math.sin(ayaw);
  const afy = -Math.cos(ayaw);
  const bfx = Math.sin(byaw);
  const bfy = -Math.cos(byaw);
  let best = null;
  for (const oa of OFFSETS) {
    for (const ob of OFFSETS) {
      const dx = ax + afx * oa - (bx + bfx * ob);
      const dy = ay + afy * oa - (by + bfy * ob);
      const d = Math.hypot(dx, dy);
      const depth = RADIUS * 2 - d;
      if (depth > 0 && (!best || depth > best.depth)) {
        best = { nx: d ? dx / d : 1, ny: d ? dy / d : 0, depth };
      }
    }
  }
  return best;
}
