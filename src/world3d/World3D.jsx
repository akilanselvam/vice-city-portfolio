import { use, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import Markers from './Markers.jsx';
import Traffic from './Traffic.jsx';
import Player from './Player.jsx';
import { loadKit } from './kits.js';
import { makeFadeTexture, makeGlowTexture } from './textures.js';
import { store } from './store.js';

// Drag on the scene (finger or mouse) to look around the vehicle. On touch screens the page keeps
// vertical swipes for driving the tour (touch-action: pan-y), so those only arrive here in free roam.
function OrbitInput() {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const el = gl.domElement;
    const o = store.orbit;
    o.yaw = 0;
    o.pitch = 0;
    let id = null;
    let lx = 0;
    let ly = 0;
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
      o.dragging = true;
      o.lastInput = performance.now();
      try {
        el.setPointerCapture(id);
      } catch {
        // Synthetic or already-released pointers cannot be captured; dragging still works without it
      }
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      o.yaw -= (e.clientX - lx) * 0.009;
      o.pitch = Math.min(0.9, Math.max(-0.35, o.pitch + (e.clientY - ly) * 0.004));
      lx = e.clientX;
      ly = e.clientY;
      o.lastInput = performance.now();
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      o.dragging = false;
      o.lastInput = performance.now();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      o.dragging = false;
    };
  }, [gl]);
  return null;
}

// The shared skeleton (driving, camera, markers, traffic logic) dressed in the active theme's kit
export default function World3D({ theme, stops, s, ride, focus, mode, input, pose, onZone, onReady, onLost, mobile }) {
  const kit = use(loadKit(theme));
  // R3F also fires a context loss when it disposes the canvas on unmount; only a loss while mounted is a real one
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const glow = useMemo(() => makeGlowTexture(), []);
  const fade = useMemo(() => makeFadeTexture(), []);
  const { Scenery } = kit;
  return (
    <Canvas
      className="world3d"
      dpr={[1, 1.5]}
      gl={{ antialias: !mobile, powerPreference: 'high-performance' }}
      camera={{ fov: 58, near: 0.5, far: 2000, position: [185, 8, 470] }}
      onCreated={({ gl }) => {
        // The browser can drop a WebGL context (GPU reset, memory pressure); rebuild the world instead of staying black
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            if (alive.current) onLost?.();
          },
          { once: true },
        );
      }}
    >
      <OrbitInput />
      <Scenery glow={glow} stops={stops} />
      <Markers fade={fade} pose={pose} look={kit.marker} />
      <Traffic Model={kit.TrafficModel} palette={kit.traffic} speedScale={kit.trafficSpeed} />
      <Player
        s={s}
        ride={ride}
        focus={focus}
        mode={mode}
        input={input}
        pose={pose}
        onZone={onZone}
        onReady={onReady}
        glow={glow}
        Vehicle={kit.Vehicle}
        handling={kit.handling}
      />
      {!mobile && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={kit.bloom.intensity} luminanceThreshold={kit.bloom.threshold} luminanceSmoothing={0.3} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
