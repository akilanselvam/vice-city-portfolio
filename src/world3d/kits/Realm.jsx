import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CITY } from '../../city/generate.js';
import { Ground, Roads, StopSigns, roadMaterial } from '../City.jsx';
import { store } from '../store.js';
import { makeCobbleTexture, makeDirtTexture, makeNoticeTexture, makeStoneTexture, makeTimberTextures } from './medievalTextures.js';

const dummy = new Object3D();

const GROUND = {
  sea: { color: '#30485a', specular: '#a8bccb', shininess: 40, emissive: '#0a1620' },
  shore: '#7d6b4c',
  land: '#5c7840',
};

const SIGN = {
  fonts: ['700 118px Cinzel', 'italic 600 58px "Cormorant Garamond"'],
  paint: makeNoticeTexture,
  post: '#4a3322',
  brightness: 1.05,
  roof: '#3e2a1a',
};

const STOREY = 4.2;
const WALL_TINTS = ['#ffffff', '#f3e7d2', '#efe6dc', '#fff0dc', '#e9dccb'].map((c) => new Color(c));
const ROOF_TINTS = ['#4a4d57', '#8a6a3c', '#7a3a2a', '#3f3b38', '#5c3f2c'].map((c) => new Color(c));

// Gable roof prism: ridge along local z, eaves at y = 0, ridge at y = 1, footprint 1 x 1
function prismGeometry() {
  const v = [
    // slopes
    -0.5, 0, 0.5, 0, 1, 0.5, 0, 1, -0.5,
    -0.5, 0, 0.5, 0, 1, -0.5, -0.5, 0, -0.5,
    0.5, 0, -0.5, 0, 1, -0.5, 0, 1, 0.5,
    0.5, 0, -0.5, 0, 1, 0.5, 0.5, 0, 0.5,
    // gable ends
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5,
    0.5, 0, -0.5, -0.5, 0, -0.5, 0, 1, -0.5,
  ];
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(v), 3));
  g.computeVertexNormals();
  return g;
}

function wallGeometry(storeys) {
  const g = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * storeys);
  return g;
}

// Split the city's footprints into one- and two-storey houses and stone towers. Footprints are unchanged,
// so collisions match the Neon Bay buildings exactly.
function planTown() {
  const houses = [[], []];
  const towers = [];
  for (const b of CITY.buildings) {
    if (b.h > 40) towers.push(b);
    else houses[b.h < 16 ? 0 : 1].push(b);
  }
  return { houses, towers };
}

function Houses() {
  const plan = useMemo(() => planTown(), []);
  const mats = useMemo(() => {
    const { map, glow } = makeTimberTextures();
    const wall = new MeshStandardMaterial({ map, emissiveMap: glow, emissive: new Color('#ffffff'), emissiveIntensity: 0.4, roughness: 0.9 });
    const top = new MeshStandardMaterial({ color: '#3f3b38', roughness: 1 });
    const roof = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: DoubleSide });
    const stone = new MeshStandardMaterial({ map: makeStoneTexture(), roughness: 1 });
    return { wall, top, roof, stone, wallArray: [wall, wall, top, top, wall, wall] };
  }, []);
  const geos = useMemo(
    () => ({ walls: [wallGeometry(1), wallGeometry(2)], roof: prismGeometry(), chimney: new BoxGeometry(1, 1, 1).translate(0, 0.5, 0) }),
    [],
  );
  const wallRefs = useRef([]);
  const roofRef = useRef();
  const chimneyRef = useRef();
  const roofCount = plan.houses[0].length + plan.houses[1].length;
  const chimneys = useMemo(() => plan.houses[1].filter((_, i) => i % 2 === 0), [plan]);

  useLayoutEffect(() => {
    store.windowMaterials = [mats.wall];
    let r = 0;
    plan.houses.forEach((list, k) => {
      const wallH = STOREY * (k + 1);
      list.forEach((b, i) => {
        dummy.position.set(b.x, 0, b.y);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(b.w, wallH, b.d);
        dummy.updateMatrix();
        wallRefs.current[k].setMatrixAt(i, dummy.matrix);
        wallRefs.current[k].setColorAt(i, WALL_TINTS[Math.floor(b.tint * WALL_TINTS.length)]);

        // Ridge runs along the longer side
        const ov = 0.9;
        const along = Math.max(b.w, b.d) + ov;
        const across = Math.min(b.w, b.d) + ov;
        dummy.position.set(b.x, wallH, b.y);
        dummy.rotation.set(0, b.w > b.d ? Math.PI / 2 : 0, 0);
        dummy.scale.set(across, across * 0.55, along);
        dummy.updateMatrix();
        roofRef.current.setMatrixAt(r, dummy.matrix);
        roofRef.current.setColorAt(r, ROOF_TINTS[Math.floor(((b.tint * 7) % 1) * ROOF_TINTS.length)]);
        r++;
      });
      wallRefs.current[k].instanceMatrix.needsUpdate = true;
      if (wallRefs.current[k].instanceColor) wallRefs.current[k].instanceColor.needsUpdate = true;
    });
    roofRef.current.instanceMatrix.needsUpdate = true;
    if (roofRef.current.instanceColor) roofRef.current.instanceColor.needsUpdate = true;
    chimneys.forEach((b, i) => {
      dummy.position.set(b.x + b.w * 0.22, STOREY * 2, b.y + b.d * 0.22);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.9, Math.min(b.w, b.d) * 0.55 + 1.4, 0.9);
      dummy.updateMatrix();
      chimneyRef.current.setMatrixAt(i, dummy.matrix);
    });
    chimneyRef.current.instanceMatrix.needsUpdate = true;
    return () => {
      store.windowMaterials = [];
    };
  }, [plan, mats, chimneys]);

  return (
    <>
      {plan.houses.map((list, k) => (
        <instancedMesh key={k} ref={(el) => {
            wallRefs.current[k] = el;
          }} args={[geos.walls[k], mats.wallArray, list.length]} />
      ))}
      <instancedMesh ref={roofRef} args={[geos.roof, mats.roof, roofCount]} />
      <instancedMesh ref={chimneyRef} args={[geos.chimney, mats.stone, chimneys.length]} />
      <Towers towers={plan.towers} stone={mats.stone} />
    </>
  );
}

// Old stone towers with steep slate spires where Neon Bay had skyscrapers
function Towers({ towers, stone }) {
  const bodyRef = useRef();
  const roofRef = useRef();
  const capRef = useRef();
  const geos = useMemo(
    () => ({
      body: wallGeometry(3),
      roof: new ConeGeometry(0.72, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
      cap: new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    }),
    [],
  );
  useLayoutEffect(() => {
    towers.forEach((b, i) => {
      const h = 16 + (b.h - 40) * 0.22;
      const w = b.w * 0.82;
      const d = b.d * 0.82;
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(b.x, 0, b.y);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x, h, b.y);
      dummy.scale.set(w + 1.2, 0.9, d + 1.2);
      dummy.updateMatrix();
      capRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x, h + 0.9, b.y);
      dummy.scale.set(w * 1.45, Math.max(w, d) * 1.1, d * 1.45);
      dummy.updateMatrix();
      roofRef.current.setMatrixAt(i, dummy.matrix);
    });
    for (const ref of [bodyRef, roofRef, capRef]) ref.current.instanceMatrix.needsUpdate = true;
  }, [towers]);
  return (
    <>
      <instancedMesh ref={bodyRef} args={[geos.body, stone, towers.length]} />
      <instancedMesh ref={capRef} args={[geos.cap, stone, towers.length]} />
      <instancedMesh ref={roofRef} args={[geos.roof, undefined, towers.length]}>
        <meshStandardMaterial color="#3d4048" roughness={0.8} />
      </instancedMesh>
    </>
  );
}

// Pines and broad oaks along the roads and shore, on the spots Neon Bay used for palms
function Trees() {
  const { pines, oaks } = useMemo(() => {
    const p = [];
    const o = [];
    CITY.palms.forEach((t, i) => (i % 3 === 0 ? o : p).push(t));
    return { pines: p, oaks: o };
  }, []);
  const geos = useMemo(() => {
    const cones = [0, 1, 2].map((k) => new ConeGeometry(2.3 - k * 0.55, 3.2, 8).translate(0, 2.6 + k * 1.7, 0));
    const blobs = [
      [0, 4.6, 0, 2.6],
      [1.5, 4.0, 0.6, 1.9],
      [-1.4, 4.2, -0.5, 2.0],
      [0.3, 5.6, -1.0, 1.7],
    ].map(([x, y, z, r]) => new IcosahedronGeometry(r, 0).translate(x, y, z));
    return {
      pine: mergeGeometries(cones),
      oak: mergeGeometries(blobs),
      trunk: new CylinderGeometry(0.18, 0.32, 1, 6).translate(0, 0.5, 0),
    };
  }, []);
  const refs = useRef({});
  useLayoutEffect(() => {
    const place = (list, crownKey, trunkKey, trunkH) => {
      list.forEach((t, i) => {
        const s = 0.75 + t.h / 22;
        dummy.position.set(t.x, 0, t.y);
        dummy.rotation.set(0, t.spin, 0);
        dummy.scale.set(s, trunkH * s, s);
        dummy.updateMatrix();
        refs.current[trunkKey].setMatrixAt(i, dummy.matrix);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        refs.current[crownKey].setMatrixAt(i, dummy.matrix);
      });
      refs.current[crownKey].instanceMatrix.needsUpdate = true;
      refs.current[trunkKey].instanceMatrix.needsUpdate = true;
    };
    place(pines, 'pine', 'pineTrunk', 2.2);
    place(oaks, 'oak', 'oakTrunk', 3.4);
  }, [pines, oaks]);
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  return (
    <>
      <instancedMesh ref={set('pineTrunk')} args={[geos.trunk, undefined, pines.length]}>
        <meshStandardMaterial color="#4a3424" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={set('pine')} args={[geos.pine, undefined, pines.length]}>
        <meshStandardMaterial color="#2c4a30" roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={set('oakTrunk')} args={[geos.trunk, undefined, oaks.length]}>
        <meshStandardMaterial color="#4a3424" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={set('oak')} args={[geos.oak, undefined, oaks.length]}>
        <meshStandardMaterial color="#56702f" roughness={0.95} flatShading />
      </instancedMesh>
    </>
  );
}

// Lantern posts where Neon Bay had street lights; the flames flicker
function Lanterns({ glow }) {
  const refs = useRef({});
  const flame = useRef();
  const pool = useRef();
  useLayoutEffect(() => {
    CITY.lights.forEach((l, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(l.x, 1.75, l.y);
      dummy.updateMatrix();
      refs.current.post.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x, 3.75, l.y);
      dummy.updateMatrix();
      refs.current.lamp.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x, 4.15, l.y);
      dummy.rotation.set(0, Math.PI / 4, 0);
      dummy.updateMatrix();
      refs.current.cap.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x + (l.gx - l.x) * 0.35, 0.1, l.y + (l.gy - l.y) * 0.35);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      refs.current.pool.setMatrixAt(i, dummy.matrix);
    });
    Object.values(refs.current).forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 0.85 + Math.sin(t * 11) * 0.06 + Math.sin(t * 17.3) * 0.05 + Math.sin(t * 5.1) * 0.04;
    flame.current.color.setRGB(3.2 * f, 1.5 * f, 0.45 * f);
    pool.current.opacity = 0.2 * f;
  });
  const n = CITY.lights.length;
  const set = (key) => (el) => {
    refs.current[key] = el;
  };
  return (
    <>
      <instancedMesh ref={set('post')} args={[undefined, undefined, n]}>
        <cylinderGeometry args={[0.09, 0.13, 3.5, 6]} />
        <meshStandardMaterial color="#3a2a1c" />
      </instancedMesh>
      <instancedMesh ref={set('lamp')} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.5, 0.65, 0.5]} />
        <meshBasicMaterial ref={flame} color={[3.2, 1.5, 0.45]} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={set('cap')} args={[undefined, undefined, n]}>
        <coneGeometry args={[0.5, 0.4, 4]} />
        <meshStandardMaterial color="#2a2420" />
      </instancedMesh>
      <instancedMesh ref={set('pool')} args={[undefined, undefined, n]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial ref={pool} map={glow} color="#ffae5a" transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

// Stone windmill on the islet where Neon Bay had its Ferris wheel
function Windmill() {
  const sails = useRef();
  const stone = useMemo(() => makeStoneTexture(), []);
  useFrame((_, dt) => {
    sails.current.rotation.z += dt * 0.35;
  });
  return (
    <group position={[402, 0, 128]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[3.4, 4.6, 16, 12]} />
        <meshStandardMaterial map={stone} roughness={1} />
      </mesh>
      <mesh position={[0, 18.4, 0]}>
        <coneGeometry args={[4.2, 5, 12]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 4.45]}>
        <boxGeometry args={[1.8, 3.2, 0.3]} />
        <meshStandardMaterial color="#3a2616" />
      </mesh>
      <group ref={sails} position={[0, 15.5, 4.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 10]} />
          <meshStandardMaterial color="#3a2616" />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI) / 2]}>
            <mesh position={[0, 6.5, 0.3]}>
              <boxGeometry args={[0.3, 13, 0.3]} />
              <meshStandardMaterial color="#4a3020" />
            </mesh>
            <mesh position={[1.25, 7.2, 0.35]}>
              <boxGeometry args={[2.3, 10, 0.06]} />
              <meshStandardMaterial color="#d9cba8" roughness={1} side={DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function Realm({ glow, stops }) {
  const materials = useMemo(
    () => ({
      route: roadMaterial(makeCobbleTexture(), { glow: 0 }),
      side: roadMaterial(makeDirtTexture(), { glow: 0 }),
      rails: new MeshStandardMaterial({ color: '#5a4028', roughness: 1, side: DoubleSide }),
    }),
    [],
  );
  return (
    <>
      <Ground colors={GROUND} />
      <Roads materials={materials} deck="#5a4330" pillar="#6b6660" posts />
      <Houses />
      <Trees />
      <Lanterns glow={glow} />
      <Windmill />
      <StopSigns stops={stops} look={SIGN} />
    </>
  );
}
