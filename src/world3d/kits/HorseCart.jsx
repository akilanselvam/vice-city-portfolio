import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Object3D, Vector3 } from 'three';

// Horse-drawn carts for the medieval theme. Like the cars they face -z, fit the same collision capsule
// (about -2.6..2.6 along their length) and expose spinning wheels through the `wheels` ref.
const WHEEL_R = 0.62;
const LEGS = [
  // x, z, gait phase offset (diagonal pairs move together: a trot)
  [-0.2, -2.0, 0],
  [0.2, -2.0, Math.PI],
  [-0.2, -1.0, Math.PI],
  [0.2, -1.0, 0],
];
const tmp = new Vector3();

function Horse({ coat = '#6b3f22', mane = '#2a1a10', socks = '#e8e0d0' }) {
  const root = useRef();
  const legs = useRef([]);
  const body = useRef();
  const head = useRef();
  const tail = useRef();
  const gait = useRef({ last: null, speed: 0, phase: 0 });

  // Read speed from how far the horse actually moved, so it works for the player, traffic and the tour alike
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05) || 0.016;
    const g = gait.current;
    root.current.getWorldPosition(tmp);
    const moved = g.last ? tmp.distanceTo(g.last) : 0;
    g.last = (g.last ?? new Vector3()).copy(tmp);
    const speed = moved > 6 ? 0 : moved / dt;
    g.speed += (speed - g.speed) * (1 - Math.exp(-dt * 6));
    const amp = Math.min(0.62, g.speed * 0.045);
    g.phase += dt * (3 + Math.min(g.speed, 30) * 0.32);
    LEGS.forEach(([, , off], i) => {
      const leg = legs.current[i];
      if (leg) leg.rotation.x = Math.sin(g.phase + off) * amp;
    });
    body.current.position.y = Math.abs(Math.sin(g.phase)) * amp * 0.12;
    head.current.rotation.x = Math.sin(g.phase * 2) * amp * 0.12;
    tail.current.rotation.x = -0.35 + Math.sin(g.phase * 0.7) * (0.06 + amp * 0.1);
  });

  return (
    <group ref={root}>
      {LEGS.map(([x, z], i) => (
        <group key={i} ref={(el) => {
          legs.current[i] = el;
        }} position={[x, 1.2, z]}>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.065, 1.0, 6]} />
            <meshStandardMaterial color={coat} roughness={0.8} />
          </mesh>
          <mesh position={[0, -1.02, 0]}>
            <cylinderGeometry args={[0.075, 0.08, 0.16, 6]} />
            <meshStandardMaterial color={socks} roughness={0.9} />
          </mesh>
          <mesh position={[0, -1.14, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.2]} />
            <meshStandardMaterial color="#1c1612" />
          </mesh>
        </group>
      ))}
      <group ref={body}>
        <mesh position={[0, 1.45, -1.5]} rotation={[Math.PI / 2, 0, 0]} scale={[0.82, 1, 1]}>
          <capsuleGeometry args={[0.42, 1.05, 6, 14]} />
          <meshStandardMaterial color={coat} roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.95, -2.18]} rotation={[-0.55, 0, 0]}>
          <capsuleGeometry args={[0.2, 0.7, 4, 10]} />
          <meshStandardMaterial color={coat} roughness={0.75} />
        </mesh>
        <mesh position={[0, 2.05, -2.03]} rotation={[-0.55, 0, 0]}>
          <boxGeometry args={[0.07, 0.85, 0.14]} />
          <meshStandardMaterial color={mane} roughness={1} />
        </mesh>
        {/* Collar and saddle pad of the harness */}
        <mesh position={[0, 1.72, -2.05]} rotation={[Math.PI / 2 - 0.55, 0, 0]}>
          <torusGeometry args={[0.27, 0.07, 6, 14]} />
          <meshStandardMaterial color="#3a2414" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.83, -1.35]}>
          <boxGeometry args={[0.72, 0.08, 0.5]} />
          <meshStandardMaterial color="#5a1c16" roughness={0.9} />
        </mesh>
        <group ref={head} position={[0, 2.36, -2.5]}>
          <mesh position={[0, -0.2, -0.24]} rotation={[-0.95, 0, 0]}>
            <boxGeometry args={[0.24, 0.26, 0.66]} />
            <meshStandardMaterial color={coat} roughness={0.75} />
          </mesh>
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.16, 0.04]}>
              <coneGeometry args={[0.045, 0.16, 5]} />
              <meshStandardMaterial color={coat} />
            </mesh>
          ))}
        </group>
        <mesh ref={tail} position={[0, 1.3, -0.82]}>
          <cylinderGeometry args={[0.05, 0.11, 0.85, 6]} />
          <meshStandardMaterial color={mane} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

function Wheel({ position, setRef }) {
  const spokes = useMemo(() => Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4), []);
  return (
    <group
      position={position}
      ref={(el) => {
        if (el) el.userData.radius = WHEEL_R;
        setRef(el);
      }}
    >
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[WHEEL_R - 0.05, 0.06, 6, 24]} />
        <meshStandardMaterial color="#3a2616" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[WHEEL_R - 0.01, 0.025, 4, 24]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.5} />
      </mesh>
      {spokes.map((a) => (
        <mesh key={a} rotation={[a, 0, 0]}>
          <boxGeometry args={[0.05, (WHEEL_R - 0.05) * 2, 0.05]} />
          <meshStandardMaterial color="#5a3d26" roughness={0.9} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 10]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Shared chassis: shafts, bed, sides, wheels on one axle
function Chassis({ wheels, wood = '#7a5434', dark = '#4a3220' }) {
  const setWheel = (i) => (el) => {
    if (wheels) wheels.current[i] = el;
  };
  return (
    <>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 1.12, -1.05]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 1.95, 6]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      ))}
      <mesh position={[0, 0.98, 1.2]}>
        <boxGeometry args={[1.72, 0.14, 2.5]} />
        <meshStandardMaterial color={wood} roughness={0.95} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 1.28, 1.2]}>
          <boxGeometry args={[0.08, 0.48, 2.5]} />
          <meshStandardMaterial color={wood} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 1.28, -0.03]}>
        <boxGeometry args={[1.72, 0.48, 0.08]} />
        <meshStandardMaterial color={dark} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.2, 2.43]}>
        <boxGeometry args={[1.72, 0.34, 0.08]} />
        <meshStandardMaterial color={dark} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.62, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 2.1, 6]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <Wheel position={[-1.0, WHEEL_R, 1.3]} setRef={setWheel(0)} />
      <Wheel position={[1.0, WHEEL_R, 1.3]} setRef={setWheel(1)} />
    </>
  );
}

// Hooded driver on the bench, with a sword slung across the back
function Driver({ cloak = '#2c2b31', skin = '#c9a27e', sword = true }) {
  return (
    <group position={[0, 0, 0.32]}>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[1.3, 0.1, 0.45]} />
        <meshStandardMaterial color="#4a3220" />
      </mesh>
      <mesh position={[0, 2.02, 0.02]} scale={[1, 1, 0.8]}>
        <capsuleGeometry args={[0.24, 0.42, 4, 10]} />
        <meshStandardMaterial color={cloak} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, 0.02]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={cloak} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.47, -0.1]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      {/* Reins out to the horse */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x * 1.6, 1.98, -1.05]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 2.2, 3]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
      ))}
      {sword && (
        <group position={[0, 2.15, 0.26]} rotation={[0, 0, 0.55]}>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.06, 1.0, 0.03]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[0.24, 0.05, 0.05]} />
            <meshStandardMaterial color="#3a2a1c" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.2, 5]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Shadow({ map }) {
  if (!map) return null;
  return (
    <mesh position={[0, 0.03, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.9, 6.2]} />
      <meshBasicMaterial map={map} color="#000000" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

// The player's ride: chestnut horse, open cart with crates and a barrel, a hanging lantern lighting the road
export function PlayerCart({ shadow, wheels }) {
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, 0, -22);
    return o;
  }, []);
  return (
    <group>
      <Shadow map={shadow} />
      <Horse coat="#6b3f22" mane="#2a1a10" />
      <Chassis wheels={wheels} />
      <Driver />
      <mesh position={[-0.35, 1.37, 1.45]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#8a6a42" roughness={0.95} />
      </mesh>
      <mesh position={[0.4, 1.32, 1.95]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7a5a36" roughness={0.95} />
      </mesh>
      <mesh position={[0.35, 1.43, 1.05]}>
        <cylinderGeometry args={[0.27, 0.27, 0.75, 12]} />
        <meshStandardMaterial color="#6a4628" roughness={0.9} />
      </mesh>
      <mesh position={[-0.8, 1.95, -0.05]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 5]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      <mesh position={[-0.8, 2.48, -0.18]}>
        <boxGeometry args={[0.16, 0.22, 0.16]} />
        <meshBasicMaterial color={[3, 1.6, 0.5]} toneMapped={false} />
      </mesh>
      <primitive object={target} />
      <spotLight position={[-0.6, 2.4, -0.4]} target={target} color="#ffc27a" intensity={14} angle={0.6} penumbra={0.8} distance={34} decay={1.4} />
    </group>
  );
}

// Traffic: covered merchant wagons with different horses and canvas
export function Wagon({ coat, mane, socks, canvas, wheels }) {
  return (
    <group>
      <Horse coat={coat} mane={mane} socks={socks} />
      <Chassis wheels={wheels} wood="#6e4c30" />
      <Driver cloak="#4a3a2c" sword={false} />
      <mesh position={[0, 1.38, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 2.2, 14, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={canvas} roughness={1} side={DoubleSide} />
      </mesh>
      {[0.3, 1.3, 2.3].map((z) => (
        <mesh key={z} position={[0, 1.38, z]}>
          <torusGeometry args={[0.91, 0.03, 4, 16, Math.PI]} />
          <meshStandardMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}
