import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BoxGeometry, DoubleSide, RepeatWrapping } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TERMINI } from '../../city/generate.js';
import { makeSignTexture } from '../textures.js';
import { makeCobbleTexture, makeStoneTexture } from './medievalTextures.js';
import { makeHoloSign } from './spaceTextures.js';
import { TrafficShip } from './Dropship.jsx';

// Landmarks that finish the two ends of the route. Each sits on a plaza where the road ends; in local space
// the road arrives from -z and the main structure stands on the far side (+z), facing the road.

function Place({ at, children }) {
  return (
    <group position={[at.x, 0, at.y]} rotation={[0, at.rot, 0]}>
      {children}
    </group>
  );
}

// A canvas texture painted once its web fonts are ready
export function useSignTexture(paint, fonts, title, sub) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let live = true;
    let made = null;
    Promise.all(fonts.map((f) => document.fonts.load(f)))
      .catch(() => {})
      .then(() => {
        if (!live) return;
        made = paint(title, sub);
        setTex(made);
      });
    return () => {
      live = false;
      made?.dispose();
    };
    // fonts is a constant list per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paint, title, sub]);
  return tex;
}

function Plaza({ radius, color, children, map }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color={color} map={map ?? null} roughness={0.9} />
      </mesh>
      {children}
    </>
  );
}

function Ring({ r0, r1, color, y = 0.09 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <ringGeometry args={[r0, r1, 72]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function Sign({ texture, width, height, position, brightness = 1.4 }) {
  if (!texture) return null;
  return (
    // Planes face +z; turn the sign to face back down the road (-z)
    <mesh position={position} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} color={[brightness, brightness, brightness]} toneMapped={false} side={DoubleSide} />
    </mesh>
  );
}

/* ---------------- Neon Bay ---------------- */

function Palm({ position, height = 10, lean = 0.08 }) {
  const crown = useMemo(
    () =>
      mergeGeometries(
        Array.from({ length: 8 }, (_, k) =>
          new BoxGeometry(0.9, 0.08, 4.4)
            .translate(0, 0, 2.1)
            .rotateX(0.5)
            .rotateY((k / 8) * Math.PI * 2),
        ),
      ),
    [],
  );
  return (
    <group position={position} rotation={[lean, 0, lean * 0.6]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.36, height, 6]} />
        <meshStandardMaterial color="#7a5238" roughness={1} />
      </mesh>
      <mesh geometry={crown} position={[0, height, 0]}>
        <meshStandardMaterial color="#2f7a52" roughness={0.85} emissive="#0c2a1c" />
      </mesh>
    </group>
  );
}

const VICE_FONTS = ['150px Yellowtail', '62px Anton'];

function ViceStart() {
  const sign = useSignTexture(makeSignTexture, VICE_FONTS, 'Neon Bay', 'Welcome to the sunshine coast');
  return (
    <Place at={TERMINI.start}>
      <Plaza radius={TERMINI.start.radius} color="#2a1d3e">
        <Ring r0={16.3} r1={17} color={[3, 0.4, 1.6]} />
        <Ring r0={9.6} r1={10} color={[0.4, 2, 2.6]} />
      </Plaza>
      {/* Neon gateway arch */}
      {[-7, 7].map((x) => (
        <group key={x} position={[x, 0, 9]}>
          <mesh position={[0, 4.6, 0]}>
            <boxGeometry args={[1.3, 9.2, 1.3]} />
            <meshStandardMaterial color="#2a2038" />
          </mesh>
          <mesh position={[0, 4.6, -0.7]}>
            <boxGeometry args={[0.16, 8.6, 0.16]} />
            <meshBasicMaterial color={[0.4, 2.2, 2.8]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 9.6, 9]}>
        <boxGeometry args={[16.4, 1.2, 1.4]} />
        <meshStandardMaterial color="#2a2038" />
      </mesh>
      <mesh position={[0, 9.0, 8.25]}>
        <boxGeometry args={[15.6, 0.16, 0.16]} />
        <meshBasicMaterial color={[3, 0.4, 1.6]} toneMapped={false} />
      </mesh>
      <Sign texture={sign} width={14} height={5.25} position={[0, 13, 9]} />
      <Palm position={[-12, 0, 4]} height={11} lean={-0.1} />
      <Palm position={[12, 0, 4]} height={10} lean={0.1} />
      <Palm position={[-11, 0, -7]} height={9} lean={0.06} />
      <Palm position={[11, 0, -7]} height={12} lean={-0.06} />
    </Place>
  );
}

function ViceEnd() {
  const sign = useSignTexture(makeSignTexture, VICE_FONTS, 'Contact', "Let's connect");
  return (
    <Place at={TERMINI.end}>
      <Plaza radius={TERMINI.end.radius} color="#2a1d3e">
        <Ring r0={17.3} r1={18} color={[0.4, 2, 2.6]} />
      </Plaza>
      {/* Pastel art-deco beach club with neon trim */}
      <group position={[0, 0, 15]}>
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[24, 8, 10]} />
          <meshStandardMaterial color="#e6a2cc" roughness={0.7} />
        </mesh>
        <mesh position={[0, 8.6, 0]}>
          <boxGeometry args={[25, 1.2, 11]} />
          <meshStandardMaterial color="#f6eaff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 6, -5]}>
          <cylinderGeometry args={[3.4, 3.4, 12, 24]} />
          <meshStandardMaterial color="#f6eaff" roughness={0.6} />
        </mesh>
        {[3, 6, 9].map((y) => (
          <mesh key={y} position={[0, y, -5]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.45, 0.09, 6, 40]} />
            <meshBasicMaterial color={[0.4, 2.2, 2.8]} toneMapped={false} />
          </mesh>
        ))}
        {[0.6, 7.95].map((y) => (
          <mesh key={y} position={[0, y, -5.08]}>
            <boxGeometry args={[24, 0.18, 0.18]} />
            <meshBasicMaterial color={[3, 0.4, 1.6]} toneMapped={false} />
          </mesh>
        ))}
        {[-8, -4.5, 4.5, 8].map((x) => (
          <mesh key={x} position={[x, 4.2, -5.06]}>
            <boxGeometry args={[2.2, 3.4, 0.1]} />
            <meshBasicMaterial color={[2.4, 1.8, 1.0]} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 1.6, -5.4]}>
          <boxGeometry args={[3, 3.2, 0.3]} />
          <meshBasicMaterial color={[0.12, 0.05, 0.18]} />
        </mesh>
        <Sign texture={sign} width={13} height={4.9} position={[0, 15.2, -1]} />
      </group>
      <Palm position={[-15, 0, 6]} height={12} lean={-0.08} />
      <Palm position={[15, 0, 6]} height={11} lean={0.1} />
      <Palm position={[-14, 0, -6]} height={9} lean={0.05} />
      <Palm position={[14, 0, -6]} height={10} lean={-0.05} />
    </Place>
  );
}

export function ViceTermini() {
  return (
    <>
      <ViceStart />
      <ViceEnd />
    </>
  );
}

/* ---------------- Medieval ---------------- */

function useStone(repeat = [1, 1]) {
  return useMemo(() => {
    const t = makeStoneTexture();
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useCobblePlaza() {
  return useMemo(() => {
    const t = makeCobbleTexture();
    t.repeat.set(5, 5);
    return t;
  }, []);
}

function Banner({ position, color = '#8a1c14' }) {
  const cloth = useRef();
  useFrame(({ clock }) => {
    cloth.current.rotation.y = Math.sin(clock.elapsedTime * 1.3 + position[0]) * 0.12;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.12, 0.12]} />
        <meshStandardMaterial color="#3a2616" />
      </mesh>
      <group ref={cloth}>
        <mesh position={[0, -1.8, 0]}>
          <planeGeometry args={[1.5, 3.6]} />
          <meshStandardMaterial color={color} roughness={1} side={DoubleSide} />
        </mesh>
        <mesh position={[0, -1.4, -0.01]}>
          <planeGeometry args={[1.5, 0.22]} />
          <meshStandardMaterial color="#d9b46a" side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function Torch({ position }) {
  const flame = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[0];
    const f = 0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 17) * 0.06;
    flame.current.color.setRGB(3.4 * f, 1.6 * f, 0.4 * f);
  });
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.12, 1, 6]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.2, 0.55, 6]} />
        <meshBasicMaterial ref={flame} color={[3.4, 1.6, 0.4]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Turret({ position, radius = 2.6, height = 11, stone }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.08, height, 12]} />
        <meshStandardMaterial map={stone} roughness={1} />
      </mesh>
      <mesh position={[0, height + 2.2, 0]}>
        <coneGeometry args={[radius * 1.25, 4.4, 12]} />
        <meshStandardMaterial color="#3d4048" roughness={0.8} />
      </mesh>
    </group>
  );
}

function MedievalStart() {
  const stone = useStone([2, 2]);
  const cobble = useCobblePlaza();
  return (
    <Place at={TERMINI.start}>
      <Plaza radius={TERMINI.start.radius} color="#ece6da" map={cobble} />
      {/* Town gate: twin towers, a wall with an open archway, gates swung back */}
      <Turret position={[-7.2, 0, 9]} stone={stone} />
      <Turret position={[7.2, 0, 9]} stone={stone} />
      {[-3.6, 3.6].map((x) => (
        <mesh key={x} position={[x, 4, 9]}>
          <boxGeometry args={[2, 8, 2.4]} />
          <meshStandardMaterial map={stone} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 7.1, 9]}>
        <boxGeometry args={[9.4, 2.2, 2.4]} />
        <meshStandardMaterial map={stone} roughness={1} />
      </mesh>
      {[-3.5, -1.2, 1.2, 3.5].map((x) => (
        <mesh key={x} position={[x, 8.6, 9]}>
          <boxGeometry args={[1, 0.9, 2.4]} />
          <meshStandardMaterial map={stone} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 2.9, 2.9, 7.4]} rotation={[0, side * 1.1, 0]}>
          <boxGeometry args={[2.6, 5.6, 0.22]} />
          <meshStandardMaterial color="#5a3d26" roughness={1} />
        </mesh>
      ))}
      <Banner position={[-7.2, 9.6, 6.3]} />
      <Banner position={[7.2, 9.6, 6.3]} />
      <Torch position={[-4.8, 4.2, 7.6]} />
      <Torch position={[4.8, 4.2, 7.6]} />
    </Place>
  );
}

function MedievalEnd() {
  const stone = useStone([3, 3]);
  const cobble = useCobblePlaza();
  const flag = useRef();
  useFrame(({ clock }) => {
    flag.current.rotation.y = Math.sin(clock.elapsedTime * 1.6) * 0.18;
  });
  return (
    <Place at={TERMINI.end}>
      <Plaza radius={TERMINI.end.radius} color="#ece6da" map={cobble} />
      {/* Castle keep with corner turrets, lit windows and a banner on the roof */}
      <group position={[0, 0, 15]}>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[13, 16, 12]} />
          <meshStandardMaterial map={stone} roughness={1} />
        </mesh>
        {[-5, -2.5, 0, 2.5, 5].map((x) => (
          <mesh key={x} position={[x, 16.6, -5.6]}>
            <boxGeometry args={[1.3, 1.2, 0.9]} />
            <meshStandardMaterial map={stone} roughness={1} />
          </mesh>
        ))}
        {[
          [-6.5, -6],
          [6.5, -6],
          [-6.5, 6],
          [6.5, 6],
        ].map(([x, z]) => (
          <Turret key={`${x}${z}`} position={[x, 0, z]} radius={2} height={19} stone={stone} />
        ))}
        <mesh position={[0, 2.6, -6.05]}>
          <boxGeometry args={[3.4, 5.2, 0.2]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
        {[
          [-3, 9],
          [3, 9],
          [0, 12.5],
          [-3, 5.8],
          [3, 5.8],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, -6.06]}>
            <boxGeometry args={[0.9, 1.6, 0.1]} />
            <meshBasicMaterial color={[2.6, 1.5, 0.55]} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 21, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 6, 6]} />
          <meshStandardMaterial color="#3a2616" />
        </mesh>
        <group ref={flag} position={[0, 23.2, 0]}>
          <mesh position={[1.6, 0, 0]}>
            <planeGeometry args={[3.2, 1.9]} />
            <meshStandardMaterial color="#8a1c14" side={DoubleSide} />
          </mesh>
        </group>
        <Banner position={[-3.4, 13.8, -6.2]} />
        <Banner position={[3.4, 13.8, -6.2]} />
        <Torch position={[-2.6, 3.4, -6.4]} />
        <Torch position={[2.6, 3.4, -6.4]} />
      </group>
    </Place>
  );
}

export function MedievalTermini() {
  return (
    <>
      <MedievalStart />
      <MedievalEnd />
    </>
  );
}

/* ---------------- Galactic ---------------- */

const SPACE_FONTS = ['120px "Saira Stencil One"', '600 56px "Chakra Petch"'];

function LandingPad({ radius }) {
  const lights = useMemo(() => Array.from({ length: 12 }, (_, k) => (k / 12) * Math.PI * 2), []);
  const blink = useRef();
  useFrame(({ clock }) => {
    blink.current.visible = Math.sin(clock.elapsedTime * 3) > -0.3;
  });
  return (
    <Plaza radius={radius} color="#3a3f4a">
      <Ring r0={radius - 1.6} r1={radius - 0.6} color={[2.4, 1.9, 0.05]} />
      <Ring r0={radius * 0.45} r1={radius * 0.45 + 0.5} color={[0.5, 1.4, 3.2]} />
      <group ref={blink}>
        {lights.map((a) => (
          <mesh key={a} position={[Math.cos(a) * (radius - 2.6), 0.18, Math.sin(a) * (radius - 2.6)]}>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshBasicMaterial color={[0.6, 1.6, 4]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </Plaza>
  );
}

function SpaceStart() {
  return (
    <Place at={TERMINI.start}>
      <LandingPad radius={TERMINI.start.radius} />
      {/* Hangar: an arched shed open toward the road, a ship parked inside */}
      <group position={[0, 0, 12]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[8.5, 8.5, 14, 28, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#4a505c" metalness={0.5} roughness={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 7]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[8.5, 28, 0, Math.PI]} />
          <meshStandardMaterial color="#2a2e36" side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -7]}>
          <torusGeometry args={[8.5, 0.28, 8, 40, Math.PI]} />
          <meshBasicMaterial color={[0.5, 1.5, 3.4]} toneMapped={false} />
        </mesh>
        <mesh position={[0, 5.5, 6.9]}>
          <planeGeometry args={[6, 1]} />
          <meshBasicMaterial color={[2.4, 1.9, 0.1]} toneMapped={false} side={DoubleSide} />
        </mesh>
        <group position={[0, -0.6, 1.5]} rotation={[0, Math.PI, 0]}>
          <TrafficShip hull="#8a8f99" accent="#ffd100" thruster={[0.6, 1.6, 4]} cockpit="#1a3a6a" />
        </group>
      </group>
    </Place>
  );
}

function BeaconBeam() {
  const beam = useRef();
  const lamp = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    beam.current.material.opacity = 0.32 + Math.sin(t * 2) * 0.08;
    lamp.current.rotation.y = t * 1.4;
  });
  return (
    <>
      <mesh ref={beam} position={[0, 140, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 280, 16, 1, true]} />
        <meshBasicMaterial color={[0.5, 1.4, 3.6]} transparent opacity={0.32} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <group ref={lamp} position={[0, 24.5, 0]}>
        <mesh>
          <sphereGeometry args={[1.1, 16, 12]} />
          <meshBasicMaterial color={[1, 2.4, 5]} toneMapped={false} />
        </mesh>
        <mesh position={[4, -0.4, 0]} rotation={[0, 0, Math.PI / 2 + 0.25]}>
          <coneGeometry args={[1.6, 8, 16, 1, true]} />
          <meshBasicMaterial color={[0.6, 1.4, 3]} transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

function SpaceEnd() {
  const sign = useSignTexture(makeHoloSign, SPACE_FONTS, 'Extraction', 'Request evac · Contact');
  return (
    <Place at={TERMINI.end}>
      <LandingPad radius={TERMINI.end.radius} />
      {/* Extraction beacon: a braced mast with a sweeping lamp and a beam into the sky */}
      <group position={[0, 0, 14]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[3.2, 4, 2, 8]} />
          <meshStandardMaterial color="#2c3038" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 12.5, 0]}>
          <cylinderGeometry args={[0.7, 1.2, 23, 8]} />
          <meshStandardMaterial color="#5a616e" metalness={0.55} roughness={0.45} />
        </mesh>
        {[6, 12, 18].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.14, 6, 24]} />
            <meshBasicMaterial color={[2.4, 1.9, 0.1]} toneMapped={false} />
          </mesh>
        ))}
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[Math.cos((k * Math.PI * 2) / 3) * 2.4, 6, Math.sin((k * Math.PI * 2) / 3) * 2.4]} rotation={[0, -(k * Math.PI * 2) / 3, 0.22]}>
            <boxGeometry args={[0.25, 12, 0.25]} />
            <meshStandardMaterial color="#3a3f4a" />
          </mesh>
        ))}
        <BeaconBeam />
      </group>
      <group position={[-12, 0, 6]} rotation={[0, 0.5, 0]}>
        {[-4.2, 4.2].map((x) => (
          <mesh key={x} position={[x, 3, 0]}>
            <boxGeometry args={[0.3, 6, 0.3]} />
            <meshStandardMaterial color="#2a2e38" />
          </mesh>
        ))}
        <Sign texture={sign} width={10} height={3.75} position={[0, 7.4, 0]} brightness={1.35} />
      </group>
    </Place>
  );
}

export function SpaceTermini() {
  return (
    <>
      <SpaceStart />
      <SpaceEnd />
    </>
  );
}
