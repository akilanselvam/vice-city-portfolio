import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Shape,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAND_OUTLINES, ROAD_WIDTH, onLand } from '../city/layout.js';
import { CITY, ROADS } from '../city/generate.js';
import { ROUTE_LENGTH, STOP_LENGTHS, headingAtLength, pointAtLength } from '../journey/route.js';
import { ROAD_TILE_METERS, makeRoadTexture, makeSignTexture, makeWindowTexture } from './textures.js';
import { store } from './store.js';
import ViceGround, { makePavementTexture } from './ViceGround.jsx';

const dummy = new Object3D();

// Road markings: full brightness at any distance, plus a soft pulse rippling out from the car while driving
export function neonMaterial(rgb, { pulses = true } = {}) {
  const m = new MeshBasicMaterial({ color: new Color(...rgb), toneMapped: false, side: DoubleSide });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, store.neon);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNeonPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvNeonPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uCar;\nuniform float uTime;\nuniform float uSpeed;\nvarying vec3 vNeonPos;')
      .replace(
        '#include <opaque_fragment>',
        `float neonD = distance(vNeonPos.xz, uCar.xz);
float neonPulse = ${pulses ? 'pow(max(0.0, sin(neonD * 0.3 - uTime * 9.0)), 12.0) * (1.0 - smoothstep(4.0, 60.0, neonD)) * uSpeed' : '0.0'};
outgoingLight *= 1.0 + neonPulse * 1.2;
#include <opaque_fragment>`,
      );
  };
  return m;
}

// Flat strips laid along polylines (map x,y -> world x,z)
export function stripGeometry(strips) {
  const pos = [];
  const uv = [];
  const index = [];
  for (const { pts, offset = 0, width, y } of strips) {
    const base = pos.length / 3;
    let along = 0;
    pts.forEach((p, i) => {
      if (i > 0) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      uv.push(0, along / ROAD_TILE_METERS, 1, along / ROAD_TILE_METERS);
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const cx = p[0] + nx * offset;
      const cy = p[1] + ny * offset;
      pos.push(cx - (nx * width) / 2, y, cy - (ny * width) / 2, cx + (nx * width) / 2, y, cy + (ny * width) / 2);
      if (i > 0) {
        const k = base + (i - 1) * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    });
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(index);
  return g;
}

// Road surface from a painted tile texture. With glow, the paint lights up a little at night and pulses
// out from the car while driving; without it the surface is lit like any other ground.
export function roadMaterial(tex, { glow = 0.55 } = {}) {
  if (!glow) return new MeshStandardMaterial({ map: tex, roughness: 0.95, side: DoubleSide });
  const m = new MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new Color('#ffffff'), emissiveIntensity: glow, roughness: 0.75, side: DoubleSide });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, store.neon);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNeonPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvNeonPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uCar;\nuniform float uTime;\nuniform float uSpeed;\nvarying vec3 vNeonPos;')
      .replace(
        '#include <opaque_fragment>',
        `float roadD = distance(vNeonPos.xz, uCar.xz);
float roadPulse = pow(max(0.0, sin(roadD * 0.3 - uTime * 9.0)), 12.0) * (1.0 - smoothstep(4.0, 60.0, roadD)) * uSpeed;
outgoingLight += totalEmissiveRadiance * roadPulse * 1.5;
#include <opaque_fragment>`,
      );
  };
  return m;
}

function landGeometry(outline, grow, depth) {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const shape = new Shape(
    outline.map(([x, y]) => {
      const d = Math.hypot(x - cx, y - cy) || 1;
      const k = 1 + grow / d;
      return { x: cx + (x - cx) * k, y: -(cy + (y - cy) * k) };
    }),
  );
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

function densify(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}

// Split polylines into runs over water, for bridge pillars and railings
function overWater(pts) {
  const runs = [];
  let run = null;
  for (const p of densify(pts, 4)) {
    if (!onLand(p[0], p[1])) (run ??= []).push(p);
    else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs.filter((r) => r.length > 1);
}

const VICE_GROUND = {
  sea: { color: '#3a1d6a', specular: '#ffa8c8', shininess: 60, emissive: '#120830' },
  shore: '#d6a08e',
  land: '#3a2a52',
};

// landMap (optional): a texture for the land surface, also used as a faint glow so it reads at night
export function Ground({ colors = VICE_GROUND, landMap = null }) {
  const geos = useMemo(() => {
    const land = mergeGeometries(LAND_OUTLINES.map((o) => landGeometry(o, 0, 3)));
    const beach = mergeGeometries(LAND_OUTLINES.map((o) => landGeometry(o, 6, 3)));
    return { land, beach };
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[400, -0.9, 280]}>
        <planeGeometry args={[5000, 5000]} />
        <meshPhongMaterial {...colors.sea} />
      </mesh>
      <mesh geometry={geos.beach} position={[0, -3.25, 0]}>
        <meshStandardMaterial color={colors.shore} roughness={1} />
      </mesh>
      <mesh geometry={geos.land} position={[0, -3, 0]}>
        {landMap ? (
          <meshStandardMaterial map={landMap} emissive="#ffffff" emissiveMap={landMap} emissiveIntensity={0.16} roughness={0.95} />
        ) : (
          <meshStandardMaterial color={colors.land} roughness={1} />
        )}
      </mesh>
    </>
  );
}

// Road surfaces plus bridge decks, railings and pillars; materials come from the theme.
// With posts, the railings stand on short posts (wooden bridges) instead of floating as light strips.
export function Roads({ materials, deck = '#2a1d3e', pillar = '#3a2a52', posts = false }) {
  const geos = useMemo(() => {
    const surfaces = { route: [], side: [] };
    const bridgeRuns = [];
    for (const road of ROADS) {
      // Main road draws on top of side streets where they meet
      const y = road.kind === 'route' ? 0.06 : road.kind === 'bridge' ? 0.05 : 0.04;
      surfaces[road.kind === 'route' ? 'route' : 'side'].push({ pts: road.pts, width: road.width, y });
      bridgeRuns.push(...overWater(road.pts).map((pts) => ({ pts, width: road.width })));
    }
    const pillars = [];
    for (const { pts, width } of bridgeRuns) {
      for (let i = 0; i < pts.length; i += 4) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const nx = -(b[1] - a[1]) / len;
        const ny = (b[0] - a[0]) / len;
        for (const sgn of [1, -1]) pillars.push([pts[i][0] + nx * sgn * (width / 2 - 0.6), pts[i][1] + ny * sgn * (width / 2 - 0.6)]);
      }
    }
    return {
      route: stripGeometry(surfaces.route),
      side: stripGeometry(surfaces.side),
      decks: stripGeometry(bridgeRuns.map(({ pts, width }) => ({ pts, width: width + 0.6, y: -0.5 }))),
      rails: stripGeometry(bridgeRuns.flatMap(({ pts, width }) => [1, -1].map((s) => ({ pts, offset: s * (width / 2), width: 0.25, y: 1 })))),
      pillars,
    };
  }, []);

  const pillarRef = useRef();
  const postRef = useRef();
  useLayoutEffect(() => {
    geos.pillars.forEach(([x, y], i) => {
      dummy.position.set(x, -1.2, y);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pillarRef.current.setMatrixAt(i, dummy.matrix);
      if (postRef.current) {
        dummy.position.set(x, 0.5, y);
        dummy.updateMatrix();
        postRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    pillarRef.current.instanceMatrix.needsUpdate = true;
    if (postRef.current) postRef.current.instanceMatrix.needsUpdate = true;
  }, [geos]);

  return (
    <>
      <mesh geometry={geos.side} material={materials.side} />
      <mesh geometry={geos.route} material={materials.route} />
      <mesh geometry={geos.decks}>
        <meshStandardMaterial color={deck} side={DoubleSide} />
      </mesh>
      <mesh geometry={geos.rails} material={materials.rails} />
      <instancedMesh ref={pillarRef} args={[undefined, undefined, geos.pillars.length]}>
        <boxGeometry args={[1, 1.6, 1]} />
        <meshStandardMaterial color={pillar} />
      </instancedMesh>
      {posts && (
        <instancedMesh ref={postRef} args={[undefined, undefined, geos.pillars.length]}>
          <boxGeometry args={[0.3, 1.1, 0.3]} />
          <meshStandardMaterial color={deck} />
        </instancedMesh>
      )}
    </>
  );
}

const TINTS = ['#b89ae0', '#9a8ad0', '#d08ac0', '#8a9ad8', '#b07ab8', '#9aaee0'].map((c) => new Color(c));
const HEIGHT_CLASSES = [
  { max: 14, rows: 0.28 },
  { max: 26, rows: 0.5 },
  { max: 42, rows: 0.82 },
  { max: Infinity, rows: 1.25 },
];

function boxWithWindowUVs(rows) {
  const g = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.45, uv.getY(i) * rows);
  return g;
}

function BuildingClass({ items, rows, sideMaterial, roofMaterial }) {
  const ref = useRef();
  const geometry = useMemo(() => boxWithWindowUVs(rows), [rows]);
  useLayoutEffect(() => {
    items.forEach((b, i) => {
      dummy.position.set(b.x, 0, b.y);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      ref.current.setColorAt(i, TINTS[Math.floor(b.tint * TINTS.length)]);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [items]);
  const materials = useMemo(() => [sideMaterial, sideMaterial, roofMaterial, roofMaterial, sideMaterial, sideMaterial], [sideMaterial, roofMaterial]);
  return <instancedMesh ref={ref} args={[geometry, materials, items.length]} />;
}

function Buildings() {
  const { sideMaterial, roofMaterial, classes, neon, beacons } = useMemo(() => {
    const tex = makeWindowTexture();
    const side = new MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new Color('#ffffff'), emissiveIntensity: 1, roughness: 0.6, metalness: 0.1 });
    const roof = new MeshStandardMaterial({ color: '#3a2a52', roughness: 0.9 });
    const groups = HEIGHT_CLASSES.map(() => []);
    CITY.buildings.forEach((b) => groups[HEIGHT_CLASSES.findIndex((c) => b.h <= c.max)].push(b));
    return {
      sideMaterial: side,
      roofMaterial: roof,
      classes: groups,
      neon: [0, 1].map((k) => CITY.buildings.filter((b) => b.neon === k)),
      beacons: CITY.buildings.filter((b) => b.h > 34),
    };
  }, []);

  const neonRefs = useRef([]);
  const beaconRef = useRef();
  useLayoutEffect(() => {
    store.windowMaterials = [sideMaterial];
    return () => {
      store.windowMaterials = [];
    };
  }, [sideMaterial]);
  useLayoutEffect(() => {
    neon.forEach((list, k) => {
      list.forEach((b, i) => {
        dummy.position.set(b.x + b.w / 2, b.h * 0.08, b.y + b.d / 2);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.35, b.h * 0.86, 0.35);
        dummy.updateMatrix();
        neonRefs.current[k].setMatrixAt(i, dummy.matrix);
      });
      neonRefs.current[k].instanceMatrix.needsUpdate = true;
    });
    beacons.forEach((b, i) => {
      dummy.position.set(b.x, b.h + 0.6, b.y);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beaconRef.current.setMatrixAt(i, dummy.matrix);
    });
    beaconRef.current.instanceMatrix.needsUpdate = true;
  }, [neon, beacons]);

  useFrame(({ clock }) => {
    beaconRef.current.visible = Math.sin(clock.elapsedTime * 3) > -0.2;
  });

  return (
    <>
      {classes.map((items, i) => items.length > 0 && <BuildingClass key={i} items={items} rows={HEIGHT_CLASSES[i].rows} sideMaterial={sideMaterial} roofMaterial={roofMaterial} />)}
      {neon.map((list, k) => (
        <instancedMesh key={k} ref={(el) => {
          neonRefs.current[k] = el;
        }} args={[undefined, undefined, list.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={k === 0 ? [3, 0.4, 1.6] : [0.4, 2, 2.6]} toneMapped={false} />
        </instancedMesh>
      ))}
      <instancedMesh ref={beaconRef} args={[undefined, undefined, beacons.length]}>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshBasicMaterial color={[4, 0.3, 0.5]} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Palms() {
  const { trunk, crown } = useMemo(() => {
    const t = new CylinderGeometry(0.2, 0.36, 1, 6).translate(0, 0.5, 0);
    const fronds = Array.from({ length: 8 }, (_, k) =>
      new BoxGeometry(0.9, 0.08, 4.4)
        .translate(0, 0, 2.1)
        .rotateX(0.5)
        .rotateY((k / 8) * Math.PI * 2),
    );
    return { trunk: t, crown: mergeGeometries(fronds) };
  }, []);
  const trunkRef = useRef();
  const crownRef = useRef();
  useLayoutEffect(() => {
    const top = new Vector3();
    CITY.palms.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.y);
      dummy.rotation.set(Math.cos(p.spin) * p.lean, 0, Math.sin(p.spin) * p.lean);
      dummy.scale.set(1, p.h, 1);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      top.set(0, 1, 0).applyMatrix4(dummy.matrix);
      dummy.position.copy(top);
      dummy.rotation.set(0, p.spin, 0);
      dummy.scale.setScalar(0.8 + p.h / 30);
      dummy.updateMatrix();
      crownRef.current.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    crownRef.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={trunkRef} args={[trunk, undefined, CITY.palms.length]}>
        <meshStandardMaterial color="#7a5238" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[crown, undefined, CITY.palms.length]}>
        <meshStandardMaterial color="#2f7a52" roughness={0.85} emissive="#0c2a1c" />
      </instancedMesh>
    </>
  );
}

function StreetLights({ glow }) {
  const refs = useRef({});
  useLayoutEffect(() => {
    CITY.lights.forEach((l, i) => {
      const yaw = Math.atan2(l.ax, l.ay);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(l.x, 0, l.y);
      dummy.updateMatrix();
      refs.current.pole.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x + l.ax * 1.1, 7.1, l.y + l.ay * 1.1);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      refs.current.arm.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x + l.ax * 2.2, 6.95, l.y + l.ay * 2.2);
      dummy.updateMatrix();
      refs.current.lamp.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.gx, 0.1, l.gy);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      refs.current.pool.setMatrixAt(i, dummy.matrix);
    });
    Object.values(refs.current).forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }, []);
  const n = CITY.lights.length;
  return (
    <>
      <instancedMesh ref={(el) => {
          refs.current.pole = el;
        }} args={[undefined, undefined, n]}>
        <cylinderGeometry args={[0.1, 0.15, 7.2, 6]} />
        <meshStandardMaterial color="#2a2038" />
      </instancedMesh>
      <instancedMesh ref={(el) => {
          refs.current.arm = el;
        }} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.12, 0.12, 2.3]} />
        <meshStandardMaterial color="#2a2038" />
      </instancedMesh>
      <instancedMesh ref={(el) => {
          refs.current.lamp = el;
        }} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.45, 0.14, 0.8]} />
        <meshBasicMaterial color={[3.2, 2.6, 1.5]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={(el) => {
          refs.current.pool = el;
        }} args={[undefined, undefined, n]}>
        <planeGeometry args={[11, 11]} />
        <meshBasicMaterial map={glow} color="#ffcf8a" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

// constructed around the second islet, visible from the big bridge
function FerrisWheel() {
  const wheel = useRef();
  useFrame((_, dt) => {
    wheel.current.rotation.z += dt * 0.12;
  });
  const R = 16;
  const spokes = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <group position={[402, 0, 128]}>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x / 2, 9.5, 0]} rotation={[0, 0, x > 0 ? 0.26 : -0.26]}>
          <boxGeometry args={[0.6, 20, 0.6]} />
          <meshStandardMaterial color="#3a2a52" />
        </mesh>
      ))}
      <group ref={wheel} position={[0, R + 3, 0]}>
        <mesh>
          <torusGeometry args={[R, 0.3, 8, 64]} />
          <meshBasicMaterial color={[3, 0.4, 1.6]} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[R * 0.82, 0.18, 6, 48]} />
          <meshBasicMaterial color={[0.4, 2, 2.6]} toneMapped={false} />
        </mesh>
        {spokes.map((a) => (
          <group key={a} rotation={[0, 0, a]}>
            <mesh position={[0, R / 2, 0]}>
              <boxGeometry args={[0.15, R, 0.15]} />
              <meshBasicMaterial color={[1.4, 0.5, 1.2]} toneMapped={false} />
            </mesh>
            <mesh position={[0, R, 0]}>
              <boxGeometry args={[1.4, 1.4, 1.4]} />
              <meshBasicMaterial color={[3, 2.4, 1.2]} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

const VICE_SIGN = { fonts: ['150px Yellowtail', '62px Anton'], paint: makeSignTexture, post: '#2a2038', brightness: 1.5 };

// A roadside board after each stop naming the area; look sets the font, painter and posts
export function StopSigns({ stops, look = VICE_SIGN }) {
  const [textures, setTextures] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all(look.fonts.map((f) => document.fonts.load(f)))
      .catch(() => {})
      .then(() => live && setTextures(stops.map((st) => look.paint(st.area, st.sub))));
    return () => {
      live = false;
    };
  }, [stops, look]);
  useEffect(() => () => textures?.forEach((t) => t.dispose()), [textures]);

  const placements = useMemo(
    () =>
      stops.map((st, i) => {
        const L = Math.min(STOP_LENGTHS[i] + 24, ROUTE_LENGTH);
        const [x, y] = pointAtLength(L);
        const h = (headingAtLength(L) * Math.PI) / 180;
        const fx = Math.sin(h);
        const fy = -Math.cos(h);
        const rx = Math.cos(h);
        const ry = Math.sin(h);
        const off = ROAD_WIDTH.route / 2 + 8;
        const nx = -fx * 0.75 - rx * 0.65;
        const ny = -fy * 0.75 - ry * 0.65;
        return { id: st.id, x: x + rx * off, y: y + ry * off, yaw: Math.atan2(nx, ny) };
      }),
    [stops],
  );

  if (!textures) return null;
  return placements.map((p, i) => (
    <group key={p.id} position={[p.x, 0, p.y]} rotation={[0, p.yaw, 0]}>
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} position={[x, 3.2, -0.2]}>
          <boxGeometry args={[0.3, 6.4, 0.3]} />
          <meshStandardMaterial color={look.post} />
        </mesh>
      ))}
      <mesh position={[0, 7.6, 0]}>
        <planeGeometry args={[12, 4.5]} />
        <meshBasicMaterial map={textures[i]} color={[look.brightness, look.brightness, look.brightness]} toneMapped={false} side={DoubleSide} />
      </mesh>
      {look.roof && (
        <mesh position={[0, 10.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.95, 0.95, 13]} />
          <meshStandardMaterial color={look.roof} />
        </mesh>
      )}
    </group>
  ));
}

export default function City({ glow, stops }) {
  const pavement = useMemo(() => makePavementTexture(), []);
  useEffect(() => () => pavement.dispose(), [pavement]);
  const materials = useMemo(
    () => ({
      route: roadMaterial(makeRoadTexture('#ff6fc8')),
      side: roadMaterial(makeRoadTexture('#6ff0ff')),
      rails: neonMaterial([0.3, 1.8, 2.4]),
    }),
    [],
  );
  return (
    <>
      <Ground landMap={pavement} />
      <ViceGround glow={glow} />
      <Roads materials={materials} />
      <Buildings />
      <Palms />
      <StreetLights glow={glow} />
      <FerrisWheel />
      <StopSigns stops={stops} />
    </>
  );
}
