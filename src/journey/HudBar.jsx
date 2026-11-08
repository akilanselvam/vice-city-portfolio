import { useEffect, useState } from 'react';
import { m, useTransform } from 'framer-motion';
import { Coins, Gamepad2, Map as MapIcon, Medal, Star, X } from 'lucide-react';
import ThemeMenu from './ThemeMenu.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';

const CASH = 1234567;

function useCountUp(target, duration = 1600) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return value;
}

const PURSE_ICONS = { medieval: Coins, space: Medal };

export default function HudBar({ s, current, travelTo, openMap, free, onToggleFree, onSwitchTheme }) {
  const { id: theme, copy, stops } = useTheme();
  const PurseIcon = PURSE_ICONS[theme];
  const cash = useCountUp(CASH);
  // Section links appear once you pull away from the title screen, which has its own menu
  const linksOpacity = useTransform(s, [0, 0.6], [0, 1]);
  const linksVisibility = useTransform(s, (v) => (v < 0.05 ? 'hidden' : 'visible'));

  return (
    <header className="hud-top">
      <button className="brand display" onClick={() => travelTo(0)} aria-label={`${copy.travelVerb} back to the title screen`}>
        AS
      </button>
      <m.nav className="nav-links" aria-label="Fast travel" style={free ? undefined : { opacity: linksOpacity, visibility: linksVisibility }}>
        {stops.slice(1).map((st, k) => (
          <button key={st.id} className={`nav-link${current === k + 1 ? ' active' : ''}`} aria-current={current === k + 1 ? 'location' : undefined} onClick={() => travelTo(k + 1)}>
            {st.label}
          </button>
        ))}
      </m.nav>
      <button className="icon-btn" onClick={openMap} aria-label="Open the city map" title="Map (M)">
        <MapIcon size={19} />
      </button>
      {/* While roaming this becomes the way back, so nothing has to float over the section popups */}
      <button
        className={`btn free-toggle${free ? ' btn-primary' : ''}`}
        onClick={onToggleFree}
        aria-pressed={free}
        title={free ? `${copy.freeOn} · back to the tour (F or Esc)` : `${copy.freeOff} (F)`}
      >
        {free ? <X size={18} aria-hidden="true" /> : <Gamepad2 size={18} aria-hidden="true" />}
        <span className="free-label">{free ? 'Back to tour' : copy.freeOff}</span>
      </button>
      <ThemeMenu onSwitch={onSwitchTheme} />

      {PurseIcon ? (
        <div className="hud-cash" role="img" aria-label={`${copy.purse}: ${CASH.toLocaleString('en-US')} ${copy.currency}`}>
          <div className="hud-money display">
            <PurseIcon size={24} aria-hidden="true" className="hud-coin" />
            {cash.toLocaleString('en-US')}
          </div>
        </div>
      ) : (
        <div className="hud-cash" role="img" aria-label={`Wanted level: 5 stars. Cash: ${CASH.toLocaleString('en-US')}`}>
          <div className="hud-stars">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={20} fill="currentColor" aria-hidden="true" />
            ))}
          </div>
          <div className="hud-money display">${cash.toLocaleString('en-US')}</div>
        </div>
      )}

    </header>
  );
}
