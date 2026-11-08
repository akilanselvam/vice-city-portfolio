import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { ICONS } from '../components/icons.js';
import { skillCategories, skills } from '../data/portfolio.js';

const countFor = (id) => (id === 'all' ? skills.length : skills.filter((s) => s.cats.includes(id)).length);

export default function SkillsStop() {
  const [cat, setCat] = useState('all');
  const shown = cat === 'all' ? skills : skills.filter((s) => s.cats.includes(cat));

  return (
    <div className="skills-stop">
      <div className="stop-top">
        <ScreenHeader title="Skills" stop="skills" />
        <div className="chip-row" role="group" aria-label="Filter skills">
          {skillCategories.map((c) => (
            <button key={c.id} className={`chip${cat === c.id ? ' active' : ''}`} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
              <span className="chip-count">{countFor(c.id)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="skills-meta" aria-live="polite">
        {shown.length} abilities unlocked
      </p>
      <ul className="skill-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((s) => {
            const Icon = ICONS[s.icon];
            return (
              <m.li
                key={s.name}
                layout
                className="skill-tile"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {s.logo ? (
                  <img src={s.logo} alt="" width="44" height="44" loading="lazy" decoding="async" />
                ) : (
                  <Icon className="skill-glyph" size={40} strokeWidth={1.6} aria-hidden="true" />
                )}
                <span>{s.name}</span>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
