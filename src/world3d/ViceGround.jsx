import { useLayoutEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, CanvasTexture, Color, Object3D, RepeatWrapping, SRGBColorSpace } from 'three';
import { MAP_POINTS, distToCoast, onLand, rng } from '../city/layout.js';
import { CITY, PITSTOPS, ROADS, TERMINI, hitsBuilding, roadClearance } from '../city/generate.js';
import { stripGeometry } from './City.jsx';

// Street-level detail for the Neon Bay theme, so the land between the roads isn't a dark void:
// paved ground, sidewalks along the roads, a plinth and a soft neon light pool under every building,
// and plots between the buildings (lawns with bushes, glowing pools, parking lots with parked cars).

const dummy = new Object3D();

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Concrete slab paving for the land: one 256px tile covers 16 m, 4 m slabs with darker joints.
// The land geometry's UVs are in metres, so the texture repeats every 16 m.
export function makePavementTexture() {
  const r = rng(77);
  const tex = canvasTexture(256, 256, (g) => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const v = 92 + Math.floor(r() * 18);
        g.fillStyle = `rgb(${v - 6}, ${v - 22}, ${v + 26})`;
        g.fillRect(i * 64, j * 64, 64, 64);
      }
    }
    g.fillStyle = 'rgba(30, 18, 50, 0.85)';
    for (let k = 0; k <= 4; k++) {
      g.fillRect(k * 64 - 2, 0, 4, 256);
      g.fillRect(0, k * 64 - 2, 256, 4);
    }
    // a few speckles so it doesn't look flat
    for (let k = 0; k < 220; k++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });
  tex.repeat.set(1 / 16, 1 / 16);
  return tex;
}

// Parking bays: white lines on asphalt for a 14 x 7 m lot (five bays along x)
function makeParkingTexture() {
  return canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#231a33';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(240, 236, 255, 0.85)';
    for (let k = 0; k <= 5; k++) g.fillRect(8 + k * 48, 10, 4, h - 34);
    g.fillRect(8, h - 26, w - 12, 3);
  });
}

// On land, away from roads, buildings, the stops, the pit-stop carts, the route ends and the shore
const STOPS = Object.values(MAP_POINTS);
function clearPlot(x, y, half, w, d) {
  if (!onLand(x, y) || distToCoast(x, y) < half + 2) return false;
  if (roadClearance(x, y) < half + 3.2) return false;
  // clear of every building and its plinth (which reaches 1.5 m out)
  if (hitsBuilding(x, y, Math.max(w, d) / 2 + 1.6)) return false;
  if (STOPS.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < half + 14)) return false;
  if (PITSTOPS.some((q) => Math.hypot(q.x - x, q.y - y) < half + 10)) return false;
  if (Object.values(TERMINI).some((t) => Math.hypot(t.x - x, t.y - y) < t.radius + half + 4)) return false;
  return true;
}

function buildPlots() {
  const r = rng(4242);
  const plots = [];
  const taken = (x, y, half) => plots.some((p) => Math.abs(p.x - x) < p.half + half + 0.5 && Math.abs(p.y - y) < p.half + half + 0.5);
  for (let k = 0; k < 9000 && plots.length < 140; k++) {
    const x = 90 + r() * 640;
    const y = 30 + r() * 500;
    const roll = r();
    const kind = roll < 0.42 ? 'lawn' : roll < 0.7 ? 'pool' : 'parking';
    const w = kind === 'parking' ? 14 : 5 + r() * 4;
    const d = kind === 'parking' ? 7 : 5 + r() * 4;
    const half = Math.hypot(w, d) / 2;
    if (!clearPlot(x, y, half, w, d) || taken(x, y, half)) continue;
    plots.push({ x, y, w, d, half, kind, seed: r() });
  }
  return plots;
}

// Sidewalks only where a road runs over land (not along bridges)
function landRuns(pts) {
  const runs = [];
  let run = null;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (onLand(p[0], p[1])) (run ??= []).push(p);
    else if (run) {
      if (run.length > 1) runs.push(run);
      run = null;
    }
  }
  if (run && run.length > 1) runs.push(run);
  return runs;
}

const PASTELS = ['#2de2ff', '#ffd36b', '#ff4fa8', '#f3f0ff', '#7a4dff', '#7dff7a', '#ff9a3d'].map((c) => new Color(c));
const BUSH_GREENS = ['#2f7a52', '#2a6a48', '#3a8a5a'].map((c) => new Color(c));

export default function ViceGround({ glow }) {
  const data = useMemo(() => {
    const plots = buildPlots();
    const sidewalks = stripGeometry(
      ROADS.filter((road) => road.kind !== 'bridge').flatMap((road) =>
        landRuns(road.pts).flatMap((pts) => [1, -1].map((s) => ({ pts, offset: s * (road.width / 2 + 1.4), width: 2.8, y: 0.025 }))),
      ),
    );
    const curbs = stripGeometry(
      ROADS.filter((road) => road.kind !== 'bridge').flatMap((road) =>
        landRuns(road.pts).flatMap((pts) => [1, -1].map((s) => ({ pts, offset: s * (road.width / 2 + 2.85), width: 0.18, y: 0.03 }))),
      ),
    );
    const lawns = plots.filter((p) => p.kind !== 'parking');
    const pools = plots.filter((p) => p.kind === 'pool');
    const lots = plots.filter((p) => p.kind === 'parking');
    const bushes = [];
    const cars = [];
    const r = rng(99);
    for (const p of lawns) {
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        // along the lawn's edges, leaving the middle for the pool
        const edge = Math.floor(r() * 4);
        const t = r() - 0.5;
        const bx = edge < 2 ? p.x + t * (p.w - 1.5) : p.x + (edge === 2 ? -1 : 1) * (p.w / 2 - 0.9);
        const by = edge < 2 ? p.y + (edge === 0 ? -1 : 1) * (p.d / 2 - 0.9) : p.y + t * (p.d - 1.5);
        bushes.push({ x: bx, y: by, s: 0.7 + r() * 0.6, c: BUSH_GREENS[Math.floor(r() * BUSH_GREENS.length)] });
      }
    }
    for (const p of lots) {
      for (let k = 0; k < 5; k++) {
        if (r() < 0.35) continue;
        cars.push({ x: p.x - 5.6 + k * 2.8, y: p.y - 0.4, c: PASTELS[Math.floor(r() * PASTELS.length)], yaw: (r() - 0.5) * 0.08 });
      }
    }
    return { plots, sidewalks, curbs, lawns, pools, lots, bushes, cars };
  }, []);
  const parking = useMemo(() => makeParkingTexture(), []);
  const sidewalkTex = useMemo(() => {
    const t = makePavementTexture();
    t.repeat.set(1, 0.25);
    return t;
  }, []);
  useLayoutEffect(
    () => () => {
      data.sidewalks.dispose();
      data.curbs.dispose();
      parking.dispose();
      sidewalkTex.dispose();
    },
    [data, parking, sidewalkTex],
  );

  const refs = useRef({});
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  useLayoutEffect(() => {
    const m = refs.current;
    const place = (mesh, i, x, y, z, sx, sy, sz, yaw = 0, rotX = 0) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(rotX, yaw, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    };
    // Plinth and neon light pool under every building
    CITY.buildings.forEach((b, i) => {
      place(m.plinth, i, b.x, 0.1, b.y, b.w + 3, 0.2, b.d + 3);
      place(m.halo, i, b.x, 0.04, b.y, b.w + 14, b.d + 14, 1, 0, -Math.PI / 2);
      const cyan = b.neon === 1 || (b.neon === -1 && b.tint > 0.55);
      m.halo.setColorAt(i, cyan ? new Color(0.25, 1.4, 1.9) : new Color(1.9, 0.35, 1.2));
    });
    data.lawns.forEach((p, i) => place(m.lawn, i, p.x, 0.06, p.y, p.w, 0.12, p.d));
    data.pools.forEach((p, i) => {
      place(m.rim, i, p.x, 0.16, p.y, p.w * 0.6 + 0.8, 0.12, p.d * 0.5 + 0.8);
      place(m.water, i, p.x, 0.23, p.y, p.w * 0.6, p.d * 0.5, 1, 0, -Math.PI / 2);
    });
    data.lots.forEach((p, i) => place(m.lot, i, p.x, 0.05, p.y, p.w, p.d, 1, 0, -Math.PI / 2));
    data.bushes.forEach((b, i) => {
      place(m.bush, i, b.x, 0.5 * b.s, b.y, b.s, b.s * 0.85, b.s);
      m.bush.setColorAt(i, b.c);
    });
    data.cars.forEach((c, i) => {
      place(m.carBody, i, c.x, 0.55, c.y, 1, 1, 1, c.yaw);
      place(m.carTop, i, c.x, 1.05, c.y + 0.25, 1, 1, 1, c.yaw);
      m.carBody.setColorAt(i, c.c);
    });
    Object.values(m).forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [data]);

  const nb = CITY.buildings.length;
  return (
    <>
      {/* Sidewalks with a pale curb line on the outside edge */}
      <mesh geometry={data.sidewalks}>
        <meshStandardMaterial map={sidewalkTex} color="#b8a8d8" emissive="#3a2a5a" emissiveIntensity={0.5} roughness={0.9} />
      </mesh>
      <mesh geometry={data.curbs}>
        <meshBasicMaterial color={[0.9, 0.75, 1.1]} toneMapped={false} />
      </mesh>

      {/* Building plinths and the soft neon light around their feet */}
      <instancedMesh ref={set('plinth')} args={[undefined, undefined, nb]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6a5a8e" emissive="#2a1d44" emissiveIntensity={0.6} roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={set('halo')} args={[undefined, undefined, nb]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      {/* Lawns, bushes and swimming pools */}
      <instancedMesh ref={set('lawn')} args={[undefined, undefined, data.lawns.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2a6a4a" emissive="#0c2a1c" emissiveIntensity={0.8} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={set('bush')} args={[undefined, undefined, data.bushes.length]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial emissive="#0c2a1c" emissiveIntensity={0.6} roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={set('rim')} args={[undefined, undefined, data.pools.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#efeaf8" emissive="#3a3450" emissiveIntensity={0.5} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={set('water')} args={[undefined, undefined, data.pools.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={[0.25, 1.35, 1.8]} toneMapped={false} />
      </instancedMesh>

      {/* Parking lots with parked cars */}
      <instancedMesh ref={set('lot')} args={[undefined, undefined, data.lots.length]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={parking} emissive="#ffffff" emissiveMap={parking} emissiveIntensity={0.18} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={set('carBody')} args={[undefined, undefined, data.cars.length]}>
        <boxGeometry args={[1.9, 0.6, 4.2]} />
        <meshStandardMaterial metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={set('carTop')} args={[undefined, undefined, data.cars.length]}>
        <boxGeometry args={[1.6, 0.48, 2.0]} />
        <meshStandardMaterial color="#141020" metalness={0.8} roughness={0.2} />
      </instancedMesh>
    </>
  );
}
