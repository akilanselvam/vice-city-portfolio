import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, Building2, Code2, GraduationCap, Heart, MapPin, User } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { profile } from '../data/content.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';

const TABS = [
  { id: 'journey', label: 'My journey' },
  { id: 'drives', label: 'What drives me' },
  { id: 'beyond', label: 'Beyond work' },
];

const INFO = [
  { Icon: MapPin, label: 'Location', value: profile.location },
  { Icon: User, label: 'Role', value: profile.role },
  { Icon: Building2, label: 'Company', value: profile.company },
  { Icon: GraduationCap, label: 'Education', value: profile.education },
  { Icon: Code2, label: 'Stack', value: profile.stack.join(' · ') },
  { Icon: Heart, label: 'Interests', value: profile.interests.join(' · ') },
];

const initials = profile.name
  .split(' ')
  .map((part) => part[0])
  .join('');

export default function AboutStop({ travelTo }) {
  const { copy } = useTheme();
  const [tab, setTab] = useState('journey');

  return (
    <div className="about-stop">
      <figure className={`portrait${profile.photo ? '' : ' portrait-empty'}`}>
        {profile.photo ? (
          <img src={profile.photo} alt={profile.name} />
        ) : (
          <span className="portrait-initials display" aria-hidden="true">
            {initials}
          </span>
        )}
        <figcaption className="portrait-tag display">{profile.name}</figcaption>
      </figure>

      <div>
        <ScreenHeader title="About me" />
        <p className="about-hey script">Hey, I'm {profile.name}.</p>
        {profile.bio.map((p) => (
          <p key={p} className="lead">
            {p}
          </p>
        ))}
        <div className="tabs" role="tablist" aria-label="More about me">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="about-panel"
              className={`btn${tab === t.id ? ' btn-primary' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <m.p
            key={tab}
            id="about-panel"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="tab-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {profile.story[tab]}
          </m.p>
        </AnimatePresence>
        <button className="btn" onClick={() => travelTo(4)}>
          {copy.travelVerb} to my career <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      <aside className="info-list">
        {INFO.map(({ Icon, label, value }) => (
          <div key={label} className="info-row">
            <span className="info-icon">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="info-label">{label}</p>
              <p className="info-value">{value}</p>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
