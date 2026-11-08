import { useCallback, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import MissionCover from '../components/MissionCover.jsx';
import MissionModal from '../components/MissionModal.jsx';
import { projectCategories, projects } from '../data/content.jsx';
import useScrollLock from '../journey/useScrollLock.js';

const categoryLabel = (id) => projectCategories.find((c) => c.id === id)?.label;

export default function ProjectsStop() {
  const [cat, setCat] = useState('all');
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  useScrollLock(Boolean(open));

  const list = cat === 'all' ? projects : projects.filter((p) => p.category === cat);
  const current = list[index];
  const step = (delta) => setIndex((i) => (i + delta + list.length) % list.length);

  return (
    <div className="projects-stop">
      <div className="stop-top">
        <ScreenHeader title="Projects" stop="projects" />
        <div className="chip-row" role="group" aria-label="Filter projects">
          {projectCategories.map((c) => (
            <button
              key={c.id}
              className={`chip${cat === c.id ? ' active' : ''}`}
              aria-pressed={cat === c.id}
              onClick={() => {
                setCat(c.id);
                setIndex(0);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <m.article
          key={current.id}
          className="mission-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          <MissionCover project={current} />
          <div className="mission-body">
            <p className="mission-cat">{categoryLabel(current.category)}</p>
            <h3 className="mission-title display">{current.title}</h3>
            <ul className="chips">
              {current.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>{current.description}</p>
            <button className="btn btn-primary" onClick={() => setOpen(current)}>
              View mission <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </m.article>
      </AnimatePresence>

      {list.length > 1 && (
        <div className="carousel-ctrl">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous mission">
            <ChevronLeft size={20} />
          </button>
          <div className="dots">
            {list.map((p, i) => (
              <button key={p.id} className={`dot${i === index ? ' active' : ''}`} onClick={() => setIndex(i)} aria-label={`Show ${p.title}`} aria-current={i === index} />
            ))}
          </div>
          <button className="icon-btn" onClick={() => step(1)} aria-label="Next mission">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <AnimatePresence>{open && <MissionModal project={open} onClose={close} />}</AnimatePresence>
    </div>
  );
}
