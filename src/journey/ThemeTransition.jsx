import { m } from 'framer-motion';
import { THEMES } from '../theme/themes.js';

// What covers the screen while the next theme's world is built. It is styled from its own class
// (tt-<theme>), not the page's data-theme, because the page is still in the old theme when it appears.
const TAGLINES = {
  vice: 'Welcome to the sunshine coast',
  medieval: 'The road north awaits',
  space: 'Prepare for planetfall',
};

export default function ThemeTransition({ to, origin }) {
  const copy = THEMES[to];
  const at = `${origin.x}px ${origin.y}px`;
  return (
    <m.div
      className={`theme-transition tt-${to}`}
      role="status"
      aria-live="polite"
      initial={{ clipPath: `circle(0% at ${at})` }}
      animate={{ clipPath: `circle(150% at ${at})` }}
      exit={{ opacity: 0 }}
      transition={{ clipPath: { duration: 0.55, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.45 } }}
    >
      <div className="tt-deco tt-deco-top" aria-hidden="true" />
      <m.div
        className="tt-body"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
      >
        <span className="tt-mark" aria-hidden="true">
          {copy.logoMark}
        </span>
        <p className="tt-name">{copy.name}</p>
        <p className="tt-tagline">{TAGLINES[to]}</p>
        <span className="tt-bar" aria-hidden="true" />
        <p className="tt-loading">{copy.loading}</p>
      </m.div>
      <div className="tt-deco tt-deco-bottom" aria-hidden="true" />
    </m.div>
  );
}
