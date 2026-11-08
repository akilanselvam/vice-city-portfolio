import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// The location name that fades in bottom-right on arrival, like entering a new area in an open-world
// game. Once it has faded out, a "next stop" button fades in at the same spot (on the tour only, and not
// at the last stop).
export default function AreaToast({ stop, next, verb, onNext }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 3600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="area-toast" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {!hidden ? (
          <m.div key="name" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45 }}>
            <p className="area-name script">{stop.area}</p>
            <p className="area-sub display">{stop.sub}</p>
          </m.div>
        ) : (
          next &&
          onNext && (
            <m.button
              key="next"
              type="button"
              className="next-stop"
              onClick={onNext}
              aria-label={`${verb} to the next stop: ${next.area}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <span className="next-stop-label">Next stop</span>
              <span className="next-stop-name display">
                {verb} to {next.area}
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </m.button>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
