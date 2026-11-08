import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, DoubleSide, Object3D, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three';
import { makeGlowTexture } from '../textures.js';

// Hovering ships for the space theme. They face -z and fit the same collision capsule as the cars.
// Each one reads its own motion to bank into turns, pitch with acceleration and brighten its engines.
const tmp = new Vector3();
const wrap = (a) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

function useFlight(root, body, flames, hover) {
  const st = useRef({ last: null, yaw: null, speed: 0, roll: 0, pitch: 0 });
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05) || 0.016;
    const s = st.current;
    root.current.getWorldPosition(tmp);
    const moved = s.last ? tmp.distanceTo(s.last) : 0;
    s.last = (s.last ?? new Vector3()).copy(tmp);
    if (![s.speed, s.roll, s.pitch].every(Number.isFinite)) {
      // A bad position upstream would otherwise leave the ship stuck invisible
      s.speed = 0;
      s.roll = 0;
      s.pitch = 0;
      s.yaw = null;
    }
    const speed = moved > 8 || !Number.isFinite(moved) ? s.speed : moved / dt;
    const accel = (speed - s.speed) / dt;
    s.speed += (speed - s.speed) * (1 - Math.exp(-dt * 5));
    // The parent group carries the heading (rotation.y = -yaw)
    const yaw = root.current.parent?.rotation.y ?? 0;
    const turn = s.yaw == null ? 0 : wrap(yaw - s.yaw) / dt;
    s.yaw = yaw;
    const k = 1 - Math.exp(-dt * 4);
    s.roll += (Math.max(-0.55, Math.min(0.55, turn * 0.32 * Math.min(1, s.speed / 6))) - s.roll) * k;
    s.pitch += (Math.max(-0.12, Math.min(0.12, -accel * 0.004)) - s.pitch) * k;
    const t = clock.elapsedTime;
    body.current.position.y = hover + Math.sin(t * 1.8) * 0.12;
    body.current.rotation.set(s.pitch, 0, s.roll);
    const power = 0.55 + Math.min(1, s.speed / 30) * 0.9;
    for (const f of flames.current) if (f) f.scale.set(power, power, 0.6 + power);
  });
}

function Thruster({ x, z, color, glow, setRef }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.4, 0.2, 14]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <group ref={setRef}>
        <mesh position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 1.1, 12, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.3]}>
          <planeGeometry args={[1.1, 1.1]} />
          <meshBasicMaterial map={glow} color={color} transparent opacity={0.32} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Hull({ hull, accent, thruster, glow, flames, cockpit = '#1a3a6a', lights = true }) {
  const setFlame = (i) => (el) => {
    flames.current[i] = el;
  };
  return (
    <>
      {/* Fuselage, armoured nose and canopy */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[1.5, 1.0, 4.0]} />
        <meshStandardMaterial color={hull} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, -2.45]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} scale={[1.05, 1, 0.72]}>
        <coneGeometry args={[0.75, 1.0, 4]} />
        <meshStandardMaterial color={hull} metalness={0.55} roughness={0.45} flatShading />
      </mesh>
      <mesh position={[0, 0.55, -1.15]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[1.05, 0.42, 1.25]} />
        <meshStandardMaterial color={cockpit} metalness={0.9} roughness={0.08} emissive={cockpit} emissiveIntensity={0.35} />
      </mesh>
      {/* Hazard stripes */}
      {[-0.76, 0.76].map((x) => (
        <mesh key={x} position={[x, 0.15, 0.1]}>
          <boxGeometry args={[0.02, 0.2, 3.4]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.51, 0.9]}>
        <boxGeometry args={[0.5, 0.02, 1.6]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {/* Swept wings, engine pods, tail fin */}
      <mesh position={[0, -0.1, 0.75]}>
        <boxGeometry args={[4.4, 0.12, 1.3]} />
        <meshStandardMaterial color={hull} metalness={0.55} roughness={0.5} />
      </mesh>
      {[-1.65, 1.65].map((x) => (
        <mesh key={x} position={[x, 0.05, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.46, 2.1, 12]} />
          <meshStandardMaterial color="#2c3038" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, 1.65]}>
        <boxGeometry args={[0.12, 0.95, 1.05]} />
        <meshStandardMaterial color={hull} metalness={0.55} roughness={0.45} />
      </mesh>
      <Thruster x={-1.65} z={2.05} color={thruster} glow={glow} setRef={setFlame(0)} />
      <Thruster x={1.65} z={2.05} color={thruster} glow={glow} setRef={setFlame(1)} />
      {lights && (
        <>
          <mesh position={[-2.2, -0.1, 0.75]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial color={[4, 0.3, 0.2]} toneMapped={false} />
          </mesh>
          <mesh position={[2.2, -0.1, 0.75]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial color={[0.3, 4, 0.6]} toneMapped={false} />
          </mesh>
        </>
      )}
      <mesh position={[0, -0.52, -0.6]}>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
        <meshBasicMaterial color={[0.8, 1.6, 3]} toneMapped={false} />
      </mesh>
    </>
  );
}

// Diagonal hazard stripes (yellow and black) for armour bands
function makeHazard(accent) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#111316';
  g.fillRect(0, 0, 128, 32);
  g.fillStyle = accent;
  for (let x = -32; x < 160; x += 24) {
    g.beginPath();
    g.moveTo(x, 32);
    g.lineTo(x + 12, 32);
    g.lineTo(x + 24, 0);
    g.lineTo(x + 12, 0);
    g.closePath();
    g.fill();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  return tex;
}

// Hull number stencilled on the tail fin
function makeDecal() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f1f3f5';
  g.font = '700 84px "Chakra Petch", "Segoe UI", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('AS-01', 128, 70);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const GUN = '#22262c';

// Extra detail for the player's dropship: panel seams, hazard armour bands on the engines, canopy frame,
// twin nose guns and a sensor eye, wingtip fins, missile pods, engine intakes and cooling ribs, a tail
// decal and blinking strobe, an antenna and downward hover glows
function ShipDetail({ hull, accent, glow }) {
  const hazard = useMemo(() => makeHazard(accent), [accent]);
  const decal = useMemo(() => makeDecal(), []);
  useEffect(
    () => () => {
      hazard.dispose();
      decal.dispose();
    },
    [hazard, decal],
  );
  const strobe = useRef();
  const beacon = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (strobe.current) strobe.current.visible = t % 1.4 < 0.09;
    if (beacon.current) beacon.current.visible = Math.sin(t * 3) > 0;
  });
  const dark = <meshStandardMaterial color={GUN} metalness={0.6} roughness={0.45} />;
  return (
    <>
      {/* Panel seams around the fuselage */}
      {[-1.25, -0.35, 0.55, 1.45].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[1.53, 1.03, 0.03]} />
          {dark}
        </mesh>
      ))}
      {/* Armour plates on the flanks */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.77, -0.18, -0.4]}>
          <boxGeometry args={[0.04, 0.42, 1.5]} />
          <meshStandardMaterial color={hull} metalness={0.5} roughness={0.5} flatShading />
        </mesh>
      ))}
      {/* Canopy frame */}
      <group position={[0, 0.55, -1.15]} rotation={[0.18, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.06, 0.44, 1.27]} />
          {dark}
        </mesh>
        {[-0.3, 0.3].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[1.07, 0.44, 0.05]} />
            {dark}
          </mesh>
        ))}
      </group>
      {/* Twin nose guns and a red sensor eye */}
      {[-0.32, 0.32].map((x) => (
        <group key={x} position={[x, -0.42, -2.0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 1.1, 8]} />
            {dark}
          </mesh>
          <mesh position={[0, 0, -0.58]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.12, 8]} />
            {dark}
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.36, -1.45]}>
        <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        {dark}
      </mesh>
      <mesh position={[0, -0.46, -1.52]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial color={[4, 0.3, 0.2]} toneMapped={false} />
      </mesh>
      {/* Wingtip fins */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 2.16, 0.18, 0.95]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.06, 0.5, 0.8]} />
          <meshStandardMaterial color={hull} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {/* Missile pods under the wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.0, -0.34, 0.75]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 1.05, 8]} />
            {dark}
          </mesh>
          <mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.13, 0.22, 8]} />
            <meshStandardMaterial color="#c8262e" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Engine pods: intake rings, hazard armour bands and cooling ribs */}
      {[-1.65, 1.65].map((x) => (
        <group key={x} position={[x, 0.05, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <torusGeometry args={[0.43, 0.06, 6, 16]} />
            {dark}
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <circleGeometry args={[0.38, 16]} />
            <meshStandardMaterial color="#0a0b0e" side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.455, 0.455, 0.32, 16, 1, true]} />
            <meshStandardMaterial map={hazard} metalness={0.3} roughness={0.6} />
          </mesh>
          {[0, 1, 2, 3].map((k) => {
            const a = Math.PI / 4 + (k * Math.PI) / 2;
            return (
              <mesh key={k} position={[Math.cos(a) * 0.46, Math.sin(a) * 0.46, 1.25]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.08, 0.05, 1.2]} />
                {dark}
              </mesh>
            );
          })}
        </group>
      ))}
      {/* Tail fin: hazard cap, hull number on both sides, a blinking strobe */}
      <mesh position={[0, 1.36, 1.65]}>
        <boxGeometry args={[0.13, 0.12, 1.06]} />
        <meshStandardMaterial map={hazard} metalness={0.3} roughness={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.065, 0.85, 1.65]} rotation={[0, side * Math.PI / 2, 0]}>
          <planeGeometry args={[0.9, 0.45]} />
          <meshBasicMaterial map={decal} transparent depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={strobe} position={[0, 1.46, 2.15]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color={[6, 6, 6]} toneMapped={false} />
      </mesh>
      {/* Antenna with a red beacon */}
      <mesh position={[0.45, 0.9, 0.2]}>
        <cylinderGeometry args={[0.015, 0.02, 0.8, 4]} />
        {dark}
      </mesh>
      <mesh ref={beacon} position={[0.45, 1.32, 0.2]}>
        <sphereGeometry args={[0.045, 6, 4]} />
        <meshBasicMaterial color={[4, 0.3, 0.2]} toneMapped={false} />
      </mesh>
      {/* Downward hover-jet glows */}
      {[
        [-0.5, -1.3],
        [0.5, -1.3],
        [-0.5, 1.3],
        [0.5, 1.3],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -0.56, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 0.7]} />
          <meshBasicMaterial map={glow} color={[0.6, 1.6, 4]} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function Shadow({ map }) {
  if (!map) return null;
  return (
    <mesh position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.6, 5.6]} />
      <meshBasicMaterial map={map} color="#000000" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}

// The player's dropship: gunmetal and hazard yellow, blue engines, a searchlight sweeping the lane ahead,
// plus the ShipDetail layer (traffic ships skip it to stay light)
export function PlayerShip({ shadow }) {
  const root = useRef();
  const body = useRef();
  const flames = useRef([]);
  const glow = useMemo(() => makeGlowTexture(), []);
  useFlight(root, body, flames, 1.7);
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, -1.7, -24);
    return o;
  }, []);
  return (
    <group ref={root}>
      <Shadow map={shadow} />
      <group ref={body} position={[0, 1.7, 0]} scale={0.82}>
        <Hull hull="#6b7280" accent="#ffd100" thruster={[0.6, 1.6, 4]} glow={glow} flames={flames} />
        <ShipDetail hull="#6b7280" accent="#ffd100" glow={glow} />
        <primitive object={target} />
        <spotLight position={[0, -0.4, -2.6]} target={target} color="#dbeaff" intensity={22} angle={0.42} penumbra={0.7} distance={46} decay={1.4} />
      </group>
    </group>
  );
}

// Traffic: other ships flying the lanes, with their own paint and engine colour
export function TrafficShip({ hull, accent, thruster, cockpit }) {
  const root = useRef();
  const body = useRef();
  const flames = useRef([]);
  const glow = useMemo(() => makeGlowTexture(), []);
  useFlight(root, body, flames, 2.6);
  return (
    <group ref={root}>
      <group ref={body} position={[0, 2.6, 0]} scale={0.8}>
        <Hull hull={hull} accent={accent} thruster={thruster} cockpit={cockpit} glow={glow} flames={flames} lights={false} />
      </group>
    </group>
  );
}
