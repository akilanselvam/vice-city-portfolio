import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Object3D, Vector3 } from 'three';
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
    const speed = moved > 8 ? s.speed : moved / dt;
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

function Shadow({ map }) {
  if (!map) return null;
  return (
    <mesh position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.6, 5.6]} />
      <meshBasicMaterial map={map} color="#000000" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}

// The player's dropship: gunmetal and hazard yellow, blue engines, a searchlight sweeping the lane ahead
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
