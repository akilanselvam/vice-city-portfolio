import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Object3D,
  PMREMGenerator,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A low, curvy GT supercar built from lofted cross-sections. Faces -z; t runs 0 (nose) to 1 (tail).
const LENGTH = 4.9;
const NOSE_Z = -LENGTH / 2;
const WHEEL_R = 0.38;
const AXLES = [-1.4, 1.45];
const TRACK = [0.8, 0.84];
const ARCH_R = 0.44;
const PAINT = '#6c727c';
const DARK = '#0d0e12';
const CARBON = '#050507';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const spow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

// Smooth scalar curve through (t, value) keys (cubic Hermite, finite-difference tangents)
function spline(keys) {
  const slope = (k) => {
    const a = keys[Math.max(0, k - 1)];
    const b = keys[Math.min(keys.length - 1, k + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  return (t) => {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    const h = t1 - t0;
    const u = clamp01((t - t0) / h);
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * slope(i) + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * slope(i + 1);
  };
}

// Centre-line height of the body: low pointed nose, long bonnet, rising haunches, tall cut-off tail
const crown = spline([[0, 0.6], [0.07, 0.74], [0.2, 0.86], [0.36, 0.9], [0.6, 0.92], [0.8, 0.97], [0.94, 0.96], [1, 0.92]]);
const base = (t) => 0.26 + 0.1 * (1 - smooth(0, 0.14, t)) + 0.08 * smooth(0.9, 1, t);
const zAt = (t) => NOSE_Z + t * LENGTH;
const bump = (z, zw) => Math.exp(-(((z - zw) / 0.65) ** 2));
// Coke-bottle plan: wide over the wheels, pinched at the doors, wider still at the rear haunches
const halfWidth = (t) => 0.92 + 0.09 * bump(zAt(t), AXLES[0]) + 0.13 * bump(zAt(t), AXLES[1]);
const end = (u) => (u >= 1 ? 1 : Math.sqrt(Math.max(0, 1 - (1 - u) ** 2)));
const archY = (z) => {
  let y = -Infinity;
  for (const zw of AXLES) {
    const dz = z - zw;
    if (Math.abs(dz) < ARCH_R) y = Math.max(y, WHEEL_R + Math.sqrt(ARCH_R ** 2 - dz ** 2));
  }
  return y;
};

function bodyPoint(t, th) {
  const z = zAt(t);
  // Rounded bullet nose; the tail stays tall and wide almost to the end for a flat, chopped rear face
  const en = end(t / 0.12);
  const et = end((1 - t) / 0.04);
  const b = base(t);
  const top = crown(t);
  const mid = (b + top) / 2;
  const hh = ((top - b) / 2) * en * et ** 0.2;
  const a = halfWidth(t) * en ** 0.55 * et ** 0.25;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const x = a * spow(c, 0.34);
  let y = mid + hh * spow(s, 0.62);
  // Fenders swell above the bonnet over each wheel
  if (s > 0) y += 0.2 * Math.abs(c) * s * Math.max(bump(z, AXLES[0]), bump(z, AXLES[1])) * en;
  const ay = archY(z);
  const arch = y < ay;
  if (arch) y = ay;
  return { x, y, z, arch, b };
}

// Teardrop glass canopy: raked windscreen, peak mid-car, long fastback
const CANOPY = [0.33, 0.86];
function canopyPoint(u, th) {
  const t = CANOPY[0] + u * (CANOPY[1] - CANOPY[0]);
  const belt = crown(t) - 0.08;
  const h = 0.44 * Math.sin(Math.PI * u ** 0.62) ** 0.85;
  const w = halfWidth(t) * (0.7 + 0.06 * Math.sin(Math.PI * u));
  const c = Math.cos(th);
  const s = Math.sin(th);
  return { x: w * spow(c, 2 / 3), y: s >= 0 ? belt + h * s ** 0.9 : belt + 0.06 * s, z: zAt(t) };
}

// Grid loft: rings of M points around, N stations along; seam sits on the underside
function loft(fn, N, M, stationAt, colorAt) {
  const pos = new Float32Array((N + 1) * (M + 1) * 3);
  const col = colorAt ? new Float32Array((N + 1) * (M + 1) * 3) : null;
  const index = [];
  for (let i = 0; i <= N; i++) {
    const t = stationAt(i / N);
    for (let j = 0; j <= M; j++) {
      const th = -Math.PI / 2 + (Math.PI * 2 * j) / M;
      const p = fn(t, th);
      const k = (i * (M + 1) + j) * 3;
      pos[k] = p.x;
      pos[k + 1] = p.y;
      pos[k + 2] = p.z;
      if (col) colorAt(p, t, th).toArray(col, k);
      if (i < N && j < M) {
        const a = i * (M + 1) + j;
        const b = a + 1;
        const cc = a + M + 1;
        const d = cc + 1;
        index.push(a, b, cc, b, d, cc);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  if (col) g.setAttribute('color', new BufferAttribute(col, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

const paint = new Color(PAINT);
const dark = new Color(DARK);
const bodyColor = (p, t, th) => {
  const s = Math.sin(th);
  const frontSplitter = t < 0.08 && s < -0.1;
  const rearFascia = t > 0.97 && s < 0.3;
  return p.arch || frontSplitter || rearFascia || p.y < p.b + 0.07 ? dark : paint;
};

// A strip of light riding just proud of the body along a constant ring angle; samples bunch toward t1
function surfaceStrip(t0, t1, th, n) {
  const at = (t, a) => {
    const p = bodyPoint(t, a);
    return new Vector3(p.x, p.y, p.z);
  };
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const t = t0 + (t1 - t0) * (1 - (1 - u) ** 2);
    const p = at(t, th);
    const dTh = at(t, th + 1e-3).sub(p);
    const dT = at(t + 1e-4, th).sub(p);
    pts.push(p.addScaledVector(dTh.cross(dT).normalize(), 0.012));
  }
  return pts;
}
const tube = (pts, r) => new TubeGeometry(new CatmullRomCurve3(pts), pts.length * 4, r, 8, false);

// Flat profile drawn in world (z, y), extruded sideways across x and centred on x = 0
function sideExtrude(points, width) {
  const g = new ExtrudeGeometry(new Shape(points.map(([z, y]) => ({ x: -z, y }))), { depth: width, bevelEnabled: false });
  g.rotateY(Math.PI / 2); // shape x (= -z) -> world z, extrusion -> world x
  g.translate(-width / 2, 0, 0);
  return g;
}

// Big GT wing: inverted airfoil on swan-neck stands, with raked endplates
const WING = { span: 2.16, chord: 0.62, y: 1.5, z: 2.12, tilt: -0.16 };
function buildWing() {
  const foil = [];
  const n = 18;
  for (let k = 0; k <= n; k++) {
    const x = k / n;
    const yt = 0.6 * WING.chord * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    const camber = -0.05 * WING.chord * Math.sin(Math.PI * x);
    foil.push([x, camber + yt, camber - yt]);
  }
  // Leading edge faces forward (-z): upper surface front to back, then lower surface back to front
  const zOf = (x) => (x - 0.5) * WING.chord;
  const profile = [
    ...foil.map(([x, up]) => [zOf(x), up]),
    ...foil.slice(1, -1).reverse().map(([x, , lo]) => [zOf(x), lo]),
  ];
  const wing = sideExtrude(profile, WING.span);
  wing.rotateX(WING.tilt); // trailing edge kicks up
  wing.translate(0, WING.y, WING.z);
  const plate = sideExtrude([[1.8, 1.4], [2.46, 1.34], [2.5, 1.62], [1.9, 1.6]], 0.03);
  // Swan neck: rises from the deck and hooks over the top of the wing
  const neck = sideExtrude(
    [[1.86, 0.82], [2.08, 0.82], [2.12, 1.2], [2.04, 1.56], [1.94, 1.62], [1.82, 1.58], [1.9, 1.52], [1.96, 1.2]],
    0.045,
  );
  return { wing, plate, neck };
}

function buildGeometry() {
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u); // denser stations at nose and tail
  const body = loft(bodyPoint, 160, 64, ease, bodyColor);
  const glass = loft(canopyPoint, 80, 48, (u) => u);
  const head = [0.7, Math.PI - 0.7].map((th) => tube(surfaceStrip(0.012, 0.12, th, 16), 0.028));
  // Slim tail lights that wrap from the rear quarters onto the chopped tail
  const tail = [0.32, Math.PI - 0.32].map((th) => tube(surfaceStrip(0.9, 0.99, th, 16), 0.034));
  const mirrorAt = canopyPoint(0.1, 0);
  return { body, glass, head, tail, mirror: [mirrorAt.x + 0.08, mirrorAt.y + 0.1, mirrorAt.z], ...buildWing() };
}

function Wheel({ pos, setRef }) {
  const out = pos[0] > 0 ? 1 : -1;
  return (
    <group position={pos} ref={setRef}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.26, 28]} />
        <meshStandardMaterial color="#0c0c0f" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[out * 0.06, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.02, 28]} />
        <meshStandardMaterial color="#141519" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[out * 0.13, 0, 0]}>
        <torusGeometry args={[0.27, 0.022, 8, 32]} />
        <meshStandardMaterial color="#b8bcc4" metalness={0.9} roughness={0.45} />
      </mesh>
      {/* Five twin spokes so the spin reads */}
      {[0, 1, 2, 3, 4].flatMap((k) =>
        [-0.13, 0.13].map((o) => (
          <group key={`${k}${o}`} rotation={[(k * Math.PI * 2) / 5 + o, 0, 0]}>
            <mesh position={[out * 0.12, 0.14, 0]}>
              <boxGeometry args={[0.03, 0.25, 0.035]} />
              <meshStandardMaterial color="#3c4049" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        )),
      )}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[out * 0.13, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 12]} />
        <meshStandardMaterial color="#1a1b20" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Player vehicle: a satin-silver GT supercar with a carbon rear wing. Same footprint as before.
export default function Roadster({ shadow, wheels }) {
  const gl = useThree((state) => state.gl);
  const env = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => env.dispose(), [env]);

  const geo = useMemo(() => buildGeometry(), []);
  useEffect(
    () => () => [geo.body, geo.glass, geo.wing, geo.plate, geo.neck, ...geo.tail, ...geo.head].forEach((g) => g.dispose()),
    [geo],
  );
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, 0, -26);
    return o;
  }, []);
  const setWheel = (i) => (el) => {
    if (wheels) wheels.current[i] = el;
  };
  const carbon = <meshStandardMaterial color={CARBON} metalness={0.2} roughness={0.45} envMap={env} envMapIntensity={0.5} />;

  return (
    <group>
      {shadow && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 6.2]} />
          <meshBasicMaterial map={shadow} color="#000000" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={geo.body}>
        <meshPhysicalMaterial
          vertexColors
          metalness={0.55}
          roughness={0.58}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
          envMap={env}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh geometry={geo.glass}>
        <meshPhysicalMaterial color="#07080e" metalness={0.6} roughness={0.22} clearcoat={0.3} clearcoatRoughness={0.3} envMap={env} envMapIntensity={0.55} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * geo.mirror[0], geo.mirror[1], geo.mirror[2]]} scale={[0.07, 0.06, 0.13]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color={PAINT} metalness={0.55} roughness={0.58} clearcoat={0.15} envMap={env} envMapIntensity={0.45} />
        </mesh>
      ))}

      {/* Swept LED headlights and slim split tail lights */}
      {geo.head.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color={[3, 3.2, 3.6]} toneMapped={false} />
        </mesh>
      ))}
      {geo.tail.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color={[3, 0.12, 0.08]} toneMapped={false} />
        </mesh>
      ))}

      {/* Carbon GT wing, raked endplates and swan-neck stands */}
      <mesh geometry={geo.wing}>{carbon}</mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh geometry={geo.plate} position={[side * (WING.span / 2 + 0.017), 0, 0]}>
            {carbon}
          </mesh>
          <mesh geometry={geo.neck} position={[side * 0.55, 0, 0]}>
            {carbon}
          </mesh>
        </group>
      ))}

      {/* Black intake blades raked ahead of the rear wheels */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.93, 0.56, 0.72]} rotation={[0.42, 0, side * 0.05]}>
          <boxGeometry args={[0.1, 0.44, 0.13]} />
          {carbon}
        </mesh>
      ))}

      {/* Diffuser strakes and twin exhausts under the black rear */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.3, 2.28]}>
          <boxGeometry args={[0.03, 0.14, 0.34]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
      ))}
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0.42, 2.42]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.075, 0.075, 0.2, 16, 1, true]} />
            <meshStandardMaterial color="#b8bcc4" metalness={0.9} roughness={0.45} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.1, 12]} />
            <meshBasicMaterial color="#050506" />
          </mesh>
        </group>
      ))}

      {AXLES.flatMap((z, k) =>
        [-1, 1].map((side) => {
          const i = k * 2 + (side > 0 ? 1 : 0);
          return <Wheel key={i} pos={[side * TRACK[k], WHEEL_R, z]} setRef={setWheel(i)} />;
        }),
      )}

      <primitive object={target} />
      <spotLight position={[0, 0.6, -2.4]} target={target} color="#eef4ff" intensity={20} angle={0.45} penumbra={0.7} distance={45} decay={1.4} />
    </group>
  );
}
