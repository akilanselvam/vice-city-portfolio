import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Vector3 } from 'three';
import { MAP_POINTS } from '../city/layout.js';
import { stops } from '../data/portfolio.js';
import { store } from './store.js';

const projected = new Vector3();
const anchor = new Vector3();

// GTA-style mission markers: a glowing column you pull into. They fade out once you're inside.
const VICE_MARKER = { column: [1.5, 1.05, 0.3], ring: [1.6, 1.1, 0.3] };

export default function Markers({ fade, pose, look = VICE_MARKER }) {
  const columns = useRef([]);
  const rings = useRef([]);

  useFrame(({ clock, camera, size }) => {
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
      anchor.set(x, 11, y);
      const dist = camera.position.distanceTo(anchor);
      projected.copy(anchor).project(camera);
      if (projected.z > 1 || visibility < 0.01) {
        label.style.opacity = '0';
        return;
      }
      const sx = ((projected.x + 1) / 2) * size.width;
      const sy = ((1 - projected.y) / 2) * size.height;
      const scale = Math.min(1.3, Math.max(0.45, 70 / dist));
      label.style.opacity = String(visibility);
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
