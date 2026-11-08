import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ROAD_MAX, ROAD_MIN, ROUTE_LENGTH, headingAtLengthExt, pointAtLengthExt } from '../journey/route.js';
import { store } from './store.js';

// Where each traffic vehicle starts and how fast it goes; its look comes from the theme's palette
const NPCS = [
  { speed: 17, at: 0.15 },
  { speed: 13, at: 0.38 },
  { speed: 15, at: 0.56 },
  { speed: 19, at: 0.74 },
  { speed: 12, at: 0.9 },
];
const LANE = -2.8;
const PASS_SHIFT = -2.6;
const approach = (v, target, step) => (v > target ? Math.max(target, v - step) : Math.min(target, v + step));
// Vehicles fade over this distance at the far ends of the road, inside the landmarks, rather than shrinking
const FADE = 8;

// Every material on a vehicle, with its own opacity, so the whole model can fade together
function collectMaterials(group) {
  const list = [];
  group.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) list.push({ m, opacity: m.opacity, transparent: m.transparent });
  });
  return list;
}

// Oncoming traffic loops the main road in real time. Cars are solid: they brake for whatever
// is ahead in their lane, get knocked aside and stall when hit, and pull out to pass if blocked.
export default function Traffic({ Model, palette, speedScale = 1 }) {
  const groups = useRef([]);
  const materials = useRef([]);
  const wheels = useMemo(() => NPCS.map(() => ({ current: [] })), []);
  const state = useRef(
    NPCS.map((n) => ({ L: n.at * ROUTE_LENGTH, v: n.speed * speedScale, stall: 0, blocked: 0, shift: 0, kx: 0, ky: 0, spin: 0, alpha: 1 })),
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cars = state.current;

    for (const hit of store.impacts) {
      const st = cars[hit.index];
      if (!st) continue;
      const push = Math.min(3, hit.strength * 0.12);
      st.kx += hit.nx * push;
      st.ky += hit.ny * push;
      st.spin += (Math.random() - 0.5) * Math.min(0.9, hit.strength * 0.04);
      st.stall = Math.max(st.stall, 1.2 + Math.min(1.5, hit.strength * 0.05));
      st.v = 0;
    }
    store.impacts.length = 0;

    NPCS.forEach((npc, i) => {
      const st = cars[i];
      const me = store.npcs[i];
      let target = npc.speed * speedScale;

      if (me) {
        // Heading of travel is the route heading reversed (they drive the route backwards)
        const fx = -Math.sin(me.routeYaw);
        const fy = Math.cos(me.routeYaw);
        const obstacles = [store.player, ...store.npcs.filter((o, j) => j !== i && o && !o.ghost)];
        let blockedNow = false;
        for (const o of obstacles) {
          const dx = o.x - me.x;
          const dy = o.y - me.y;
          const ahead = dx * fx + dy * fy;
          const side = Math.abs(dx * -fy + dy * fx);
          if (ahead > 0 && ahead < 16 && side < 2.6) {
            target = Math.min(target, Math.max(0, (ahead - 6) * 1.6));
            if (ahead < 10) blockedNow = true;
          }
        }
        st.blocked = blockedNow ? st.blocked + dt : Math.max(0, st.blocked - dt * 2);
      }
      if (st.stall > 0) {
        st.stall -= dt;
        target = 0;
      }

      st.v = approach(st.v, target, (target < st.v ? 32 : 7) * dt);
      st.L -= st.v * dt;
      // Out past the start, inside its landmark: re-enter from inside the landmark at the far end
      if (st.L < ROAD_MIN) st.L += ROAD_MAX - ROAD_MIN;
      // Swing out to pass after waiting a couple of seconds, then tuck back in
      st.shift += ((st.blocked > 1.8 ? PASS_SHIFT : 0) - st.shift) * (1 - Math.exp(-dt * 1.5));
      const decay = Math.exp(-dt * 1.2);
      st.kx *= decay;
      st.ky *= decay;
      st.spin *= Math.exp(-dt * 1.5);

      const [x, y] = pointAtLengthExt(st.L);
      const h = (headingAtLengthExt(st.L) * Math.PI) / 180;
      const lane = LANE + st.shift;
      const px = x + Math.cos(h) * lane + st.kx;
      const py = y + Math.sin(h) * lane + st.ky;
      const yaw = h + Math.PI + st.spin;
      // Route position, lane offset and speed let the tour car plan overtakes around this vehicle
      const alpha = Math.min(1, Math.max(0, Math.min(st.L - ROAD_MIN, ROAD_MAX - st.L) / FADE));
      // A fading vehicle is a ghost: nothing collides with it or brakes for it
      store.npcs[i] = { x: px, y: py, yaw, routeYaw: h, L: st.L, lane, v: st.v, ghost: alpha < 0.6 };

      const g = groups.current[i];
      if (!g) return;
      g.position.set(px, 0, py);
      g.rotation.y = -yaw;
      if (alpha !== st.alpha) {
        materials.current[i] ??= collectMaterials(g);
        for (const e of materials.current[i]) {
          const fading = alpha < 1 || e.transparent;
          if (e.m.transparent !== fading) {
            e.m.transparent = fading;
            e.m.needsUpdate = true;
          }
          e.m.opacity = e.opacity * alpha;
        }
        g.visible = alpha > 0.01;
        st.alpha = alpha;
      }
      for (const w of wheels[i].current) if (w) w.rotation.x -= (st.v * dt) / (w.userData.radius ?? 0.38);
    });
  });

  return NPCS.map((npc, i) => (
    <group key={i} ref={(el) => {
          groups.current[i] = el;
        }}>
      <Model {...palette[i % palette.length]} wheels={wheels[i]} />
    </group>
  ));
}
