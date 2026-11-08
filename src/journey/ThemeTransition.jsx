import { m } from 'framer-motion';
import { themeCopy } from '../theme/ThemeContext.jsx';
import { LoadingScene } from './LoadingScreen.jsx';

// What covers the screen while the next theme's world is built: the same animated scene as the loading
// screen, for the theme being switched to, revealed in a circle from the button that was pressed. The
// scene styles itself from its ls-<theme> class, because the page is still in the old theme meanwhile.
export default function ThemeTransition({ to, origin }) {
  const copy = themeCopy(to);
  const at = `${origin.x}px ${origin.y}px`;
  return (
    <m.div
      className={`theme-transition loading-screen ls-${to}`}
      role="status"
      aria-live="polite"
      initial={{ clipPath: `circle(0% at ${at})` }}
      animate={{ clipPath: `circle(150% at ${at})` }}
      exit={{ opacity: 0 }}
      transition={{ clipPath: { duration: 0.55, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.45 } }}
    >
      <LoadingScene theme={to} copy={copy} title={copy.name} />
    </m.div>
  );
}
