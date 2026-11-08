import { useEffect, useState } from 'react';
import { m } from 'framer-motion';

// The screen shown while the 3D world loads: a small animated scene per theme (CSS and SVG only, so it
// costs almost nothing), the logo mark, the theme's loading line, a themed progress bar and rotating
// game-style tips.

function tipsFor(verb) {
  return [
    'Drag the scene to look around',
    'Press M to open the map',
    `${verb} into a glowing marker to open a section`,
    'Press F for free roam',
    'Press → to head to the next stop',
  ];
}

// A neon skyline along the horizon: deterministic building heights with a few lit windows
const SKYLINE = Array.from({ length: 26 }, (_, k) => {
  const h = 40 + ((k * 37) % 70) + (k % 3 === 0 ? 40 : 0);
  return { x: k * 40, w: 30 + ((k * 13) % 12), h };
});

function NeonScene() {
  return (
    <>
      <div className="ls-stars" />
      <div className="ls-sun" />
      <svg className="ls-skyline" viewBox="0 0 1040 200" preserveAspectRatio="xMidYMax slice">
        {SKYLINE.map((b) => (
          <g key={b.x}>
            <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} />
            {Array.from({ length: Math.floor(b.h / 22) }, (_, r) =>
              [0, 1].map((c) =>
                (b.x + r + c) % 3 === 0 ? <rect key={`${r}${c}`} className="ls-win" x={b.x + 5 + c * 12} y={200 - b.h + 8 + r * 22} width="6" height="8" /> : null,
              ),
            )}
          </g>
        ))}
      </svg>
      <div className="ls-horizon" />
      <div className="ls-floor">
        <div className="ls-grid" />
      </div>
      <div className="ls-scan" />
    </>
  );
}

function MedievalScene() {
  return (
    <>
      <div className="ls-stars" />
      <div className="ls-moon" />
      <svg className="ls-mountains" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
        <path className="ls-m1" d="M0 300 L0 170 L120 90 L230 160 L340 70 L470 170 L600 60 L730 150 L850 80 L980 160 L1090 100 L1200 150 L1200 300 Z" />
        <path className="ls-m2" d="M0 300 L0 220 L150 150 L300 220 L420 170 L560 230 L700 160 L860 230 L1000 170 L1200 230 L1200 300 Z" />
        <path className="ls-m3" d="M0 300 L0 260 L200 225 L420 265 L640 230 L880 265 L1060 235 L1200 260 L1200 300 Z" />
      </svg>
      <div className="ls-mist" />
      <div className="ls-embers">
        {Array.from({ length: 14 }, (_, k) => (
          <span key={k} style={{ '--x': `${(k * 71) % 100}%`, '--d': `${(k % 5) * 0.9}s`, '--t': `${5 + (k % 4)}s` }} />
        ))}
      </div>
    </>
  );
}

function SpaceScene() {
  return (
    <>
      <div className="ls-stars ls-stars-far" />
      <div className="ls-stars ls-stars-near" />
      <div className="ls-planet" />
      <div className="ls-hazard ls-hazard-top" />
      <div className="ls-hazard ls-hazard-bottom" />
      <div className="ls-brackets">
        <span />
        <span />
        <span />
        <span />
      </div>
      <ul className="ls-telemetry">
        <li>Drop sequence initiated</li>
        <li>Orbit lock ........ OK</li>
        <li>Payload: portfolio</li>
        <li>Drop pod armed</li>
      </ul>
    </>
  );
}

const SCENES = { vice: NeonScene, medieval: MedievalScene, space: SpaceScene };

// The scene itself, used by the loading screen and by the card that covers a theme switch. It styles itself
// from its ls-<theme> class (own fonts and colours), so it looks right even while the page is still in
// another theme. title: an optional line above the loading text (the theme name, on a switch).
export function LoadingScene({ theme, copy, title }) {
  const tips = tipsFor(copy.travelVerb);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % tips.length), 2400);
    return () => clearInterval(t);
  }, [tips.length]);
  const Scene = SCENES[theme] ?? NeonScene;

  return (
    <>
      <div className="ls-scene" aria-hidden="true">
        <Scene />
      </div>
      <div className="ls-center">
        <div className="ls-emblem" aria-hidden="true">
          {theme === 'space' && (
            <svg className="ls-reticle" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="92" />
              <circle cx="100" cy="100" r="78" className="ls-reticle-dash" />
              {[0, 90, 180, 270].map((a) => (
                <rect key={a} x="97" y="0" width="6" height="18" transform={`rotate(${a} 100 100)`} />
              ))}
            </svg>
          )}
          {theme === 'medieval' && (
            <svg className="ls-astrolabe" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="94" />
              <circle cx="100" cy="100" r="82" />
              {Array.from({ length: 36 }, (_, k) => (
                <line key={k} x1="100" y1="6" x2="100" y2={k % 3 === 0 ? 20 : 13} transform={`rotate(${k * 10} 100 100)`} />
              ))}
            </svg>
          )}
          {theme === 'medieval' && <span className="ls-shield" />}
          <span className="loading-mark display">{copy.logoMark}</span>
        </div>
        {title && <p className="ls-title display">{title}</p>}
        <p className="loading-text display">{copy.loading}</p>
        <div className="ls-progress">
          <span />
        </div>
        <p className="ls-tip" aria-live="polite">
          <span key={tip}>Tip: {tips[tip]}</span>
        </p>
      </div>
    </>
  );
}

export default function LoadingScreen({ theme, copy }) {
  return (
    <m.div className={`loading-screen ls-${theme}`} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <LoadingScene theme={theme} copy={copy} />
    </m.div>
  );
}
