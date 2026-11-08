import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';

// The location name that fades in bottom-right on arrival, like entering a new area in GTA
export default function AreaToast({ stop }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 3600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="area-toast" role="status" aria-live="polite">
      <AnimatePresence>
        {!hidden && (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45 }}>
            <p className="area-name script">{stop.area}</p>
            <p className="area-sub display">{stop.sub}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
