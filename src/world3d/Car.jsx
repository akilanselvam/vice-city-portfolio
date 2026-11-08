const WHEELS = [
  [-0.95, 0.38, -1.45],
  [0.95, 0.38, -1.45],
  [-0.95, 0.38, 1.45],
  [0.95, 0.38, 1.45],
];

// Low-poly traffic coupe; faces -z. `wheels` receives the four wheel groups so the parent can spin them.
export default function Car({ paint = '#6a2a9a', trim = '#ff2d95', wheels }) {
  const setWheel = (i) => (el) => {
    if (wheels) wheels.current[i] = el;
  };

  return (
    <group>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[2, 0.56, 4.6]} />
        <meshStandardMaterial color={paint} metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.98, -1.55]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[1.94, 0.18, 1.3]} />
        <meshStandardMaterial color={paint} metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.12, 0.35]}>
        <boxGeometry args={[1.7, 0.5, 2.1]} />
        <meshStandardMaterial color="#0e0619" metalness={0.9} roughness={0.12} emissive={trim} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 1.08, 2.2]}>
        <boxGeometry args={[1.9, 0.07, 0.36]} />
        <meshStandardMaterial color="#0a0412" />
      </mesh>
      {[-1.01, 1.01].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.04, 0.07, 3.9]} />
          <meshBasicMaterial color={trim} toneMapped={false} />
        </mesh>
      ))}
      {[-0.66, 0.66].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.66, -2.31]}>
          <boxGeometry args={[0.46, 0.15, 0.04]} />
          <meshBasicMaterial color={[3, 2.8, 2.2]} toneMapped={false} />
        </mesh>
      ))}
      {[-0.66, 0.66].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.7, 2.31]}>
          <boxGeometry args={[0.52, 0.12, 0.04]} />
          <meshBasicMaterial color={[2.2, 0.06, 0.16]} toneMapped={false} />
        </mesh>
      ))}
      {WHEELS.map((p, i) => (
        <group key={i} position={p} ref={setWheel(i)}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 14]} />
            <meshStandardMaterial color="#07040b" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[p[0] > 0 ? 0.16 : -0.16, 0, 0]}>
            <boxGeometry args={[0.04, 0.5, 0.08]} />
            <meshStandardMaterial color="#b8b0d0" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
