import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { m } from 'framer-motion';
import { Check, ExternalLink, X } from 'lucide-react';
import MissionCover from './MissionCover.jsx';
import { GithubIcon } from './BrandIcons.jsx';

export default function MissionModal({ project, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const { github, live } = project.links;

  // Portalled to <body>: the animated screen wrapper uses filter, which would trap position: fixed
  return createPortal(
    <m.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <m.div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-title"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
      >
        <button ref={closeRef} className="icon-btn modal-close" onClick={onClose} aria-label="Close mission details">
          <X size={20} />
        </button>
        <MissionCover project={project} />
        <div className="modal-body">
          <p className="screen-sub">Mission details</p>
          <h2 id="mission-title" className="mission-title display">
            {project.title}
          </h2>
          <ul className="chips">
            {project.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p>{project.description}</p>
          <h3 className="panel-label">Highlights</h3>
          <ul className="highlights">
            {project.highlights.map((h) => (
              <li key={h}>
                <Check size={16} aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
          {(github || live) && (
            <div className="modal-links">
              {github && (
                <a className="btn" href={github} target="_blank" rel="noreferrer">
                  <GithubIcon size={16} /> Source
                </a>
              )}
              {live && (
                <a className="btn btn-primary" href={live} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} aria-hidden="true" /> Live demo
                </a>
              )}
            </div>
          )}
        </div>
      </m.div>
    </m.div>,
    document.body,
  );
}
