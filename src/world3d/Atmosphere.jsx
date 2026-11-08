import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Vector3 } from 'three';
import { rng } from '../city/layout.js';
import { store } from './store.js';

export const prepare = (keys) =>
  keys.map((k) => ({ ...k, top: new Color(k.top), mid: new Color(k.mid), bottom: new Color(k.bottom), fog: new Color(k.fog) }));

// Each theme's sky: time-of-day keys along the tour (sunset at the start, night mid-tour, dawn at Contact),
// plus the fixed lights and the sun's look
export const VICE_SKY = {
  keys: prepare([
    { at: 0, top: '#4a1a80', mid: '#ff4f8a', bottom: '#ffb070', fog: '#d0607e', sun: 0.11, light: 2.2, hemi: 1.45, win: 0.9, stars: 0 },
    { at: 1.5, top: '#36157a', mid: '#d03f98', bottom: '#ff8aa0', fog: '#a24888', sun: 0.05, light: 1.7, hemi: 1.3, win: 1.15, stars: 0.15 },
    { at: 2.6, top: '#1e0f58', mid: '#5a26a0', bottom: '#c24a96', fog: '#6e3490', sun: -0.14, light: 0.9, hemi: 1.1, win: 1.5, stars: 0.6 },
    { at: 4.2, top: '#1e0f58', mid: '#5a26a0', bottom: '#c24a96', fog: '#6e3490', sun: -0.14, light: 0.9, hemi: 1.1, win: 1.5, stars: 0.6 },
    { at: 5, top: '#3a2280', mid: '#ee6aa4', bottom: '#ffd3aa', fog: '#c47896', sun: 0.07, light: 1.9, hemi: 1.4, win: 0.9, stars: 0.1 },
  ]),
  fog: ['#d0607e', 90, 700],
  hemi: ['#ff7ab8', '#4a2a66'],
  ambient: ['#9a6ac0', 0.55],
  halo: '#ff5aa0',
  sun: { stripes: 1, low: [1.0, 0.16, 0.5], high: [1.0, 0.86, 0.42], boost: 1.6, scale: 150 },
  moon: false,
  starSize: 1.7,
};

const current = { top: new Color(), mid: new Color(), bottom: new Color(), fog: new Color(), sun: 0, light: 0, hemi: 0, win: 0, stars: 0 };

function sampleTimeOfDay(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const f = Math.min(1, Math.max(0, (t - a.at) / (b.at - a.at)));
  for (const key of ['top', 'mid', 'bottom', 'fog']) current[key].lerpColors(a[key], b[key], f);
  for (const key of ['sun', 'light', 'hemi', 'win', 'stars']) current[key] = a[key] + (b[key] - a[key]) * f;
  return current;
}

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAG = `
uniform vec3 top;
uniform vec3 mid;
uniform vec3 bottom;
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 c = mix(bottom, mid, smoothstep(-0.02, 0.16, h));
  c = mix(c, top, smoothstep(0.16, 0.62, h));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const SUN_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SUN_FRAG = `
uniform float uStripes;
uniform vec3 uLow;
uniform vec3 uHigh;
uniform float uBoost;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0) discard;
  float y = vUv.y;
  if (uStripes > 0.5 && y < 0.5) {
    float band = fract((0.5 - y) * 10.0);
    if (band < (0.5 - y) * 1.7) discard;
  }
  vec3 c = mix(uLow, uHigh, smoothstep(0.05, 0.95, y));
  gl_FragColor = vec4(c * uBoost, smoothstep(1.0, 0.97, d) * uAlpha);
  #include <colorspace_fragment>
}`;

const SUN_DIR = new Vector3();
const MOON_DIR = new Vector3(0.45, 0.42, -0.79).normalize();
const sunUniforms = (sun, alpha = 1) => ({
  uStripes: { value: sun.stripes },
  uLow: { value: new Color(...sun.low) },
  uHigh: { value: new Color(...sun.high) },
  uBoost: { value: sun.boost },
  uAlpha: { value: alpha },
});
const MOON = { stripes: 0, low: [0.78, 0.84, 0.95], high: [0.95, 0.97, 1.0], boost: 1.25 };
const CITY_CENTER = new Vector3(400, 0, 280);

export default function Atmosphere({ glow, sky = VICE_SKY }) {
  const { scene, camera } = useThree();
  const skyMesh = useRef();
  const sun = useRef();
  const halo = useRef();
  const stars = useRef();
  const light = useRef();
  const hemi = useRef();
  const moon = useRef();
  const sunU = useMemo(() => sunUniforms(sky.sun), [sky]);
  const moonU = useMemo(() => sunUniforms(MOON, 0), []);

  const skyUniforms = useMemo(() => ({ top: { value: new Color() }, mid: { value: new Color() }, bottom: { value: new Color() } }), []);
  const starGeometry = useMemo(() => {
    const r = rng(5);
    const pts = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const theta = r() * Math.PI * 2;
      const y = 0.08 + r() * 0.92;
      const rad = Math.sqrt(1 - y * y);
      pts.set([Math.cos(theta) * rad * 850, y * 850, Math.sin(theta) * rad * 850], i * 3);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pts, 3));
    return g;
  }, []);

  useEffect(() => {
    const target = light.current.target;
    scene.add(target);
    return () => scene.remove(target);
  }, [scene]);

  useFrame(() => {
    const t = sampleTimeOfDay(sky.keys, store.tod);
    skyUniforms.top.value.copy(t.top);
    skyUniforms.mid.value.copy(t.mid);
    skyUniforms.bottom.value.copy(t.fog);
    scene.fog.color.copy(t.fog);
    skyMesh.current.position.copy(camera.position);
    stars.current.position.copy(camera.position);
    stars.current.material.opacity = t.stars;
    stars.current.visible = t.stars > 0.01;

    SUN_DIR.set(-0.5, t.sun, -0.86).normalize();
    sun.current.position.copy(camera.position).addScaledVector(SUN_DIR, 700);
    sun.current.lookAt(camera.position);
    halo.current.position.copy(sun.current.position).addScaledVector(SUN_DIR, 5);
    halo.current.lookAt(camera.position);
    halo.current.material.opacity = Math.max(0, Math.min(0.7, (t.sun + 0.05) * 5));
    if (moon.current) {
      moon.current.position.copy(camera.position).addScaledVector(MOON_DIR, 700);
      moon.current.lookAt(camera.position);
      moonU.uAlpha.value = Math.min(1, t.stars * 1.6);
      moon.current.visible = t.stars > 0.02;
    }

    light.current.position.copy(CITY_CENTER).addScaledVector(SUN_DIR, 400);
    light.current.intensity = t.light;
    light.current.color.copy(t.bottom);
    hemi.current.intensity = t.hemi;
    hemi.current.color.copy(t.mid);
    for (const m of store.windowMaterials) m.emissiveIntensity = t.win;
  });

  return (
    <>
      <fog attach="fog" args={sky.fog} />
      <mesh ref={skyMesh} renderOrder={-2} frustumCulled={false}>
        <sphereGeometry args={[900, 32, 16]} />
        <shaderMaterial vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={skyUniforms} side={BackSide} depthWrite={false} fog={false} />
      </mesh>
      <points ref={stars} geometry={starGeometry} frustumCulled={false}>
        <pointsMaterial color="#ffffff" size={sky.starSize} sizeAttenuation={false} transparent depthWrite={false} fog={false} />
      </points>
      <mesh ref={halo} scale={420} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial map={glow} color={sky.halo} transparent blending={AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={sun} scale={sky.sun.scale} renderOrder={-1}>
        <planeGeometry />
        <shaderMaterial vertexShader={SUN_VERT} fragmentShader={SUN_FRAG} uniforms={sunU} transparent depthWrite={false} fog={false} />
      </mesh>
      {sky.moon && (
        <mesh ref={moon} scale={70} renderOrder={-1}>
          <planeGeometry />
          <shaderMaterial vertexShader={SUN_VERT} fragmentShader={SUN_FRAG} uniforms={moonU} transparent depthWrite={false} fog={false} />
        </mesh>
      )}
      <hemisphereLight ref={hemi} args={[sky.hemi[0], sky.hemi[1], 1.2]} />
      <ambientLight intensity={sky.ambient[1]} color={sky.ambient[0]} />
      <directionalLight ref={light} intensity={1.2} target-position={[400, 0, 280]} />
    </>
  );
}
