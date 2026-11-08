import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  Shape,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAND_OUTLINES, onLand, rng } from '../../city/layout.js';
import { CITY } from '../../city/generate.js';
import { Roads, StopSigns, neonMaterial, roadMaterial, stripGeometry } from '../City.jsx';
import { makeHoloSign, makeHullTextures, makeLaneTexture, makePlanetTexture, makeRingTexture } from './spaceTextures.js';
import { store } from '../store.js';

const dummy = new Object3D();

const SIGN = {
  fonts: ['120px "Saira Stencil One"', '600 56px "Chakra Petch"'],
  paint: makeHoloSign,
  post: '#2a2e38',
  brightness: 1.35,
};

// Outline scaled toward its centre with a little jitter, as an extruded slab spanning y = top - depth .. top
function slab(outline, scale, depth, top, seed) {
  const r = rng(seed);
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const pts = outline.map(([x, y]) => {
    const j = scale < 1 ? 1 + (r() - 0.5) * 0.12 : 1;
    return { x: cx + (x - cx) * scale * j, y: -(cy + (y - cy) * scale * j) };
  });
  const g = new ExtrudeGeometry(new Shape(pts), { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, top - depth, 0);
  return g;
}

// The islands hang in space: a flat top deck over a stepped, tapering rock underside
function FloatingIslands() {
  const geos = useMemo(() => {
    const top = [];
    const under = [];
    LAND_OUTLINES.forEach((o, i) => {
      top.push(slab(o, 1, 2.5, 0, 0));
      const layers = o.length > 40 ? 6 : 4;
      for (let k = 1; k <= layers; k++) under.push(slab(o, 1 - (k / (layers + 1)) * 0.95, 9, -2.5 - (k - 1) * 8, i * 31 + k));
    });
    const rims = LAND_OUTLINES.map((o) => ({ pts: [...o, o[0]], width: 0.6, y: 0.03 }));
    return { top: mergeGeometries(top), under: mergeGeometries(under), rim: stripGeometry(rims) };
  }, []);
  const rimMaterial = useMemo(() => neonMaterial([0.5, 1.2, 2.6], { pulses: false }), []);
  return (
    <>
      <mesh geometry={geos.top}>
        <meshStandardMaterial color="#3d4352" roughness={0.9} metalness={0.2} />
      </mesh>
      <mesh geometry={geos.under}>
        <meshStandardMaterial color="#2a2530" roughness={1} flatShading />
      </mesh>
      <mesh geometry={geos.rim} material={rimMaterial} />
    </>
  );
}

// Drifting asteroids around and below the islands
function Debris() {
  const ref = useRef();
  const rocks = useMemo(() => {
    const r = rng(77);
    const out = [];
    while (out.length < 140) {
      const x = -150 + r() * 1100;
      const z = -150 + r() * 860;
      let y = -70 + r() * 110;
      // Keep the deck clear: over land, rocks only float well below
      if (onLand(x, z)) y = -40 - r() * 60;
      out.push({ x, y, z, s: 1 + r() ** 2 * 7, ax: r() * 6, ay: r() * 6, spin: (r() - 0.5) * 0.4 });
    }
    return out;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rocks.forEach((k, i) => {
      dummy.position.set(k.x, k.y + Math.sin(t * 0.3 + i) * 1.2, k.z);
      dummy.rotation.set(k.ax + t * k.spin, k.ay + t * k.spin * 0.7, 0);
      dummy.scale.setScalar(k.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, rocks.length]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a4450" roughness={1} flatShading />
    </instancedMesh>
  );
}

// A ringed gas giant fixed in the sky (it follows the camera, so it never gets closer)
const PLANET_DIR = new Vector3(0.62, 0.2, -0.76).normalize();
function Planet() {
  const camera = useThree((s) => s.camera);
  const group = useRef();
  const { map, ring, ringGeo } = useMemo(() => {
    const g = new RingGeometry(1.35, 2.3, 96, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const d = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (d - 1.35) / (2.3 - 1.35), 0.5);
    }
    return { map: makePlanetTexture(), ring: makeRingTexture(), ringGeo: g };
  }, []);
  useFrame((_, dt) => {
    group.current.position.copy(camera.position).addScaledVector(PLANET_DIR, 1500);
    group.current.children[0].rotation.y += dt * 0.01;
  });
  return (
    <group ref={group} scale={300} rotation={[0.35, 0, 0.28]}>
      <mesh>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.18} fog={false} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
        <meshBasicMaterial map={ring} transparent side={DoubleSide} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

// A battleship holding station over the sector, slowly drifting
function Battleship() {
  const ship = useRef();
  const lights = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ship.current.position.set(380 + Math.sin(t * 0.03) * 40, 95, -120);
    lights.current.visible = Math.sin(t * 2.5) > 0;
  });
  return (
    <group ref={ship} rotation={[0, 0.9, 0]}>
      <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]} scale={[1, 1, 0.45]}>
        <cylinderGeometry args={[7, 26, 190, 4]} />
        <meshStandardMaterial color="#5a606c" metalness={0.5} roughness={0.6} flatShading fog={false} />
      </mesh>
      <mesh position={[0, 14, 55]}>
        <boxGeometry args={[14, 16, 30]} />
        <meshStandardMaterial color="#4a505c" metalness={0.5} roughness={0.6} fog={false} />
      </mesh>
      <mesh position={[0, 24, 60]}>
        <boxGeometry args={[22, 4, 8]} />
        <meshStandardMaterial color="#3a3f4a" fog={false} />
      </mesh>
      {[-12, 0, 12].map((x) => (
        <mesh key={x} position={[x, 0, 96]}>
          <sphereGeometry args={[5, 16, 12]} />
          <meshBasicMaterial color={[0.8, 1.8, 4]} toneMapped={false} fog={false} />
        </mesh>
      ))}
      <group ref={lights}>
        {[-20, 20].map((x) => (
          <mesh key={x} position={[x, 2, 20]}>
            <sphereGeometry args={[1.4, 8, 6]} />
            <meshBasicMaterial color={[4, 0.3, 0.2]} toneMapped={false} fog={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function wallGeometry(storeys) {
  const g = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * storeys);
  return g;
}

// Military outposts on the city's footprints: bunkers, and comms towers where the tall buildings were
function Outposts() {
  const plan = useMemo(() => {
    const bunkers = [];
    const towers = [];
    for (const b of CITY.buildings) (b.h > 26 ? towers : bunkers).push(b);
    return { bunkers, towers, all: CITY.buildings };
  }, []);
  const mats = useMemo(() => {
    const { map, glow } = makeHullTextures();
    const hull = new MeshStandardMaterial({ map, emissiveMap: glow, emissive: new Color('#ffffff'), emissiveIntensity: 1, metalness: 0.4, roughness: 0.6 });
    const roof = new MeshStandardMaterial({ color: '#30343e', metalness: 0.4, roughness: 0.7 });
    return { hull, roof, array: [hull, hull, roof, roof, hull, hull] };
  }, []);
  const geos = useMemo(
    () => ({
      pad: new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
      bunker: wallGeometry(1),
      tower: new CylinderGeometry(0.5, 0.62, 1, 6).translate(0, 0.5, 0),
      dish: new CylinderGeometry(0.5, 0.05, 0.25, 12),
    }),
    [],
  );
  const refs = useRef({});
  const beacon = useRef();
  useLayoutEffect(() => {
    store.windowMaterials = [mats.hull];
    plan.all.forEach((b, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(b.x, 0, b.y);
      dummy.scale.set(b.w, 1.1, b.d);
      dummy.updateMatrix();
      refs.current.pad.setMatrixAt(i, dummy.matrix);
    });
    plan.bunkers.forEach((b, i) => {
      dummy.position.set(b.x, 1.1, b.y);
      dummy.scale.set(b.w * 0.84, 3.5 + b.h * 0.22, b.d * 0.84);
      dummy.updateMatrix();
      refs.current.bunker.setMatrixAt(i, dummy.matrix);
    });
    plan.towers.forEach((b, i) => {
      const r = Math.min(b.w, b.d) * 0.72;
      const h = 14 + b.h * 0.75;
      dummy.position.set(b.x, 1.1, b.y);
      dummy.scale.set(r, h, r);
      dummy.updateMatrix();
      refs.current.tower.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x, h + 2.4, b.y);
      dummy.rotation.set(0.5, i, 0);
      dummy.scale.set(r * 1.6, r * 1.6, r * 1.6);
      dummy.updateMatrix();
      refs.current.dish.setMatrixAt(i, dummy.matrix);
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(b.x, h + 1.2, b.y);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beacon.current.setMatrixAt(i, dummy.matrix);
    });
    Object.values(refs.current).forEach((m) => (m.instanceMatrix.needsUpdate = true));
    beacon.current.instanceMatrix.needsUpdate = true;
    return () => {
      store.windowMaterials = [];
    };
  }, [plan, mats]);
  useFrame(({ clock }) => {
    beacon.current.visible = Math.sin(clock.elapsedTime * 3) > -0.2;
  });
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  return (
    <>
      <instancedMesh ref={set('pad')} args={[geos.pad, undefined, plan.all.length]}>
        <meshStandardMaterial color="#2c3038" metalness={0.3} roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={set('bunker')} args={[geos.bunker, mats.array, plan.bunkers.length]} />
      <instancedMesh ref={set('tower')} args={[geos.tower, mats.hull, plan.towers.length]} />
      <instancedMesh ref={set('dish')} args={[geos.dish, undefined, plan.towers.length]}>
        <meshStandardMaterial color="#9aa2ae" metalness={0.6} roughness={0.4} side={DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={beacon} args={[undefined, undefined, plan.towers.length]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshBasicMaterial color={[4, 0.3, 0.25]} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

const HULL_TINTS = ['#8a929e', '#8f9670', '#76808e', '#a4aab2'].map((c) => new Color(c));
const CRATE_TINTS = ['#7a8aa4', '#8a9466', '#ffd100', '#6a7690', '#b07a52'].map((c) => new Color(c));

// Outpost hardware where the other themes have trees: scanning sentry turrets, landed drop pods, cargo stacks
function OutpostProps() {
  const plan = useMemo(() => {
    const sentries = [];
    const pods = [];
    const crates = [];
    CITY.palms.forEach((p, i) => [sentries, pods, crates][i % 3].push(p));
    // Each crate spot gets a small stack of two or three containers
    const boxes = [];
    crates.forEach((p, i) => {
      const fx = Math.cos(p.spin);
      const fy = Math.sin(p.spin);
      boxes.push({ x: p.x, y: p.y, lift: 0, yaw: p.spin, t: i });
      boxes.push({ x: p.x + fx * 2.3, y: p.y + fy * 2.3, lift: 0, yaw: p.spin, t: i + 1 });
      if (i % 2 === 0) boxes.push({ x: p.x + fx * 1.15, y: p.y + fy * 1.15, lift: 2.1, yaw: p.spin + 0.08, t: i + 2 });
    });
    return { sentries, pods, boxes };
  }, []);

  const geos = useMemo(() => {
    const legs = [0, 1, 2].map((k) =>
      new BoxGeometry(0.16, 1.6, 0.16)
        .translate(0, 0.8, 0)
        .rotateZ(0.42)
        .rotateY((k * Math.PI * 2) / 3),
    );
    const base = mergeGeometries([...legs, new CylinderGeometry(0.35, 0.45, 0.5, 8).translate(0, 1.55, 0)]);
    const head = mergeGeometries([
      new BoxGeometry(0.95, 0.7, 1.2).translate(0, 2.15, 0),
      new CylinderGeometry(0.09, 0.09, 1.6, 8).rotateX(Math.PI / 2).translate(0.2, 2.2, -1.25),
      new CylinderGeometry(0.09, 0.09, 1.6, 8).rotateX(Math.PI / 2).translate(-0.2, 2.2, -1.25),
      new BoxGeometry(0.12, 0.5, 0.5).translate(0.55, 2.2, 0.1),
    ]);
    const eye = new BoxGeometry(0.5, 0.12, 0.05).translate(0, 2.28, -0.61);
    const pod = mergeGeometries([
      new CylinderGeometry(0.95, 1.05, 3.2, 8).translate(0, 1.6, 0),
      new ConeGeometry(0.95, 1.3, 8).translate(0, 3.85, 0),
      ...[0, 1, 2, 3].map((k) => new BoxGeometry(0.12, 1.2, 0.9).translate(1.05, 0.6, 0).rotateY((k * Math.PI) / 2 + Math.PI / 4)),
    ]);
    const band = new CylinderGeometry(1.0, 1.0, 0.35, 8, 1, true).translate(0, 2.5, 0);
    const podLight = new CylinderGeometry(1.06, 1.06, 0.12, 8, 1, true).translate(0, 0.35, 0);
    const crate = wallGeometry(1);
    return { base, head, eye, pod, band, podLight, crate };
  }, []);
  // Plain painted containers so the tint reads clearly (the hull texture made them almost black)
  const crateMat = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', metalness: 0.25, roughness: 0.6, flatShading: true }), []);

  const refs = useRef({});
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  const placeAll = (key, list, fn) => {
    const mesh = refs.current[key];
    list.forEach((item, i) => {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      fn(item, i);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    placeAll('base', plan.sentries, (p) => dummy.position.set(p.x, 0, p.y));
    // Pods land a little off vertical, half buried from the drop
    const podPose = (p) => {
      dummy.position.set(p.x, -0.4, p.y);
      dummy.rotation.set(Math.cos(p.spin) * 0.18, p.spin, Math.sin(p.spin) * 0.18);
    };
    placeAll('pod', plan.pods, podPose);
    placeAll('band', plan.pods, podPose);
    placeAll('podLight', plan.pods, podPose);
    plan.pods.forEach((p, i) => refs.current.pod.setColorAt(i, HULL_TINTS[i % HULL_TINTS.length]));
    refs.current.pod.instanceColor.needsUpdate = true;
    placeAll('crate', plan.boxes, (b) => {
      dummy.position.set(b.x, b.lift, b.y);
      dummy.rotation.set(0, b.yaw, 0);
      dummy.scale.set(2.1, 2.1, 4.2);
    });
    plan.boxes.forEach((b, i) => refs.current.crate.setColorAt(i, CRATE_TINTS[b.t % CRATE_TINTS.length]));
    refs.current.crate.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // Sentry heads sweep back and forth; pod beacons pulse
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const turn = (p, i) => {
      dummy.position.set(p.x, 0, p.y);
      dummy.rotation.set(0, p.spin + Math.sin(t * 0.6 + i * 1.7) * 1.1, 0);
    };
    placeAll('head', plan.sentries, turn);
    placeAll('eye', plan.sentries, turn);
    const pulse = 0.6 + 0.4 * Math.max(0, Math.sin(t * 3));
    refs.current.podLight.material.color.setRGB(0.6 * pulse * 2, 1.4 * pulse * 2, 3.4 * pulse * 2);
  });

  return (
    <>
      <instancedMesh ref={set('base')} args={[geos.base, undefined, plan.sentries.length]}>
        <meshStandardMaterial color="#5a616e" metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={set('head')} args={[geos.head, undefined, plan.sentries.length]}>
        <meshStandardMaterial color="#9aa3b0" metalness={0.45} roughness={0.45} flatShading />
      </instancedMesh>
      <instancedMesh ref={set('eye')} args={[geos.eye, undefined, plan.sentries.length]}>
        <meshBasicMaterial color={[4, 0.4, 0.25]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={set('pod')} args={[geos.pod, undefined, plan.pods.length]}>
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.5} flatShading />
      </instancedMesh>
      <instancedMesh ref={set('band')} args={[geos.band, undefined, plan.pods.length]}>
        <meshStandardMaterial color="#ffd100" emissive="#ffd100" emissiveIntensity={0.2} side={DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={set('podLight')} args={[geos.podLight, undefined, plan.pods.length]}>
        <meshBasicMaterial color={[1.2, 2.8, 6.8]} toneMapped={false} side={DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={set('crate')} args={[geos.crate, crateMat, plan.boxes.length]} />
    </>
  );
}

// Light pylons along the lanes
function Pylons({ glow }) {
  const refs = useRef({});
  useLayoutEffect(() => {
    CITY.lights.forEach((l, i) => {
      dummy.rotation.set(0, Math.atan2(l.ax, l.ay), 0);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(l.x, 2.6, l.y);
      dummy.updateMatrix();
      refs.current.post.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x, 5.3, l.y);
      dummy.updateMatrix();
      refs.current.lamp.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x + (l.gx - l.x) * 0.4, 0.1, l.y + (l.gy - l.y) * 0.4);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      refs.current.pool.setMatrixAt(i, dummy.matrix);
    });
    Object.values(refs.current).forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }, []);
  const n = CITY.lights.length;
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  return (
    <>
      <instancedMesh ref={set('post')} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.35, 5.2, 0.35]} />
        <meshStandardMaterial color="#2a2e38" metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={set('lamp')} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.7, 0.3, 0.7]} />
        <meshBasicMaterial color={[0.9, 1.8, 3.4]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={set('pool')} args={[undefined, undefined, n]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={glow} color="#7fc8ff" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

// Giant radar dish on the islet where Neon Bay has its Ferris wheel
function RadarDish() {
  const head = useRef();
  useFrame((_, dt) => {
    head.current.rotation.y += dt * 0.15;
  });
  const dish = useMemo(() => new IcosahedronGeometry(1, 0), []);
  return (
    <group position={[402, 0, 128]}>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[3.5, 6, 10, 8]} />
        <meshStandardMaterial color="#3a3f4a" metalness={0.4} roughness={0.7} />
      </mesh>
      <group ref={head} position={[0, 11, 0]}>
        <mesh position={[0, 7, 0]} rotation={[-0.9, 0, 0]}>
          <sphereGeometry args={[14, 32, 12, 0, Math.PI * 2, 0, 0.95]} />
          <meshStandardMaterial color="#b8c0cc" metalness={0.5} roughness={0.35} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1.2, 1.6, 5, 8]} />
          <meshStandardMaterial color="#4a505c" />
        </mesh>
        <mesh position={[0, 9, 5.5]} rotation={[-0.9, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 12, 6]} />
          <meshStandardMaterial color="#4a505c" />
        </mesh>
        <mesh position={[0, 13.4, 9.6]} geometry={dish} scale={1.1}>
          <meshBasicMaterial color={[1, 2, 4]} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function Starfield({ glow, stops }) {
  const materials = useMemo(
    () => ({
      route: roadMaterial(makeLaneTexture('hazard', '#7fc8ff'), { glow: 0.5 }),
      side: roadMaterial(makeLaneTexture('#4da3ff', '#ffd100'), { glow: 0.45 }),
      rails: neonMaterial([0.5, 1.4, 3.2]),
    }),
    [],
  );
  return (
    <>
      <FloatingIslands />
      <Debris />
      <Planet />
      <Battleship />
      <Roads materials={materials} deck="#1e2c46" pillar="#2a2e38" />
      <Outposts />
      <OutpostProps />
      <Pylons glow={glow} />
      <RadarDish />
      <StopSigns stops={stops} look={SIGN} />
    </>
  );
}
