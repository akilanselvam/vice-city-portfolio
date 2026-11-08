import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion';
import { stops } from '../data/portfolio.js';

export const LAST_STOP = stops.length - 1;

// Fraction of each leg's scroll spent parked at either end, so sections hold still while you read
const DWELL = 0.1;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x) => x * x * (3 - 2 * x);
const inverseSmoothstep = (y) => 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3);

// u: scroll position measured in legs. Returns s: position along the street in stops.
function scrollToStop(u) {
  const uu = clamp(u, 0, LAST_STOP);
  const i = Math.min(Math.floor(uu), LAST_STOP - 1);
  return i + smoothstep(clamp((uu - i - DWELL) / (1 - 2 * DWELL), 0, 1));
}

function stopToScroll(s) {
  const ss = clamp(s, 0, LAST_STOP);
  const i = Math.min(Math.floor(ss), LAST_STOP - 1);
  return i + DWELL + (1 - 2 * DWELL) * inverseSmoothstep(ss - i);
}

function computeLayout(w, h) {
  const mobile = w < 760;
  const navH = mobile ? 60 : 72;
  const radar = mobile ? 96 : Math.round(Math.min(150, h * 0.18));
  // Phones lift the radar above the free-roam touch pads, so reserve that height too
  const radarTop = h - radar - (mobile ? 104 : 16);
  const panelTop = navH + 6;
  return {
    w,
    h,
    mobile,
    seg: Math.round(h * 1.05),
    navH,
    panelTop,
    // Panels end above the radar so the two never overlap
    panelMax: Math.min(Math.round(h * 0.79), radarTop - 12) - panelTop,
    radar,
  };
}

const stopFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  const i = stops.findIndex((st) => st.id === id);
  return i < 0 ? 0 : i;
};

export function useJourney(stageRef) {
  const [layout, setLayout] = useState(null);
  const s = useMotionValue(stopFromHash());
  const { scrollY } = useScroll();
  const segRef = useRef(1);
  const travel = useRef(null);

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';
    const update = (width, height) =>
      setLayout((prev) =>
        prev && Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : computeLayout(width, height),
      );
    const stage = stageRef.current;
    const rect = stage.getBoundingClientRect();
    update(rect.width, rect.height);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stageRef]);

  // Keep the car where it was when the viewport (and so the scroll length) changes
  useLayoutEffect(() => {
    if (!layout) return;
    const current = s.get();
    segRef.current = layout.seg;
    const parked = Math.abs(current - Math.round(current)) < 1e-3;
    window.scrollTo(0, (parked ? Math.round(current) : stopToScroll(current)) * layout.seg);
  }, [layout, s]);

  useMotionValueEvent(scrollY, 'change', (y) => s.set(scrollToStop(y / segRef.current)));

  const stopTravel = useCallback(() => {
    travel.current?.controls.stop();
    travel.current = null;
    document.documentElement.classList.remove('traveling');
  }, []);

  const travelTo = useCallback(
    (index) => {
      const target = clamp(Math.round(index), 0, LAST_STOP);
      stopTravel();
      const from = s.get();
      const seg = segRef.current;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || Math.abs(from - target) < 1e-3) {
        window.scrollTo(0, target * seg);
        return;
      }
      // Snap points would grab each intermediate scrollTo, so switch them off while driving
      document.documentElement.classList.add('traveling');
      const controls = animate(from, target, {
        duration: Math.min(3.2, 0.8 + 0.55 * Math.abs(target - from)),
        ease: [0.45, 0, 0.25, 1],
        onUpdate: (v) => window.scrollTo(0, stopToScroll(v) * seg),
        onComplete: () => {
          window.scrollTo(0, target * seg);
          travel.current = null;
          document.documentElement.classList.remove('traveling');
        },
      });
      travel.current = { controls, target };
    },
    [s, stopTravel],
  );

  // Any manual input takes the wheel back from an auto-drive
  useEffect(() => {
    const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    const cancel = () => travel.current && stopTravel();
    const onKey = (e) => SCROLL_KEYS.has(e.key) && cancel();
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [stopTravel]);

  const destination = useCallback(() => travel.current?.target ?? Math.round(s.get()), [s]);

  const jumpTo = useCallback(
    (index) => {
      stopTravel();
      const target = clamp(Math.round(index), 0, LAST_STOP);
      window.scrollTo(0, target * segRef.current);
      s.set(target);
    },
    [s, stopTravel],
  );

  return { layout, s, travelTo, destination, jumpTo };
}
