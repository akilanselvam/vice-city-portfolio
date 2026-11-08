import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { m, useTransform } from 'framer-motion';
import { Briefcase, Code2, Flag, Gamepad2, Mail, Rocket, User, X } from 'lucide-react';
import MapArt from '../components/MapArt.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';
import { RouteLine } from './Radar.jsx';
import { MAP_POINTS } from './route.js';
import useScrollLock from './useScrollLock.js';

const ICONS = { home: Flag, about: User, skills: Code2, projects: Rocket, experience: Briefcase, contact: Mail, freeroam: Gamepad2 };

export default function MapOverlay({ pose, current, onClose, onTravel }) {
  const { copy, stops } = useTheme();
  const closeRef = useRef(null);
  useScrollLock(true);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const left = useTransform(pose.x, (v) => `${(v / 800) * 100}%`);
  const top = useTransform(pose.y, (v) => `${(v / 560) * 100}%`);
  const heading = pose.h;

  return createPortal(
    <m.div
      className="map-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="City map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <m.div className="map-overlay-inner" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
        <header className="map-overlay-head">
          <div>
            <h2 className="screen-title display neon-title">{copy.mapTitle}</h2>
            <p className="screen-sub">{copy.mapSub}</p>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close map">
            <X size={20} />
          </button>
        </header>

        <div className="map-layout">
          <nav className="panel districts" aria-label="Destinations">
            <p className="panel-label">{copy.mapRegions}</p>
            {stops.map((st, i) => {
              const Icon = ICONS[st.id];
              return (
                <button key={st.id} className={`district${i === current ? ' active' : ''}`} onClick={() => onTravel(i)} aria-current={i === current ? 'location' : undefined}>
                  <Icon size={18} aria-hidden="true" />
                  {st.area}
                </button>
              );
            })}
          </nav>

          <div className="map-frame">
            <MapArt>
              <RouteLine />
            </MapArt>
            {stops.map((st, i) => {
              const [x, y] = MAP_POINTS[st.id];
              return (
                <button
                  key={st.id}
                  className={`pin${i === current ? ' active' : ''}`}
                  data-side={x > 400 ? 'left' : 'right'}
                  style={{ left: `${(x / 800) * 100}%`, top: `${(y / 560) * 100}%` }}
                  onClick={() => onTravel(i)}
                  aria-label={`${copy.travelVerb} to ${st.area}`}
                >
                  <span className="pin-pulse" />
                  <svg className="pin-marker" viewBox="0 0 32 40" aria-hidden="true">
                    <path d="M16 39C16 39 3 24 3 15a13 13 0 0 1 26 0c0 9-13 24-13 24Z" />
                    <circle cx="16" cy="15" r="5" />
                  </svg>
                  <span className="pin-card">
                    <span className="pin-title display">{st.area}</span>
                    <span className="pin-sub">{st.sub}</span>
                  </span>
                </button>
              );
            })}
            <m.span className="player" style={{ left, top, x: '-50%', y: '-50%', rotate: heading }} aria-hidden="true" />
          </div>
        </div>
        <p className="map-hint">
          You are here <span className="player-legend" aria-hidden="true" /> · Press <kbd>M</kbd> or <kbd>Esc</kbd> to close
        </p>
      </m.div>
    </m.div>,
    document.body,
  );
}
