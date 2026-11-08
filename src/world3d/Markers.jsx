import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Vector3 } from 'three';
import { MAP_POINTS } from '../city/layout.js';
import { stops } from '../data/portfolio.js';
import { store } from './store.js';

const projected = new Vector3();
const anchor = new Vector3();

// Game-style mission markers: a glowing column you pull into. They fade out once you're inside.
// Tags appear within LABEL_FAR of their stop and are fully shown by LABEL_FULL (map units; stops are
// 50 to 330 apart, so only the stop you're heading for shows its tag)
const LABEL_FAR = 46;
const LABEL_FULL = 34;

const VICE_MARKER = { column: [1.5, 1.05, 0.3], ring: [1.6, 1.1, 0.3] };

export default function Markers({ fade, pose, look = VICE_MARKER }) {
  const columns = useRef([]);
  const rings = useRef([]);
  // Per tag: last distance to its stop, whether we're heading toward it (1) or away (-1), and its
  // current (smoothed) opacity
  const tags = useRef([]);

  useFrame(({ clock, camera, size }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.elapsedTime;
    const cx = pose.x.get();
    const cy = pose.y.get();
    stops.forEach((st, i) => {
      const column = columns.current[i];
      if (!column) return;
      const [x, y] = MAP_POINTS[st.id];
      const visibility = Math.min(1, Math.max(0, (Math.hypot(cx - x, cy - y) - 10) / 22));
      const pulse = 1 + Math.sin(t * 2.2 + i) * 0.05;
      column.scale.set(pulse, 1, pulse);
      column.material.opacity = 0.55 * visibility;
      column.visible = visibility > 0.01;
      rings.current[i].material.opacity = 0.9 * visibility;

      const label = store.labels[i];
      if (!label) return;
      // The tag only shows while you're heading toward this stop: it fades in from LABEL_FAR to LABEL_FULL
      // away and out again in the last few units, where the section's popup takes over. Far-away stops
      // and the stop you're driving away from show nothing, so tags never float over buildings.
      const away = Math.hypot(cx - x, cy - y);
      const tag = (tags.current[i] ??= { last: away, heading: 0, shown: 0 });
      if (away < tag.last - 0.01) tag.heading = 1;
      else if (away > tag.last + 0.01) tag.heading = -1;
      tag.last = away;
      const near = Math.min(1, Math.max(0, (LABEL_FAR - away) / (LABEL_FAR - LABEL_FULL)));
      const arriving = Math.min(1, Math.max(0, (away - 6) / 8));
      const target = tag.heading === -1 ? 0 : near * arriving;
      tag.shown += (target - tag.shown) * Math.min(1, dt * (target > tag.shown ? 5 : 9));
      const show = tag.shown;
      anchor.set(x, 11, y);
      const dist = camera.position.distanceTo(anchor);
      projected.copy(anchor).project(camera);
      if (projected.z > 1 || show < 0.01) {
        label.style.opacity = '0';
        return;
      }
      const sx = ((projected.x + 1) / 2) * size.width;
      const sy = ((1 - projected.y) / 2) * size.height;
      const scale = Math.min(1.3, Math.max(0.45, 70 / dist));
      label.style.opacity = String(show);
      label.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    });
  });

  return stops.map((st, i) => {
    const [x, y] = MAP_POINTS[st.id];
    return (
      <group key={st.id} position={[x, 0, y]}>
        <mesh ref={(el) => {
          columns.current[i] = el;
        }} position={[0, 2, 0]}>
          <cylinderGeometry args={[4.5, 4.5, 4, 40, 1, true]} />
          <meshBasicMaterial map={fade} color={look.column} transparent blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
        </mesh>
        <mesh ref={(el) => {
          rings.current[i] = el;
        }} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.2, 4.6, 48]} />
          <meshBasicMaterial color={look.ring} transparent toneMapped={false} />
        </mesh>
      </group>
    );
  });
}
