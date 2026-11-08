import { ArrowRight, Briefcase, GraduationCap } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { experience } from '../data/content.jsx';

export default function ExperienceStop({ travelTo }) {
  return (
    <div className="exp-stop">
      <div>
        <ScreenHeader title="Experience" stop="experience" />
        <ol className="timeline">
          {experience.map((item) => {
            const Icon = item.type === 'education' ? GraduationCap : Briefcase;
            return (
              <li key={item.role + item.org} className="tl-item">
                <span className="tl-node" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div className="tl-card">
                  <div className="tl-top">
                    <h3 className="tl-role display">{item.role}</h3>
                    {item.current && <span className="badge">Current</span>}
                  </div>
                  <p className="tl-meta">
                    {item.org && <span className="tl-org">{item.org}</span>}
                    {item.org && ' · '}
                    {item.place && `${item.place} · `}
                    {item.period}
                  </p>
                  <p>{item.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <aside className="exp-aside">
        <p className="script exp-quote">
          Good code,
          <br />
          better experiences
        </p>
        <button className="btn btn-primary" onClick={() => travelTo(5)}>
          Let's connect <ArrowRight size={16} aria-hidden="true" />
        </button>
      </aside>
    </div>
  );
}
