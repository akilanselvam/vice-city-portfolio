import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Object3D,
  PMREMGenerator,
  SRGBColorSpace,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// The Neon Bay player car: an 80s wedge sports car built from crisp flat panels to match the low-poly
// neon city. Pearl paint over a black lower body, a pink-to-cyan neon side stripe, pop-up headlights,
// rear-window louvers, side strakes, a flat 80s wing, white turbine wheels and pink underglow.
// Faces -z. Same footprint as before (4.9 long, about 2.06 wide, wheels at the same spots).

const WHEEL_R = 0.38;
const AXLES = [-1.4, 1.45];
const TRACK = [0.8, 0.84];
const ARCH_R = 0.47;
const PAINT = '#d4cee2';
const LOWER = '#14101c';
const GLASS = '#0a0814';
const PINK = '#ff2d95';
const CYAN = '#2de2ff';

// Body keyframes along the car: z, underside, rocker top, shoulder, deck centre, half width, deck half width.
// Straight lines between keys give the flat, faceted wedge.
const BODY = [
  [-2.45, 0.34, 0.4, 0.5, 0.53, 0.84, 0.6],
  [-2.3, 0.3, 0.38, 0.57, 0.63, 0.95, 0.74],
  [-1.4, 0.28, 0.4, 0.7, 0.79, 1.01, 0.8],
  [-0.55, 0.27, 0.4, 0.72, 0.81, 0.97, 0.78],
  [0.4, 0.27, 0.4, 0.74, 0.83, 0.97, 0.78],
  [1.45, 0.28, 0.42, 0.8, 0.89, 1.03, 0.84],
  [2.3, 0.32, 0.44, 0.82, 0.89, 1.0, 0.82],
  [2.45, 0.36, 0.45, 0.82, 0.87, 0.97, 0.8],
];
// Glasshouse keyframes: z, roof height (null = meets the deck), belt half width, roof half width
const CABIN = [
  [-0.62, null, 0.74, 0.5],
  [0.1, 1.26, 0.76, 0.58],
  [0.8, 1.24, 0.76, 0.58],
  [1.85, null, 0.8, 0.66],
];

function lerpKeys(keys, z) {
  if (z <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (z <= b[0]) {
      const u = (z - a[0]) / (b[0] - a[0]);
      return a.slice(1).map((v, k) => v + (b[k + 1] - v) * u);
    }
  }
  return keys[keys.length - 1].slice(1);
}

const body = (z) => {
  const [yb, yr, ys, yt, w, wt] = lerpKeys(BODY, z);
  return { yb, yr, ys, yt, w, wt };
};

// Top of the wheel opening at z, kept just under the shoulder so a strip of side panel runs over it
function archTop(z) {
  let y = -Infinity;
  for (const zw of AXLES) {
    const dz = z - zw;
    if (Math.abs(dz) < ARCH_R) y = Math.max(y, WHEEL_R + Math.sqrt(ARCH_R ** 2 - dz ** 2));
  }
  return y;
}

// Loft a right-side half-profile along z, mirrored to make the full cross-section. `centre` says which
// end of the half-profile sits on the centre line: 'end' (it runs out to the side, then in to the top
// centre) or 'start' (it runs from the bottom centre out to the side).
function loft(stations, profileAt, centre = 'end') {
  const mirror = ([x, y]) => [-x, y];
  const rings = stations.map((z) => {
    const half = profileAt(z);
    const ring =
      centre === 'end'
        ? [...half, ...half.slice(0, -1).reverse().map(mirror)]
        : [...half.slice(1).reverse().map(mirror), ...half];
    return ring.map(([x, y]) => [x, y, z]);
  });
  const pos = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i];
    const b = rings[i + 1];
    for (let j = 0; j < a.length - 1; j++) {
      pos.push(...a[j], ...b[j], ...a[j + 1], ...a[j + 1], ...b[j], ...b[j + 1]);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

// A flat polygon facing +z or -z (for the nose and tail ends)
function cap(points, z, facing) {
  const pos = [];
  const c = points.reduce((s, [x, y]) => [s[0] + x / points.length, s[1] + y / points.length], [0, 0]);
  for (let k = 0; k < points.length; k++) {
    const p = points[k];
    const q = points[(k + 1) % points.length];
    if (facing > 0) pos.push(c[0], c[1], z, p[0], p[1], z, q[0], q[1], z);
    else pos.push(c[0], c[1], z, q[0], q[1], z, p[0], p[1], z);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

// A thin ribbon on the car's side between two heights, with a colour gradient along its length
function sideRibbon(z0, z1, yLow, yHigh, side, n, colorAt) {
  const pos = [];
  const col = [];
  for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n;
    const zb = z0 + ((z1 - z0) * (i + 1)) / n;
    const pa = body(za);
    const pb = body(zb);
    const xa = side * (pa.w + 0.006);
    const xb = side * (pb.w + 0.006);
    const quad = [
      [xa, yLow(pa), za],
      [xb, yLow(pb), zb],
      [xa, yHigh(pa), za],
      [xa, yHigh(pa), za],
      [xb, yLow(pb), zb],
      [xb, yHigh(pb), zb],
    ];
    const tris = side > 0 ? quad : [quad[0], quad[2], quad[1], quad[3], quad[5], quad[4]];
    for (const v of tris) {
      pos.push(...v);
      colorAt((v[2] - z0) / (z1 - z0)).toArray(col, col.length);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  return g;
}

// A thin ribbon lying on the top deck between two x offsets, following the deck's centre crease
function topRibbon(z0, z1, xa, xb, n, colorAt) {
  const deckY = (p, x) => p.yt + 0.02 * (1 - Math.abs(x) / p.wt) + 0.006;
  const pos = [];
  const col = [];
  for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n;
    const zb = z0 + ((z1 - z0) * (i + 1)) / n;
    const pa = body(za);
    const pb = body(zb);
    const quad = [
      [xa, deckY(pa, xa), za],
      [xa, deckY(pb, xa), zb],
      [xb, deckY(pa, xb), za],
      [xb, deckY(pa, xb), za],
      [xa, deckY(pb, xa), zb],
      [xb, deckY(pb, xb), zb],
    ];
    for (const v of quad) {
      pos.push(...v);
      colorAt((v[2] + 2.45) / 4.9).toArray(col, col.length);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  return g;
}

function buildGeometry() {
  // Slice the body only at its keyframes (so each panel is one flat facet), plus finely around the
  // wheels where the arches are cut
  const cuts = new Set(BODY.map(([z]) => z));
  for (const zw of AXLES) for (let k = -10; k <= 10; k++) cuts.add(+(zw + (k / 10) * ARCH_R * 1.02).toFixed(4));
  const stations = [...cuts].sort((a, b) => a - b);

  // Lower body (black): underside to rocker, lifted over the wheels to form the wheel wells
  const lower = loft(stations, (z) => {
    const p = body(z);
    const lift = Math.min(archTop(z), p.ys - 0.09);
    const yr = Math.max(p.yr, lift);
    const yb = Math.max(p.yb, lift - 0.12);
    return [
      [0, p.yb],
      [p.w - 0.1, yb],
      [p.w, yr],
    ];
  }, 'start');
  // Upper body (paint): rocker to shoulder, chamfer, and a faint crease down the middle of the deck
  const upper = loft(
    stations,
    (z) => {
      const p = body(z);
      const yr = Math.max(p.yr, Math.min(archTop(z), p.ys - 0.09));
      return [
        [p.w, yr],
        [p.w, p.ys],
        [p.wt, p.yt],
        [0, p.yt + 0.02],
      ];
    },
  );
  const ring = (z) => {
    const p = body(z);
    const half = [
      [0, p.yb],
      [p.w - 0.1, p.yb],
      [p.w, p.yr],
      [p.w, p.ys],
      [p.wt, p.yt],
      [0, p.yt + 0.02],
    ];
    return [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
  };
  const nose = cap(ring(-2.45), -2.45, -1);
  const tail = cap(ring(2.45), 2.45, 1);

  // Glasshouse: the roof meets the deck at both ends (raked windscreen, sloping rear window)
  const cabinKeys = CABIN.map(([z, roof, wb, wr]) => [z, roof ?? body(z).yt + 0.005, wb, wr]);
  const cabinStations = CABIN.map(([z]) => z);
  const glass = loft(
    cabinStations,
    (z) => {
      const p = body(z);
      const [roof, wb, wr] = lerpKeys(cabinKeys, z);
      const belt = p.yt + 0.005;
      const top = Math.max(belt, roof);
      return [
        [wb, belt],
        [wr, top],
        [0, top + 0.015],
      ];
    },
  );

  // Neon side stripe just under the shoulder, pink at the nose fading to cyan at the tail
  const pink = new Color(PINK).multiplyScalar(1.5);
  const cyan = new Color(CYAN).multiplyScalar(1.5);
  const grad = (u) => pink.clone().lerp(cyan, u);
  const stripes = [1, -1].flatMap((side) => [
    sideRibbon(-2.3, 2.42, (p) => p.ys - 0.15, (p) => p.ys - 0.07, side, 60, grad),
    sideRibbon(-2.2, 2.4, (p) => p.ys - 0.2, (p) => p.ys - 0.18, side, 60, grad),
  ]);
  // Twin pinstripes down the bonnet and over the rear deck
  const pinstripes = [-1, 1].flatMap((side) => [
    topRibbon(-2.3, -0.68, side * 0.09, side * 0.15, 40, grad),
    topRibbon(1.9, 2.42, side * 0.09, side * 0.15, 16, grad),
  ]);

  return { lower, upper, nose, tail, glass, stripes: [...stripes, ...pinstripes] };
}

// Pink glow on the road under the car
function makeUnderglow() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 128, 8, 64, 128, 124);
  grad.addColorStop(0, 'rgba(255, 60, 170, 0.9)');
  grad.addColorStop(0.45, 'rgba(255, 45, 149, 0.45)');
  grad.addColorStop(1, 'rgba(255, 45, 149, 0)');
  g.fillStyle = grad;
  g.save();
  g.scale(1, 2);
  g.fillRect(0, 0, 128, 128);
  g.restore();
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// White turbine-style wheel: deep dish with a ring of vents so the spin reads
function Wheel({ pos, setRef }) {
  const out = pos[0] > 0 ? 1 : -1;
  return (
    <group position={pos} ref={setRef}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.27, 24]} />
        <meshStandardMaterial color="#0b0a0f" roughness={0.9} flatShading side={DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[out * 0.1, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.25, 0.08, 20]} />
        <meshStandardMaterial color="#efedf6" metalness={0.3} roughness={0.4} flatShading side={DoubleSide} />
      </mesh>
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k * Math.PI * 2) / 8;
        return (
          <mesh key={k} rotation={[0, 0, Math.PI / 2]} position={[out * 0.145, Math.cos(a) * 0.165, Math.sin(a) * 0.165]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 10]} />
            <meshBasicMaterial color="#1a1426" />
          </mesh>
        );
      })}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[out * 0.15, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
        <meshBasicMaterial color={[2.2, 0.3, 1.2]} toneMapped={false} />
      </mesh>
    </group>
  );
}

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
  useEffect(() => () => [geo.lower, geo.upper, geo.nose, geo.tail, geo.glass, ...geo.stripes].forEach((g) => g.dispose()), [geo]);
  const underglow = useMemo(() => makeUnderglow(), []);
  useEffect(() => () => underglow.dispose(), [underglow]);

  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, 0, -26);
    return o;
  }, []);
  const setWheel = (i) => (el) => {
    if (wheels) wheels.current[i] = el;
  };

  const paint = (
    <meshPhysicalMaterial color={PAINT} metalness={0.25} roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.45} envMap={env} envMapIntensity={0.3} flatShading side={DoubleSide} />
  );
  const black = <meshStandardMaterial color={LOWER} metalness={0.2} roughness={0.6} envMap={env} envMapIntensity={0.3} flatShading side={DoubleSide} />;

  // Heights used to seat the parts on the body
  const hood = body(-1.95);
  const deck = body(2.2);
  const louverZ = [1.0, 1.13, 1.26, 1.39, 1.52, 1.65];
  const slope = Math.atan2(1.24 - body(1.85).yt, 1.85 - 0.8);

  return (
    <group>
      {shadow && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 6.2]} />
          <meshBasicMaterial map={shadow} color="#000000" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
      {/* Neon underglow */}
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 6.6]} />
        <meshBasicMaterial map={underglow} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* Body */}
      <mesh geometry={geo.upper}>{paint}</mesh>
      <mesh geometry={geo.lower}>{black}</mesh>
      <mesh geometry={geo.nose}>{black}</mesh>
      <mesh geometry={geo.tail}>{black}</mesh>
      <mesh geometry={geo.glass}>
        <meshPhysicalMaterial color={GLASS} metalness={0.5} roughness={0.15} clearcoat={0.6} clearcoatRoughness={0.2} envMap={env} envMapIntensity={0.7} flatShading side={DoubleSide} />
      </mesh>
      {/* Painted roof panel */}
      <mesh position={[0, 1.262, 0.45]}>
        <boxGeometry args={[1.12, 0.03, 0.72]} />
        {paint}
      </mesh>
      {/* Neon side stripes */}
      {geo.stripes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial vertexColors toneMapped={false} side={DoubleSide} />
        </mesh>
      ))}

      {/* Black trim around each wheel opening */}
      {AXLES.flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}${side}`} position={[side * (body(z).w + 0.012), WHEEL_R, z]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[ARCH_R, 0.035, 4, 20, Math.PI]} />
            {black}
          </mesh>
        )),
      )}

      {/* Pop-up headlights, flipped up on the bonnet */}
      {[-0.56, 0.56].map((x) => (
        <group key={x} position={[x, hood.yt - 0.01, -1.95]} rotation={[-0.32, 0, 0]}>
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.46, 0.18, 0.3]} />
            {paint}
          </mesh>
          <mesh position={[0, 0.09, -0.152]}>
            <planeGeometry args={[0.4, 0.12]} />
            <meshBasicMaterial color={[3, 3.1, 3.4]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Nose: neon light line, amber corner lights and a black intake */}
      <mesh position={[0, body(-2.38).ys - 0.02, -2.43]}>
        <boxGeometry args={[1.3, 0.025, 0.02]} />
        <meshBasicMaterial color={[2.6, 0.35, 1.4]} toneMapped={false} />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.44, -2.42]}>
          <boxGeometry args={[0.22, 0.05, 0.03]} />
          <meshBasicMaterial color={[3, 1.4, 0.2]} toneMapped={false} />
        </mesh>
      ))}

      {/* Side strakes ahead of the rear wheels and door mirrors */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[side * (body(0.6).w + 0.02), 0.47 + k * 0.045, 0.62]}>
              <boxGeometry args={[0.03, 0.022, 1.0 - k * 0.06]} />
              {black}
            </mesh>
          ))}
          <mesh position={[side * 0.86, body(-0.45).yt + 0.12, -0.45]} rotation={[0, side * 0.2, 0]}>
            <boxGeometry args={[0.16, 0.09, 0.2]} />
            {paint}
          </mesh>
        </group>
      ))}

      {/* Louvers over the rear window */}
      {louverZ.map((z) => {
        const y = 1.24 - (z - 0.8) * Math.tan(slope) + 0.03;
        return (
          <mesh key={z} position={[0, y, z]} rotation={[slope - 0.35, 0, 0]}>
            <boxGeometry args={[1.18, 0.02, 0.11]} />
            {black}
          </mesh>
        );
      })}

      {/* Flat 80s wing on two stands, with a neon edge */}
      <group position={[0, deck.yt, 2.2]}>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.17, 0]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.06, 0.34, 0.16]} />
            {black}
          </mesh>
        ))}
        <mesh position={[0, 0.36, 0.05]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[1.86, 0.05, 0.44]} />
          {paint}
        </mesh>
        <mesh position={[0, 0.39, 0.27]}>
          <boxGeometry args={[1.86, 0.02, 0.02]} />
          <meshBasicMaterial color={[2.6, 0.35, 1.4]} toneMapped={false} />
        </mesh>
        {[-0.94, 0.94].map((x) => (
          <mesh key={x} position={[x, 0.34, 0.06]}>
            <boxGeometry args={[0.03, 0.2, 0.5]} />
            {black}
          </mesh>
        ))}
      </group>

      {/* Full-width slatted tail-light bar, plate and twin exhausts */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, deck.ys - 0.07 - k * 0.055, 2.455]}>
          <boxGeometry args={[1.62 - k * 0.08, 0.032, 0.01]} />
          <meshBasicMaterial color={[3, 0.1 + k * 0.05, 0.25]} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.52, 2.455]}>
        <boxGeometry args={[0.5, 0.13, 0.01]} />
        <meshStandardMaterial color="#d8d4e6" roughness={0.6} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.36, 2.44]}>
          <boxGeometry args={[0.24, 0.08, 0.06]} />
          <meshStandardMaterial color="#b8bcc4" metalness={0.8} roughness={0.4} />
        </mesh>
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
