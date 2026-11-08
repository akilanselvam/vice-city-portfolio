import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import HudBar from './journey/HudBar.jsx';
import Radar from './journey/Radar.jsx';
import MapOverlay from './journey/MapOverlay.jsx';
import ThemeTransition from './journey/ThemeTransition.jsx';
import AreaToast from './journey/AreaToast.jsx';
import DriveControls from './journey/DriveControls.jsx';
import useDriveInput from './journey/useDriveInput.js';
import useScrollLock from './journey/useScrollLock.js';
import { LAST_STOP, useJourney } from './journey/useJourney.js';
import { nearestStop } from './journey/route.js';
import { MAP_POINTS } from './city/layout.js';
import { store } from './world3d/store.js';
import HomeStop from './stops/HomeStop.jsx';
import AboutStop from './stops/AboutStop.jsx';
import SkillsStop from './stops/SkillsStop.jsx';
import ProjectsStop from './stops/ProjectsStop.jsx';
import ExperienceStop from './stops/ExperienceStop.jsx';
import ContactStop from './stops/ContactStop.jsx';
import FreeRoamStop from './stops/FreeRoamStop.jsx';
import { profile } from './data/portfolio.js';
import { useTheme } from './theme/ThemeContext.jsx';
import { loadKit } from './world3d/kits.js';
import { ensureThemeFonts } from './theme/fonts.js';

const World3D = lazy(() => import('./world3d/World3D.jsx'));
const STOP_VIEWS = [HomeStop, AboutStop, SkillsStop, ProjectsStop, ExperienceStop, ContactStop, FreeRoamStop];
// freeNear value meaning "we're on the tour, use scroll position"
const TOUR = -2;

class WorldBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(_, prev) {
    if (this.state.failed && !prev.failed) this.props.onFail();
  }
  render() {
    return this.state.failed ? <div className="world-fallback" /> : this.props.children;
  }
}

const PANEL_SPRING = { stiffness: 220, damping: 30, restDelta: 0.001 };

// How far open stop `index`'s panel is: 1 when parked there, 0 once you've driven away
function panelOpenness(index, v, near) {
  if (near !== TOUR) return near === index ? 1 : 0;
  return 1 - Math.min(1, Math.max(0, (Math.abs(index - v) - 0.02) / 0.16));
}

// A section that pops up when the car pulls into its stop. It can be closed while parked (closed holds
// the closed stop's index, or -1); it opens again on the next arrival.
// focus is the stop whose pit-stop cart the camera has swung round to (-2 = no 3D scene, don't wait).
// Sections other than the title wait for that before opening.
function Stop({ index, s, freeNear, closed, focus, onClose, layout, children }) {
  const { stops } = useTheme();
  const target = useTransform([s, freeNear, closed, focus], ([v, near, shut, f]) => {
    if (shut === index) return 0;
    if (index !== 0 && f !== -2 && f !== index) return 0;
    return panelOpenness(index, v, near);
  });
  const opacity = useSpring(target, PANEL_SPRING);
  // Build a section's content only the first time it opens: less work at startup, and its images
  // (such as the skill icons) aren't downloaded until someone actually gets there
  const [mounted, setMounted] = useState(() => target.get() > 0);
  useMotionValueEvent(opacity, 'change', (o) => {
    if (o > 0.01 && !mounted) setMounted(true);
  });
  const y = useTransform(opacity, (o) => (1 - o) * 28);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? 'hidden' : 'visible'));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? 'auto' : 'none'));
  return (
    <m.section
      className={`stop stop-${stops[index].id}`}
      aria-label={stops[index].area}
      style={{ opacity, y, visibility, pointerEvents, top: layout.panelTop, height: layout.panelMax }}
    >
      <div className="stop-inner">
        <div className="stop-frame">
          <button className="stop-close" onClick={() => onClose(index)} aria-label={`Close ${stops[index].area}`} title="Close">
            <X size={18} aria-hidden="true" />
          </button>
          <div className="stop-card">{mounted ? children : null}</div>
        </div>
      </div>
    </m.section>
  );
}

export default function App() {
  const stageRef = useRef(null);
  const { layout, s, travelTo, destination, jumpTo } = useJourney(stageRef);
  const { id: theme, copy, stops, setTheme } = useTheme();
  const revealOnReady = useRef(false);
  // The themed card that covers a theme switch: { to, origin } while showing
  const [switching, setSwitching] = useState(null);
  const switchingRef = useRef(false);
  const revealAfter = useRef(0);
  // Where the vehicle actually is along the tour (stop-space). The scene drives it toward the scroll
  // position at a real speed; panels, arrivals and the location toast follow this instead of the scroll.
  const ride = useMotionValue(s.get());
  const focus = useMotionValue(-1);
  const [worldFailed, setWorldFailed] = useState(false);
  // Without a 3D scene nothing drives the vehicle, so follow the scroll directly
  useMotionValueEvent(s, 'change', (v) => {
    if (worldFailed) ride.set(v);
  });
  // Bumped to rebuild the 3D world after the browser drops its WebGL context (capped so it cannot loop)
  const [worldKey, setWorldKey] = useState(0);
  const onLost = useCallback(() => setWorldKey((k) => (k < 3 ? k + 1 : k)), []);
  const [mode, setMode] = useState('tour');
  const free = mode === 'free';
  const [current, setCurrent] = useState(() => Math.round(s.get()));
  const [arrival, setArrival] = useState(() => ({ index: Math.round(s.get()), n: 0 }));
  const [mapOpen, setMapOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const arrivedRef = useRef(arrival.index);
  const freeNear = useMotionValue(TOUR);
  const px = useMotionValue(MAP_POINTS.home[0]);
  const py = useMotionValue(MAP_POINTS.home[1]);
  const ph = useMotionValue(0);
  const pose = useMemo(() => ({ x: px, y: py, h: ph }), [px, py, ph]);
  const input = useDriveInput(free);
  useScrollLock(free);

  // A closed section stays closed only while parked at it; a reopen flag brings it back
  const closed = useMotionValue(-1);
  const [closedStop, setClosedStop] = useState(-1);
  const closeStop = useCallback(
    (i) => {
      closed.set(i);
      setClosedStop(i);
    },
    [closed],
  );
  const reopenStop = useCallback(() => {
    closed.set(-1);
    setClosedStop(-1);
  }, [closed]);

  const announce = useCallback((index) => {
    arrivedRef.current = index;
    setArrival((a) => ({ index, n: a.n + 1 }));
  }, []);

  useMotionValueEvent(ride, 'change', (v) => {
    if (closed.get() >= 0 && Math.abs(v - closed.get()) > 0.25) reopenStop();
    if (free) return;
    const nearest = Math.round(v);
    setCurrent(nearest);
    if (Math.abs(v - nearest) < 0.02 && nearest !== arrivedRef.current) {
      announce(nearest);
      const url = nearest === 0 ? window.location.pathname + window.location.search : `#/${stops[nearest].id}`;
      window.history.replaceState(null, '', url);
    }
  });

  const onZone = useCallback(
    (zone, near) => {
      freeNear.set(near);
      if (closed.get() >= 0 && near !== closed.get()) reopenStop();
      if (zone < 0) {
        arrivedRef.current = -1;
        return;
      }
      setCurrent(zone);
      if (zone !== arrivedRef.current) announce(zone);
    },
    [freeNear, announce, closed, reopenStop],
  );

  // Fade to black, swap the world state, fade back in: a GTA "skip trip"
  const cut = useCallback((fn) => {
    setFading(true);
    window.setTimeout(() => {
      fn();
      window.setTimeout(() => setFading(false), 120);
    }, 320);
  }, []);

  const enterFree = useCallback(() => {
    reopenStop();
    setMapOpen(false);
    freeNear.set(-1);
    setMode('free');
  }, [freeNear, reopenStop]);

  const exitFree = useCallback(
    (target) => {
      cut(() => {
        reopenStop();
        const k = target ?? nearestStop(px.get(), py.get()).index;
        freeNear.set(TOUR);
        setMode('tour');
        jumpTo(k);
      });
    },
    [cut, freeNear, jumpTo, px, py, reopenStop],
  );

  const toggleFree = useCallback(() => (free ? exitFree() : enterFree()), [free, exitFree, enterFree]);

  const endSwitch = useCallback(() => {
    revealOnReady.current = false;
    switchingRef.current = false;
    setSwitching(null);
  }, []);

  // Swap the world behind the next theme's title card: it wipes out from the theme button, the world is
  // rebuilt underneath, and it lifts once the new world has drawn (and has been up long enough to read).
  // Free roam ends at the nearest stop.
  const switchTheme = useCallback((target) => {
    if (switchingRef.current || !target || target === theme) return;
    switchingRef.current = true;
    const rect = document.querySelector('.theme-toggle')?.getBoundingClientRect();
    const origin = rect?.width
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    revealAfter.current = performance.now() + 1300;
    ensureThemeFonts(target);
    setSwitching({ to: target, origin });
    loadKit(target)
      .catch(() => {})
      .then(() => {
        // Wait for the wipe to cover the screen before tearing the old world down
        window.setTimeout(() => {
          if (free) {
            freeNear.set(TOUR);
            setMode('tour');
            jumpTo(nearestStop(px.get(), py.get()).index);
          }
          revealOnReady.current = true;
          setTheme(target);
          // Safety net in case the new world never reports a frame
          window.setTimeout(() => {
            if (revealOnReady.current) endSwitch();
          }, 6000);
        }, 600);
      });
  }, [theme, free, freeNear, jumpTo, px, py, setTheme, endSwitch]);
  const goTo = useCallback((i) => (free ? exitFree(i) : travelTo(i)), [free, exitFree, travelTo]);

  useEffect(() => {
    document.title = current === 0 ? `${profile.name} — Portfolio` : `${stops[current].area} · ${profile.name}`;
  }, [current, stops]);

  useEffect(() => {
    const onHash = () => {
      const i = stops.findIndex((st) => st.id === window.location.hash.replace(/^#\/?/, ''));
      goTo(i < 0 ? 0 : i);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [goTo, stops]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented && !free) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'f' || e.key === 'F') return toggleFree();
      if (e.key === 'm' || e.key === 'M') return setMapOpen(true);
      if (free) {
        if (e.key === 'Escape') exitFree();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        travelTo(destination() + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        travelTo(destination() - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [free, toggleFree, exitFree, travelTo, destination]);

  useEffect(() => {
    if (free) return undefined;
    let touchStartY = null;
    let canNavigate = false;
    const onTouchStart = (event) => {
      if (!event.touches || !event.touches.length) return;
      touchStartY = event.touches[0].clientY;
      canNavigate = !event.target.closest?.('.stop');
    };
    const onTouchEnd = (event) => {
      if (touchStartY == null || !canNavigate) {
        touchStartY = null;
        canNavigate = false;
        return;
      }
      const touch = event.changedTouches?.[0];
      const endY = touch ? touch.clientY : touchStartY;
      const delta = endY - touchStartY;
      const step = Math.abs(delta) > 18 ? (delta < 0 ? 1 : -1) : 0;
      touchStartY = null;
      canNavigate = false;
      if (!step) return;
      const current = Math.round(s.get());
      const target = Math.min(Math.max(current + step, 0), LAST_STOP);
      if (target !== current) travelTo(target);
    };
    const onTouchCancel = () => {
      touchStartY = null;
      canNavigate = false;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [free, s, travelTo]);

  const openMap = useCallback(() => setMapOpen(true), []);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const travelFromMap = useCallback(
    (i) => {
      setMapOpen(false);
      // Let the map's scroll lock release before driving
      requestAnimationFrame(() => goTo(i));
    },
    [goTo],
  );
  const onReady = useCallback(() => {
    setReady(true);
    if (revealOnReady.current) {
      revealOnReady.current = false;
      window.setTimeout(endSwitch, Math.max(200, revealAfter.current - performance.now()));
    }
  }, [endSwitch]);

  const height = layout ? layout.h + LAST_STOP * layout.seg + Math.round(layout.h * 0.15) : undefined;

  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <div className="journey" style={{ height }}>
        {layout &&
          stops.map((st, i) => <div key={st.id} className="snap" style={{ top: i * layout.seg }} aria-hidden="true" />)}
        <div className={`stage${free ? ' free' : ''}`} ref={stageRef}>
          {layout && (
            <>
              <WorldBoundary
                onFail={() => {
                  setWorldFailed(true);
                  ride.set(s.get());
                  focus.set(-2);
                  onReady();
                }}
              >
                <Suspense fallback={null}>
                  <World3D
                    key={`${theme}-${worldKey}`}
                    theme={theme}
                    stops={stops}
                    s={s}
                    ride={ride}
                    focus={focus}
                    mode={mode}
                    input={input}
                    pose={pose}
                    onZone={onZone}
                    onReady={onReady}
                    onLost={onLost}
                    mobile={layout.mobile}
                  />
                </Suspense>
              </WorldBoundary>
              <div className="marker-labels" aria-hidden="true">
                {stops.map((st, i) => (
                  <div
                    key={st.id}
                    ref={(el) => {
                      store.labels[i] = el;
                    }}
                    className="marker-label"
                  >
                    <span className="marker-letter display">{st.id[0]}</span>
                    <span className="marker-name display">{st.area}</span>
                  </div>
                ))}
              </div>
              {STOP_VIEWS.map((View, i) => (
                <Stop key={stops[i].id} index={i} s={ride} freeNear={freeNear} closed={closed} focus={focus} onClose={closeStop} layout={layout}>
                  <View travelTo={goTo} openMap={openMap} onFreeRoam={enterFree} />
                </Stop>
              ))}
              <AnimatePresence>
                {closedStop >= 0 && (
                  <m.button
                    key="reopen"
                    className="reopen-flag"
                    style={{ top: layout.panelTop + 6, x: '-50%' }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={reopenStop}
                    aria-label={`Open ${stops[closedStop].area}`}
                    autoFocus
                  >
                    <Flag size={16} aria-hidden="true" className="reopen-icon" />
                    <span className="reopen-name display">{stops[closedStop].area}</span>
                    <span className="reopen-hint">Open</span>
                  </m.button>
                )}
              </AnimatePresence>
              <HudBar s={ride} current={current} travelTo={goTo} openMap={openMap} free={free} onToggleFree={toggleFree} onSwitchTheme={switchTheme} />
              <Radar pose={pose} layout={layout} onOpen={openMap} />
              <AreaToast key={arrival.n} stop={stops[arrival.index]} />
              {free && <DriveControls input={input} />}
            </>
          )}
          <AnimatePresence>
            {!ready && (
              <m.div className="loading-screen" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                <span className="loading-mark display">{copy.logoMark}</span>
                <p className="loading-text display">{copy.loading}</p>
                <span className="loading-bar" />
              </m.div>
            )}
          </AnimatePresence>
          <m.div className="cut" animate={{ opacity: fading ? 1 : 0 }} transition={{ duration: 0.3 }} aria-hidden="true" />
        </div>
      </div>
      <AnimatePresence>
        {mapOpen && <MapOverlay pose={pose} current={current} onClose={closeMap} onTravel={travelFromMap} />}
      </AnimatePresence>
      <AnimatePresence>{switching && <ThemeTransition key="theme-card" to={switching.to} origin={switching.origin} />}</AnimatePresence>
    </MotionConfig>
    </LazyMotion>
  );
}
