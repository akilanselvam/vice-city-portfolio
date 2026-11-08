import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide } from 'three';
import { PITSTOPS } from '../../city/generate.js';
import { makeSignTexture } from '../textures.js';
import { makeNoticeTexture } from './medievalTextures.js';
import { makeHoloSign } from './spaceTextures.js';
import { useSignTexture } from './Termini.jsx';
import { store } from '../store.js';
import { stops } from '../../data/portfolio.js';

// A themed pit-stop cart beside each section: a stall, a character at work and props that say what the
// section is. Local space: the road is toward -z, the cart's counter faces it.

const LOOKS = {
  vice: {
    paint: makeSignTexture,
    fonts: ['150px Yellowtail', '62px Anton'],
    signBright: 1.4,
    body: { home: '#f4a6cf', about: '#9be7f2', skills: '#ffd79a', projects: '#c9a6ff', experience: '#a6f2c4', contact: '#ffb3a1', freeroam: '#ffe08a' },
    trim: '#2a2038',
    counter: '#3a2a52',
    awning: ['#ff4fa8', '#fff1f8'],
    wheels: '#1a1420',
    metal: '#c8ccd4',
    accent: [3, 0.4, 1.6],
    goods: ['#ff4fa8', '#2de2ff', '#ffd36b', '#7dff7a', '#c87aff'],
    pad: '#4a3560',
    person: { skin: '#c99a78', pants: '#2a2a3a', hair: '#2a1a10', extra: 'shades' },
    shirts: { home: '#ff6fb5', about: '#2de2ff', skills: '#ffd36b', projects: '#7dff7a', experience: '#c87aff', contact: '#ff9a3d', freeroam: '#ff2d95' },
    names: {
      home: ['Welcome Kiosk', 'Start your engine'],
      about: ['Driver Profile', 'Who is behind the wheel'],
      skills: ['Skill Garage', 'Tools of the trade'],
      projects: ['Mission Board', 'Pick a job'],
      experience: ['Trophy Stand', 'Career wins'],
      contact: ['Payphone', 'Call me up'],
      freeroam: ['Driving School', 'Take the wheel'],
    },
  },
  medieval: {
    paint: makeNoticeTexture,
    fonts: ['700 118px Cinzel', 'italic 600 58px "Cormorant Garamond"'],
    signBright: 1.05,
    body: { home: '#8a5e3a', about: '#7a5434', skills: '#6e4a2e', projects: '#8a6040', experience: '#7a5434', contact: '#6e4a2e', freeroam: '#8a6040' },
    trim: '#3a2616',
    counter: '#5a3d26',
    awning: ['#8a2a1e', '#e8d8b0'],
    wheels: '#3a2616',
    metal: '#8a8f99',
    accent: [3.2, 1.5, 0.45],
    goods: ['#8a6a42', '#5a7a3a', '#7a3a2a', '#d9c49a', '#4a5a7a'],
    pad: '#8f8678',
    person: { skin: '#c9a27e', pants: '#3a2c20', hair: '#3a2414', extra: 'hood' },
    shirts: { home: '#5a6a3a', about: '#4a5a7a', skills: '#5a3a2a', projects: '#6a4a2a', experience: '#7a1d14', contact: '#3a4a5a', freeroam: '#2a4a2a' },
    names: {
      home: ['Waystation', 'Rest a while, traveller'],
      about: ["Traveller's Tale", 'Who rides this road'],
      skills: ['Smithy', 'Steel & alchemy'],
      projects: ['Notice Board', 'Contracts posted'],
      experience: ['Hall of Deeds', 'Honours earned'],
      contact: ['Raven Post', 'Send word'],
      freeroam: ['Stables', 'Take the reins'],
    },
  },
  space: {
    paint: makeHoloSign,
    fonts: ['120px "Saira Stencil One"', '600 56px "Chakra Petch"'],
    signBright: 1.35,
    body: { home: '#5a616e', about: '#4e5664', skills: '#5a616e', projects: '#4e5664', experience: '#5a616e', contact: '#4e5664', freeroam: '#5a616e' },
    trim: '#2a2e38',
    counter: '#3a3f4a',
    awning: null,
    wheels: null,
    metal: '#9aa2ae',
    accent: [2.4, 1.9, 0.1],
    goods: ['#ffd100', '#4da3ff', '#9aa2ae', '#ff4a3a', '#5a6a4a'],
    pad: '#3a3f4a',
    person: { skin: '#c9a27e', pants: '#3a3f4a', hair: '#1a1a1a', extra: 'helmet' },
    shirts: { home: '#6b7280', about: '#5a6470', skills: '#6b7280', projects: '#5a6470', experience: '#6b7280', contact: '#5a6470', freeroam: '#7a6a2a' },
    names: {
      home: ['Supply Drop', 'Gear up, diver'],
      about: ['Personnel File', 'Service record'],
      skills: ['Armory', 'Loadout bench'],
      projects: ['Mission Terminal', 'Active contracts'],
      experience: ['Medal Rack', 'Decorations'],
      contact: ['Comms Relay', 'Open a channel'],
      freeroam: ['Flight School', 'Take the controls'],
    },
  },
};

const Std = ({ color, metal = 0.1, rough = 0.75, emissive, ei = 0 }) => (
  <meshStandardMaterial color={color} metalness={metal} roughness={rough} emissive={emissive ?? '#000000'} emissiveIntensity={ei} />
);
const Glow = ({ color }) => <meshBasicMaterial color={color} toneMapped={false} />;

/* ---------- The stall ---------- */

function Awning({ colors }) {
  const stripes = 8;
  return (
    <group position={[0, 4.75, -0.1]} rotation={[-0.22, 0, 0]}>
      {Array.from({ length: stripes }, (_, k) => (
        <mesh key={k} position={[-3.15 + 0.4 + k * 0.8, 0, 0]}>
          <boxGeometry args={[0.8, 0.06, 3.9]} />
          <Std color={colors[k % 2]} rough={0.95} />
        </mesh>
      ))}
      {/* scalloped valance along the front */}
      {Array.from({ length: stripes }, (_, k) => (
        <mesh key={`v${k}`} position={[-3.15 + 0.4 + k * 0.8, -0.25, -1.95]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <Std color={colors[k % 2]} rough={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Stall({ look, color, sign, theme }) {
  return (
    <group>
      <mesh position={[0, 0.95, 0.1]}>
        <boxGeometry args={[6, 1.3, 3.0]} />
        <Std color={color} rough={0.6} />
      </mesh>
      <mesh position={[0, 1.66, -0.15]}>
        <boxGeometry args={[6.4, 0.16, 3.5]} />
        <Std color={look.counter} />
      </mesh>
      <mesh position={[0, 3.15, 1.5]}>
        <boxGeometry args={[6, 2.9, 0.2]} />
        <Std color={color} rough={0.7} />
      </mesh>
      {[-3.05, 3.05].map((x) => (
        <mesh key={x} position={[x, 3.15, -1.75]}>
          <boxGeometry args={[0.18, 2.95, 0.18]} />
          <Std color={look.trim} />
        </mesh>
      ))}
      {look.awning ? (
        <Awning colors={look.awning} />
      ) : (
        <>
          <mesh position={[0, 4.72, -0.1]}>
            <boxGeometry args={[6.6, 0.28, 3.9]} />
            <Std color={look.trim} metal={0.5} rough={0.5} />
          </mesh>
          <mesh position={[0, 4.55, -2.06]}>
            <boxGeometry args={[6.6, 0.12, 0.06]} />
            <Glow color={look.accent} />
          </mesh>
        </>
      )}
      {theme === 'vice' && (
        <mesh position={[0, 1.66, -1.92]}>
          <boxGeometry args={[6.3, 0.07, 0.07]} />
          <Glow color={look.accent} />
        </mesh>
      )}
      {sign && (
        <mesh position={[0, 6.05, 0.4]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[5.4, 2.03]} />
          <meshBasicMaterial map={sign} color={[look.signBright, look.signBright, look.signBright]} toneMapped={false} side={DoubleSide} />
        </mesh>
      )}
      {look.wheels ? (
        [-2.2, 2.2].flatMap((x) =>
          [-1.62, 1.82].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.55, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.22, 16]} />
              <Std color={look.wheels} rough={0.9} />
            </mesh>
          )),
        )
      ) : (
        [-2, 2].map((x) => (
          <mesh key={x} position={[x, 0.18, 0.1]}>
            <boxGeometry args={[1.4, 0.12, 2.4]} />
            <Glow color={[0.5, 1.4, 3.4]} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ---------- A character ---------- */

function Person({ look, shirt, position, rotation = 0, pose = 'idle', walking, children }) {
  const body = useRef();
  const arm = useRef();
  const legs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[0] * 0.7;
    const a = arm.current;
    if (walking?.current) {
      // Stride: legs swing in opposite phase, the arm swings, the body bobs with each step
      const sw = Math.sin(t * 8);
      legs.current.forEach((l, i) => l && (l.rotation.x = sw * 0.55 * (i ? 1 : -1)));
      a.rotation.set(-sw * 0.5, 0, 0.1);
      body.current.position.y = Math.abs(sw) * 0.06;
      return;
    }
    legs.current.forEach((l) => l && (l.rotation.x = 0));
    body.current.position.y = Math.sin(t * 2) * 0.03;
    if (pose === 'explain') a.rotation.set(-1.0 + Math.sin(t * 2.6) * 0.3, 0, -0.35 + Math.sin(t * 1.3) * 0.15);
    else if (pose === 'wave') a.rotation.set(0, 0, 2.5 + Math.sin(t * 6) * 0.35);
    else if (pose === 'work') a.rotation.set(-1.1 - Math.abs(Math.sin(t * 4)) * 0.9, 0, 0.15);
    else if (pose === 'point') a.rotation.set(-1.45 + Math.sin(t * 1.5) * 0.08, 0, -0.5);
    else if (pose === 'talk') a.rotation.set(-0.3, 0, 2.6);
    else if (pose === 'cheer') a.rotation.set(0, 0, 2.8 + Math.sin(t * 3) * 0.2);
    else a.rotation.set(-0.5 + Math.sin(t * 1.2) * 0.06, 0, 0.1);
  });
  const p = look.person;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group ref={body}>
        {[-0.17, 0.17].map((x, i) => (
          <group
            key={x}
            position={[x, 0.92, 0]}
            ref={(el) => {
              legs.current[i] = el;
            }}
          >
            <mesh position={[0, -0.46, 0]}>
              <boxGeometry args={[0.28, 0.92, 0.3]} />
              <Std color={p.pants} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.36, 0]}>
          <boxGeometry args={[0.78, 0.9, 0.42]} />
          <Std color={shirt} metal={p.extra === 'helmet' ? 0.5 : 0.05} rough={0.7} />
        </mesh>
        <mesh position={[-0.5, 1.4, 0]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.2, 0.78, 0.22]} />
          <Std color={shirt} />
        </mesh>
        <group ref={arm} position={[0.5, 1.76, 0]}>
          <mesh position={[0, -0.37, 0]}>
            <boxGeometry args={[0.2, 0.78, 0.22]} />
            <Std color={shirt} />
          </mesh>
          <group position={[0, -0.8, 0]}>{children}</group>
        </group>
        <mesh position={[0, 2.03, 0]}>
          <sphereGeometry args={[0.25, 14, 10]} />
          <Std color={p.skin} />
        </mesh>
        {p.extra === 'shades' && (
          <>
            <mesh position={[0, 2.22, 0.02]}>
              <sphereGeometry args={[0.26, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
              <Std color={p.hair} />
            </mesh>
            <mesh position={[0, 2.06, -0.23]}>
              <boxGeometry args={[0.36, 0.08, 0.04]} />
              <Std color="#050505" metal={0.6} rough={0.2} />
            </mesh>
          </>
        )}
        {p.extra === 'hood' && (
          <mesh position={[0, 2.12, 0.06]} scale={[1, 1.1, 1]}>
            <sphereGeometry args={[0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <Std color={shirt} rough={1} />
          </mesh>
        )}
        {p.extra === 'helmet' && (
          <>
            <mesh position={[0, 2.06, 0]}>
              <sphereGeometry args={[0.32, 16, 12]} />
              <Std color="#4a505c" metal={0.6} rough={0.4} />
            </mesh>
            <mesh position={[0, 2.06, -0.26]}>
              <boxGeometry args={[0.42, 0.14, 0.08]} />
              <Glow color={[0.5, 1.4, 3.4]} />
            </mesh>
            <mesh position={[0, 1.55, -0.22]}>
              <boxGeometry args={[0.5, 0.12, 0.02]} />
              <Std color="#ffd100" emissive="#ffd100" ei={0.3} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

/* ---------- Hand-held items ---------- */

const Wrench = ({ look }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh position={[0, -0.3, 0]}>
      <boxGeometry args={[0.07, 0.6, 0.05]} />
      <Std color={look.metal} metal={0.9} rough={0.3} />
    </mesh>
    <mesh position={[0, -0.64, 0]}>
      <torusGeometry args={[0.1, 0.035, 6, 12, Math.PI * 1.5]} />
      <Std color={look.metal} metal={0.9} rough={0.3} />
    </mesh>
  </group>
);
const Hammer = ({ look }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh position={[0, -0.3, 0]}>
      <boxGeometry args={[0.06, 0.65, 0.06]} />
      <Std color="#5a3d26" />
    </mesh>
    <mesh position={[0, -0.64, 0]}>
      <boxGeometry args={[0.32, 0.14, 0.14]} />
      <Std color={look.metal} metal={0.8} rough={0.35} />
    </mesh>
  </group>
);
const Clipboard = () => (
  <mesh position={[0, -0.05, -0.12]} rotation={[0.9, 0, 0]}>
    <boxGeometry args={[0.36, 0.48, 0.03]} />
    <Std color="#e8e0cc" />
  </mesh>
);
const Phone = ({ theme }) =>
  theme === 'medieval' ? (
    <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.07, 0.07, 0.42, 8]} />
      <Std color="#e8d8b0" />
    </mesh>
  ) : (
    <mesh position={[0, -0.02, 0]}>
      <boxGeometry args={[0.1, 0.36, 0.08]} />
      <Std color={theme === 'space' ? '#2a2e38' : '#1a1a1a'} />
    </mesh>
  );

/* ---------- What each section's stall shows ---------- */

function HomeProps({ theme }) {
  return (
    <>
      {theme === 'medieval' ? (
        <mesh position={[4.6, 0.75, -0.4]}>
          <cylinderGeometry args={[0.7, 0.75, 1.5, 14]} />
          <Std color="#6a4628" />
        </mesh>
      ) : (
        <mesh position={[4.6, 0.6, -0.4]}>
          <boxGeometry args={[1.4, 1.2, 1.0]} />
          <Std color={theme === 'space' ? '#4a5a3a' : '#2de2ff'} rough={0.5} />
        </mesh>
      )}
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, 1.92, -0.9]}>
          <cylinderGeometry args={[0.16, 0.13, 0.36, 10]} />
          <Std color={theme === 'medieval' ? '#8a6a42' : theme === 'space' ? '#9aa2ae' : '#ff4fa8'} />
        </mesh>
      ))}
    </>
  );
}

function AboutProps({ look, theme }) {
  return (
    <group position={[4.7, 0, -0.4]} rotation={[0, -0.35, 0]}>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.2]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.1, 2.2, 0.1]} />
          <Std color={look.trim} />
        </mesh>
      ))}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.7, 2.0, 0.12]} />
        <Std color={theme === 'medieval' ? '#d9c49a' : theme === 'space' ? '#0b1424' : '#fff1f8'} emissive={theme === 'space' ? '#1a3a6a' : undefined} ei={theme === 'space' ? 0.6 : 0} />
      </mesh>
      {/* a portrait silhouette */}
      <mesh position={[0, 2.35, -0.08]}>
        <sphereGeometry args={[0.3, 14, 10]} />
        <Std color={theme === 'space' ? '#4da3ff' : look.trim} emissive={theme === 'space' ? '#4da3ff' : undefined} ei={theme === 'space' ? 0.6 : 0} />
      </mesh>
      <mesh position={[0, 1.72, -0.08]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Std color={theme === 'space' ? '#4da3ff' : look.trim} emissive={theme === 'space' ? '#4da3ff' : undefined} ei={theme === 'space' ? 0.6 : 0} />
      </mesh>
    </group>
  );
}

function SkillsProps({ look, theme }) {
  return (
    <>
      {/* tools on the counter and a tool wall behind */}
      <mesh position={[-1.4, 1.98, -0.6]}>
        <boxGeometry args={[1.2, 0.5, 0.6]} />
        <Std color={theme === 'medieval' ? '#5a3d26' : theme === 'space' ? '#3a3f4a' : '#d8262e'} metal={0.3} />
      </mesh>
      <mesh position={[0.6, 1.79, -0.7]} rotation={[-Math.PI / 2, 0, 0.6]}>
        <boxGeometry args={[0.1, 0.9, 0.06]} />
        <Std color={look.metal} metal={0.9} rough={0.3} />
      </mesh>
      {[-2.2, -1.2, -0.2, 0.8, 1.8].map((x, k) => (
        <mesh key={x} position={[x, 3.3 + (k % 2) * 0.3, 1.36]}>
          <boxGeometry args={[0.12, 0.9 - (k % 3) * 0.2, 0.06]} />
          <Std color={look.metal} metal={0.9} rough={0.3} />
        </mesh>
      ))}
      {theme === 'medieval' && (
        <>
          {/* anvil and a glowing forge */}
          <group position={[4.5, 0, -0.3]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.5, 0.7, 0.5]} />
              <Std color="#3a3a3e" metal={0.6} rough={0.5} />
            </mesh>
            <mesh position={[0, 0.82, 0]}>
              <boxGeometry args={[1.2, 0.3, 0.5]} />
              <Std color="#4a4a50" metal={0.7} rough={0.4} />
            </mesh>
          </group>
          <mesh position={[4.6, 0.6, 1.4]}>
            <boxGeometry args={[1.3, 1.2, 1.1]} />
            <Std color="#5c5751" />
          </mesh>
          <mesh position={[4.6, 1.22, 1.4]}>
            <boxGeometry args={[0.9, 0.06, 0.7]} />
            <Glow color={[3.4, 1.2, 0.2]} />
          </mesh>
        </>
      )}
      {theme === 'space' && (
        <group position={[4.6, 0, 0]}>
          <mesh position={[0, 1.4, 0.4]}>
            <boxGeometry args={[1.6, 2.8, 0.3]} />
            <Std color="#2c3038" metal={0.5} />
          </mesh>
          {[-0.45, 0, 0.45].map((x) => (
            <mesh key={x} position={[x, 1.5, 0.2]}>
              <boxGeometry args={[0.16, 2.0, 0.14]} />
              <Std color="#9aa2ae" metal={0.8} rough={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 2.85, 0.2]}>
            <boxGeometry args={[1.6, 0.08, 0.1]} />
            <Glow color={[0.5, 1.4, 3.4]} />
          </mesh>
        </group>
      )}
      {theme === 'vice' && (
        <mesh position={[4.6, 0.55, -0.3]}>
          <boxGeometry args={[1.4, 1.1, 0.9]} />
          <Std color="#d8262e" metal={0.4} rough={0.5} />
        </mesh>
      )}
    </>
  );
}

function ProjectsProps({ look, theme }) {
  const cards = theme === 'medieval' ? ['#efe0bb', '#e8d8b0', '#f4e8c8'] : theme === 'space' ? ['#ffd100', '#4da3ff', '#cfe8ff'] : ['#ff4fa8', '#2de2ff', '#ffd36b'];
  return (
    <>
      <group position={[4.8, 0, 0]} rotation={[0, -0.3, 0]}>
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 1.4, 0.1]}>
            <boxGeometry args={[0.14, 2.8, 0.14]} />
            <Std color={look.trim} />
          </mesh>
        ))}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[3, 1.9, 0.12]} />
          <Std color={theme === 'space' ? '#0b1424' : theme === 'medieval' ? '#5a3d26' : '#3a2a52'} emissive={theme === 'space' ? '#0b2a4a' : undefined} ei={theme === 'space' ? 0.6 : 0} />
        </mesh>
        {Array.from({ length: 6 }, (_, k) => (
          <mesh key={k} position={[-0.95 + (k % 3) * 0.95, 2.6 - Math.floor(k / 3) * 0.85, -0.08]} rotation={[0, 0, (k % 2 ? 1 : -1) * 0.06]}>
            <planeGeometry args={[0.7, 0.62]} />
            <meshStandardMaterial color={cards[k % 3]} side={DoubleSide} emissive={theme === 'space' ? cards[k % 3] : '#000000'} emissiveIntensity={theme === 'space' ? 0.5 : 0} />
          </mesh>
        ))}
      </group>
      {[
        [-1.6, 1.98, -0.7, 0.5],
        [1.5, 1.98, -0.6, 0.6],
      ].map(([x, y, z, s]) => (
        <mesh key={x} position={[x, y, z]}>
          <boxGeometry args={[s, s, s]} />
          <Std color={theme === 'space' ? '#4a5a3a' : '#8a6a42'} />
        </mesh>
      ))}
    </>
  );
}

function ExperienceProps({ theme }) {
  if (theme === 'medieval') {
    return (
      <group position={[4.7, 0, 0]}>
        <mesh position={[0, 1.6, 0.5]}>
          <boxGeometry args={[2.2, 3.2, 0.2]} />
          <Std color="#5a3d26" />
        </mesh>
        {[
          [-0.55, 2.3, '#8a1c14'],
          [0.55, 2.3, '#2a4a7a'],
          [0, 1.25, '#d9b46a'],
        ].map(([x, y, c]) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.32]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.25, 1.2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 16]} />
            <Std color={c} metal={0.3} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 3.0, 0.3]} rotation={[0, 0, s * 0.7]}>
            <boxGeometry args={[0.08, 1.6, 0.05]} />
            <Std color="#c8ccd2" metal={0.8} rough={0.3} />
          </mesh>
        ))}
      </group>
    );
  }
  if (theme === 'space') {
    return (
      <group position={[4.7, 0, 0]}>
        <mesh position={[0, 1.6, 0.5]}>
          <boxGeometry args={[2.2, 3.2, 0.2]} />
          <Std color="#2c3038" metal={0.5} />
        </mesh>
        {[-0.6, 0, 0.6].map((x, k) => (
          <group key={x} position={[x, 2.2 - (k % 2) * 0.6, 0.35]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.2, 0.5, 0.03]} />
              <Std color={k === 1 ? '#4da3ff' : '#c8262e'} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 6]} />
              <Std color="#ffd100" metal={0.8} rough={0.3} emissive="#ffd100" ei={0.25} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  // Vice City: a three-step podium with gold trophies
  return (
    <group position={[4.7, 0, -0.2]}>
      {[
        [0, 1.2],
        [-0.85, 0.8],
        [0.85, 0.55],
      ].map(([x, h]) => (
        <group key={x}>
          <mesh position={[x, h / 2, 0]}>
            <boxGeometry args={[0.85, h, 0.85]} />
            <Std color="#fff1f8" />
          </mesh>
          <mesh position={[x, h + 0.35, 0]}>
            <cylinderGeometry args={[0.2, 0.08, 0.4, 12]} />
            <Std color="#ffd36b" metal={0.9} rough={0.25} />
          </mesh>
          <mesh position={[x, h + 0.08, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 0.12, 10]} />
            <Std color="#ffd36b" metal={0.9} rough={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ContactProps({ theme }) {
  const blink = useRef();
  useFrame(({ clock }) => {
    if (blink.current) blink.current.visible = Math.sin(clock.elapsedTime * 4) > 0;
  });
  if (theme === 'medieval') {
    return (
      <group position={[4.6, 0, -0.2]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 6]} />
          <Std color="#3a2616" />
        </mesh>
        <mesh position={[0, 2.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
          <Std color="#3a2616" />
        </mesh>
        {/* the raven */}
        <group position={[0.2, 2.62, 0]}>
          <mesh scale={[0.6, 0.55, 1]}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <Std color="#141216" rough={0.6} />
          </mesh>
          <mesh position={[0, 0.2, -0.18]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <Std color="#141216" rough={0.6} />
          </mesh>
          <mesh position={[0, 0.18, -0.36]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.04, 0.16, 6]} />
            <Std color="#3a3a3a" />
          </mesh>
          <mesh position={[0, -0.02, 0.32]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.18, 0.04, 0.3]} />
            <Std color="#141216" />
          </mesh>
        </group>
        <mesh position={[1.1, 0.7, 0.4]}>
          <boxGeometry args={[1.0, 1.4, 0.8]} />
          <Std color="#5a3d26" />
        </mesh>
        <mesh position={[1.1, 1.43, 0.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
          <Std color="#efe0bb" />
        </mesh>
      </group>
    );
  }
  if (theme === 'space') {
    return (
      <group position={[4.6, 0, 0]}>
        <mesh position={[0, 0.9, 0.3]}>
          <boxGeometry args={[1.2, 1.8, 0.8]} />
          <Std color="#3a3f4a" metal={0.5} />
        </mesh>
        <mesh position={[0, 1.35, -0.12]}>
          <boxGeometry args={[0.9, 0.5, 0.04]} />
          <Glow color={[0.5, 1.4, 3.4]} />
        </mesh>
        <mesh position={[0, 2.5, 0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
          <Std color="#9aa2ae" metal={0.8} />
        </mesh>
        <mesh position={[0, 3.3, 0.3]} rotation={[-0.7, 0, 0]}>
          <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, 0.9]} />
          <Std color="#c8ccd4" metal={0.6} rough={0.35} />
        </mesh>
        <mesh ref={blink} position={[0, 3.25, 0.05]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <Glow color={[4, 0.4, 0.3]} />
        </mesh>
      </group>
    );
  }
  // Vice City: a payphone on a post
  return (
    <group position={[4.6, 0, -0.2]}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.18, 1.6, 0.18]} />
        <Std color="#8a8f99" metal={0.6} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[0.8, 1.1, 0.45]} />
        <Std color="#2a6ad0" metal={0.4} rough={0.4} />
      </mesh>
      <mesh position={[0.22, 2.05, -0.25]}>
        <boxGeometry args={[0.14, 0.6, 0.1]} />
        <Std color="#111111" />
      </mesh>
      <mesh position={[-0.12, 2.15, -0.24]}>
        <boxGeometry args={[0.3, 0.38, 0.04]} />
        <Std color="#c8ccd4" metal={0.8} />
      </mesh>
      <mesh position={[0, 2.62, 0]}>
        <boxGeometry args={[0.86, 0.12, 0.5]} />
        <Glow color={[0.4, 2.2, 2.8]} />
      </mesh>
    </group>
  );
}

/* ---------- Set dressing every cart gets ---------- */

function Dressing({ look, theme }) {
  const lights = useRef();
  useFrame(({ clock }) => {
    if (theme === 'space' && lights.current) lights.current.visible = Math.sin(clock.elapsedTime * 3) > -0.3;
  });
  const g = look.goods;
  const shelfItems = Array.from({ length: 7 }, (_, k) => k);
  return (
    <>
      {/* paved pad joining the cart to the road, so there's no grass between */}
      <mesh position={[0, 0.035, -0.4]}>
        <boxGeometry args={[11, 0.07, 6.2]} />
        <Std color={look.pad} rough={0.95} />
      </mesh>
      {theme === 'space' && (
        <mesh position={[0, 0.075, -3.45]}>
          <boxGeometry args={[11, 0.02, 0.18]} />
          <Std color="#ffd100" emissive="#ffd100" ei={0.3} />
        </mesh>
      )}

      {/* stocked shelves on the back wall */}
      {[2.45, 3.35].map((y, row) => (
        <group key={y}>
          <mesh position={[0, y, 1.2]}>
            <boxGeometry args={[5.4, 0.08, 0.38]} />
            <Std color={look.trim} />
          </mesh>
          {shelfItems.map((k) => {
            const tall = (k + row) % 3 === 0;
            return (
              <mesh key={k} position={[-2.3 + k * 0.76, y + (tall ? 0.24 : 0.17), 1.18]}>
                {tall ? <cylinderGeometry args={[0.14, 0.14, 0.42, 10]} /> : <boxGeometry args={[0.38, 0.3, 0.26]} />}
                <Std color={g[(k + row * 2) % g.length]} rough={0.5} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* more on the counter */}
      {[-2.6, -0.6, 2.3].map((x, k) => (
        <mesh key={x} position={[x, 1.86, -1.1]}>
          {k === 1 ? <cylinderGeometry args={[0.18, 0.15, 0.32, 10]} /> : <boxGeometry args={[0.42, 0.32, 0.32]} />}
          <Std color={g[(k + 2) % g.length]} rough={0.5} />
        </mesh>
      ))}

      {/* lights under the roof */}
      {theme === 'vice' &&
        Array.from({ length: 11 }, (_, k) => (
          <mesh key={k} position={[-2.9 + k * 0.58, 4.32 - Math.sin((k / 10) * Math.PI) * 0.18, -1.95]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <Glow color={[[3, 0.4, 1.6], [0.4, 2.2, 2.8], [3, 2.4, 0.6]][k % 3]} />
          </mesh>
        ))}
      {theme === 'medieval' &&
        [-2.7, 2.7].map((x) => (
          <group key={x} position={[x, 3.85, -1.85]}>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
              <Std color="#2a1a10" />
            </mesh>
            <mesh>
              <boxGeometry args={[0.24, 0.32, 0.24]} />
              <Glow color={[3.2, 1.5, 0.45]} />
            </mesh>
            <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.22, 0.16, 4]} />
              <Std color="#2a2420" />
            </mesh>
          </group>
        ))}
      {theme === 'space' && (
        <group ref={lights}>
          {[-3.2, 3.2].map((x) => (
            <mesh key={x} position={[x, 4.95, -1.9]}>
              <sphereGeometry args={[0.13, 8, 6]} />
              <Glow color={[4, 0.4, 0.3]} />
            </mesh>
          ))}
        </group>
      )}

      {/* crates and barrels behind on the left */}
      <group position={[-3.9, 0, 1.6]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <Std color={theme === 'space' ? '#4a5a3a' : '#8a6a42'} />
        </mesh>
        <mesh position={[0.1, 1.25, 0.05]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <Std color={theme === 'space' ? '#5a616e' : '#7a5a36'} />
        </mesh>
        <mesh position={[-0.9, 0.55, 0.3]}>
          <cylinderGeometry args={[0.4, 0.42, 1.1, 12]} />
          <Std color={theme === 'space' ? '#9aa2ae' : theme === 'vice' ? '#2de2ff' : '#6a4628'} metal={theme === 'space' ? 0.6 : 0.1} />
        </mesh>
      </group>

      {/* a plant, sacks or canisters behind on the right */}
      <group position={[3.9, 0, 2.1]}>
        {theme === 'vice' && (
          <>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.35, 0.28, 0.7, 12]} />
              <Std color="#ffffff" />
            </mesh>
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} position={[0, 1.0, 0]} rotation={[0.6, (k * Math.PI * 2) / 5, 0]}>
                <boxGeometry args={[0.18, 0.9, 0.04]} />
                <Std color="#2f7a52" />
              </mesh>
            ))}
          </>
        )}
        {theme === 'medieval' &&
          [[0, 0.3, 0], [0.55, 0.28, 0.2], [0.25, 0.7, 0.1]].map(([x, y, z], k) => (
            <mesh key={k} position={[x, y, z]} scale={[1, 0.8, 1]}>
              <sphereGeometry args={[0.38, 10, 8]} />
              <Std color="#c9b48a" rough={1} />
            </mesh>
          ))}
        {theme === 'space' &&
          [0, 0.55, 1.1].map((x) => (
            <mesh key={x} position={[x - 0.5, 0.5, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 1.0, 10]} />
              <Std color="#ffd100" metal={0.4} rough={0.5} />
            </mesh>
          ))}
      </group>

      {/* a stool at the counter and an A-frame sign out front */}
      <group position={[1.0, 0, -2.35]}>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
          <Std color={theme === 'medieval' ? '#5a3d26' : g[0]} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.72, 6]} />
          <Std color={look.trim} />
        </mesh>
      </group>
      <group position={[-1.9, 0, -2.75]} rotation={[0, 0.25, 0]}>
        {[-1, 1].map((sgn) => (
          <mesh key={sgn} position={[0, 0.6, sgn * 0.17]} rotation={[sgn * 0.28, 0, 0]}>
            <boxGeometry args={[0.85, 1.2, 0.05]} />
            <Std color={theme === 'medieval' ? '#3a2616' : theme === 'space' ? '#2a2e38' : '#2a2038'} />
          </mesh>
        ))}
        <mesh position={[0, 0.65, -0.2]} rotation={[-0.28, 0, 0]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color={theme === 'medieval' ? '#d9c49a' : theme === 'space' ? '#0b1424' : '#ffd6f0'}
            emissive={theme === 'space' ? '#1a4a8a' : '#000000'}
            emissiveIntensity={theme === 'space' ? 0.7 : 0}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}

function FreeRoamProps({ look, theme }) {
  // Traffic cones (vice), hay bales and a hitching post (medieval), landing lights (space) along the pad,
  // plus a steering wheel or flight stick on the counter and a chequered flag
  const flag = useRef();
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.2;
  });
  return (
    <>
      {[-3.6, -1.2, 1.2, 3.6].map((x, k) =>
        theme === 'medieval' ? (
          <mesh key={x} position={[x, 0.32, -3.2]} rotation={[0, k * 0.4, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.6]} />
            <Std color="#c9a85a" rough={1} />
          </mesh>
        ) : theme === 'space' ? (
          <mesh key={x} position={[x, 0.1, -3.2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
            <Glow color={k % 2 ? [2.4, 1.9, 0.1] : [0.5, 1.4, 3.4]} />
          </mesh>
        ) : (
          <group key={x} position={[x, 0, -3.2]}>
            <mesh position={[0, 0.38, 0]}>
              <coneGeometry args={[0.28, 0.76, 12]} />
              <Std color="#ff6a1a" rough={0.6} />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.15, 0.19, 0.1, 12]} />
              <Std color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.6, 0.06, 0.6]} />
              <Std color="#ff6a1a" />
            </mesh>
          </group>
        ),
      )}
      {theme === 'space' ? (
        <group position={[0.6, 1.75, -0.9]}>
          <mesh>
            <boxGeometry args={[1.2, 0.12, 0.7]} />
            <Std color="#2c3038" metal={0.5} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.5, 8]} />
            <Std color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <Glow color={[4, 0.4, 0.3]} />
          </mesh>
        </group>
      ) : (
        <group position={[0.6, 2.3, -0.9]} rotation={[-0.9, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.42, 0.06, 8, 24]} />
            <Std color={theme === 'medieval' ? '#5a3d26' : '#1a1a1a'} rough={0.5} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[0, 0, (k * Math.PI * 2) / 3]}>
              <boxGeometry args={[0.06, 0.8, 0.05]} />
              <Std color={theme === 'medieval' ? '#5a3d26' : '#c8ccd4'} metal={0.5} />
            </mesh>
          ))}
        </group>
      )}
      {theme === 'medieval' && (
        <group position={[4.7, 0, -0.4]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 1.4, 8]} />
            <Std color="#3a2616" />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.04, 6, 14, Math.PI * 1.4]} />
            <Std color="#8a8f99" metal={0.8} rough={0.35} />
          </mesh>
        </group>
      )}
      {/* chequered flag on a pole */}
      <group position={[theme === 'medieval' ? 3.6 : 4.6, 0, 0.6]}>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 3.6, 6]} />
          <Std color={look.metal} metal={0.6} />
        </mesh>
        <group ref={flag} position={[0, 3.2, 0]}>
          {Array.from({ length: 12 }, (_, k) => (
            <mesh key={k} position={[0.18 + (k % 4) * 0.3, -Math.floor(k / 4) * 0.3, 0]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshStandardMaterial color={(k + Math.floor(k / 4)) % 2 ? '#111111' : '#f4f4f4'} side={DoubleSide} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}

// The instructor walks in from beside the stand when you pull up, and walks back out when you leave
const FREEROAM_INDEX = stops.findIndex((st) => st.id === 'freeroam');
function Guide({ look, shirt }) {
  const group = useRef();
  const walking = useRef(false);
  const st = useRef({ t: 0 });
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const here = store.parkStop === FREEROAM_INDEX;
    const s = st.current;
    s.t = Math.min(1, Math.max(0, s.t + (here ? dt : -dt) / 2.4));
    const e = s.t * s.t * (3 - 2 * s.t);
    group.current.position.set(-13 + 8.6 * e, 0, -1.2 + 0.5 * e);
    walking.current = here ? s.t < 1 : s.t > 0;
    // Face the way it's walking; once there, turn to talk to you
    const target = walking.current ? (here ? -Math.PI / 2 : Math.PI / 2) : 0.4;
    group.current.rotation.y += (target - group.current.rotation.y) * (1 - Math.exp(-dt * 8));
  });
  return (
    <group ref={group}>
      <Person look={look} shirt={shirt} position={[0, 0, 0]} pose="explain" walking={walking} />
    </group>
  );
}

const SECTIONS = {
  home: { Props: HomeProps, pose: 'wave' },
  about: { Props: AboutProps, pose: 'idle', hold: 'clipboard' },
  skills: { Props: SkillsProps, pose: 'work', hold: 'tool' },
  projects: { Props: ProjectsProps, pose: 'point' },
  experience: { Props: ExperienceProps, pose: 'cheer' },
  contact: { Props: ContactProps, pose: 'talk', hold: 'phone' },
  freeroam: { Props: FreeRoamProps, guide: true },
};

function PitStop({ stop, theme }) {
  const look = LOOKS[theme];
  const [title, sub] = look.names[stop.id];
  const sign = useSignTexture(look.paint, look.fonts, title, sub);
  const section = SECTIONS[stop.id];
  const { Props } = section;
  let held = null;
  if (section.hold === 'tool') held = theme === 'medieval' ? <Hammer look={look} /> : <Wrench look={look} />;
  else if (section.hold === 'clipboard') held = <Clipboard />;
  else if (section.hold === 'phone') held = <Phone theme={theme} />;
  return (
    <group position={[stop.x, 0, stop.y]} rotation={[0, stop.rot, 0]}>
      <Stall look={look} color={look.body[stop.id]} sign={sign} theme={theme} />
      <Dressing look={look} theme={theme} />
      <Props look={look} theme={theme} />
      {section.guide ? (
        <Guide look={look} shirt={look.shirts[stop.id]} />
      ) : (
        <Person look={look} shirt={look.shirts[stop.id]} position={[-4.4, 0, -0.7]} rotation={0.35} pose={section.pose}>
          {held}
        </Person>
      )}
    </group>
  );
}

export default function PitStops({ theme }) {
  return PITSTOPS.map((stop) => <PitStop key={stop.id} stop={stop} theme={theme} />);
}
