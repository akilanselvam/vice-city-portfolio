import { useLayoutEffect, useRef, useState } from 'react';
import { Mouse, Play } from 'lucide-react';
import { profile } from '../data/portfolio.js';
import { useTheme } from '../theme/ThemeContext.jsx';

// Scale the title screen down just enough to fit its panel, which ends above the radar.
// Fonts differ by theme, so this measures the real content rather than guessing sizes.
function useFitToPanel(ref, deps) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.closest('.stop-inner');
    if (!el || !box) return undefined;
    const fit = () => {
      // Layout size ignores the transform, so measuring never feeds back on itself
      const natural = el.scrollHeight;
      const avail = box.clientHeight;
      setScale(natural > avail ? (avail / natural) * 0.98 : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    ro.observe(el);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return scale;
}

const MENU = [
  { label: 'Start game', stop: 1 },
  { label: 'About', stop: 1 },
  { label: 'Skills', stop: 2 },
  { label: 'Projects', stop: 3 },
  { label: 'Experience', stop: 4 },
  { label: 'Contact', stop: 5 },
];

export default function HomeStop({ travelTo, openMap }) {
  const { id, copy } = useTheme();
  const ref = useRef(null);
  const scale = useFitToPanel(ref, [id]);
  return (
    <div
      className="home-stop"
      ref={ref}
      style={scale < 0.999 ? { transform: `scale(${scale.toFixed(3)})`, transformOrigin: 'left top' } : undefined}
    >
      <div className="home-main">
        <div className="logo">
          <span className="logo-mark" aria-hidden="true">
            {copy.logoMark}
          </span>
          <h1 className="logo-name display">{profile.name}</h1>
          <span className="logo-script script" aria-hidden="true">
            Portfolio
          </span>
        </div>
        <p className="tagline">
          {profile.tagline.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <nav className="home-menu" aria-label="Main menu">
          {MENU.map((item) => (
            <button key={item.label} className="menu-item display" onClick={() => travelTo(item.stop)}>
              <Play className="menu-caret" size={16} fill="currentColor" aria-hidden="true" />
              {item.label}
            </button>
          ))}
          <button className="menu-item display" onClick={openMap}>
            <Play className="menu-caret" size={16} fill="currentColor" aria-hidden="true" />
            Map
          </button>
        </nav>
        <p className="drive-hint">
          <Mouse size={18} aria-hidden="true" className="drive-hint-icon" />
          <span className="hint-mouse">{copy.scrollHint}</span>
          <span className="hint-touch">{copy.swipeHint} · drag sideways to look around</span>
          <span className="drive-keys">
            · <kbd>→</kbd> next stop · <kbd>M</kbd> map · drag to look around
          </span>
        </p>
      </div>
      <div className="motto script" aria-hidden="true">
        {profile.motto.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </div>
  );
}
